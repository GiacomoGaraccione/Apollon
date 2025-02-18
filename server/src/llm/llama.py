import requests


def ask_llama(prompt, temp=0.7):
    try:
        API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"
        with open('hf-api-token.txt', 'r') as file:
            token = file.read().strip()
        headers = {
            "Authorization": f"Bearer {token}"
        }
        payload = {"inputs": prompt}
        full_output = requests.post(API_URL, headers=headers, json=payload).json()[0]["generated_text"]
        response = full_output[len(prompt):].strip()
        return response
    except Exception as e:
        print(e)
        raise Exception("Error asking Llama")

def generate_uml_content(text):
    try:
        prompt = f"""
        You are a software engineering professor who is dealing with UML class diagrams. 
        You are designing a modeling exercise for your students starting from the textual description of a system to be developed.
        When designing an exercise you consider a reference solution that you will use to evaluate the students' diagrams.
        The reference solution lists the classes, attributes, and associations between classes that a class diagram is expected to contain. Methods are not considered in the reference solution.
        The reference solution must be returned in a JSON format as a single object with the following attributes:
        - classes. A list of objects, each representing a class. Each class object has the following attributes:
            - name. The name of the class.
            - type. The type of the class. It is equal to "Class" if the class is a regular class, "Enum" if it's an enumeration, "Abstract" if it's an abstract class, "Interface" if it's an interface, or "Association" if it's an association class.
            - attributes. A list of objects, each representing an attribute of the class. Each attribute object has the following attributes:
                - name. The name of the attribute.
                - type. The type of the attribute.
        - associations. A list of objects, each representing an association between two classes. Each association object has the following attributes:
            - class1. The name of the first class in the association.
            - class2. The name of the second class in the association.
            - name. The name of the association.
            - cardinality1. The cardinality of the association from class1 to class2.
            - cardinality2. The cardinality of the association from class2 to class1.
            - type. The type of the association.
        A class cannot have another class as one of its attributes, as well as a list, a set, a collection, or a map of types for its attributes.
        If you think that a class should have another class as its attribute, express this as an association between the two classes.
        Enumeration types are allowed as attribute types where suitable. If a class is an enumeration type, its possible values should be listed as attributes with no type.
        If a class has no attributes, then it should be reworked as an attribute of another class it is associated with.
        Consider the following textual description of a system:{text}
        Generate the reference solution in the format specified above. Answer with the JSON code only and no other text. Before the JSON code, write "```" and after the JSON code write "```".
""" 
        response = ask_llama(prompt)
        return response
    except Exception as e:
        print(e)
        raise Exception("Error generating UML content")

def generate_synonyms(solution, text):

    prompt = f"""
    Consider the following textual description of a system: {text}.
    Now, consider the following JSON structure, representing a UML class diagram that models the system described in the text: {solution}
    For each class name, attribute name, and association name in the JSON structure, generate a list of possible synonyms that students might use.
    Edit directly the JSON structure by reading each element and adding a "synonyms" field with the list of synonyms.
"""
    response = ask_llama(prompt)
    return response