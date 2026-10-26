import uuid
import json
import sys
from datetime import datetime
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Group, GroupDiagram
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required

groups_bp = Blueprint("groups", __name__)


def _identity():
    identity = get_jwt_identity()
    username, role = identity.split("_", 1)
    return username, role


def _get_group_or_error(session, groupId):
    group = session.query(Group).filter_by(groupId=groupId).first()
    if group is None:
        return None, (jsonify({"message": "Group not found"}), 404)
    return group, None


def _check_workspace_access(session, groupId, username, role):
    """Returns (group, error_response). Teachers can access any group; everyone
    else must be an enrolled member."""
    group, error = _get_group_or_error(session, groupId)
    if error:
        return None, error
    if role != "Teacher" and not any(member.username == username for member in group.members):
        return None, (jsonify({"message": "You are not allowed to access this group's workspace"}), 403)
    return group, None


def _check_workspace_write_access(session, groupId, username):
    """Returns (group, error_response). Only enrolled members may modify a
    group's workspace, regardless of role."""
    group, error = _get_group_or_error(session, groupId)
    if error:
        return None, error
    if not any(member.username == username for member in group.members):
        return None, (jsonify({"message": "You are not allowed to modify this group's workspace"}), 403)
    return group, None


# ----------------- Teacher: group CRUD -----------------

@groups_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_all_groups():
    with get_session() as session:
        try:
            groups = session.query(Group).all()
            return jsonify({"groups": [group.serialize() for group in groups]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@groups_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def create_group():
    with get_session() as session:
        try:
            data = request.json
            name = (data.get("name") or "").strip()
            if not name:
                return jsonify({"message": "Group name is required"}), 400
            if session.query(Group).filter_by(name=name).first():
                return jsonify({"message": "Group name is already in use"}), 400
            group = Group(groupId=str(uuid.uuid4()), name=name)
            for userId in data.get("memberUserIds", []):
                member = session.query(User).filter_by(userId=userId).first()
                if member:
                    group.members.append(member)
            session.add(group)
            session.commit()
            return jsonify(group.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@groups_bp.route("/<groupId>", methods=["PUT"])
@jwt_required()
@role_required("Teacher")
def update_group(groupId):
    with get_session() as session:
        try:
            group, error = _get_group_or_error(session, groupId)
            if error:
                return error
            data = request.json
            name = (data.get("name") or "").strip()
            if name and name != group.name:
                if session.query(Group).filter_by(name=name).first():
                    return jsonify({"message": "Group name is already in use"}), 400
                group.name = name
            session.commit()
            return jsonify(group.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@groups_bp.route("/<groupId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_group(groupId):
    with get_session() as session:
        try:
            group, error = _get_group_or_error(session, groupId)
            if error:
                return error
            session.delete(group)
            session.commit()
            return jsonify({"message": "Group deleted successfully"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


# ----------------- Teacher: group membership -----------------

@groups_bp.route("/<groupId>/non-members", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_non_members(groupId):
    with get_session() as session:
        try:
            group, error = _get_group_or_error(session, groupId)
            if error:
                return error
            member_usernames = {member.username for member in group.members}
            non_members = session.query(User).filter(User.username.notin_(member_usernames)).all() if member_usernames else session.query(User).all()
            return jsonify({"users": [user.serialize() for user in non_members]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@groups_bp.route("/<groupId>/members", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def add_members(groupId):
    with get_session() as session:
        try:
            group, error = _get_group_or_error(session, groupId)
            if error:
                return error
            data = request.json
            added = []
            failed = []
            for userId in data.get("userIds", []):
                member = session.query(User).filter_by(userId=userId).first()
                if not member:
                    failed.append({"userId": userId, "message": "User not found"})
                elif member in group.members:
                    failed.append({"userId": userId, "message": "User is already a member"})
                else:
                    group.members.append(member)
                    added.append(userId)
            session.commit()
            return jsonify({"added": added, "failed": failed}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@groups_bp.route("/<groupId>/members/<userId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def remove_member(groupId, userId):
    with get_session() as session:
        try:
            group, error = _get_group_or_error(session, groupId)
            if error:
                return error
            member = session.query(User).filter_by(userId=userId).first()
            if not member:
                return jsonify({"message": "User not found"}), 404
            if member not in group.members:
                return jsonify({"message": "User is not a member of this group"}), 400
            group.members.remove(member)
            session.commit()
            return jsonify({"message": "Member removed successfully"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


# ----------------- Any user: their own groups -----------------

@groups_bp.route("/mine", methods=["GET"])
@jwt_required()
def get_my_groups():
    username, _ = _identity()
    with get_session() as session:
        try:
            user = session.query(User).filter_by(username=username).first()
            if not user:
                return jsonify({"message": "User not found"}), 404
            return jsonify({"groups": [group.serialize() for group in user.groups]}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


# ----------------- Group workspace: members (any role) + teachers -----------------

@groups_bp.route("/<groupId>", methods=["GET"])
@jwt_required()
def get_group(groupId):
    username, role = _identity()
    with get_session() as session:
        try:
            group, error = _check_workspace_access(session, groupId, username, role)
            if error:
                return error
            return jsonify(group.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Database connection error"}), 500


@groups_bp.route("/<groupId>/diagrams", methods=["GET"])
@jwt_required()
def get_group_diagrams(groupId):
    username, role = _identity()
    with get_session() as session:
        try:
            group, error = _check_workspace_access(session, groupId, username, role)
            if error:
                return error
            diagrams = session.query(GroupDiagram).filter_by(groupId=groupId).all()
            if role != "Teacher":
                diagrams = [d for d in diagrams if not d.hidden]
            return jsonify([d.serialize() for d in diagrams]), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in groups route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400


@groups_bp.route("/<groupId>/diagrams", methods=["POST"])
@jwt_required()
def create_group_diagram(groupId):
    username, role = _identity()
    with get_session() as session:
        try:
            group, error = _check_workspace_write_access(session, groupId, username)
            if error:
                return error
            data = request.get_json()
            model = data.get("model")
            diagramType = data.get("diagramType")
            filename = data.get("filename")
            max_counter = session.query(GroupDiagram).filter_by(groupId=groupId).with_entities(GroupDiagram.counter).order_by(GroupDiagram.counter.desc()).first()
            counter = (max_counter[0] if max_counter else 0) + 1
            diagramId = f"{groupId}_{counter}"
            diagram = GroupDiagram(
                groupId=groupId,
                diagramId=diagramId,
                counter=counter,
                model=json.dumps(model) if model else None,
                diagramType=diagramType,
                filename=filename,
                createdBy=username,
                lastEditedBy=username,
            )
            session.add(diagram)
            session.commit()
            return jsonify({"message": "Diagram created successfully", "diagramId": diagramId}), 201
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in groups route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400


@groups_bp.route("/<groupId>/diagrams/<diagramId>", methods=["PUT"])
@jwt_required()
def update_group_diagram(groupId, diagramId):
    username, role = _identity()
    with get_session() as session:
        try:
            group, error = _check_workspace_write_access(session, groupId, username)
            if error:
                return error
            diagram = session.query(GroupDiagram).filter_by(groupId=groupId, diagramId=diagramId).first()
            if not diagram:
                return jsonify({"message": "Diagram not found"}), 404
            data = request.get_json()
            model = data.get("model")
            filename = data.get("filename")
            diagramType = data.get("diagramType")
            if model is not None:
                diagram.model = json.dumps(model)
            if filename is not None:
                diagram.filename = filename
            if diagramType is not None:
                diagram.diagramType = diagramType
            diagram.lastEditedBy = username
            diagram.lastUpdated = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
            session.commit()
            return jsonify({"message": "Diagram updated successfully"}), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in groups route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400


@groups_bp.route("/<groupId>/diagrams/<diagramId>", methods=["DELETE"])
@jwt_required()
def hide_group_diagram(groupId, diagramId):
    username, role = _identity()
    with get_session() as session:
        try:
            group, error = _check_workspace_write_access(session, groupId, username)
            if error:
                return error
            diagram = session.query(GroupDiagram).filter_by(groupId=groupId, diagramId=diagramId).first()
            if not diagram:
                return jsonify({"message": "Diagram not found"}), 404
            diagram.hidden = True
            session.commit()
            return jsonify({"message": "Diagram removed from the workspace"}), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in groups route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400


@groups_bp.route("/<groupId>/diagrams/<diagramId>/restore", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def restore_group_diagram(groupId, diagramId):
    with get_session() as session:
        try:
            diagram = session.query(GroupDiagram).filter_by(groupId=groupId, diagramId=diagramId).first()
            if not diagram:
                return jsonify({"message": "Diagram not found"}), 404
            diagram.hidden = False
            session.commit()
            return jsonify({"message": "Diagram restored successfully"}), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in groups route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid Request"}), 400
