from sqlalchemy import Column, String, ForeignKey, Float, Table, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()
from werkzeug.security import generate_password_hash, check_password_hash

student_courses = Table("student_courses", 
    Base.metadata,
    Column("username", String, ForeignKey("users.username", ondelete="CASCADE")),
    Column("courseId", String, ForeignKey("courses.courseId", ondelete="CASCADE"))
)

class User(Base):
    __tablename__ = 'users'
    username = Column(String, primary_key=True)
    userId = Column(String, nullable=False)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Student")
    courses = relationship("Course", secondary=student_courses, back_populates="students", cascade="all, delete")
    student_course_info = relationship("StudentCourseInfo", back_populates="user", cascade="all, delete-orphan")

    exercises = relationship("StudentExerciseLog", back_populates="user", cascade="all, delete-orphan")
    exercise_completions = relationship("StudentExerciseCompletion", back_populates="user", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "username": self.username,
            "userId": self.userId,
            "name": self.name,
            "surname": self.surname,
            "role": self.role,
            "courses": [course.courseId for course in self.courses]
        }

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Course(Base):
    __tablename__ = "courses"
    courseId = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    settings = Column(String, nullable=True)
    gameOptions = Column(String, nullable=True)

    students = relationship("User", secondary=student_courses, back_populates="courses", cascade="all, delete")
    exercises = relationship("Exercise", back_populates="course", cascade="all, delete-orphan")
    student_course_info = relationship("StudentCourseInfo", back_populates="course", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "courseId": self.courseId,
            "name": self.name,
            "students": [student.serialize() for student in self.students],
            "exercises": [exercise.serialize() for exercise in self.exercises],
            "settings": self.settings,
            "gameOptions": self.gameOptions,
        }
  
class Exercise(Base):
    __tablename__ = "exercises"
    exerciseId = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    level = Column(Integer, nullable=False, default=1)
    experience = Column(Integer, nullable=False, default=0)
    visible = Column(Boolean, nullable=False, default=True)
    gamified = Column(Boolean, nullable=False, default=False)
    courseId = Column(String, ForeignKey("courses.courseId", ondelete="CASCADE"), nullable=False)

    course = relationship("Course", back_populates="exercises")
    solutions = relationship("Solution", back_populates="exercise", cascade="all, delete-orphan")
    boss = relationship("Boss", back_populates="exercise", uselist=False, cascade="all, delete-orphan")
    student_exercises = relationship("StudentExerciseLog", back_populates="exercise", cascade="all, delete-orphan")
    exercise_completions = relationship("StudentExerciseCompletion", back_populates="exercise", cascade="all, delete-orphan")

    def serialize(self):
        return{
            "exerciseId": self.exerciseId,
            "title": self.title,
            "description": self.description,
            "level": self.level,
            "experience": self.experience,
            "visible": self.visible,
            "gamified": self.gamified,
            "courseId": self.courseId,
            "solutions": [solution.serialize() for solution in self.solutions],
            "boss": self.boss.serialize() if self.boss else None,
            "records": [record.serialize() for record in self.student_exercises],
            "completions": [completion.serialize() for completion in self.exercise_completions]
        }
    
class Solution(Base):
    __tablename__ = "solutions"
    solutionId = Column(String, primary_key=True)
    content = Column(String, nullable=True)
    exerciseId = Column(Integer, ForeignKey("exercises.exerciseId", ondelete="CASCADE"), nullable=False)
    exercise = relationship("Exercise", back_populates="solutions")

    def serialize(self):
        return {
            "solutionId": self.solutionId,
            "content": self.content
        }
    
class Boss(Base):
    __tablename__ = "bosses"
    bossId = Column(Integer, primary_key=True, autoincrement=True)
    introDialogue = Column(String, nullable=True)
    victoryDialogue = Column(String, nullable=True)
    props = Column(String, nullable=False)
    exerciseId = Column(Integer, ForeignKey("exercises.exerciseId", ondelete="CASCADE"), nullable=False)
    exercise = relationship("Exercise", back_populates="boss")
    def serialize(self):
        return {
            "bossId": self.bossId,
            "introDialogue": self.introDialogue,
            "victoryDialogue": self.victoryDialogue,
            "props": self.props
        }

class StudentCourseInfo(Base):
    __tablename__ = "student_course_info"
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    courseId = Column(String, ForeignKey("courses.courseId", ondelete="CASCADE"), primary_key=True)
    level = Column(Integer, nullable=False, default=1)
    avatar = Column(String, nullable=True)
    experience = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="student_course_info")
    course = relationship("Course", back_populates="student_course_info")
    def serialize(self):
        return {
            "username": self.username,
            "courseId": self.courseId,
            "level": self.level,
            "avatar": self.avatar,
            "experience": self.experience
        }
    
class StudentExerciseLog(Base):
    __tablename__ = "student_exercise"
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    exerciseId = Column(String, ForeignKey("exercises.exerciseId", ondelete="CASCADE"), primary_key=True)
    courseId = Column(String, ForeignKey("courses.courseId", ondelete="CASCADE"), primary_key=True)
    experience = Column(Integer, nullable=False)
    correctness = Column(Float, nullable=False)
    checks = Column(Integer, nullable=False, default=1)
    model = Column(String, nullable=True)
    syntax_errors = Column(String, nullable=True)
    semantic_errors = Column(String, nullable=True)
    results = Column(String, nullable=True)
    timestamp = Column(String, nullable=False, default=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

    user = relationship("User", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="student_exercises")

    def serialize(self):
        return {
            "username": self.username,
            "exerciseId": self.exerciseId,
            "courseId": self.courseId,
            "experience": self.experience,
            "correctness": self.correctness,
            "checks": self.checks,
            "model": self.model,
            "syntax_errors": self.syntax_errors,
            "semantic_errors": self.semantic_errors,
            "results": self.results,
            "timestamp": self.timestamp
        }
    
class StudentExerciseCompletion(Base):
    __tablename__ = "exercise_completion"
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    exerciseId = Column(String, ForeignKey("exercises.exerciseId", ondelete="CASCADE"), primary_key=True)
    courseId = Column(String, ForeignKey("courses.courseId", ondelete="CASCADE"), primary_key=True)
    timestamp = Column(String, nullable=False, default=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    experience = Column(Integer, nullable=False)
    correctness = Column(Float, nullable=False)
    checks = Column(Integer, nullable=False, default=1)
    model = Column(String, nullable=True)
    syntax_errors = Column(String, nullable=True)
    semantic_errors = Column(String, nullable=True)

    user = relationship("User", back_populates="exercise_completions")
    exercise = relationship("Exercise", back_populates="exercise_completions")

    def serialize(self):
        return {
            "username": self.username,
            "exerciseId": self.exerciseId,
            "courseId": self.courseId,
            "timestamp": self.timestamp,
            "experience": self.experience,
            "correctness": self.correctness,
            "checks": self.checks,
            "model": self.model,
            "syntax_errors": self.syntax_errors,
            "semantic_errors": self.semantic_errors
        }
