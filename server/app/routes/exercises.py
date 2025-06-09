import json
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Course, Exercise, Boss, Solution, StudentCourseInfo, StudentExerciseLog
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required
from app.utils.game_utils import update_experience_points
from sqlalchemy.orm import joinedload
import app.evaluator.eval as evaluator

exercises_bp = Blueprint("exercises", __name__)
        
@exercises_bp.route("/<courseId>/exercises", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def create_course_exercise(courseId):
    with get_session() as session:
        try:
            data = request.json
            print(data)
            course = session.query(Course).filter_by(courseId=courseId).first()
            if course is None:
                return jsonify({"message": "Course not found"}), 404
            existing_ids = (session.query(Exercise.exerciseId).filter_by(courseId=courseId).all())
            ids = []
            for eid, in existing_ids:
                try:
                    idx = int(eid.split("_")[1])
                    ids.append(idx)
                except ValueError:
                    continue
            next = max(ids, default=0) + 1
            exercise = Exercise(
                title=data["title"],
                description=data["description"],
                level=data["level"],
                experience=data["experience"],
                visible=data.get("visible", True),
                gamified=data.get("gamified", False),
                courseId=courseId,
                course=course,
                exerciseId=f"{courseId}_{next}"
            )
            session.add(exercise)
            session.commit()
            return jsonify(exercise.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400

@exercises_bp.route("/<courseId>/exercises/<exerciseId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_course_exercise(courseId, exerciseId):
    with get_session() as session:
        try:
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            session.delete(exercise)
            session.commit()
            return jsonify({"message": "Exercise deleted"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>", methods=["PUT"])
@jwt_required()
@role_required("Teacher")
def update_exercise(courseId, exerciseId):
    with get_session() as session:
        try:
            data = request.json
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            if "title" in data:
                exercise.title = data["title"]
            if "description" in data:
                exercise.description = data["description"]
            if "level" in data:
                exercise.level = data["level"]
            if "experience" in data:
                exercise.experience = data["experience"]
            if "visible" in data:
                exercise.visible = data["visible"]
            if "gamified" in data:
                exercise.gamified = data["gamified"]
            session.commit()
            return jsonify(exercise.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/boss", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def create_exercise_boss(courseId, exerciseId):
    with get_session() as session:
        try:
            data = request.json
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            boss = session.query(Boss).filter_by(exerciseId=exerciseId).first()
            if boss is not None:
                boss.introDialogue = data["introDialogue"]
                boss.victoryDialogue = data["victoryDialogue"]
                boss.props = json.dumps(data["bossOptions"])
                session.commit()
                return jsonify(exercise.serialize()), 200
            boss = Boss(
                introDialogue=data["introDialogue"],
                victoryDialogue=data["victoryDialogue"],
                props=json.dumps(data["bossOptions"]),
                exerciseId=exerciseId,
                exercise=exercise
            )
            session.add(boss)
            session.commit()
            return jsonify(exercise.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        

@exercises_bp.route("/<courseId>/exercises/<exerciseId>/solutions", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def add_solution(courseId, exerciseId):
    with get_session() as session:
        try:
            data = request.json
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            existing_ids = (session.query(Solution.solutionId).filter_by(exerciseId=exerciseId).all())
            ids = []
            for eid, in existing_ids:
                try:
                    idx = int(eid.split("_")[2])
                    ids.append(idx)
                except ValueError:
                    continue
            next = max(ids, default=0) + 1
            solution = Solution(
                content=json.dumps(data["content"]),
                exerciseId=exerciseId,
                exercise=exercise,
                solutionId=f"{exerciseId}_{next}"
            )
            session.add(solution)
            session.commit()
            return jsonify(exercise.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/solutions/<solutionId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_solution(courseId, exerciseId, solutionId):
    with get_session() as session:
        try:
            solution = session.query(Solution).filter_by(exerciseId=exerciseId, solutionId=solutionId).first()
            if solution is None:
                return jsonify({"message": "Solution not found"}), 404
            session.delete(solution)
            session.commit()
            return jsonify({"message": "Solution deleted"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/students/<studentId>", methods=["GET"])
@jwt_required()
@role_required("Student")
def get_student_exercise(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            student = session.query(User).filter_by(username=studentId).first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            record = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId, username=studentId).first()
            if record is None:
                return jsonify({"message": "Student exercise record not found"}), 404
            return jsonify(record.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/students/<studentId>", methods=["PUT"])
@jwt_required()
@role_required("Student")
def update_student_exercise(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            data = request.json
            student = session.query(User).filter_by(username=studentId).first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            record = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId, username=studentId).first()
            solutions = session.query(Solution).filter_by(exerciseId=exerciseId).all()
            solutions = [sol.serialize() for sol in solutions]
            model = data.get("model", None)
            results = evaluator.evaluate_student_diagram(solutions=solutions, model=model)
            if record is None:
                experience = data.get("experience", 0)
                correctness = data.get("progress", 0)
                checks = data.get("checks", 0)
                if data.get("evaluation", False):
                    checks = checks + 1
                syntax_errors = data.get("syntaxErrors", None)
                semantic_errors = data.get("semanticErrors", None)
                record = StudentExerciseLog(
                    exerciseId=exerciseId,
                    username=studentId,
                    courseId=courseId,
                    experience=experience,
                    correctness=correctness,
                    checks=checks,
                    model=json.dumps(model) if model else None,
                    syntax_errors=json.dumps(syntax_errors) if syntax_errors else None,
                    semantic_errors=json.dumps(semantic_errors) if semantic_errors else None,
                    results=json.dumps(results) if results else None
                )
                session.add(record)
                session.commit()
                return jsonify({"record": record.serialize(), "results": results}), 201
            else:
                if data.get("evaluation", False):
                    experience = update_experience_points(exercise, results, record)
                    correctness = data.get("progress", record.correctness)
                    checks = data.get("checks", record.checks)
                    checks = checks + 1
                    record.experience = experience
                    record.correctness = results.get("completeness", record.correctness)
                    record.checks = checks
                    record.syntax_errors = json.dumps(results.get("syntax_errors", record.syntax_errors))
                    record.semantic_errors = json.dumps(results.get("semantic_errors", record.semantic_errors))
                    record.results = json.dumps(results) if results else record.results
                record.model = json.dumps(model) if model else record.model
                session.commit()
                return jsonify({"record": record.serialize(), "results": results}), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400