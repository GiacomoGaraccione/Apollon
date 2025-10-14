from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Course, Exercise, Boss, Solution, StudentCourseInfo, StudentExerciseLog, StudentExerciseCompletion
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

rankings_bp = Blueprint('rankings', __name__)

@rankings_bp.route("/<courseId>/rankings/exercises/<exerciseId>", methods=["GET"])
@jwt_required()
def get_rankings_by_exercise(courseId, exerciseId):
    with get_session() as session:
        try:
            course = session.query(Course).filter(Course.courseId == courseId).first()
            if not course:
                return jsonify({"error": "Course not found"}), 404
            exercise = session.query(Exercise).filter(Exercise.exerciseId == exerciseId, Exercise.courseId == courseId).first()
            if not exercise:
                return jsonify({"error": "Exercise not found"}), 404
            results = (
                session.query(
                    User.username,
                    StudentCourseInfo.avatar,
                    StudentExerciseLog.correctness,
                )
                .join(StudentCourseInfo, (StudentCourseInfo.username == User.username) & (StudentCourseInfo.courseId == courseId))
                .join(StudentExerciseLog, (StudentExerciseLog.username == User.username) & (StudentExerciseLog.exerciseId == exerciseId))
                .filter(StudentExerciseLog.courseId == courseId)
                .distinct(User.username)
                .all()
            )
            if not results:
                return jsonify({"rankings": []}), 200
            print(f"Results: {results}")
            unique_rankings = {}
            for username, avatar, correctness in results:
                if username not in unique_rankings or correctness > unique_rankings[username]["correctness"]:
                    unique_rankings[username] = {
                        "username": username,
                        "avatar": avatar,
                        "correctness": correctness
                    }
            rankings = list(unique_rankings.values())
            rankings.sort(key=lambda x: x["correctness"], reverse=True)
            return jsonify({"rankings": rankings}), 200
        except Exception as e:
            print(f"Error fetching rankings: {e}")
            return jsonify({"error": "Failed to fetch rankings"}), 500
        
@rankings_bp.route("/<courseId>/rankings/level", methods=["GET"])
@jwt_required()
def get_rankings_by_level(courseId):
    with get_session() as session:
        try:
            course = session.query(Course).filter(Course.courseId == courseId).first()
            if not course:
                return jsonify({"error": "Course not found"}), 404
            results = (
                session.query(
                    User.username,
                    StudentCourseInfo.avatar,
                    StudentCourseInfo.level,
                    StudentCourseInfo.experience,
                )
                .join(StudentCourseInfo, StudentCourseInfo.username == User.username)
                .filter(StudentCourseInfo.courseId == courseId)
                .all()
            )
            if results is None:
                return jsonify({"rankings": []}), 200
            rankings = [
                {
                    "username": username,
                    "avatar": avatar,
                    "level": level,
                    "experience": experience
                }
                for username, avatar, level, experience in results
            ]
            rankings.sort(key=lambda x: (x["level"], x["experience"]), reverse=True)
            return jsonify({"rankings": rankings}), 200
        except Exception as e:
            print(f"Error fetching rankings: {e}")
            return jsonify({"error": "Failed to fetch rankings"}), 500
        
@rankings_bp.route("/<courseId>/rankings/bosses", methods=["GET"])
@jwt_required()
def get_rankings_by_bosses(courseId):
    with get_session() as session:
        try:
            course = session.query(Course).filter(Course.courseId == courseId).first()
            if not course:
                return jsonify({"error": "Course not found"}), 404

            students = (
                session.query(User.username, StudentCourseInfo.avatar)
                .join(StudentCourseInfo, StudentCourseInfo.username == User.username)
                .filter(StudentCourseInfo.courseId == courseId)
                .all()
            )

            completion_counts = dict(
                session.query(
                    User.username,
                    func.count(StudentExerciseCompletion.exerciseId).label("completed")
                )
                .join(StudentCourseInfo, StudentCourseInfo.username == User.username)
                .outerjoin(
                    StudentExerciseCompletion,
                    (StudentExerciseCompletion.username == User.username) &
                    (StudentExerciseCompletion.courseId == courseId)
                )
                .filter(StudentCourseInfo.courseId == courseId)
                .group_by(User.username)
                .all()
            )
            print(f"Completion counts: {completion_counts}")

            rankings = []
            for username, avatar in students:
                completed = completion_counts.get(username, 0)
                rankings.append({
                    "username": username,
                    "avatar": avatar,
                    "completed_exercises": completed
                })

            rankings.sort(key=lambda x: x["completed_exercises"], reverse=True)
            return jsonify({"rankings": rankings}), 200
        except Exception as e:
            print(f"Error fetching rankings: {e}")
            return jsonify({"error": "Failed to fetch rankings"}), 500