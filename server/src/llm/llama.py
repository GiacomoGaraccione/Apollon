import json
import requests
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from huggingface_hub import login, InferenceClient

#device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
#model_id = "deepseek-ai/DeepSeek-R1-Distill-Qwen-8B"
#tokenizer = AutoTokenizer.from_pretrained(model_id)
#model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.float16, device_map="auto")
#model = model.to(device)

#def ask(prompt, temp = 0.7):
 #   try:
 #       inputs = tokenizer(prompt, return_tensors="pt", padding="max_length", truncation=True, max_length=2048).to(device)
 #       outputs = model.generate(**inputs, do_sample=True, temperature=temp, max_length=20248, pad_token_id=tokenizer.eos_token_id)
 #       response = tokenizer.decode(outputs[0], skip_special_tokens=True)
 #       return response
 #   except Exception as e:
 #       print(e)
 #       raise Exception("Error asking Llama")

def ask_llama(prompt, temp=0.7):
    try:
        API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"
        with open('hf-api-token.txt', 'r') as file:
            token = file.read().strip()
        headers = {
            "Authorization": f"Bearer {token}"
        }
        payload = {"inputs": prompt}
        try:
            #full_output = requests.post(API_URL, headers=headers, json=payload)
            client = InferenceClient(api_key=token)
            full_output = client.chat.completions.create(
                model="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
                messages=[{"role": "system", "content": prompt}]
            )
        except requests.exceptions.RequestException as e:
            print("Exception Type: ", type(e).__name__)
            print("Exception Args: ", e.args)
            raise Exception("Error asking Llama")
        print(full_output)
        try:
            response = full_output.json()
        except:
            raise Exception("Error asking Llama")
        if isinstance(response, list) and len(response) >0 and "generated_text" in response[0]:
            full_output = response[0]["generated_text"]
            response_text = full_output[len(prompt):].strip()
            return response_text
        else:
            raise ValueError(f"Unexpected response format: {response}")
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
        #response = ask(prompt)
        return response
    except Exception as e:
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

def get_synonyms_batch(terms, language):
    prompt = f"""
    Provide synonyms for the following words in {language}: {', '.join(terms)}.
    Answer only with a JSON object where the keys are the words and the values are lists of synonyms.
    Enclose the JSON object in triple backticks.
"""
    response = ask_llama(prompt)
    return response

def get_synonyms(data):
    try:
        terms = set()
        for cls in data.get("classes", []):
            terms.add(cls["name"])
            for attr in cls.get("attributes", []):
                terms.add(attr["name"])
        for assoc in data.get("associations", []):
            terms.add(assoc["name"])
        for enum in data.get("enumerations", []):
            terms.add(enum["name"])
        terms = list(terms)

        eng_synonyms = get_synonyms_batch(terms, "English")
        ita_synonyms = get_synonyms_batch(terms, "Italian")
        eng_synonyms = json.loads(eng_synonyms[eng_synonyms.find('{'):eng_synonyms.rfind('}')+1])
        ita_synonyms = json.loads(ita_synonyms[ita_synonyms.find('{'):ita_synonyms.rfind('}')+1])
        synonym_map = {
            term: {
                "english": eng_synonyms.get(term, []),
                "italian": ita_synonyms.get(term, [])
            } for term in terms
        }

        # Assign synonyms back to the reference structure
        for cls in data.get("classes", []):
            cls["synonyms"] = cls.get("synonyms", []) + synonym_map.get(cls["name"], {}).get("english", []) + synonym_map.get(cls["name"], {}).get("italian", [])
            for attr in cls.get("attributes", []):
                attr["synonyms"] = attr.get("synonyms", []) + synonym_map.get(attr["name"], {}).get("english", []) + synonym_map.get(attr["name"], {}).get("italian", [])
        for assoc in data.get("associations", []):
            assoc["synonyms"] = assoc.get("synonyms", []) + synonym_map.get(assoc["name"], {}).get("english", []) + synonym_map.get(assoc["name"], {}).get("italian", [])
        for enum in data.get("enumerations", []):
            enum["synonyms"] = enum.get("synonyms", []) + synonym_map.get(enum["name"], {}).get("english", []) + synonym_map.get(enum["name"], {}).get("italian", [])
        return data
    except Exception as e:
        print(e)
        raise Exception("Error getting reference synonyms")