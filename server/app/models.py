from sqlalchemy import Column, String, ForeignKey, Float, Table, Boolean, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

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

    students = relationship("User", secondary=student_courses, back_populates="courses", cascade="all, delete")
    exercises = relationship("Exercise", back_populates="course", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "courseId": self.courseId,
            "name": self.name,
            "students": [student.serialize() for student in self.students],
            "exercises": [exercise.serialize() for exercise in self.exercises]
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
            "boss": self.boss.serialize() if self.boss else None
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