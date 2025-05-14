from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Course
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required
from sqlalchemy.orm import joinedload

courses_bp = Blueprint('courses', __name__)

@courses_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_courses():
    with get_session() as session:
        courses = session.query(Course).all()
        return jsonify({"courses": [course.serialize() for course in courses]}), 200
    
@courses_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def add_course():
    with get_session() as session:
        try:
            data = request.json
            if session.query(Course).filter_by(courseId=data["courseId"]).first() :
                return jsonify({'message': 'Course ID is already in use'}), 400
            if session.query(Course).filter_by(name=data["courseName"]).first() :
                return jsonify({'message': 'Course name is already in use'}), 400
            new_course = Course(courseId=data["courseId"], name=data["courseName"])
            session.add(new_course)
            session.commit()
            return jsonify({'message': 'Course created successfully'}), 201
        except Exception as e:
            print(e)
            return jsonify({'message': 'Database connection error'}), 500


@courses_bp.route("/<courseId>", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_course(courseId):
    with get_session() as session:
        try:
            course = session.query(Course).options(joinedload(Course.students)).filter_by(courseId=courseId).first()
            if course is None:
                return jsonify({'message': 'Course not found'}), 404
            return jsonify(course.serialize()), 200
        except:
            return jsonify({'message': 'Database connection error'}), 500
        

@courses_bp.route("/<courseId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_course(courseId):
    with get_session() as session:
        try:
            if session.query(Course).filter_by(courseId=courseId).first() is None:
                return jsonify({'message': 'Course not found'}), 404
            session.query(Course).filter_by(courseId=courseId).delete()
            session.commit()
            return jsonify({'message': 'Course deleted successfully'}), 200
        except:
            return jsonify({'message': 'Database connection error'}), 500

@courses_bp.route("/<courseId>/non-enrolled-students", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_non_enrolled_students(courseId):
    with get_session() as session:
        try:
            course = session.query(Course).filter_by(courseId=courseId).first()
            if course is None:
                return jsonify({'message': 'Course not found'}), 404
            enrolled_students = {student.username for student in course.students}
            non_enrolled_students = session.query(User).filter(
                User.role == "Student",
                User.username.notin_(enrolled_students)
            ).all()
            return jsonify({"students": [student.serialize() for student in non_enrolled_students]}), 200
        except:
            return jsonify({'message': 'Database connection error'}), 500

@courses_bp.route("/<courseId>/students", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def enroll_student(courseId):
    try:
        with get_session() as session:
            data = request.json
            user_ids = data.get("userIds", [])
            course = session.query(Course).filter_by(courseId=courseId).first()
            if not course:
                return jsonify({'message': 'Course not found'}), 404
            failed = []
            enrolled = []
            for userId in user_ids:
                student = session.query(User).filter_by(userId=userId, role="Student").first()
                if not student:
                    failed.append({"userId": userId, "message": "User not found or not a student"})
                elif course in student.courses:
                    failed.append({"userId": userId, "message": "User already enrolled in course"})
                else:
                    enrolled.append(userId)
                    course.students.append(student)
            session.commit()
            return jsonify({
                "message": f"Enrolled {len(enrolled)} students in course {courseId}",
                "failed": failed,
                "enrolled": enrolled
            }), 200
    except:
        return jsonify({'message': 'Database connection error'}), 500
    
@courses_bp.route("/<courseId>/students/<studentId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def unenroll_student(courseId, studentId):
    try:
        with get_session() as session:
            course = session.query(Course).filter_by(courseId=courseId).first()
            if not course:
                return jsonify({'message': 'Course not found'}), 404
            student = session.query(User).filter_by(userId=studentId, role="Student").first()
            if not student:
                return jsonify({'message': 'Student not found'}), 404
            if student not in course.students:
                return jsonify({'message': 'Student not enrolled in this course'}), 400
            course.students.remove(student)
            session.commit()
            return jsonify({'message': 'Student unenrolled successfully'}), 200
    except:
        return jsonify({'message': 'Database connection error'}), 500