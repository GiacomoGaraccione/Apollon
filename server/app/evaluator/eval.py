import json
import Levenshtein
import app.evaluator.utils as utils
import sys, os
import re
from .logger_config import get_eval_logger

# Configurazione del logger per eval.py
logger = get_eval_logger()

def find_closest_strings(dict1, dict2):
    """
    Receives two dictionaries with 'name' and 'synonyms' (list of strings).
    Computes the Levenshtein distance between both 'name' attributes and,
    for each 'name', the distance with the 'synonyms' of the other dictionary.
    Returns the two strings with the lowest distance and the computed value.
    """

    strings1 = [dict1["name"]] + dict1.get("synonyms", [])
    strings2 = [dict2["name"]] + dict2.get("synonyms", [])

    max_distance = None
    closest_pair = (None, None)

    for s1 in strings1:
        for s2 in strings2:
            dist = 1 - Levenshtein.distance(s1.lower(), s2.lower()) / max(len(s1), len(s2), 1)
            if (max_distance is None) or (dist > max_distance):
                max_distance = dist
                closest_pair = (s1, s2)
    return closest_pair[0], closest_pair[1], max_distance

def evaluate_student_diagram(solutions, model):
    try:
        best = None
        best_completeness = 0
        best_reference = None
        for sol in solutions:
            reference = json.loads(sol.get("content")).get("reference")
            diagram = utils.convert_apollon_model_to_reference(model)
            report = {
                "matchingClasses": [],
                "matchingAssociations": [],
                "forbiddenClasses": [],
                "forbiddenAssociations": []
            }
            for cl1 in reference.get("classes", {}):
                matching_class = None
                max_sim = 0.7
                print(cl1.get("type", ""))
                for cl2 in diagram.get("classes", {}):
                    _, _, sim = find_closest_strings(cl1, cl2)
                    if sim > max_sim:
                        max_sim = sim
                        matching_class = cl2
                if matching_class:
                    matching_attributes = []
                    for attr1 in cl1.get("attributes", []):
                        matching_attr = None
                        max_attr_sim = 0.7
                        for attr2 in matching_class.get("attributes", []):
                            _, _, attr_sim = find_closest_strings(attr1, attr2)
                            if attr_sim > max_attr_sim:
                                max_attr_sim = attr_sim
                                matching_attr = attr2
                        if matching_attr:
                            types_match = False
                            if matching_class.get("type") == "Enumeration":
                                types_match = True
                            if matching_attr.get("types") and attr1.get("types"):
                                types_match = matching_attr["types"][0].lower() in [attr.lower() for attr in attr1["types"]]
                            matching_attributes.append({
                                "referenceAttribute": attr1.get("name"), 
                                "diagramAttribute": {"elementId": matching_attr.get("elementId"), "name": matching_attr.get("name")}, 
                                "similarity": max_attr_sim,
                                "typesMatch": types_match,
                                "allowsForeignKeyName": attr1.get("allowsForeignKeyName", False)
                            })
                    forbidden_attributes = []
                    for attr in matching_class.get("attributes", []):
                        if any(ma["diagramAttribute"]["elementId"] == attr.get("elementId") for ma in matching_attributes):
                            continue
                        max_forbidden_sim = 0.7
                        forbidden_attr_name = None
                        for forbidden in cl1.get("forbiddenAttributes", []):
                            _, _, sim = find_closest_strings(attr, {"name": forbidden, "synonyms": []})
                            if sim > max_forbidden_sim:
                                max_forbidden_sim = sim
                                forbidden_attr_name = forbidden
                        if forbidden_attr_name:
                            forbidden_attributes.append({
                                "name": forbidden_attr_name,
                                "elementId": attr.get("elementId"),
                                "similarity": max_forbidden_sim
                            })
                    report["matchingClasses"].append({
                        "referenceClass": cl1.get("name"), 
                        "diagramClass": {"elementId": matching_class.get("elementId"), "name": matching_class.get("name")}, 
                        "similarity": max_sim,
                        "matchingAttributes": matching_attributes,
                        "forbiddenAttributes": forbidden_attributes,
                        "correctType": cl1.get("type") == matching_class.get("type"),
                        "currentType": matching_class.get("type")
                    })
            matched_diagram_class_names = {mc["diagramClass"]["name"] for mc in report["matchingClasses"]}
            for cl in diagram.get("classes", []):
                max_sim = 0.7
                if cl.get("name") not in matched_diagram_class_names:
                    forbidden_classes = reference.get("forbiddenClasses", [])
                    str1, str2, sim = find_closest_strings(cl, {"name": "", "synonyms": forbidden_classes})
                    if sim > max_sim:
                        max_sim = sim
                        report["forbiddenClasses"].append({
                            "forbiddenClass": str2,
                            "diagramClass": {"elementId": cl.get("elementId"), "name": cl.get("name")},
                            "similarity": sim
                        })
                    continue
            used_diagram_associations = set()
            for assoc1 in reference.get("associations", []):
                matching_association = None
                source_pair = None
                target_pair = None
                ref_source = assoc1.get("source", {}).get("referenceClass", {}).get("name")
                ref_target = assoc1.get("target", {}).get("referenceClass", {}).get("name")
                source_match = next((mc for mc in report["matchingClasses"] if mc.get("referenceClass") == ref_source), None)
                target_match = next((mc for mc in report["matchingClasses"] if mc.get("referenceClass") == ref_target), None)
                if source_match is not None and target_match is not None:
                    for assoc2 in diagram.get("associations", []):
                        if assoc2.get("elementId") in used_diagram_associations:
                            continue
                        source = assoc2.get("source", {}).get("referenceClass", {}).get("name")
                        target = assoc2.get("target", {}).get("referenceClass", {}).get("name")
                        if (source_match.get("diagramClass", {}).get("name") == source or source_match.get("diagramClass", {}).get("name") == target) and (target_match.get("diagramClass", {}).get("name") == target or target_match.get("diagramClass", {}).get("name") == source):
                            matching_association = assoc2
                            used_diagram_associations.add(assoc2.get("elementId"))
                            if source_match.get("diagramClass", {}).get("name") == source:
                                source_pair = {
                                    "diagramInfo":  {
                                        "elementId": model.get("relationships", {}).get(matching_association.get("elementId"), {}).get("source", {}).get("element"),
                                        "multiplicity": model.get("relationships", {}).get(matching_association.get("elementId"), {}).get("source", {}).get("multiplicity"),
                                        "role": model.get("relationships", {}).get(matching_association.get("elementId"), {}).get("source", {}).get("role"),
                                        "name": source_match.get("diagramClass", {}).get("name")
                                    },
                                    "referenceInfo": assoc1.get("source", {})
                                }
                                target_pair = {
                                    "diagramInfo": {
                                        "elementId": model.get("relationships", {}).get(matching_association.get("elementId"), {}).get("target", {}).get("element"),
                                        "multiplicity": model.get("relationships", {}).get(matching_association.get("elementId"), {}).get("target", {}).get("multiplicity"),
                                        "role": model.get("relationships", {}).get(matching_association.get("elementId"), {}).get("target", {}).get("role"),
                                        "name": target_match.get("diagramClass", {}).get("name")
                                    },
                                    "referenceInfo": assoc1.get("target", {})
                                }
                            else:
                                source_pair = {
                                    "diagramInfo": {
                                        "elementId": model.get("relationships", {}).get(matching_association.get("elementId")).get("target", {}).get("element"),
                                        "multiplicity": model.get("relationships", {}).get(matching_association.get("elementId")).get("target", {}).get("multiplicity"),
                                        "role": model.get("relationships", {}).get(matching_association.get("elementId")).get("target", {}).get("role"),
                                        "name": source_match.get("diagramClass", {}).get("name")
                                    },
                                    "referenceInfo": assoc1.get("source", {})
                                }
                                target_pair = {
                                    "diagramInfo": {
                                        "elementId": model.get("relationships", {}).get(matching_association.get("elementId")).get("source", {}).get("element"),
                                        "multiplicity": model.get("relationships", {}).get(matching_association.get("elementId")).get("source", {}).get("multiplicity"),
                                        "role": model.get("relationships", {}).get(matching_association.get("elementId")).get("source", {}).get("role"),
                                        "name": target_match.get("diagramClass", {}).get("name")
                                    },
                                    "referenceInfo": assoc1.get("target", {})
                                }
                            break
                if matching_association:
                    report["matchingAssociations"].append({
                        "referenceAssociation": assoc1,
                        "diagramAssociation": model.get("relationships", {}).get(matching_association.get("elementId")),
                        "source_pair": source_pair,
                        "target_pair": target_pair
                    })
            for cls in report.get("matchingClasses", []):
                cls_name = cls.get("referenceClass", {})
                cls_associations = [
                    assoc for assoc in diagram.get("associations", [])
                    if assoc.get("source", {}).get("referenceClass", {}).get("name") == cls_name
                    or assoc.get("target", {}).get("referenceClass", {}).get("name") == cls_name
                ]
                for assoc in cls_associations:
                    source_name = assoc.get("source", {}).get("referenceClass", {}).get("name")
                    target_name = assoc.get("target", {}).get("referenceClass", {}).get("name")
                    for forbidden in reference.get("forbiddenAssociations", []):
                        forbidden_source = forbidden.get("source")
                        forbidden_target = forbidden.get("target")
                        if (source_name == forbidden_source and target_name == forbidden_target) or (source_name == forbidden_target and target_name == forbidden_source):
                            report["forbiddenAssociations"].append({
                                "source": source_name,
                                "target": target_name
                            })
            class_completeness = len(report["matchingClasses"]) / len(reference.get("classes", [])) if reference.get("classes") else 0
            attribute_completeness = sum(len(mc.get("matchingAttributes", [])) for mc in report["matchingClasses"]) / sum(len(cl.get("attributes", [])) for cl in reference.get("classes", [])) if reference.get("classes") else 0
            association_completeness = len(report["matchingAssociations"]) / len(reference.get("associations", []))
            report["classCompleteness"] = round(100 * class_completeness, 2)
            report["attributeCompleteness"] = round(100* attribute_completeness, 2)
            report["associationCompleteness"] = round(100 * association_completeness, 2)
            total_reference = len(reference.get("classes", [])) + sum(len(cl.get("attributes", [])) for cl in reference.get("classes", [])) + len(reference.get("associations", []))
            total_matched = len(report["matchingClasses"]) + sum(len(mc.get("matchingAttributes", [])) for mc in report["matchingClasses"]) + len(report.get("matchingAssociations", []))
            completeness = total_matched / total_reference if total_reference else 0
            report["completeness"] = round(100 * completeness, 2)
            if completeness > best_completeness:
                best_completeness = completeness
                best = report
                best_reference = reference
            else:
                best_completeness = 0
                best_reference = reference
                best = report
        semantic_errors = get_semantic_errors_from_report(best, best_reference)
        syntax_errors = get_syntax_errors_from_model(utils.convert_apollon_model_to_reference(model), best_reference, best)
        best["syntax_errors"] = syntax_errors
        best["semantic_errors"] = semantic_errors
        return best
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        logger.error(f"Error in evaluate_student_diagram: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
        raise(e)

def get_syntax_errors_from_model(model, reference=None, report=None):
    errors = []
    try:
        names_seen = {}
        enumeration_names = [c.get("name", "") for c in model.get("classes", []) if c.get("type") == "Enumeration"]
        for cl in model.get("classes", []):
            name = cl.get("name", "").strip().lower()
            if not name:
                errors.append({
                    "type": utils.SyntaxErrorType.MISSING_CLASS_NAME._value_,
                    "message": "Class name is missing",
                    "element": cl
                })
            elif name in names_seen:
                errors.append({
                    "type": utils.SyntaxErrorType.DUPLICATE_CLASS_NAME._value_,
                    "message": f"Duplicate class name '{cl.get('name')}' found",
                    "element": cl
                })
            else:
                names_seen[name] = cl
            attrs_seen = {}
            for attr in cl.get("attributes", []):
                attr_name = attr.get("name", "").strip().lower()
                if not attr_name:
                    errors.append({
                        "type": utils.SyntaxErrorType.MISSING_ATTRIBUTE_NAME._value_,
                        "message": "Attribute name is missing",
                        "attribute": attr,
                        "class": cl.get("name")
                    })
                elif attr_name in attrs_seen:
                    errors.append({
                        "type": utils.SyntaxErrorType.DUPLICATE_ATTRIBUTE_NAME._value_,
                        "message": f"Duplicate attribute name '{attr.get('name')}' found in class '{cl.get('name')}'",
                        "attribute": attr,
                        "class": cl.get("name")
                    })
                else:
                    attrs_seen[attr_name] = attr
                attr_types = attr.get("types", [""])
                if cl.get("type") != "Enumeration":
                    if len(attr_types) == 0 or attr_types[0] == "":
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_ATTRIBUTE_TYPE._value_,
                            "message": f"Attribute '{attr.get('name')}' in class '{cl.get('name')}' has no type defined",
                            "attribute": attr,
                            "class": cl.get("name")
                        })  
                    else:
                        allowed_types = [t.value.lower() for t in utils.AttributeType] + [en.lower() for en in enumeration_names]
                        if attr_types[0].lower() not in allowed_types:
                            errors.append({
                                "type": utils.SyntaxErrorType.INVALID_ATTRIBUTE_TYPE._value_,
                                "message": f"Attribute '{attr.get('name')}' in class '{cl.get('name')}' has an invalid type '{attr_types[0]}'",
                                "attribute": attr,
                                "class": cl.get("name")
                            })
                else:
                    if len(attr_types) > 0 and attr_types[0] != "":
                        errors.append({
                            "type": utils.SyntaxErrorType.ENUMERATION_TYPE_WITH_ATTRIBUTES._value_,
                            "message": f"Enumeration '{cl.get('name')}' should not have attributes with types",
                            "attribute": attr,
                            "class": cl.get("name")
                        })
                for other_cl in model.get("classes", []):
                    other_name = other_cl.get("name", "").strip().lower()
                    if other_name and other_name in attr_name and other_name != name:
                        matching_report_class = next((mc for mc in report.get("matchingClasses", []) if mc.get("diagramClass", {}).get("name") == cl.get("name")), None)
                        matching_report_attr = None
                        if matching_report_class:
                            matching_report_attr = next((ma for ma in matching_report_class.get("matchingAttributes", []) if ma.get("diagramAttribute", {}).get("elementId") == attr.get("elementId")), None)
                        if not matching_report_attr or not matching_report_attr.get("allowsForeignKeyName", False):
                            errors.append({
                                "type": utils.SyntaxErrorType.FOREIGN_KEY_REFERENCE._value_,
                                "message": f"Attribute name '{attr.get('name')}' in class '{cl.get('name')}' may be a foreign key reference to another class '{other_cl.get('name')}'",
                                "attribute": attr,
                                "class": cl.get("name"),
                                "containedClass": other_cl.get("name")
                            })
                class_names = [c.get("name") for c in model.get("classes", [])]
                if attr_types and attr_types[0] and attr_types[0] in class_names:
                    typed_class = next((c for c in model.get("classes", []) if c.get("name") == attr_types[0]), None)
                    if typed_class.get("type") == "Enumeration":
                        for assoc in model.get("associations"):
                            source = assoc.get("source", {}).get("referenceClass", {}).get("name")
                            target = assoc.get("target", {}).get("referenceClass", {}).get("name")
                            if ((source == cl.get("name") and target == typed_class.get("name")) or
                                (source == typed_class.get("name") and target == cl.get("name"))):
                                break
                        else:
                            errors.append({
                                "type": utils.SyntaxErrorType.UNCONNECTED_ENUMERATION._value_,
                                "message": f"Attribute '{attr.get('name')}' in class '{cl.get('name')}' is an enumeration, but there is no association between '{cl.get('name')}' and '{typed_class.get('name')}'",
                                "attribute": attr,
                                "class": cl.get("name")
                            })
                    else:
                        errors.append({
                            "type": utils.SyntaxErrorType.CLASS_AS_ATTRIBUTE_TYPE._value_,
                            "message": f"Attribute '{attr.get('name')}' in class '{cl.get('name')}' has a type that is a class",
                            "attribute": attr,
                            "class": cl.get("name")
                        })
                
            class_used_in_association = any(
                (assoc.get("source", {}).get("referenceClass", {}).get("name") == cl.get("name") or
                 assoc.get("target", {}).get("referenceClass", {}).get("name") == cl.get("name"))
                for assoc in model.get("associations", [])
            )
            if not class_used_in_association:
                errors.append({
                    "type": utils.SyntaxErrorType.UNCONNECTED_CLASS._value_,
                    "message": f"Class '{cl.get('name')}' is not connected to any other class",
                    "element": cl
                })
            if cl.get("type", "Class") == "IntermediateClass":
                connected_classes = set()
                for assoc in model.get("associations", []):
                    source = assoc.get("source", {}).get("referenceClass", {})
                    target = assoc.get("target", {}).get("referenceClass", {})
                    if source.get("name") == cl.get("name"):
                        other = target
                    elif target.get("name") == cl.get("name"):
                        other = source
                    else:
                        continue
                    for c in model.get("classes", []):
                        if c.get("name") == other.get("name") and c.get("type", "Class") == "Class":
                            connected_classes.add(c.get("name"))
                if len(connected_classes) != 2:
                    errors.append({
                        "type": utils.SyntaxErrorType.INVALID_INTERMEDIATE_CLASS_CONNECTIONS._value_,
                        "message": f"Intermediate class '{cl.get('name')}' must be connected to exactly two classes",
                        "element": cl,
                        "connectedClasses": list(connected_classes)
                    })
        for assoc in model.get("associations", []):
            if assoc.get("type") == "Default":
                source = assoc.get("source", {})
                target = assoc.get("target", {})
                source_type = source.get("referenceClass", {}).get("type", "Class")
                target_type = target.get("referenceClass", {}).get("type", "Class")
                if source_type != "Enumeration" and target_type != "Enumeration":
                    if source.get("multiplicities", [""]) == [""]:
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_ASSOCIATION_MULTIPLICITY._value_,
                            "message": f"Association '{assoc.get('name')}' has no source multiplicity defined",
                            "association": assoc,
                            "class": source.get("referenceClass", {}).get("name")
                        })
                    elif not get_multiplicity(source.get("multiplicities", [""])[0]):
                        errors.append({
                            "type": utils.SyntaxErrorType.INVALID_ASSOCIATION_MULTIPLICITY._value_,
                            "message": f"Association '{assoc.get('name')}' has an invalid source multiplicity '{source.get('multiplicities', [''])[0]}'",
                            "association": assoc,
                            "class": source.get("referenceClass", {}).get("name")
                        })
                    if target.get("multiplicities", [""]) == [""]:
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_ASSOCIATION_MULTIPLICITY._value_,
                            "message": f"Association '{assoc.get('name')}' has no target multiplicity defined",
                            "association": assoc,
                            "class": target.get("referenceClass", {}).get("name")
                        })
                    elif not get_multiplicity(target.get("multiplicities", [""])[0]):
                        errors.append({
                            "type": utils.SyntaxErrorType.INVALID_ASSOCIATION_MULTIPLICITY._value_,
                            "message": f"Association '{assoc.get('name')}' has an invalid target multiplicity '{target.get('multiplicities', [''])[0]}'",
                            "association": assoc,
                            "class": target.get("referenceClass", {}).get("name")
                        })
                    if not assoc.get("name", "").strip():
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_ASSOCIATION_NAME._value_,
                            "message": f"Association has no name defined",
                            "association": assoc
                        })
                if source.get("referenceClass", {}).get("name", "") == target.get("referenceClass", {}).get("name", ""):
                    source_no_role = False
                    target_no_role = False
                    if source.get("role", "").strip() == "":
                        source_no_role = True
                    if target.get("role", "").strip() == "":
                        target_no_role = True
                    if source_no_role and target_no_role:
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_RECURSIVE_ASSOCIATION_ROLE._value_,
                            "message": f"Class '{source.get('referenceClass', {}).get('name')}' has a recursive association '{assoc.get('name')}' but no role defined",
                            "association": assoc,
                            "count": 2,
                            "class": source.get("referenceClass", {}).get("name")
                        })
                    elif source_no_role:
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_RECURSIVE_ASSOCIATION_ROLE._value_,
                            "message": f"Class '{source.get('referenceClass', {}).get('name')}' has a recursive association '{assoc.get('name')}' but no source role defined",
                            "association": assoc,
                            "count": 1,
                            "class": source.get("referenceClass", {}).get("name")
                        })
                    elif target_no_role:
                        errors.append({
                            "type": utils.SyntaxErrorType.MISSING_RECURSIVE_ASSOCIATION_ROLE._value_,
                            "message": f"Class '{target.get('referenceClass', {}).get('name')}' has a recursive association '{assoc.get('name')}' but no target role defined",
                            "association": assoc,
                            "count": 1,
                            "class": target.get("referenceClass", {}).get("name")
                        })
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        logger.error(f"Error in get_syntax_errors_from_model: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
        raise(e)
    return errors

def get_multiplicity(multiplicity):
    if re.fullmatch(f"0", multiplicity):
        return utils.Multiplicity.ZERO
    elif re.fullmatch(f"1", multiplicity) or re.fullmatch(r"1.*1", multiplicity):
        return utils.Multiplicity.ONE
    elif re.fullmatch(r"\*", multiplicity) or re.fullmatch(r"0.*\*", multiplicity):
        return utils.Multiplicity.ZERO_TO_MANY
    elif re.fullmatch(r"\d+", multiplicity):
        return utils.Multiplicity.NUMERIC
    elif re.fullmatch(r"0.*1", multiplicity):
        return utils.Multiplicity.ZERO_TO_ONE
    elif re.fullmatch(r"1.*\*", multiplicity):
        return utils.Multiplicity.ONE_TO_MANY
    elif re.fullmatch(r"1.*\d+", multiplicity):
        return utils.Multiplicity.ONE_TO_NUMERIC
    elif re.fullmatch(r"0.*\d+", multiplicity):
        return utils.Multiplicity.ZERO_TO_NUMERIC
    elif re.fullmatch(r"\d+.*\d+", multiplicity):
        return utils.Multiplicity.NUMERIC_TO_NUMERIC
    elif re.fullmatch(r"\d+.*\*", multiplicity):
        return utils.Multiplicity.NUMERIC_TO_MANY
    
    return None
    

def get_semantic_errors_from_report(report, reference):
    errors = []
    try:
        for cl in reference.get("classes", []):
            found = False
            for mc in report.get("matchingClasses", []):
                if mc.get("referenceClass") == cl.get("name"):
                    found = True
                    if not mc.get("correctType"):
                        print(cl)
                        errors.append({
                            "type": utils.SemanticErrorType.CLASS_TYPE._value_,
                            "name": cl.get("name"),
                            "message": "Class type does not match, it should be " + cl.get("type"),
                            "id": mc.get("diagramClass", {}).get("elementId"),
                            "currentType": mc.get("currentType", "")
                        })
                    break
            if not found:
                errors.append({
                    "type": utils.SemanticErrorType.MISSING_CLASS._value_,
                    "name": cl.get("name"),
                    "message": "Class not found in the diagram"
                })
            else:
                for attr in cl.get("attributes", []):
                    attr_found = False
                    for ma in mc.get("matchingAttributes", []):
                        if ma.get("referenceAttribute") == attr.get("name"):
                            attr_found = True
                            break
                    if not attr_found:
                        errors.append({
                            "type": utils.SemanticErrorType.MISSING_ATTRIBUTE._value_,
                            "class": cl.get("name"),
                            "name": attr.get("name"),
                            "message": "Attribute not found in the diagram"
                        })
                    else :
                        if not ma.get("typesMatch"):
                            errors.append({
                                "type": utils.SemanticErrorType.ATTRIBUTE_TYPE._value_,
                                "class": cl.get("name"),
                                "name": attr.get("name"),
                                "message": "Attribute type does not match",
                                "id": ma.get("diagramAttribute", {}).get("elementId")
                            })
        for cl in report.get("forbiddenClasses", []):
            errors.append({
                "type": utils.SemanticErrorType.FORBIDDEN_CLASS._value_,
                "name": cl.get("diagramClass", {}).get("name"),
                "message": "Forbidden class found in the diagram",
                "id": cl.get("diagramClass", {}).get("elementId")
            })
        for cl in report.get("matchingClasses", []):
            for fa in cl.get("forbiddenAttributes", []):
                errors.append({
                    "type": utils.SemanticErrorType.FORBIDDEN_ATTRIBUTE._value_,
                    "class": cl.get("referenceClass"),
                    "name": fa.get("name"),
                    "message": "Forbidden attribute found in the diagram",
                    "id": fa.get("elementId")
                })
        for assoc in reference.get("associations", []):
            found = False
            for ma in report.get("matchingAssociations", []):
                if ma.get("referenceAssociation") == assoc:
                    found = True
                    break
            if not found:
                source = assoc.get("source", {}).get("referenceClass", {}).get("name")
                target = assoc.get("target", {}).get("referenceClass", {}).get("name")
                source_exists = any(mc.get("referenceClass") == source for mc in report.get("matchingClasses", []))
                target_exists = any(mc.get("referenceClass") == target for mc in report.get("matchingClasses", []))
                if source_exists and target_exists:
                    errors.append({
                        "type": utils.SemanticErrorType.MISSING_ASSOCIATION._value_,
                        "source": source,
                        "target": target,
                        "message": "Association not found in the diagram"
                    })
        for assoc in report.get("matchingAssociations", []):
            ref_assoc = assoc.get("referenceAssociation")
            if ref_assoc.get("name") != "":
                ref_name, diagram_name, sim = find_closest_strings(ref_assoc, assoc.get("diagramAssociation", {}))
                if sim < 0.7:
                    errors.append({
                        "type": utils.SemanticErrorType.ASSOCIATION_NAME._value_,
                        "message": "Association name does not match",
                        "referenceSource": ref_assoc.get("source"),
                        "referenceTarget": ref_assoc.get("target"),
                        "diagramSource": assoc.get("source_pair", {}).get("diagramInfo", {}),
                        "diagramTarget": assoc.get("target_pair", {}).get("diagramInfo", {}),
                    })
            reference_type = ref_assoc.get("type", "Default")
            diagram_type = assoc.get("diagramAssociation",{}).get("type", "ClassBidirectional")
            if (diagram_type == "ClassBidirectional" or diagram_type == "ClassUnidirectional") and assoc.get("source_pair", {}).get("diagramInfo", {}).get("multiplicity", "") not in assoc.get("source_pair", {}).get("referenceInfo", {}).get("multiplicities", []):
                errors.append({
                    "type": utils.SemanticErrorType.ASSOCIATION_MULTIPLICITY._value_,
                    "message": "Association source multiplicity does not match",
                    "referenceSource": assoc.get("referenceAssociation").get("source"),
                    "referenceTarget": assoc.get("referenceAssociation").get("target"),
                    "diagramSource": assoc.get("source_pair", {}).get("diagramInfo", {}).get("name"),
                    "elementId": assoc.get("diagramAssociation").get("id")
                })
            if (diagram_type == "ClassBidirectional" or diagram_type == "ClassUnidirectional") and assoc.get("target_pair", {}).get("diagramInfo", {}).get("multiplicity", "") not in assoc.get("target_pair", {}).get("referenceInfo", {}).get("multiplicities", []) :
                errors.append({
                    "type": utils.SemanticErrorType.ASSOCIATION_MULTIPLICITY._value_,
                    "message": "Association target multiplicity does not match",
                    "referenceSource": assoc.get("referenceAssociation").get("source"),
                    "referenceTarget": assoc.get("referenceAssociation").get("target"),
                    "diagramTarget": assoc.get("target_pair", {}).get("diagramInfo", {}).get("name"),
                    "elementId": assoc.get("diagramAssociation").get("id")
                })
            correct = (
                (reference_type == "Default" and (diagram_type == "ClassBidirectional" or diagram_type == "ClassUnidirectional")) or
                (reference_type == "Aggregation" and diagram_type == "ClassAggregation") or
                (reference_type == "Composition" and diagram_type == "ClassComposition") or
                (reference_type == "Inheritance" and diagram_type == "ClassInheritance")
            )
            if not correct:
                errors.append({
                    "type": utils.SemanticErrorType.ASSOCIATION_TYPE._value_,
                    "message": "Association type does not match",
                    "referenceType": reference_type,
                    "diagramType": diagram_type,
                    "diagramSource": assoc.get("source_pair", {}).get("diagramInfo", {}).get("name"),
                    "diagramTarget": assoc.get("target_pair", {}).get("diagramInfo", {}).get("name"),
                    "elementId": assoc.get("diagramAssociation").get("id")
                })
        print(reference.get("forbiddenAssociations", []))
    except Exception as e:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        logger.error(f"Error in get_semantic_errors_from_report: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
        raise(e)
    return errors