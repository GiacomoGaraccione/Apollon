import json
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Course, Exercise, Boss, Solution
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required
from sqlalchemy.orm import joinedload

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