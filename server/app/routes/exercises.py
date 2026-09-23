import json
import sys
import time
import copy
from app.database.db import get_session
from flask import jsonify, Blueprint, request
from app.models import User, Course, Exercise, Boss, Solution, StudentCourseInfo, StudentExerciseLog, StudentExerciseCompletion, TeacherEvaluation
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.auth_utils import role_required
from app.utils.game_utils import update_experience_points
from sqlalchemy.orm import joinedload
import app.evaluator.eval as evaluator
from datetime import datetime
from app.evaluator.evaluator_factory import get_evaluator
from app.evaluator.utils.model_converter import ensure_v3
from app.evaluator.llm_evaluator import evaluate_with_llm

exercises_bp = Blueprint("exercises", __name__)
        
@exercises_bp.route("/<courseId>/exercises", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def create_course_exercise(courseId):
    with get_session() as session:
        try:
            data = request.json
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
                exerciseId=f"{courseId}_{next}",
                exType=data.get("exType", "ClassDiagram")
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
            if "exType" in data:
                exercise.exType = data["exType"]
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
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/solutions/<solutionId>", methods=["PUT"])
@jwt_required()
@role_required("Teacher")
def update_solution(courseId, exerciseId, solutionId):
    with get_session() as session:
        try:
            data = request.json
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            solution = session.query(Solution).filter_by(exerciseId=exerciseId, solutionId=solutionId).first()
            if solution is None:
                return jsonify({"message": "Solution not found"}), 404
            if "content" in data:
                solution.content = json.dumps(data["content"])
            session.commit()
            return jsonify(exercise.serialize()), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/solutions/<solutionId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_solution(courseId, exerciseId, solutionId):
    with get_session() as session:
        try:
            solution = session.query(Solution).filter_by(exerciseId=exerciseId, solutionId=solutionId).first()
            if solution is None:
                return jsonify({"message": "Solution not found"}), 404
            session.delete(solution)
            session.commit()
            return jsonify({"message": "Solution deleted"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/students/<studentId>", methods=["GET"])
@jwt_required()
@role_required("Student")
def get_student_exercise(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            student = session.query(User).filter_by(username=studentId).first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            record = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId, username=studentId).first()
            if record is None:
                return jsonify({"message": "Student exercise record not found"}), 404
            return jsonify({"data": record.serialize(), "exerciseType": exercise.exType}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/students/<studentId>", methods=["PUT"])
@jwt_required()
@role_required("Student")
def update_student_exercise(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            data = request.json
            student = session.query(User).filter_by(username=studentId).first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            record = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId, username=studentId).first()
            solutions = session.query(Solution).filter_by(exerciseId=exerciseId).all()
            solutions = [sol.serialize() for sol in solutions]
            model = data.get("model", None)
            results = evaluator.evaluate_uml_diagram(solutions=solutions, model=model, diagram_type=exercise.exType) 
            completed = session.query(StudentExerciseCompletion).filter_by(exerciseId=exerciseId, username=studentId).first()
            evaluation = data.get("evaluation", False)
            if record is None:
                record = StudentExerciseLog(
                    exerciseId=exerciseId,
                    username=studentId,
                    courseId=courseId,
                    experience=exercise.experience,
                    correctness=0,
                    checks=0,
                    model=json.dumps(model) if model else None,
                    syntax_errors=json.dumps([]),
                    semantic_errors=json.dumps([]),
                    results=json.dumps(results) if results else None
                )
                if evaluation and results is not None:
                    record.correctness = results.get("completeness", 0)
                    record.checks = 1
                    record.experience = update_experience_points(exercise, results, record) if completed is None else completed.experience
                    record.syntax_errors = json.dumps(results.get("syntax_errors", []))
                    record.semantic_errors = json.dumps(results.get("semantic_errors", []))
                session.add(record)
                session.commit()
                return jsonify({"record": record.serialize(), "results": results}), 201
            else:
                if evaluation:
                    record.experience = update_experience_points(exercise, results, record) if completed is None else completed.experience
                    record.correctness = results.get("completeness", record.correctness)
                    record.checks = record.checks + 1
                    record.syntax_errors = json.dumps(results.get("syntax_errors", record.syntax_errors))
                    record.semantic_errors = json.dumps(results.get("semantic_errors", record.semantic_errors))
                    record.results = json.dumps(results) if results else record.results
                record.model = json.dumps(model) if model else record.model
                record.timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                session.commit()
                return jsonify({"record": record.serialize(), "results": results}), 201
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in exercises route: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/students/<studentId>/complete", methods=["GET"])
@jwt_required()
@role_required("Student")
def get_student_completion(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            student = session.query(User).filter_by(username=studentId).first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            record = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId, username=studentId).first()
            if record is None:
                return jsonify({"message": "Student exercise record not found"}), 404
            completed = session.query(StudentExerciseCompletion).filter_by(exerciseId=exerciseId, username=studentId).first()
            if completed is None:
                return jsonify({"completed": False}), 200
            return jsonify({"completed": True, "log": completed.serialize()}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400
        
@exercises_bp.route("/<courseId>/exercises/<exerciseId>/students/<studentId>/complete", methods=["POST"])
@jwt_required()
@role_required("Student")
def complete_student_exercise(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            data = request.json
            student = session.query(User).filter_by(username=studentId).first()
            if student is None:
                return jsonify({"message": "Student not found"}), 404
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            record = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId, username=studentId).first()
            if record is None:
                return jsonify({"message": "Student exercise record not found"}), 404
            completed = session.query(StudentExerciseCompletion).filter_by(exerciseId=exerciseId, username=studentId).first()
            if completed is not None:
                return jsonify({"message": "Exercise already completed"}), 400
            completed = StudentExerciseCompletion(
                exerciseId=exerciseId,
                username=studentId,
                courseId=courseId,
                experience=data.get("newXp", record.experience),
                correctness=record.correctness,
                checks=record.checks,
                model=record.model,
                syntax_errors=record.syntax_errors,
                semantic_errors=record.semantic_errors
            )
            session.add(completed)
            session.commit()
            return jsonify({"log": completed.serialize()}), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Student not found"}), 404

@exercises_bp.route("/<courseId>/exercises/<exerciseId>/diagrams", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_student_diagrams(courseId, exerciseId):
    with get_session() as session:
        try:
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            logs = session.query(StudentExerciseLog).filter_by(exerciseId=exerciseId).all()
            diagrams = []
            for log in logs:
                diagrams.append(log.serialize())
            return jsonify(diagrams), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Invalid JSON"}), 400


def apply_colors_to_model(model, syntax_errors, semantic_errors, results, diagram_type):
    colored = copy.deepcopy(model)
    if diagram_type == "ClassDiagram":
        for error in syntax_errors:
            etype = error.get("type", "")
            if etype == "missingClassName":
                eid = (error.get("element") or {}).get("elementId")
                el = colored["elements"].get(eid) if eid else None
                if el:
                    el["textColor"] = "#e8590c"
                    el["strokeColor"] = "#e8590c"
            elif etype in ("duplicateClassName", "unconnectedClass", "invalidIntermediateClassConnections"):
                eid = (error.get("element") or {}).get("elementId")
                el = colored["elements"].get(eid) if eid else None
                if el:
                    el["fillColor"] = "#fff4e6"
            elif etype in ("missingAttributeName", "duplicateAttributeName", "missingAttributeType",
                           "foreignKeyReference", "invalidAttributeType", "enumerationTypeWithAttributes",
                           "classAsAttributeType", "unconnectedEnumeration"):
                eid = (error.get("attribute") or {}).get("elementId")
                el = colored["elements"].get(eid) if eid else None
                if el:
                    el["fillColor"] = "#fff4e6"
            elif etype in ("missingAssociationName", "missingAssociationMultiplicity",
                           "invalidAssociationMultiplicity", "missingRecursiveAssociationRole"):
                eid = (error.get("association") or {}).get("elementId")
                el = colored["relationships"].get(eid) if eid else None
                if el:
                    el["strokeColor"] = "#e8590c"
                    el["textColor"] = "#e8590c"
        for error in semantic_errors:
            etype = error.get("type", "")
            if etype in ("associationName", "associationMultiplicity", "associationType", "forbiddenAssociation"):
                el = colored["relationships"].get(error.get("elementId"))
                if el:
                    el["strokeColor"] = "#ff6b6b"
                    el["textColor"] = "#ff6b6b"
            elif etype == "attributeType":
                el = colored["elements"].get(error.get("id"))
                if el:
                    el["textColor"] = "#ff6b6b"
            elif etype == "forbiddenClass":
                el = colored["elements"].get(error.get("id"))
                if el:
                    el["textColor"] = "#ff6b6b"
                    el["strokeColor"] = "#ff6b6b"
            elif etype == "classType":
                el = colored["elements"].get(error.get("id"))
                if el:
                    el["fillColor"] = "#ff6b6b"
            elif etype == "forbiddenAttribute":
                el = colored["elements"].get(error.get("id"))
                if el:
                    el["textColor"] = "#ff6b6b"
                    el["strokeColor"] = "#ff6b6b"
        for match in results.get("matchingClasses", []):
            dc = match.get("diagramClass") or {}
            eid = dc.get("elementId")
            el = colored["elements"].get(eid) if eid else None
            if el:
                el["strokeColor"] = "#51cf66"
                el["textColor"] = "#51cf66"
            for attr in match.get("matchingAttributes", []):
                da = attr.get("diagramAttribute") or {}
                aeid = da.get("elementId")
                ael = colored["elements"].get(aeid) if aeid else None
                if ael:
                    ael["fillColor"] = "#ebfbee"
        for match in results.get("matchingAssociations", []):
            da = match.get("diagramAssociation") or {}
            rid = da.get("id")
            el = colored["relationships"].get(rid) if rid else None
            if el:
                el["strokeColor"] = "#51cf66"
                el["textColor"] = "#51cf66"
    elif diagram_type == "UseCaseDiagram":
        for error in syntax_errors:
            etype = error.get("type", "")
            if etype in ("missingActorName", "missingUseCaseName", "missingSystemName"):
                el = colored["elements"].get(error.get("elementId"))
                if el:
                    el["textColor"] = "#e8590c"
                    el["strokeColor"] = "#e8590c"
            elif etype in ("duplicateActorName", "misplacedActor"):
                el = colored["elements"].get(error.get("elementId"))
                if el:
                    el["fillColor"] = "#fd7e14"
            elif etype in ("unconnectedUseCase", "duplicateUseCaseName", "duplicateSystemName",
                           "displacedUseCase", "multipleConnectedActors"):
                el = colored["elements"].get(error.get("elementId"))
                if el:
                    el["fillColor"] = "#ffa94d"
            elif etype in ("noActorGeneralization", "wrongUseCaseAssociation"):
                el = colored["relationships"].get(error.get("elementId"))
                if el:
                    el["strokeColor"] = "#e8590c"
                    el["textColor"] = "#e8590c"
        for error in semantic_errors:
            etype = error.get("type", "")
            if etype in ("wrongIncludeExtendAssociation", "wrongIncludeExtendAssociationDirection"):
                el = colored["relationships"].get(error.get("elementId"))
                if el:
                    el["strokeColor"] = "#ff6b6b"
                    el["textColor"] = "#ff6b6b"
            elif etype == "wrongUseCaseOwner":
                el = colored["elements"].get(error.get("elementId"))
                if el:
                    el["fillColor"] = "#fff5f5"
        for match in results.get("matchingActors", []):
            da = match.get("diagramActor") or {}
            eid = da.get("elementId")
            el = colored["elements"].get(eid) if eid else None
            if el:
                el["strokeColor"] = "#51cf66"
                el["textColor"] = "#51cf66"
        for match in results.get("matchingUseCases", []):
            da = match.get("diagramUseCase") or {}
            eid = da.get("elementId")
            el = colored["elements"].get(eid) if eid else None
            if el:
                el["strokeColor"] = "#51cf66"
                el["textColor"] = "#51cf66"
        for match in results.get("matchingSystems", []):
            da = match.get("diagramSystem") or {}
            eid = da.get("elementId")
            el = colored["elements"].get(eid) if eid else None
            if el:
                el["strokeColor"] = "#51cf66"
                el["textColor"] = "#51cf66"
    return colored


@exercises_bp.route("/<courseId>/exercises/<exerciseId>/evaluations", methods=["GET"])
@jwt_required()
@role_required("Teacher")
def get_teacher_evaluations(courseId, exerciseId):
    with get_session() as session:
        try:
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            evals = session.query(TeacherEvaluation).filter_by(exerciseId=exerciseId).all()
            return jsonify([e.serialize() for e in evals]), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Server error"}), 500


@exercises_bp.route("/<courseId>/exercises/<exerciseId>/evaluations", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def upload_student_solution(courseId, exerciseId):
    with get_session() as session:
        try:
            data = request.json
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            student_id = data.get("studentId")
            model = data.get("model")
            if not student_id or model is None:
                return jsonify({"message": "studentId and model are required"}), 400
            model = ensure_v3(model)
            existing = session.query(TeacherEvaluation).filter_by(exerciseId=exerciseId, studentId=student_id).first()
            if existing is not None:
                existing.originalModel = json.dumps(model)
                existing.staticResult = None
                existing.staticModel = None
                existing.staticTime = None
                existing.llmResult = None
                existing.llmModel = None
                existing.llmTime = None
                existing.timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
                session.commit()
                return jsonify(existing.serialize()), 200
            evaluation = TeacherEvaluation(
                exerciseId=exerciseId,
                studentId=student_id,
                originalModel=json.dumps(model),
            )
            session.add(evaluation)
            session.commit()
            return jsonify(evaluation.serialize()), 201
        except Exception as e:
            print(e)
            return jsonify({"message": "Server error"}), 500


@exercises_bp.route("/<courseId>/exercises/<exerciseId>/evaluations/<studentId>", methods=["DELETE"])
@jwt_required()
@role_required("Teacher")
def delete_teacher_evaluation(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            evaluation = session.query(TeacherEvaluation).filter_by(exerciseId=exerciseId, studentId=studentId).first()
            if evaluation is None:
                return jsonify({"message": "Evaluation not found"}), 404
            session.delete(evaluation)
            session.commit()
            return jsonify({"message": "Evaluation deleted"}), 200
        except Exception as e:
            print(e)
            return jsonify({"message": "Server error"}), 500


@exercises_bp.route("/<courseId>/exercises/<exerciseId>/evaluations/<studentId>/static", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def run_static_evaluation(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            evaluation = session.query(TeacherEvaluation).filter_by(exerciseId=exerciseId, studentId=studentId).first()
            if evaluation is None:
                return jsonify({"message": "Evaluation not found"}), 404
            solutions = session.query(Solution).filter_by(exerciseId=exerciseId).all()
            if not solutions:
                return jsonify({"message": "No reference solutions found for this exercise"}), 400
            solutions_data = [sol.serialize() for sol in solutions]
            model = json.loads(evaluation.originalModel)
            start_time = time.time()
            results = evaluator.evaluate_uml_diagram(solutions=solutions_data, model=model, diagram_type=exercise.exType)
            elapsed = time.time() - start_time
            syntax_errors = results.get("syntax_errors", [])
            semantic_errors = results.get("semantic_errors", [])
            colored_model = apply_colors_to_model(model, syntax_errors, semantic_errors, results, exercise.exType)
            evaluation.staticResult = json.dumps(results)
            evaluation.staticModel = json.dumps(colored_model)
            evaluation.staticTime = round(elapsed, 4)
            session.commit()
            return jsonify(evaluation.serialize()), 200
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in static evaluation: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": "Server error"}), 500


@exercises_bp.route("/<courseId>/exercises/<exerciseId>/evaluations/<studentId>/llm", methods=["POST"])
@jwt_required()
@role_required("Teacher")
def run_llm_evaluation(courseId, exerciseId, studentId):
    with get_session() as session:
        try:
            exercise = session.query(Exercise).filter_by(courseId=courseId, exerciseId=exerciseId).first()
            if exercise is None:
                return jsonify({"message": "Exercise not found"}), 404
            evaluation = session.query(TeacherEvaluation).filter_by(exerciseId=exerciseId, studentId=studentId).first()
            if evaluation is None:
                return jsonify({"message": "Evaluation not found"}), 404
            solutions = session.query(Solution).filter_by(exerciseId=exerciseId).all()
            if not solutions:
                return jsonify({"message": "No reference solutions found for this exercise"}), 400
            model = json.loads(evaluation.originalModel)
            best_result = None
            best_completeness = -1
            best_tokens = 0
            total_time = 0
            for sol in solutions:
                content = json.loads(sol.content)
                reference = content.get("reference")
                if not reference:
                    continue
                start_time = time.time()
                result, tokens = evaluate_with_llm(reference, model)
                elapsed = time.time() - start_time
                total_time += elapsed
                completeness = result.get("completeness", 0)
                if completeness > best_completeness:
                    best_completeness = completeness
                    best_result = result
                    best_tokens = tokens
            if best_result is None:
                return jsonify({"message": "LLM evaluation failed: no valid results"}), 500
            try:
                syntax_errors = best_result.get("syntax_errors", [])
                semantic_errors = best_result.get("semantic_errors", [])
                colored_model = apply_colors_to_model(model, syntax_errors, semantic_errors, best_result, exercise.exType)
                evaluation.llmResult = json.dumps(best_result)
                evaluation.llmModel = json.dumps(colored_model)
                evaluation.llmTime = round(total_time, 4)
                evaluation.llmTokens = best_tokens
                session.commit()
                return jsonify(evaluation.serialize()), 200
            except Exception as e:
                session.rollback()
                exc_type, exc_obj, exc_tb = sys.exc_info()
                print(f"Error processing LLM result: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
                return jsonify({
                    "message": f"LLM returned a result but post-processing failed: {str(e)}",
                    "llmRawResult": best_result,
                    "llmTime": round(total_time, 4),
                    "llmTokens": best_tokens
                }), 422
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in LLM evaluation: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            return jsonify({"message": f"LLM evaluation error: {str(e)}"}), 500