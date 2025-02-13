from sqlalchemy import Column, String, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class ExerciseModel(Base):
    __tablename__ = 'exercises'

    title = Column(String, primary_key=True)
    description = Column(String, nullable=False)
    solutions = Column(String)

    # Define bidirectional relationship with cascading delete
    results = relationship(
        "ResultModel",
        back_populates="exercise",
        cascade="all, delete-orphan"
    )

class ResultModel(Base):
    __tablename__ = "results"

    exercise_title = Column(
        String,
        ForeignKey('exercises.title', onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True
    )
    name = Column(String, primary_key=True)
    xml = Column(String)
    json = Column(String)
    completeness = Column(Float)
    feedback = Column(String)

    # Define the relationship back to ExerciseModel
    exercise = relationship("ExerciseModel", back_populates="results")
