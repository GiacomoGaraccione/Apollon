# server/app/evaluator/evaluator_factory.py
from app.evaluator.base_evaluator import BaseEvaluator
from app.evaluator.class_diagram_evaluator import ClassDiagramEvaluator
from app.evaluator.use_case_evaluator import UseCaseEvaluator
from app.evaluator.bpmn_evaluator import BPMNEvaluator

def get_evaluator(diagram_type: str) -> BaseEvaluator:
    evaluators = {
        'ClassDiagram': ClassDiagramEvaluator,
        "UseCaseDiagram": UseCaseEvaluator,
        "BPMN": BPMNEvaluator
    }
    return evaluators.get(diagram_type, ClassDiagramEvaluator)()