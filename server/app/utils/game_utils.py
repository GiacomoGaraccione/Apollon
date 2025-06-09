import json
from app.models import Exercise, StudentExerciseLog
from app.evaluator.utils import SyntaxErrorType, SemanticErrorType
import sys
from enum import Enum

class ErrorWeight(Enum):
    HIGH = 5
    MEDIUM_HIGH = 4
    MEDIUM = 3
    MEDIUM_LOW = 2
    LOW = 1

SYNTAX_ERROR_PENALTIES = {
    SyntaxErrorType.MISSING_CLASS_NAME: ErrorWeight.HIGH,
    SyntaxErrorType.DUPLICATE_CLASS_NAME: ErrorWeight.MEDIUM_HIGH,
    SyntaxErrorType.MISSING_ATTRIBUTE_NAME: ErrorWeight.MEDIUM,
    SyntaxErrorType.DUPLICATE_ATTRIBUTE_NAME: ErrorWeight.MEDIUM,
    SyntaxErrorType.MISSING_ATTRIBUTE_TYPE: ErrorWeight.MEDIUM_HIGH,
    SyntaxErrorType.INVALID_ATTRIBUTE_TYPE: ErrorWeight.HIGH,
    SyntaxErrorType.FOREIGN_KEY_REFERENCE: ErrorWeight.MEDIUM_HIGH,
    SyntaxErrorType.UNCONNECTED_CLASS: ErrorWeight.MEDIUM,
    SyntaxErrorType.MISSING_ASSOCIATION_MULTIPLICITY: ErrorWeight.MEDIUM_LOW,
    SyntaxErrorType.INVALID_ASSOCIATION_MULTIPLICITY: ErrorWeight.MEDIUM_HIGH,
    SyntaxErrorType.MISSING_ASSOCIATION_NAME: ErrorWeight.MEDIUM_LOW,
    SyntaxErrorType.MISSING_RECURSIVE_ASSOCIATION_ROLE: ErrorWeight.LOW,
}

SEMANTIC_ERROR_PENALTIES = {
    SemanticErrorType.MISSING_CLASS: ErrorWeight.HIGH,
    SemanticErrorType.MISSING_ATTRIBUTE: ErrorWeight.MEDIUM,
    SemanticErrorType.ATTRIBUTE_TYPE: ErrorWeight.MEDIUM_HIGH,
    SemanticErrorType.FORBIDDEN_CLASS: ErrorWeight.MEDIUM,
    SemanticErrorType.FORBIDDEN_ATTRIBUTE: ErrorWeight.MEDIUM_LOW,
    SemanticErrorType.MISSING_ASSOCIATION: ErrorWeight.MEDIUM_HIGH,
    SemanticErrorType.ASSOCIATION_NAME: ErrorWeight.MEDIUM_LOW,
    SemanticErrorType.ASSOCIATION_MULTIPLICITY: ErrorWeight.MEDIUM,
    SemanticErrorType.ASSOCIATION_TYPE: ErrorWeight.MEDIUM_HIGH,
}


def update_experience_points(exercise: Exercise, results, record: StudentExerciseLog, ) -> int:
    try:
        new_unique_syntax_errors = [err for err in results.get("syntax_errors") if err not in json.loads(record.syntax_errors)]
        new_unique_semantic_errors = [err for err in results.get("semantic_errors") if err not in json.loads(record.semantic_errors)]
        fixed_syntax_errors = [err for err in json.loads(record.syntax_errors) if err not in results.get("syntax_errors")]
        fixed_semantic_errors = [err for err in json.loads(record.semantic_errors) if err not in results.get("semantic_errors")]
        syntax_penalty = 0
        for err in new_unique_syntax_errors:
            penalty = SYNTAX_ERROR_PENALTIES.get(SyntaxErrorType(err.get("type")), ErrorWeight.LOW)
            syntax_penalty += penalty.value
        syntax_increase = 0
        for err in fixed_syntax_errors:
            penalty = SYNTAX_ERROR_PENALTIES.get(SyntaxErrorType(err.get("type")), ErrorWeight.LOW)
            syntax_increase += penalty.value
        semantic_penalty = 0
        for err in new_unique_semantic_errors:
            penalty = SEMANTIC_ERROR_PENALTIES.get(SemanticErrorType(err.get("type")), ErrorWeight.LOW)
            semantic_penalty += penalty.value
        semantic_increase = 0
        for err in fixed_semantic_errors:
            penalty = SEMANTIC_ERROR_PENALTIES.get(SemanticErrorType(err.get("type")), ErrorWeight.LOW)
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
        print(f"Error in evaluate_student_diagram: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
        raise(e)
    return record.experience