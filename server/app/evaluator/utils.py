from enum import Enum

def convert_apollon_model_to_reference(model):
    reference = {
        "classes": [],
        "associations": [],
        "enumerations": [],
        "enumerationAssociations": []
    }
    elements = model.get("elements", {})
    for element in elements.values():
        if element.get("type") == "Class":
            newClass = {
                "name": element.get("name"),
                "synonyms": [],
                "weight": "STRONG",
                "message": "",
                "forbiddenAttributes": [],
                "attributes": [],
                "elementId": element.get("id")
            }
            attributes = element.get("attributes", [])
            for attr_id in attributes:
                attr_element = elements.get(attr_id)
                if attr_element:
                    newAttr = {
                        "name": attr_element.get("name").split(":")[0].replace(" ", ""),
                        "synonyms": [],
                        "weight": "STRONG",
                        "message": "",
                        "elementId": attr_element.get("id")
                    }
                    attrType = attr_element.get("name")
                    if attrType and ":" in attrType:
                        attrType = attrType.split(":", 1)[1].replace(" ", "")
                    else:
                        attrType = ""
                    newAttr["types"] = [attrType]
                    newClass["attributes"].append(newAttr)
            reference["classes"].append(newClass)
    relationships = model.get("relationships", {})
    for rel in relationships.values():
        newAssoc = {
            "message": "",
            "type":  "Default" if (rel.get("type") == "ClassBidirectional" or rel.get("type") == "ClassUnidirectional") else "Aggregation", 
            "weight": "STRONG",
            "synonyms": [],
            "name": rel.get("name", ""),
            "elementId": rel.get("id")
        }
        sourceCls = {
            "role": rel.get("source", {}).get("role", ""),
            "multiplicities": [rel.get("source", {}).get("multiplicity", "")],
            "referenceClass": next((cls for cls in reference["classes"] if cls.get("elementId") == rel.get("source", {}).get("element")), None)
        }
        newAssoc["source"] = sourceCls
        targetCls = {
            "role": rel.get("target", {}).get("role", ""),
            "multiplicities": [rel.get("target", {}).get("multiplicity", "")],
            "referenceClass": next((cls for cls in reference["classes"] if cls.get("elementId") == rel.get("target", {}).get("element")), None)
        }
        newAssoc["target"] = targetCls
        reference["associations"].append(newAssoc)
            
    return reference

class Multiplicity(Enum):
    ZERO = "ZERO"
    ONE = "ONE"
    NUMERIC = "NUMERIC"
    ZERO_TO_ONE = "ZERO_TO_ONE"
    ZERO_TO_MANY = "ZERO_TO_MANY"
    ONE_TO_ONE = "ONE_TO_ONE"
    ONE_TO_MANY = "ONE_TO_MANY"
    ZERO_TO_NUMERIC = "ZERO_TO_NUMERIC"
    ONE_TO_NUMERIC = "ONE_TO_NUMERIC"
    NUMERIC_TO_NUMERIC = "NUMERIC_TO_NUMERIC"
    NUMERIC_TO_MANY = "NUMERIC_TO_MANY"


class AttributeType(Enum): 
    FLOAT = "float"
    INT = "int"
    STRING = "string"
    BOOLEAN = "boolean"
    DATE = "date"
    CURRENCY = "currency"
    TIME = "time"
    DATETIME = "datetime"
    INTEGER = "integer"
    DOUBLE = "double"
    NUMBER = "number"
    LATLONG = "latlong"
