
from db.database import get_session
from db.models import ExerciseModel, ResultModel
from sqlalchemy.orm.exc import NoResultFound

def create_exercise(title, description):
    with get_session() as session:
        try:
            session.query(ExerciseModel).filter_by(title=title).one()
            return False
        except NoResultFound:
            new_exercise = ExerciseModel(title=title, description=description, solutions="[]")
            session.add(new_exercise)
            session.commit()
            return True
    
def get_exercise(title):
    with get_session() as session:
        try:
            exercise = session.query(ExerciseModel).filter_by(title=title).one()
            return exercise
        except NoResultFound:
            return None
    
def get_all_exercises():
    with get_session() as session:
        exercises = session.query(ExerciseModel).all()
        return exercises
    
def update_exercise_solutions(title, solutions):
    with get_session() as session:
        try:
            exercise = session.query(ExerciseModel).filter_by(title=title).one()
            exercise.solutions = solutions
            session.commit()
            return True
        except NoResultFound:
            return False
    
def upload_student_exercise(title, name, json):
    with get_session() as session:
        try:
            exercise = session.query(ExerciseModel).filter_by(title=title).one()
            result = ResultModel(exercise_title=title, name=name, json=json)
            session.add(result)
            session.commit()
            return True
        except NoResultFound:
            return False
        
def get_exercise_diagrams(title):
    with get_session() as session:
        diagrams = session.query(ResultModel).filter_by(exercise_title=title).all()
        return [{
            "name": diagram.name, 
            "json": diagram.json, 
            "completeness": diagram.completeness, 
            "feedback": diagram.feedback
        } for diagram in diagrams]