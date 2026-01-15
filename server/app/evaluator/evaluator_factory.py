# server/app/evaluator/evaluator_factory.py
from app.evaluator.base_evaluator import BaseEvaluator
from app.evaluator.class_diagram_evaluator import ClassDiagramEvaluator
from app.evaluator.use_case_evaluator import UseCaseEvaluator

def get_evaluator(diagram_type: str) -> BaseEvaluator:
    evaluators = {
        'ClassDiagram': ClassDiagramEvaluator,
        "UseCaseDiagram": UseCaseEvaluator
    }
    return evaluators.get(diagram_type, ClassDiagramEvaluator)()