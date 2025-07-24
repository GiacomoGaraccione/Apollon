import json
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import ErrorExample
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required
from app.utils.game_utils import update_experience_points
from sqlalchemy.orm import joinedload
import app.evaluator.eval as evaluator
from datetime import datetime

errors_bp = Blueprint('errors', __name__)

@errors_bp.route("/", methods=["GET"])
@jwt_required()
def get_example_errors():
    with get_session() as session:
        errors = session.query(ErrorExample).all()
        return jsonify([error.serialize() for error in errors]), 200