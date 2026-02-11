from enum import Enum

class SyntaxErrorType(Enum):
    MISSING_ACTOR_NAME = "missingActorName" 
    DUPLICATE_ACTOR_NAME = "duplicateActorName"
    MISSING_USE_CASE_NAME = "missingUseCaseName" 
    DUPLICATE_USE_CASE_NAME = "duplicateUseCaseName"
    MISSING_SYSTEM_NAME = "missingSystemName" 
    DUPLICATE_SYSTEM_NAME = "duplicateSystemName"
    UNCONNECTED_USE_CASE = "unconnectedUseCase"
    NO_ACTOR_GENERALIZATION = "noActorGeneralization"
    WRONG_USE_CASE_ASSOCIATION = "wrongUseCaseAssociation"
    MULTIPLE_CONNECTED_ACTORS = "multipleConnectedActors"
    MISPLACED_ACTOR = "misplacedActor"
    DISPLACED_USE_CASE = "displacedUseCase"

class SemanticErrorType(Enum):
    MISSING_ACTOR = "missingActor"#done
    MISSING_USE_CASE = "missingUseCase"#done
    FORBIDDEN_ACTOR = "forbiddenActor"
    FORBIDDEN_USE_CASE = "forbiddenUseCase"
    MISSING_SYSTEM = "missingSystem"#done
    FORBIDDEN_ASSOCIATION = "forbiddenAssociation"
    MISSING_GENERALIZATION = "missingGeneralization"
    MISSING_ACTOR_USE_CASE_ASSOCIATION = "missingActorUseCaseAssociation"#done
    MISSING_USE_CASE_ASSOCIATION = "missingUseCaseAssociation"#done
    WRONG_INCLUDE_EXTEND_ASSOCIATION = "wrongIncludeExtendAssociation"#done
    WRONG_INCLUDE_EXTEND_ASSOCIATION_DIRECTION = "wrongIncludeExtendAssociationDirection"#done
    WRONG_USE_CASE_OWNER = "wrongUseCaseOwner"#done

def convert_apollon_model_to_reference(model):
    reference = {
        "actors": [],
        "useCases": [],
        "systems": [],
        "actorUseCaseAssociations": [],
        "useCaseAssociations": [],
        "actorAssociations": [],
    }
    elements = model.get("elements", {})
    for element in elements.values():
        element_type = element.get("type")
        if element_type == "UseCaseActor":
            reference["actors"].append({
                "elementId": element.get("id"),
                "name": element.get("name", ""),
                "synonyms": [],
                "message": "",
                "hasOwner": element.get("owner", None) is not None
            })
        elif element_type == "UseCaseSystem":
            reference["systems"].append({
                "elementId": element.get("id"),
                "name": element.get("name", ""),
                "synonyms": [],
                "message": "",
                "isExternal": False
            })
        elif element_type == "UseCaseExternalSystem":
            reference["systems"].append({
                "elementId": element.get("id"),
                "name": element.get("name", ""),
                "synonyms": [],
                "message": "",
                "isExternal": True
            })
        elif element_type == "UseCase":
            reference["useCases"].append({
                "elementId": element.get("id"),
                "name": element.get("name", ""),
                "synonyms": [],
                "message": "",
                "owner": element.get("owner", None)
            })
    relationships = model.get("relationships", {})
    for rel in relationships.values():
        rel_type = rel.get("type")
        source_el = elements.get(rel.get("source", {}).get("element"), {})
        target_el = elements.get(rel.get("target", {}).get("element"), {})
        if source_el and target_el:
            if source_el.get("type") == "UseCaseActor" and target_el.get("type") == "UseCaseActor":
                reference["actorAssociations"].append({
                    "sourceId": source_el.get("id"),
                    "targetId": target_el.get("id"),
                    "message": "",
                    "isGeneralization": rel_type == "UseCaseGeneralization",
                    "elementId": rel.get("id")
                })
            elif (source_el.get("type") == "UseCaseActor" and target_el.get("type") == "UseCase") or (source_el.get("type") == "UseCase" and target_el.get("type") == "UseCaseActor"):
                reference["actorUseCaseAssociations"].append({
                    "sourceId": source_el.get("id"),
                    "targetId": target_el.get("id"),
                    "message": "",
                    "isSupportingActor": rel_type == "UseCaseSupport",
                    "elementId": rel.get("id")
                })
            elif (source_el.get("type") == "UseCaseExternalSystem" and target_el.get("type") == "UseCase" ) or (source_el.get("type") == "UseCase" and target_el.get("type") == "UseCaseExternalSystem"):
                reference["actorUseCaseAssociations"].append({
                    "sourceId": source_el.get("id"),
                    "targetId": target_el.get("id"),
                    "message": "",
                    "isSupportingActor": rel_type == "UseCaseSupport",
                    "elementId": rel.get("id")
                })
            elif (source_el.get("type") == "UseCase" and target_el.get("type") == "UseCase"):
                reference["useCaseAssociations"].append({
                    "sourceId": source_el.get("id"),
                    "targetId": target_el.get("id"),
                    "associationType": rel_type,
                    "message": "",
                    "isExtend": rel_type == "UseCaseExtend",
                    "elementId": rel.get("id")
                })
    return reference