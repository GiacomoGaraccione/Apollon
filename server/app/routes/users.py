from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required

users_bp = Blueprint('users', __name__)

@users_bp.route("/", methods=["OPTIONS"])
def options():
    return jsonify({}), 200

@users_bp.route('/', methods=['GET'])
@jwt_required()
@role_required("Teacher")
def get_users():
    with get_session() as session:
        users = session.query(User).all()
        return jsonify({"users": [user.serialize() for user in users]}), 200
    
@users_bp.route('/', methods=['POST'])
@jwt_required()
@role_required("Teacher")
def register():
    with get_session() as session:
        try:
            data = request.json
            username = data['name'] + data['surname']
            if session.query(User).filter_by(username=username).first() :
                return jsonify({'message': 'Username is already in use'}), 400
            if session.query(User).filter_by(userId=data["userId"]).first() :
                return jsonify({'message': 'User ID is already in use'}), 400
            new_user = User(userId=data["userId"] ,username=username, name=data['name'], surname=data['surname'], role=data["role"])
            new_user.set_password(f"!!{username}!!")
            session.add(new_user)
            session.commit()
            return jsonify({'message': 'User created successfully'}), 201
        except:
            return jsonify({'message': 'Database connection error'}), 500

@users_bp.route("/<username>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_user(username):
    with get_session() as session:
        try:
            if session.query(User).filter_by(username=username).first() is None:
                return jsonify({'message': 'User not found'}), 404
            session.query(User).filter_by(username=username).delete()
            session.commit()
            return jsonify({'message': 'User deleted successfully'}), 200
        except:
            return jsonify({'message': 'Database connection error'}), 500
        
@users_bp.route("/<username>", methods=["PUT"])
@jwt_required()
@role_required("Teacher")
def update_student_id(username):
    with get_session() as session:
        try:
            data = request.json
            user = session.query(User).filter_by(username=username).first()
            if user is None:
                print("1")
                return jsonify({'message': 'User not found'}), 404
            if session.query(User).filter_by(userId=data["userId"]).first() :
                return jsonify({'message': 'User ID is already in use'}), 400
            if user.role != "Student":
                return jsonify({'message': 'User is not a student'}), 400
            user.userId = data["userId"]
            session.commit()
            return jsonify({'message': 'User updated successfully'}), 200
        except:
            return jsonify({'message': 'Database connection error'}), 500