from flask_jwt_extended import get_jwt_identity
from functools import wraps
from flask import jsonify

def role_required(role):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            current_user = get_jwt_identity()
            if not current_user.split("_")[1] == role:
                return jsonify({"message": "You are not allowed to access this resource"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
