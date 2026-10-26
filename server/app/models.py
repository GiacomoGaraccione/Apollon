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

exam_call_students = Table("exam_call_students",
    Base.metadata,
    Column("username", String, ForeignKey("users.username", ondelete="CASCADE")),
    Column("examId", String, ForeignKey("exam_calls.examId", ondelete="CASCADE"))
)

group_members = Table("group_members",
    Base.metadata,
    Column("username", String, ForeignKey("users.username", ondelete="CASCADE")),
    Column("groupId", String, ForeignKey("groups.groupId", ondelete="CASCADE"))
)

class User(Base):
    __tablename__ = 'users'
    username = Column(String, primary_key=True)
    userId = Column(String, nullable=False)
    name = Column(String, nullable=False)
    surname = Column(String, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="Student")
    courses = relationship("Course", secondary=student_courses, back_populates="students")
    student_course_info = relationship("StudentCourseInfo", back_populates="user", cascade="all, delete-orphan")

    exercises = relationship("StudentExerciseLog", back_populates="user", cascade="all, delete-orphan")
    exercise_completions = relationship("StudentExerciseCompletion", back_populates="user", cascade="all, delete-orphan")

    exam_calls = relationship("ExamCall", secondary=exam_call_students, back_populates="students")
    exam_submissions = relationship("StudentExamSubmission", back_populates="user", cascade="all, delete-orphan")

    groups = relationship("Group", secondary=group_members, back_populates="members")

    def serialize(self):
        return {
            "username": self.username,
            "userId": self.userId,
            "name": self.name,
            "surname": self.surname,
            "role": self.role,
            "courses": [course.courseId for course in self.courses]
        }

    def serialize_basic(self):
        """Senza `courses`: usata per elencare gli iscritti DENTRO un corso (Course.serialize()),
        dove quel campo non serve mai lato client ma il suo accesso innescherebbe comunque una query
        lazy separata per OGNI studente elencato (N+1, significativo con centinaia di iscritti)."""
        return {
            "username": self.username,
            "userId": self.userId,
            "name": self.name,
            "surname": self.surname,
            "role": self.role,
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
    gamified = Column(Boolean, nullable=False, default=True)

    students = relationship("User", secondary=student_courses, back_populates="courses")
    exercises = relationship("Exercise", back_populates="course", cascade="all, delete-orphan")
    student_course_info = relationship("StudentCourseInfo", back_populates="course", cascade="all, delete-orphan")
    exam_calls = relationship("ExamCall", back_populates="course", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "courseId": self.courseId,
            "name": self.name,
            "students": [student.serialize_basic() for student in self.students],
            "exercises": [exercise.serialize() for exercise in self.exercises],
            "settings": self.settings,
            "gameOptions": self.gameOptions,
            "gamified": self.gamified,
        }

    def serialize_summary(self):
        """Versione leggera per la lista corsi (GET /courses/): niente studenti/esercizi annidati,
        che per un corso con molti iscritti ed esercizi fanno esplodere sia il numero di query
        (N+1 su ogni relationship, per ogni corso) sia la dimensione del payload - il frontend della
        lista corsi (CourseView.tsx) usa comunque solo courseId/name. Il dettaglio completo resta
        disponibile via GET /courses/<courseId> (serialize())."""
        return {
            "courseId": self.courseId,
            "name": self.name,
            "gamified": self.gamified,
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
    exType = Column(String, nullable=False, default="ClassDiagram")
    courseId = Column(String, ForeignKey("courses.courseId", ondelete="CASCADE"), nullable=False)

    course = relationship("Course", back_populates="exercises")
    solutions = relationship("Solution", back_populates="exercise", cascade="all, delete-orphan")
    boss = relationship("Boss", back_populates="exercise", uselist=False, cascade="all, delete-orphan")
    student_exercises = relationship("StudentExerciseLog", back_populates="exercise", cascade="all, delete-orphan")
    exercise_completions = relationship("StudentExerciseCompletion", back_populates="exercise", cascade="all, delete-orphan")
    teacher_evaluations = relationship("TeacherEvaluation", back_populates="exercise", cascade="all, delete-orphan")

    def serialize(self):
        # `records`/`completions` (i log di OGNI studente su questo esercizio, con l'intero diagramma
        # UML sottomesso + dettagli di valutazione) sono stati rimossi da qui: nessun campo client-side
        # li legge mai (ne' in Course/Exercise di Models.ts ne' nelle mappature di API.ts), ma venivano
        # comunque serializzati per intero ad ogni fetch di un esercizio (compresa la lista corsi e la
        # vista corso dello STUDENTE in get_course_info, che quindi esponeva anche le submission di
        # tutti gli altri studenti) - con molti iscritti e' la causa principale dei payload multi-MB.
        # Quel dato resta disponibile dove serve davvero tramite l'endpoint dedicato per esercizio
        # (GET .../records in exercises.py), scoping corretto per una vista "risultati esercizio".
        return{
            "exerciseId": self.exerciseId,
            "title": self.title,
            "description": self.description,
            "level": self.level,
            "experience": self.experience,
            "visible": self.visible,
            "gamified": self.gamified,
            "courseId": self.courseId,
            "exType": self.exType,
            "solutions": [solution.serialize() for solution in self.solutions],
            "boss": self.boss.serialize() if self.boss else None,
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



class TeacherEvaluation(Base):
    __tablename__ = "teacher_evaluations"
    exerciseId = Column(String, ForeignKey("exercises.exerciseId", ondelete="CASCADE"), primary_key=True)
    studentId = Column(String, primary_key=True)
    originalModel = Column(String, nullable=True)
    staticResult = Column(String, nullable=True)
    staticModel = Column(String, nullable=True)
    staticTime = Column(Float, nullable=True)
    llmResult = Column(String, nullable=True)
    llmModel = Column(String, nullable=True)
    llmTime = Column(Float, nullable=True)
    llmTokens = Column(Integer, nullable=True)
    timestamp = Column(String, nullable=False, default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

    exercise = relationship("Exercise", back_populates="teacher_evaluations")

    def serialize(self):
        return {
            "exerciseId": self.exerciseId,
            "studentId": self.studentId,
            "originalModel": self.originalModel,
            "staticResult": self.staticResult,
            "staticModel": self.staticModel,
            "staticTime": self.staticTime,
            "llmResult": self.llmResult,
            "llmModel": self.llmModel,
            "llmTime": self.llmTime,
            "llmTokens": self.llmTokens,
            "timestamp": self.timestamp
        }


class ErrorExample(Base):
    __tablename__ = "error_examples"
    id = Column(String, primary_key=True)
    key = Column(String, nullable=False)
    type = Column(String, nullable=False, default="syntax")
    model = Column(String, nullable=True)
    description = Column(String, nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "key": self.key,
            "type": self.type,
            "model": self.model,
            "description": self.description 
        }

class SandboxDiagram(Base):
    __tablename__ = "sandbox_diagrams"
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    counter = Column(Integer, nullable=False)
    diagramId = Column(String, nullable=False, primary_key=True)
    model = Column(String, nullable=True)
    exerciseType = Column(String, nullable=True)
    lastUpdated = Column(String, nullable=False, default=lambda: datetime.now().strftime("%d-%m-%Y %H:%M:%S"))
    filename = Column(String, nullable=True)

class ExamCall(Base):
    __tablename__ = "exam_calls"
    examId = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    startDate = Column(String, nullable=False)
    endDate = Column(String, nullable=False)
    courseId = Column(String, ForeignKey("courses.courseId", ondelete="CASCADE"), nullable=False)

    course = relationship("Course", back_populates="exam_calls")
    exercises = relationship("ExamExercise", back_populates="exam", cascade="all, delete-orphan")
    students = relationship("User", secondary=exam_call_students, back_populates="exam_calls")

    def serialize(self):
        return {
            "examId": self.examId,
            "title": self.title,
            "description": self.description,
            "startDate": self.startDate,
            "endDate": self.endDate,
            "courseId": self.courseId,
            "exercises": [exercise.serialize() for exercise in self.exercises],
            "students": [student.serialize() for student in self.students],
        }

class ExamExercise(Base):
    __tablename__ = "exam_exercises"
    exerciseId = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    exType = Column(String, nullable=False, default="ClassDiagram")
    examId = Column(String, ForeignKey("exam_calls.examId", ondelete="CASCADE"), nullable=False)

    exam = relationship("ExamCall", back_populates="exercises")
    submissions = relationship("StudentExamSubmission", back_populates="exercise", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "exerciseId": self.exerciseId,
            "title": self.title,
            "description": self.description,
            "exType": self.exType,
            "examId": self.examId,
        }

class StudentExamSubmission(Base):
    __tablename__ = "student_exam_submissions"
    username = Column(String, ForeignKey("users.username", ondelete="CASCADE"), primary_key=True)
    exerciseId = Column(String, ForeignKey("exam_exercises.exerciseId", ondelete="CASCADE"), primary_key=True)
    examId = Column(String, ForeignKey("exam_calls.examId", ondelete="CASCADE"), nullable=False)
    model = Column(String, nullable=True)
    lastUpdated = Column(String, nullable=False, default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

    user = relationship("User", back_populates="exam_submissions")
    exercise = relationship("ExamExercise", back_populates="submissions")

    def serialize(self):
        return {
            "username": self.username,
            "exerciseId": self.exerciseId,
            "examId": self.examId,
            "model": self.model,
            "lastUpdated": self.lastUpdated,
        }

class Group(Base):
    __tablename__ = "groups"
    groupId = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    createdAt = Column(String, nullable=False, default=lambda: datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))

    members = relationship("User", secondary=group_members, back_populates="groups")
    diagrams = relationship("GroupDiagram", back_populates="group", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "groupId": self.groupId,
            "name": self.name,
            "members": [member.serialize() for member in self.members],
            "diagramCount": len([d for d in self.diagrams if not d.hidden]),
        }

class GroupDiagram(Base):
    __tablename__ = "group_diagrams"
    groupId = Column(String, ForeignKey("groups.groupId", ondelete="CASCADE"), primary_key=True)
    diagramId = Column(String, primary_key=True)
    counter = Column(Integer, nullable=False)
    filename = Column(String, nullable=True)
    diagramType = Column(String, nullable=True)
    model = Column(String, nullable=True)
    createdBy = Column(String, ForeignKey("users.username", ondelete="SET NULL"), nullable=True)
    lastEditedBy = Column(String, ForeignKey("users.username", ondelete="SET NULL"), nullable=True)
    lastUpdated = Column(String, nullable=False, default=lambda: datetime.now().strftime("%d-%m-%Y %H:%M:%S"))
    hidden = Column(Boolean, nullable=False, default=False)

    group = relationship("Group", back_populates="diagrams")

    def serialize(self):
        return {
            "groupId": self.groupId,
            "diagramId": self.diagramId,
            "filename": self.filename,
            "diagramType": self.diagramType,
            "model": self.model,
            "createdBy": self.createdBy,
            "lastEditedBy": self.lastEditedBy,
            "lastUpdated": self.lastUpdated,
            "hidden": self.hidden,
        }