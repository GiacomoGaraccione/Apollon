from enum import Enum
from .logger_config import get_utils_logger
import copy

# Configurazione del logger per utils.py
logger = get_utils_logger()

def create_association_endpoint(endpoint_data, element_id, reference_classes):
    """
    Crea un endpoint di associazione in modo sicuro.
    
    Args:
        endpoint_data (dict): Dati dell'endpoint (source o target)
        element_id (str): ID dell'elemento
        reference_classes (list): Lista delle classi di riferimento
    
    Returns:
        dict: Endpoint dell'associazione
    """
    if not endpoint_data:
        logger.warning(f"Endpoint data is empty for element {element_id}")
        return {
            "role": "",
            "multiplicities": [""],
            "referenceClass": None
        }
    
    # Usa conversioni esplicite per evitare riferimenti condivisi
    role = str(endpoint_data.get("role", ""))
    multiplicity = str(endpoint_data.get("multiplicity", ""))
    
    # Trova la classe di riferimento
    reference_class = None
    for cls in reference_classes:
        if cls.get("elementId") == element_id:
            reference_class = cls
            break
    
    endpoint = {
        "role": role,
        "multiplicities": [multiplicity],
        "referenceClass": reference_class
    }
    
    return endpoint

def convert_apollon_model_to_reference(model):
    reference = {
        "classes": [],
        "associations": []
    }
    elements = model.get("elements", {})
    for element in elements.values():
        elementType = element.get("type", "")
        if elementType == "Class" or elementType == "Enumeration" or elementType == "IntermediateClass" or elementType == "AbstractClass" or elementType == "Interface":
            newClass = {
                "name": element.get("name"),
                "synonyms": [],
                "weight": "STRONG",
                "message": "",
                "forbiddenAttributes": [],
                "attributes": [],
                "elementId": element.get("id"),
                "type": elementType
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
        # Logging essenziale per debug delle associazioni
        rel_id = rel.get("id", "unknown")
        rel_name = rel.get("name", "unnamed")
        source_info = rel.get("source", {})
        target_info = rel.get("target", {})
        
        source_element_id = source_info.get("element")
        target_element_id = target_info.get("element")
        source_multiplicity = source_info.get("multiplicity", "")
        target_multiplicity = target_info.get("multiplicity", "")
        
        logger.info(f"Processing association {rel_id} ({rel_name}): SOURCE {source_element_id}[{source_multiplicity}] -> TARGET {target_element_id}[{target_multiplicity}]")
        
        # Usa la funzione helper per creare gli endpoint in modo sicuro
        sourceCls = create_association_endpoint(source_info, source_element_id, reference["classes"])
        targetCls = create_association_endpoint(target_info, target_element_id, reference["classes"])
        
        newAssoc["source"] = sourceCls
        newAssoc["target"] = targetCls
        
        # Verifica finale e logging degli errori
        actual_source_mult = sourceCls["multiplicities"][0] if sourceCls["multiplicities"] else ""
        actual_target_mult = targetCls["multiplicities"][0] if targetCls["multiplicities"] else ""
        
        if actual_source_mult != source_multiplicity:
            logger.error(f"ERRORE: sourceCls multiplicity non corrisponde! Associazione {rel_id}, Atteso: '{source_multiplicity}', Trovato: '{actual_source_mult}'")
        if actual_target_mult != target_multiplicity:
            logger.error(f"ERRORE: targetCls multiplicity non corrisponde! Associazione {rel_id}, Atteso: '{target_multiplicity}', Trovato: '{actual_target_mult}'")
        
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

class SyntaxErrorType(Enum):
    MISSING_CLASS_NAME = "missingClassName"
    DUPLICATE_CLASS_NAME = "duplicateClassName"
    MISSING_ATTRIBUTE_NAME = "missingAttributeName"
    DUPLICATE_ATTRIBUTE_NAME = "duplicateAttributeName"
    MISSING_ATTRIBUTE_TYPE = "missingAttributeType"
    INVALID_ATTRIBUTE_TYPE = "invalidAttributeType"
    FOREIGN_KEY_REFERENCE = "foreignKeyReference"
    UNCONNECTED_CLASS = "unconnectedClass"
    MISSING_ASSOCIATION_MULTIPLICITY = "missingAssociationMultiplicity"
    INVALID_ASSOCIATION_MULTIPLICITY = "invalidAssociationMultiplicity"
    MISSING_ASSOCIATION_NAME = "missingAssociationName"
    MISSING_RECURSIVE_ASSOCIATION_ROLE = "missingRecursiveAssociationRole"
    ENUMERATION_TYPE_WITH_ATTRIBUTES = "enumerationTypeWithAttributes"
    INTERMEDIATE_CLASS_MULTIPLE_CONNECTIONS = "intermediateClassMultipleConnections"
    CLASS_AS_ATTRIBUTE_TYPE = "classAsAttributeType"
    UNCONNECTED_ENUMERATION = "unconnectedEnumeration"
    INVALID_INTERMEDIATE_CLASS_CONNECTIONS = "invalidIntermediateClassConnections"

class SemanticErrorType(Enum):
    MISSING_CLASS = "missingClass"
    MISSING_ATTRIBUTE = "missingAttribute"
    ATTRIBUTE_TYPE = "attributeType"
    FORBIDDEN_CLASS = "forbiddenClass"
    FORBIDDEN_ATTRIBUTE = "forbiddenAttribute"
    MISSING_ASSOCIATION = "missingAssociation"
    ASSOCIATION_NAME = "associationName"
    ASSOCIATION_MULTIPLICITY = "associationMultiplicity"
    ASSOCIATION_TYPE = "associationType"
    CLASS_TYPE = "classType"