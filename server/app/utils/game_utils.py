import json
from app.models import Exercise, StudentExerciseLog
from app.evaluator.utils.class_diagram import SyntaxErrorType as ClassDiagramSyntaxError, SemanticErrorType as ClassDiagramSemanticError
from app.evaluator.utils.use_case import SyntaxErrorType as UseCaseDiagramSyntaxError, SemanticErrorType as UseCaseDiagramSemanticError
import sys
from enum import Enum

class ErrorWeight(Enum):
    HIGH = 5
    MEDIUM_HIGH = 4
    MEDIUM = 3
    MEDIUM_LOW = 2
    LOW = 1

SYNTAX_ERROR_PENALTIES = {
    ClassDiagramSyntaxError.MISSING_CLASS_NAME: ErrorWeight.HIGH,
    ClassDiagramSyntaxError.DUPLICATE_CLASS_NAME: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSyntaxError.MISSING_ATTRIBUTE_NAME: ErrorWeight.MEDIUM,
    ClassDiagramSyntaxError.DUPLICATE_ATTRIBUTE_NAME: ErrorWeight.MEDIUM,
    ClassDiagramSyntaxError.MISSING_ATTRIBUTE_TYPE: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSyntaxError.INVALID_ATTRIBUTE_TYPE: ErrorWeight.HIGH,
    ClassDiagramSyntaxError.FOREIGN_KEY_REFERENCE: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSyntaxError.UNCONNECTED_CLASS: ErrorWeight.MEDIUM,
    ClassDiagramSyntaxError.MISSING_ASSOCIATION_MULTIPLICITY: ErrorWeight.MEDIUM_LOW,
    ClassDiagramSyntaxError.INVALID_ASSOCIATION_MULTIPLICITY: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSyntaxError.MISSING_ASSOCIATION_NAME: ErrorWeight.MEDIUM_LOW,
    ClassDiagramSyntaxError.MISSING_RECURSIVE_ASSOCIATION_ROLE: ErrorWeight.LOW,
    ClassDiagramSyntaxError.ENUMERATION_TYPE_WITH_ATTRIBUTES: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSyntaxError.CLASS_AS_ATTRIBUTE_TYPE: ErrorWeight.HIGH,
    ClassDiagramSyntaxError.UNCONNECTED_ENUMERATION: ErrorWeight.MEDIUM_LOW,
    ClassDiagramSyntaxError.INVALID_INTERMEDIATE_CLASS_CONNECTIONS: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSyntaxError.MISSING_ACTOR_NAME: ErrorWeight.HIGH,
    UseCaseDiagramSyntaxError.DUPLICATE_ACTOR_NAME: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSyntaxError.MISSING_USE_CASE_NAME: ErrorWeight.HIGH,
    UseCaseDiagramSyntaxError.DUPLICATE_USE_CASE_NAME: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSyntaxError.MISSING_SYSTEM_NAME: ErrorWeight.HIGH,
    UseCaseDiagramSyntaxError.DUPLICATE_SYSTEM_NAME: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSyntaxError.UNCONNECTED_USE_CASE: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSyntaxError.NO_ACTOR_GENERALIZATION: ErrorWeight.MEDIUM,
    UseCaseDiagramSyntaxError.WRONG_USE_CASE_ASSOCIATION: ErrorWeight.MEDIUM,
    UseCaseDiagramSyntaxError.MULTIPLE_CONNECTED_ACTORS: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSyntaxError.MISPLACED_ACTOR: ErrorWeight.MEDIUM_LOW,
    UseCaseDiagramSyntaxError.DISPLACED_USE_CASE: ErrorWeight.LOW
}

SEMANTIC_ERROR_PENALTIES = {
    ClassDiagramSemanticError.MISSING_CLASS: ErrorWeight.HIGH,
    ClassDiagramSemanticError.MISSING_ATTRIBUTE: ErrorWeight.MEDIUM,
    ClassDiagramSemanticError.ATTRIBUTE_TYPE: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSemanticError.FORBIDDEN_CLASS: ErrorWeight.MEDIUM,
    ClassDiagramSemanticError.FORBIDDEN_ATTRIBUTE: ErrorWeight.MEDIUM_LOW,
    ClassDiagramSemanticError.MISSING_ASSOCIATION: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSemanticError.ASSOCIATION_NAME: ErrorWeight.MEDIUM_LOW,
    ClassDiagramSemanticError.ASSOCIATION_MULTIPLICITY: ErrorWeight.MEDIUM,
    ClassDiagramSemanticError.ASSOCIATION_TYPE: ErrorWeight.MEDIUM_HIGH,
    ClassDiagramSemanticError.CLASS_TYPE: ErrorWeight.HIGH,
    UseCaseDiagramSemanticError.MISSING_ACTOR: ErrorWeight.HIGH,
    UseCaseDiagramSemanticError.MISSING_USE_CASE: ErrorWeight.MEDIUM_LOW,
    UseCaseDiagramSemanticError.FORBIDDEN_ACTOR: ErrorWeight.MEDIUM,
    UseCaseDiagramSemanticError.FORBIDDEN_USE_CASE: ErrorWeight.MEDIUM_LOW,
    UseCaseDiagramSemanticError.MISSING_SYSTEM: ErrorWeight.LOW,
    UseCaseDiagramSemanticError.FORBIDDEN_ASSOCIATION: ErrorWeight.MEDIUM_LOW,
    UseCaseDiagramSemanticError.MISSING_GENERALIZATION: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSemanticError.MISSING_ACTOR_USE_CASE_ASSOCIATION: ErrorWeight.MEDIUM,
    UseCaseDiagramSemanticError.MISSING_USE_CASE_ASSOCIATION: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSemanticError.WRONG_INCLUDE_EXTEND_ASSOCIATION: ErrorWeight.MEDIUM_LOW,
    UseCaseDiagramSemanticError.WRONG_INCLUDE_EXTEND_ASSOCIATION_DIRECTION: ErrorWeight.MEDIUM_HIGH,
    UseCaseDiagramSemanticError.WRONG_USE_CASE_OWNER: ErrorWeight.HIGH
}


def update_experience_points(exercise: Exercise, results, record: StudentExerciseLog, ) -> int:
    try:
        new_unique_syntax_errors = [err for err in results.get("syntax_errors") if err not in json.loads(record.syntax_errors)]
        new_unique_semantic_errors = [err for err in results.get("semantic_errors") if err not in json.loads(record.semantic_errors)]
        fixed_syntax_errors = [err for err in json.loads(record.syntax_errors) if err not in results.get("syntax_errors")]
        fixed_semantic_errors = [err for err in json.loads(record.semantic_errors) if err not in results.get("semantic_errors")]
        syntax_penalty = 0
        for err in new_unique_syntax_errors:
            penalty = SYNTAX_ERROR_PENALTIES.get(err.get("type"), ErrorWeight.LOW)
            syntax_penalty += penalty.value
        syntax_increase = 0
        for err in fixed_syntax_errors:
            penalty = SYNTAX_ERROR_PENALTIES.get(err.get("type"), ErrorWeight.LOW)
            syntax_increase += penalty.value
        semantic_penalty = 0
        for err in new_unique_semantic_errors:
            penalty = SEMANTIC_ERROR_PENALTIES.get(err.get("type"), ErrorWeight.LOW)
            semantic_penalty += penalty.value
        semantic_increase = 0
        for err in fixed_semantic_errors:
            penalty = SEMANTIC_ERROR_PENALTIES.get(err.get("type"), ErrorWeight.LOW)
            semantic_increase += penalty.value
        limit = int(exercise.experience * 0.35)
        record.experience += syntax_increase
        record.experience -= syntax_penalty
        record.experience += semantic_increase
        record.experience -= semantic_penalty
        if record.experience < limit:
            record.experience = limit
        elif record.experience > exercise.experience:
            record.experience = exercise.experience
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        print(f"Error in game_utils.update_experience_points: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
        raise(e)
    return record.experience