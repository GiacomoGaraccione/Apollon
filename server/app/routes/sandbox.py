from datetime import datetime
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, SandboxDiagram
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required
from sqlalchemy.orm import joinedload
import json, sys

sandbox_bp = Blueprint('sandbox', __name__)

@sandbox_bp.route("/<userId>", methods=["GET"])
@jwt_required()
def get_sandbox_diagrams(userId):
    with get_session() as session:
        try:
            diagrams = session.query(SandboxDiagram).filter_by(username=userId).all()
            return jsonify([{
                "diagramId": diagram.diagramId,
                "model": diagram.model,
                "exerciseType": diagram.exerciseType,
                "lastUpdated": diagram.lastUpdated,
                "filename": diagram.filename
            } for diagram in diagrams]), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in exercises route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400
        
@sandbox_bp.route("/<userId>", methods=["POST"])
@jwt_required()
def create_sandbox_diagram(userId):
    with get_session() as session:
        try:
            user = session.query(User).filter_by(username=userId).first()
            if not user:
                return jsonify({"message": "User not found"}), 404
            data = request.get_json()
            model = data.get("model")
            exerciseType = data.get("exerciseType")
            filename = data.get("filename")
            max_counter = session.query(SandboxDiagram).filter_by(username=userId).with_entities(SandboxDiagram.counter).order_by(SandboxDiagram.counter.desc()).first()
            counter = (max_counter[0] if max_counter else 0) + 1
            diagramId = f"{userId}_{counter}"
            new_diagram = SandboxDiagram(
                username=userId,
                counter=counter,
                diagramId=diagramId,
                model=json.dumps(model) if model else None,
                exerciseType=exerciseType,
                filename=filename
            )
            session.add(new_diagram)
            session.commit()
            return jsonify({"message": "Diagram created successfully", "diagramId": diagramId}), 201
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in exercises route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400
        
@sandbox_bp.route("/<userId>/<diagramId>", methods=["PUT"])
@jwt_required()
def update_sandbox_diagram(userId, diagramId):
    with get_session() as session:
        try:
            diagram = session.query(SandboxDiagram).filter_by(username=userId, diagramId=diagramId).first()
            if not diagram:
                return jsonify({"message": "Diagram not found"}), 404
            data = request.get_json()
            model = data.get("model")
            filename = data.get("filename")
            exerciseType = data.get("exerciseType")
            diagram.model = json.dumps(model) if model else None
            diagram.filename = filename
            diagram.exerciseType = exerciseType
            diagram.lastUpdated = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
            session.commit()
            return jsonify({"message": "Diagram updated successfully"}), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in exercises route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400
        
@sandbox_bp.route("/<userId>/<diagramId>", methods=["DELETE"])
@jwt_required()
def delete_sandbox_diagram(userId, diagramId):
    with get_session() as session:
        try:
            diagram = session.query(SandboxDiagram).filter_by(username=userId, diagramId=diagramId).first()
            if not diagram:
                return jsonify({"message": "Diagram not found"}), 404
            session.delete(diagram)
            session.commit()
            return jsonify({"message": "Diagram deleted successfully"}), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in exercises route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400