import json
import Levenshtein
import app.evaluator.utils as utils
import sys, os
import re

from app.evaluator.evaluator_factory import get_evaluator

def evaluate_uml_diagram(solutions, model, diagram_type):
    evaluator = get_evaluator(diagram_type)
    return evaluator.evaluate(solutions, model)
