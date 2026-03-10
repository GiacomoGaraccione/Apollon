from flask import Blueprint, request, jsonify, make_response
from app.models import User
from app.database.db import get_session
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_csrf_token, unset_jwt_cookies
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    with get_session() as session:
        data = request.json
        user =session.query(User).filter_by(username=data['username']).first()
        if user and user.check_password(data['password']):
            expires = timedelta(days=7)
            access_token = create_access_token(identity=f"{user.username}_{user.role}", expires_delta=expires)
            response = make_response(jsonify({'message': 'Logged in successfully'}), 200)
            response.set_cookie("access_token_cookie", access_token, httponly=True, secure=True, samesite="Strict")
            response_data = user.serialize()
            csrf_token = get_csrf_token(access_token)
            response.headers["X-CSRF-TOKEN"] = csrf_token
            response_data['csrf_token'] = csrf_token
            response.set_data(jsonify(response_data).get_data())
            return response, 200
        return jsonify({'message': 'Invalid credentials'}), 401
    
@auth_bp.route("current", methods=["GET"])
@jwt_required()
def current_user():
    user_identity = get_jwt_identity()
    with get_session() as session:
        user = session.query(User).filter_by(username=user_identity.split("_")[0]).first()
        if user:
            return jsonify(user.serialize()), 200
        return jsonify({'message': 'User not found'}), 404

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    response = jsonify({'message': 'Logged out successfully'})
    unset_jwt_cookies(response)
    return response, 200
    
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_identity = get_jwt_identity()
    username = user_identity.split("_")[0]
    with get_session() as session:
        data = request.json
        user = session.query(User).filter_by(username=username).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        print(f"Old password: {data.get('oldPassword')}, New password: {data.get('newPassword')}")
        if not user.check_password(data.get("oldPassword")):
            return jsonify({'message': 'Old password is incorrect'}), 400
        new_password = data.get("newPassword")
        if not new_password or len(new_password) < 8:
            return jsonify({'message': 'New password must be at least 8 characters long'}), 400
        if user.check_password(new_password):
            return jsonify({'message': 'New password cannot be the same as the old password'}), 400
        
        user.set_password(new_password)
        session.commit()
        return jsonify({'message': 'Password changed successfully'}), 200