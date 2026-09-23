import json
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Course, ExamCall, ExamExercise, StudentExamSubmission
from flask_jwt_extended import jwt_required
from app.utils.auth_utils import role_required
from datetime import datetime

exams_bp = Blueprint("exams", __name__)


def _exam_active(exam):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return exam.startDate <= now <= exam.endDate


def _exam_ended(exam):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return now > exam.endDate


# ----------------- Teacher: exam call CRUD -----------------

@exams_bp.route("/<courseId>/exams", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_exam_calls(courseId):
    with get_session() as session:
        try:
            course = session.query(Course).filter_by(courseId=courseId).first()
            if course is None:
                return jsonify({"message": "Course not found"}), 404
            return jsonify({"exams": [exam.serialize() for exam in course.exam_calls]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@exams_bp.route("/<courseId>/exams", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def create_exam_call(courseId):
    with get_session() as session:
        try:
            data = request.json
            course = session.query(Course).filter_by(courseId=courseId).first()
            if course is None:
                return jsonify({"message": "Course not found"}), 404
            existing_ids = (session.query(ExamCall.examId).filter_by(courseId=courseId).all())
            ids = []
            for eid, in existing_ids:
                try:
                    idx = int(eid.split("_")[2])
                    ids.append(idx)
                except (ValueError, IndexError):
                    continue
            next = max(ids, default=0) + 1
            exam = ExamCall(
                examId=f"{courseId}_exam_{next}",
                title=data["title"],
                description=data.get("description", ""),
                startDate=data["startDate"],
                endDate=data["endDate"],
                courseId=courseId,
                course=course
            )
            session.add(exam)
            session.commit()
            return jsonify(exam.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


@exams_bp.route("/<courseId>/exams/<examId>", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_exam_call(courseId, examId):
    with get_session() as session:
        try:
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            return jsonify(exam.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@exams_bp.route("/<courseId>/exams/<examId>", methods=["PUT"])
@jwt_required()
@role_required("Teacher")
def update_exam_call(courseId, examId):
    with get_session() as session:
        try:
            data = request.json
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            if "title" in data:
                exam.title = data["title"]
            if "description" in data:
                exam.description = data["description"]
            if "startDate" in data:
                exam.startDate = data["startDate"]
            if "endDate" in data:
                exam.endDate = data["endDate"]
            session.commit()
            return jsonify(exam.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


@exams_bp.route("/<courseId>/exams/<examId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_exam_call(courseId, examId):
    with get_session() as session:
        try:
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            session.delete(exam)
            session.commit()
            return jsonify({"message": "Exam call deleted"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


# ----------------- Teacher: exam exercise CRUD -----------------

@exams_bp.route("/<courseId>/exams/<examId>/exercises", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def create_exam_exercise(courseId, examId):
    with get_session() as session:
        try:
            data = request.json
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            existing_ids = (session.query(ExamExercise.exerciseId).filter_by(examId=examId).all())
            ids = []
            for eid, in existing_ids:
                try:
                    idx = int(eid.split("_")[-1])
                    ids.append(idx)
                except ValueError:
                    continue
            next = max(ids, default=0) + 1
            exercise = ExamExercise(
                exerciseId=f"{examId}_{next}",
                title=data["title"],
                description=data.get("description", ""),
                exType=data.get("exType", "ClassDiagram"),
                examId=examId,
                exam=exam
            )
            session.add(exercise)
            session.commit()
            return jsonify(exercise.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


@exams_bp.route("/<courseId>/exams/<examId>/exercises/<exerciseId>", methods=["PUT"])
@jwt_required()
@role_required("Teacher")
def update_exam_exercise(courseId, examId, exerciseId):
    with get_session() as session:
        try:
            data = request.json
            exercise = session.query(ExamExercise).filter_by(examId=examId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exam exercise not found"}), 404
            if "title" in data:
                exercise.title = data["title"]
            if "description" in data:
                exercise.description = data["description"]
            if "exType" in data:
                exercise.exType = data["exType"]
            session.commit()
            return jsonify(exercise.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


@exams_bp.route("/<courseId>/exams/<examId>/exercises/<exerciseId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_exam_exercise(courseId, examId, exerciseId):
    with get_session() as session:
        try:
            exercise = session.query(ExamExercise).filter_by(examId=examId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exam exercise not found"}), 404
            session.delete(exercise)
            session.commit()
            return jsonify({"message": "Exam exercise deleted"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


# ----------------- Teacher: exam call enrollment -----------------

@exams_bp.route("/<courseId>/exams/<examId>/non-enrolled-students", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_exam_non_enrolled_students(courseId, examId):
    with get_session() as session:
        try:
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            enrolled = {student.username for student in exam.students}
            non_enrolled = [student for student in exam.course.students if student.username not in enrolled]
            return jsonify({"students": [student.serialize() for student in non_enrolled]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@exams_bp.route("/<courseId>/exams/<examId>/students", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def enroll_exam_students(courseId, examId):
    with get_session() as session:
        try:
            data = request.json
            user_ids = data.get("userIds", [])
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            course_students = {student.username for student in exam.course.students}
            failed = []
            enrolled = []
            for userId in user_ids:
                student = session.query(User).filter_by(userId=userId, role="Student").first()
                if not student:
                    failed.append({"userId": userId, "message": "User not found or not a student"})
                elif student.username not in course_students:
                    failed.append({"userId": userId, "message": "User not enrolled in this course"})
                elif student in exam.students:
                    failed.append({"userId": userId, "message": "User already enrolled in this exam call"})
                else:
                    enrolled.append(userId)
                    exam.students.append(student)
            session.commit()
            return jsonify({
                "message": f"Enrolled {len(enrolled)} students in exam call {examId}",
                "failed": failed,
                "enrolled": enrolled
            }), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@exams_bp.route("/<courseId>/exams/<examId>/students/<studentId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def unenroll_exam_student(courseId, examId, studentId):
    with get_session() as session:
        try:
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            student = session.query(User).filter_by(userId=studentId, role="Student").first()
            if not student:
                return jsonify({"message": "Student not found"}), 404
            if student not in exam.students:
                return jsonify({"message": "Student not enrolled in this exam call"}), 400
            exam.students.remove(student)
            session.commit()
            return jsonify({"message": "Student unenrolled successfully"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


# ----------------- Teacher: monitoring submissions -----------------

@exams_bp.route("/<courseId>/exams/<examId>/exercises/<exerciseId>/submissions", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_exam_exercise_submissions(courseId, examId, exerciseId):
    with get_session() as session:
        try:
            exercise = session.query(ExamExercise).filter_by(examId=examId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exam exercise not found"}), 404
            return jsonify([submission.serialize() for submission in exercise.submissions]), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


# ----------------- Student: exam calls & submissions -----------------

@exams_bp.route("/<courseId>/exams/students/<studentId>", methods=["GET"])
@jwt_required()
@role_required("Student")
def get_student_exam_calls(courseId, studentId):
    with get_session() as session:
        try:
            course = session.query(Course).filter_by(courseId=courseId).first()
            if course is None:
                return jsonify({"message": "Course not found"}), 404
            student = session.query(User).filter_by(username=studentId, role="Student").first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exams = [exam for exam in course.exam_calls if student in exam.students]
            return jsonify({"exams": [exam.serialize() for exam in exams]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@exams_bp.route("/<courseId>/exams/<examId>/exercises/<exerciseId>/students/<studentId>", methods=["GET"])
@jwt_required()
@role_required("Student")
def get_exam_submission(courseId, examId, exerciseId, studentId):
    with get_session() as session:
        try:
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            student = session.query(User).filter_by(username=studentId, role="Student").first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            if student not in exam.students:
                return jsonify({"message": "Student not enrolled in this exam call"}), 400
            exercise = session.query(ExamExercise).filter_by(examId=examId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exam exercise not found"}), 404
            submission = session.query(StudentExamSubmission).filter_by(exerciseId=exerciseId, username=studentId).first()
            return jsonify({
                "submission": submission.serialize() if submission else None,
                "exam": exam.serialize(),
                "exercise": exercise.serialize(),
                "active": _exam_active(exam),
                "ended": _exam_ended(exam)
            }), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


@exams_bp.route("/<courseId>/exams/<examId>/exercises/<exerciseId>/students/<studentId>", methods=["PUT"])
@jwt_required()
@role_required("Student")
def save_exam_submission(courseId, examId, exerciseId, studentId):
    with get_session() as session:
        try:
            data = request.json
            exam = session.query(ExamCall).filter_by(courseId=courseId, examId=examId).first()
            if exam is None:
                return jsonify({"message": "Exam call not found"}), 404
            student = session.query(User).filter_by(username=studentId, role="Student").first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            if student not in exam.students:
                return jsonify({"message": "Student not enrolled in this exam call"}), 400
            exercise = session.query(ExamExercise).filter_by(examId=examId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exam exercise not found"}), 404
            if not _exam_active(exam):
                return jsonify({"message": "This exam call is not currently active"}), 403
            model = data.get("model", None)
            submission = session.query(StudentExamSubmission).filter_by(exerciseId=exerciseId, username=studentId).first()
            if submission is None:
                submission = StudentExamSubmission(
                    username=studentId,
                    exerciseId=exerciseId,
                    examId=examId,
                    model=json.dumps(model) if model is not None else None
                )
                session.add(submission)
            else:
                submission.model = json.dumps(model) if model is not None else submission.model
                submission.lastUpdated = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            session.commit()
            return jsonify(submission.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
