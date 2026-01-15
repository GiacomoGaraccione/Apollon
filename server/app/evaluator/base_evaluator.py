from abc import ABC, abstractmethod

class BaseEvaluator(ABC):

    @abstractmethod
    def validate_solution(self, solution):
        """Validate the provided solution"""
        pass

    @abstractmethod
    def evaluate(self, solution, model):
        """Evaluate the student's model against the reference solution"""
        pass


