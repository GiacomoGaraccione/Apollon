import json
from db.database import engine
from db.models import Base
import db.operations as db_ops
from flask import Flask, request, jsonify
from flask_cors import CORS
from llm.llama import generate_uml_content, generate_synonyms, get_synonyms
from llm.nlp import generate_solution_synonyms

Base.metadata.create_all(engine)
app = Flask(__name__)
CORS(app)

@app.route("/exercises", methods=["GET"])
def get_all_exercises():
    exercises = db_ops.get_all_exercises()
    exs = [
        {
            "title": exercise.title,
            "description": exercise.description,
            "solutions": exercise.solutions
        }
        for exercise in exercises
    ]
    return jsonify(exs), 200

@app.route("/exercises", methods=["POST"])
def create_exercise():
    data = request.json
    title = data.get("title")
    description = data.get("description")

    if not title or not description:
        return jsonify({"error": "Missing title or description"}), 400
    
    if not db_ops.create_exercise(title, description):
        return jsonify({"error": "Exercise already exists"}), 409
    
    return jsonify({"message": "Exercise created"}), 201

@app.route("/exercises/<title>", methods=["GET"])
def get_exercise(title):
    exercise = db_ops.get_exercise(title)
    if not exercise:
        return jsonify({"error": "Exercise not found"}), 404
    
    return jsonify({
        "title": exercise.title,
        "description": exercise.description,
        "solutions": exercise.solutions
    }), 200

@app.route("/exercises/<title>/upload", methods=["POST"])
def upload_student_exercises(title):
    data = request.json
    name = data.get("name")
    json = data.get("model")
    if not name or not json:
        return jsonify({"error": "Missing name or json content"}), 400
    
    if not db_ops.upload_student_exercise(title, name, json):
        return jsonify({"error": "Exercise not found"}), 404
    
    return jsonify({"message": "Exercise uploaded"}), 201

@app.route("/exercises/<title>/diagrams", methods=["GET"])
def get_exercise_diagrams(title):
    diagrams = db_ops.get_exercise_diagrams(title)
    if not diagrams:
        return jsonify({"error": "Exercise not found"}), 404
    
    return jsonify(diagrams), 200

@app.route("/exercises/<title>/text", methods=["POST"])
def extract_uml_content(title):
    try:
        data = request.json
        text = data.get("text")
        if not text:
            return jsonify({"error": "Missing text content"}), 400
        response = generate_uml_content(text)
        return jsonify({"uml": response}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Error generating UML content"}), 500

@app.route("/exercises/<title>/reference", methods=["POST"])
def save_synonyms(title):
    data = request.json
    solution = data.get("solution")
    if not solution:
        return jsonify({"error": "Missing solution"}), 400
    
    ex = db_ops.get_exercise(title)
    if not ex:
        return jsonify({"error": "Exercise not found"}), 404
    #solution = generate_solution_synonyms(solution)
    parsed_solutions = json.loads(ex.solutions)
    solution = json.loads(solution)
    parsed_solutions.append(solution)
    ex.solutions = json.dumps(parsed_solutions)
    if not db_ops.update_exercise_solutions(title, ex.solutions):
        return jsonify({"error": "Exercise not found"}), 404
    return jsonify({"solution": parsed_solutions}), 200

@app.route("/exercises/<title>/reference", methods=["PUT"])
def update_references(title):
    try:
        data = request.json
        solution = data.get("solution")
        if not solution:
            return jsonify({"error": "Missing solution"}), 400
        ex = db_ops.get_exercise(title)
        if not ex:
            return jsonify({"error": "Exercise not found"}), 404
        ex.solutions = solution
        if not db_ops.update_exercise_solutions(title, ex.solutions):
            return jsonify({"error": "Exercise not found"}), 404
        return jsonify({"solution": solution}), 200
    except:
        return jsonify({"error": "Invalid JSON"}), 400

@app.route("/exercises/<title>/reference/synonyms", methods=["POST"])
def get_reference_synonyms(title):
    try:
        data = request.json
        synonyms = get_synonyms(data["reference"])
        return jsonify({"synonyms": synonyms}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Invalid JSON"}), 400

if __name__ == "__main__":
    
    app.run(debug=True)