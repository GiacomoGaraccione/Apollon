import json
import sys
from app.evaluator.base_evaluator import BaseEvaluator
from app.evaluator.utils.common import find_closest_strings
from app.evaluator.utils.use_case import convert_apollon_model_to_reference, SemanticErrorType, SyntaxErrorType

class UseCaseEvaluator(BaseEvaluator):

    def validate_solution(self, solution):
        """Validate the provided use case diagram solution"""
        # Implementation of validation logic
        pass

    def evaluate(self, solutions, model):
        try:
            best = None
            best_completeness = 0
            best_reference = None
            first = None
            first_reference = None
            diagram = convert_apollon_model_to_reference(model)
            for sol in solutions:
                reference = json.loads(sol.get("content")).get("reference", None)
                matched_diagram_actors = set()
                matched_diagram_ucs = set()
                matched_diagram_systems = set()
                report = {
                    "matchingActors": [],
                    "matchingUseCases": [],
                    "matchingSystems": [],
                    "matchingAssociations": [],
                    "forbiddenElements": []
                }
                for act1 in reference.get("actors", []):
                    matching_actor = None
                    max_sim = 0.7
                    for act2 in diagram.get("actors", []):
                        if act2.get("elementId") in matched_diagram_actors:
                            continue
                        _, _, sim = find_closest_strings(act1, act2)
                        if sim > max_sim:
                            max_sim = sim
                            matching_actor = act2
                    if matching_actor:
                        report["matchingActors"].append({
                            "referenceActor": act1.get("name"),
                            "diagramActor": {"elementId": matching_actor.get("elementId"), "name": matching_actor.get("name")},
                            "similarity": max_sim
                        })
                        matched_diagram_actors.add(matching_actor.get("elementId"))
                for sys1 in reference.get("systems", []):
                    matching_system = None
                    max_sim = 0.7
                    for sys2 in diagram.get("systems", []):
                        if sys2.get("elementId") in matched_diagram_systems:
                            continue
                        _, _, sim = find_closest_strings(sys1, sys2)
                        if sim > max_sim:
                            max_sim = sim
                            matching_system = sys2
                    if matching_system:
                        report["matchingSystems"].append({
                            "referenceSystem": sys1.get("name"),
                            "diagramSystem": {"elementId": matching_system.get("elementId"), "name": matching_system.get("name")},
                            "similarity": max_sim
                        })
                        matched_diagram_systems.add(matching_system.get("elementId"))
                for uc1 in reference.get("useCases", []):
                    matching_use_case = None
                    max_sim = 0.7
                    for uc2 in diagram.get("useCases", []):
                        if uc2.get("elementId") in matched_diagram_ucs:
                            continue
                        _, _, sim = find_closest_strings(uc1, uc2)
                        if sim > max_sim:
                            max_sim = sim
                            matching_use_case = uc2
                    if matching_use_case:
                        report["matchingUseCases"].append({
                            "referenceUseCase": uc1.get("name"),
                            "diagramUseCase": {"elementId": matching_use_case.get("elementId"), "name": matching_use_case.get("name")},
                            "similarity": max_sim
                        })
                        matched_diagram_ucs.add(matching_use_case.get("elementId"))
                matched_actors = {m["diagramActor"]["name"] for m in report["matchingActors"]}
                matched_use_cases = {m["diagramUseCase"]["name"] for m in report["matchingUseCases"]}
                matched_systems = {m["diagramSystem"]["name"] for m in report["matchingSystems"]}
                # name -> matched diagram element lookups, used below both for the node-level
                # forbidden checks and for the forbidden-association checks (which, unlike the
                # main associations, are authored by name rather than by elementId - see
                # ForbiddenActorActor.tsx / ForbiddenActorUseCase.tsx / ForbiddenUseCaseUseCase.tsx)
                name_to_diagram_actor = {m["referenceActor"]: m["diagramActor"] for m in report["matchingActors"]}
                name_to_diagram_use_case = {m["referenceUseCase"]: m["diagramUseCase"] for m in report["matchingUseCases"]}
                name_to_diagram_system = {m["referenceSystem"]: m["diagramSystem"] for m in report["matchingSystems"]}
                forbidden_actors = reference.get("forbiddenActors", [])
                forbidden_use_cases = reference.get("forbiddenUseCases", [])
                forbidden_systems = reference.get("forbiddenSystems", [])
                # forbidden actors/use cases/systems: these must be checked against the STUDENT's
                # unmatched diagram elements (extra things they added that resemble something
                # forbidden), not against the reference's own required elements - mirrors
                # class_diagram_evaluator's forbidden_classes check (diagram.get("classes", [])
                # filtered by matched_diagram_class_names)
                for act in diagram.get("actors", []):
                    if act.get("name") not in matched_actors:
                        _, str2, sim = find_closest_strings(act, {"name": "", "synonyms": forbidden_actors})
                        if sim > 0.7:
                            report["forbiddenElements"].append({
                                "type": "Actor",
                                "diagramElement": {"name": act.get("name"), "elementId": act.get("elementId")},
                                "matchedForbiddenElement": str2,
                                "similarity": sim
                            })
                for uc in diagram.get("useCases", []):
                    if uc.get("name") not in matched_use_cases:
                        _, str2, sim = find_closest_strings(uc, {"name": "", "synonyms": forbidden_use_cases})
                        if sim > 0.7:
                            report["forbiddenElements"].append({
                                "type": "UseCase",
                                "diagramElement": {"name": uc.get("name"), "elementId": uc.get("elementId")},
                                "matchedForbiddenElement": str2,
                                "similarity": sim
                            })
                for syst in diagram.get("systems", []):
                    if syst.get("name") not in matched_systems:
                        _, str2, sim = find_closest_strings(syst, {"name": "", "synonyms": forbidden_systems})
                        if sim > 0.7:
                            report["forbiddenElements"].append({
                                "type": "System",
                                "diagramElement": {"name": syst.get("name"), "elementId": syst.get("elementId")},
                                "matchedForbiddenElement": str2,
                                "similarity": sim
                            })
                # forbidden actor <-> actor associations (generalizations that should not be present)
                for forbidden_assoc in reference.get("forbiddenActorAssociations", []):
                    source_diagram = name_to_diagram_actor.get(forbidden_assoc.get("sourceId"))
                    target_diagram = name_to_diagram_actor.get(forbidden_assoc.get("targetId"))
                    if source_diagram and target_diagram:
                        matching_diagram_assoc = next((a for a in diagram.get("actorAssociations", [])
                            if (a.get("sourceId") == source_diagram.get("elementId") and a.get("targetId") == target_diagram.get("elementId"))
                            or (a.get("sourceId") == target_diagram.get("elementId") and a.get("targetId") == source_diagram.get("elementId"))), None)
                        if matching_diagram_assoc:
                            report["forbiddenElements"].append({
                                "type": "ActorAssociation",
                                "source": source_diagram.get("name"),
                                "target": target_diagram.get("name"),
                                "elementId": matching_diagram_assoc.get("elementId")
                            })
                # forbidden actor/external-system <-> use case associations
                for forbidden_assoc in reference.get("forbiddenActorUseCaseAssociations", []):
                    source_diagram = name_to_diagram_actor.get(forbidden_assoc.get("sourceId")) or name_to_diagram_system.get(forbidden_assoc.get("sourceId"))
                    target_diagram = name_to_diagram_use_case.get(forbidden_assoc.get("targetId"))
                    if source_diagram and target_diagram:
                        matching_diagram_assoc = next((a for a in diagram.get("actorUseCaseAssociations", [])
                            if (a.get("sourceId") == source_diagram.get("elementId") and a.get("targetId") == target_diagram.get("elementId"))
                            or (a.get("sourceId") == target_diagram.get("elementId") and a.get("targetId") == source_diagram.get("elementId"))), None)
                        if matching_diagram_assoc:
                            report["forbiddenElements"].append({
                                "type": "ActorUseCaseAssociation",
                                "source": source_diagram.get("name"),
                                "target": target_diagram.get("name"),
                                "elementId": matching_diagram_assoc.get("elementId")
                            })
                # forbidden use case <-> use case associations
                for forbidden_assoc in reference.get("forbiddenUseCaseAssociations", []):
                    source_diagram = name_to_diagram_use_case.get(forbidden_assoc.get("sourceId"))
                    target_diagram = name_to_diagram_use_case.get(forbidden_assoc.get("targetId"))
                    if source_diagram and target_diagram:
                        matching_diagram_assoc = next((a for a in diagram.get("useCaseAssociations", [])
                            if (a.get("sourceId") == source_diagram.get("elementId") and a.get("targetId") == target_diagram.get("elementId"))
                            or (a.get("sourceId") == target_diagram.get("elementId") and a.get("targetId") == source_diagram.get("elementId"))), None)
                        if matching_diagram_assoc:
                            report["forbiddenElements"].append({
                                "type": "UseCaseAssociation",
                                "source": source_diagram.get("name"),
                                "target": target_diagram.get("name"),
                                "elementId": matching_diagram_assoc.get("elementId")
                            })
                # computed once per candidate reference (not just for the eventual "best") so that
                # relationship completeness - and the matched-relationship count it depends on - is
                # consistent with whichever candidate ends up chosen below
                report["semantic_errors"] = self._get_semantic_errors_from_report(report, reference, diagram)
                total_relationships = len(reference.get("actorUseCaseAssociations", [])) + len(reference.get("useCaseAssociations", [])) + len(reference.get("actorAssociations", []))
                matched_relationships = report.get("matchedRelationships", 0)
                total_matched = len(report["matchingActors"]) + len(report["matchingUseCases"]) + len(report["matchingSystems"]) + matched_relationships
                total_reference = len(reference.get("actors", [])) + len(reference.get("useCases", [])) + len(reference.get("systems", [])) + total_relationships
                completeness = total_matched / total_reference if total_reference > 0 else 0
                report["completeness"] = round(100 * completeness, 2)
                if best is None or completeness > best_completeness:
                    best_completeness = completeness
                    best = report
                    best_reference = reference
                if first is None:
                    first = report
                    first_reference = reference
            best["syntax_errors"] = self._get_syntax_errors_from_model(diagram)
            return best
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in use_case_evaluator.evaluate: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            raise(e)

    def _get_syntax_errors_from_model(self, model, reference=None, report=None):
        errors = []
        try:
            actors_seen = {}
            ucs_seen = {}
            systems_seen = {}
            for act in model.get("actors", []):
                if not act.get("name"):
                    errors.append({
                        "type": SyntaxErrorType.MISSING_ACTOR_NAME.value,
                        "elementId": act.get("elementId")
                    })
                elif act.get("name") in actors_seen:
                    errors.append({
                        "type": SyntaxErrorType.DUPLICATE_ACTOR_NAME.value,
                        "elementId": act.get("elementId"),
                        "name": act.get("name")
                    })
                else:
                    actors_seen[act.get("name")] = act.get("elementId")
                if act.get("hasOwner"):
                    errors.append({
                        "type": SyntaxErrorType.MISPLACED_ACTOR.value,
                        "elementId": act.get("elementId"),
                        "name": act.get("name")
                    })
            for uc in model.get("useCases", []):
                if not uc.get("name"):
                    errors.append({
                        "type": SyntaxErrorType.MISSING_USE_CASE_NAME.value,
                        "elementId": uc.get("elementId")
                    })
                elif uc.get("name") in ucs_seen:
                    errors.append({
                        "type": SyntaxErrorType.DUPLICATE_USE_CASE_NAME.value,
                        "elementId": uc.get("elementId"),
                        "name": uc.get("name")
                    })
                else:
                    ucs_seen[uc.get("name")] = uc.get("elementId")
                connected_to_actor = any(assoc.get("sourceId") == uc.get("elementId") or assoc.get("targetId") == uc.get("elementId") for assoc in model.get("actorUseCaseAssociations", []))
                # a use case that's only reachable through an Include/Extend relationship (e.g. an
                # "extend" use case with no direct actor line, which is normal UML) is still
                # legitimately connected to the diagram - only flag ones connected to nothing at all
                connected_via_include_extend = any(assoc.get("sourceId") == uc.get("elementId") or assoc.get("targetId") == uc.get("elementId") for assoc in model.get("useCaseAssociations", []))
                if not connected_to_actor and not connected_via_include_extend:
                    errors.append({
                        "type": SyntaxErrorType.UNCONNECTED_USE_CASE.value,
                        "elementId": uc.get("elementId"),
                        "name": uc.get("name")
                    })
                related_associations = [assoc for assoc in model.get("actorUseCaseAssociations", []) if assoc.get("sourceId") == uc.get("elementId") or assoc.get("targetId") == uc.get("elementId")]
                if len(related_associations) > 1 and not any(assoc.get("isSupportingActor") for assoc in related_associations):
                    errors.append({
                        "type": SyntaxErrorType.MULTIPLE_CONNECTED_ACTORS.value,
                        "elementId": uc.get("elementId"),
                        "name": uc.get("name")
                    })
                if not uc.get("owner"):
                    errors.append({
                        "type": SyntaxErrorType.DISPLACED_USE_CASE.value,
                        "elementId": uc.get("elementId"),
                        "name": uc.get("name")
                    })
            for system in model.get("systems", []):
                if not system.get("name"):
                    errors.append({
                        "type": SyntaxErrorType.MISSING_SYSTEM_NAME.value,
                        "elementId": system.get("elementId")
                    })
                elif system.get("name") in systems_seen:
                    errors.append({
                        "type": SyntaxErrorType.DUPLICATE_SYSTEM_NAME.value,
                        "elementId": system.get("elementId"),
                        "name": system.get("name")
                    })
                else:
                    systems_seen[system.get("name")] = system.get("elementId")
            for act_act_assoc in model.get("actorAssociations", []):
                if not act_act_assoc.get("isGeneralization"):
                    source_name = next((a.get("name", "") for a in model.get("actors", []) if a.get("elementId") == act_act_assoc.get("sourceId")), "")
                    target_name = next((a.get("name", "") for a in model.get("actors", []) if a.get("elementId") == act_act_assoc.get("targetId")), "")
                    errors.append({
                        "type": SyntaxErrorType.NO_ACTOR_GENERALIZATION.value,
                        "elementId": act_act_assoc.get("elementId"),
                        "source": source_name,
                        "target": target_name
                    })
            for uc_assoc in model.get("useCaseAssociations", []):
                if uc_assoc.get("associationType") not in {"UseCaseInclude", "UseCaseExtend"}:
                    source_name = next((uc.get("name", "") for uc in model.get("useCases", []) if uc.get("elementId") == uc_assoc.get("sourceId")), "")
                    target_name = next((uc.get("name", "") for uc in model.get("useCases", []) if uc.get("elementId") == uc_assoc.get("targetId")), "")
                    errors.append({
                        "type": SyntaxErrorType.WRONG_USE_CASE_ASSOCIATION.value,
                        "elementId": uc_assoc.get("elementId"),
                        "source": source_name,
                        "target": target_name,
                        "associationType": uc_assoc.get("associationType")
                    })
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in use_case_evaluator._get_syntax_errors_from_model: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            raise(e)
        return errors

    def _get_semantic_errors_from_report(self, report, reference, model=None):
        errors = []
        matched_relationships = 0
        try:
            for act in reference.get("actors", []):
                if act.get("name") not in {m["diagramActor"]["name"] for m in report["matchingActors"]}:
                    errors.append({
                        "type": SemanticErrorType.MISSING_ACTOR.value,
                        "name": act.get("name")
                    })
            for uc in reference.get("useCases", []):
                reference_owner = next((s for s in reference.get("systems", []) if s.get("elementId") == uc.get("owner")), None)
                if uc.get("name") not in {m["diagramUseCase"]["name"] for m in report["matchingUseCases"]}:
                    errors.append({
                        "type": SemanticErrorType.MISSING_USE_CASE.value,
                        "name": uc.get("name")
                    })
                else:
                    matched_uc = next((m for m in report["matchingUseCases"] if m["referenceUseCase"] == uc.get("name")), None)
                    if matched_uc:
                        diagram_uc = next((u for u in model.get("useCases", []) if u.get("elementId") == matched_uc["diagramUseCase"].get("elementId")), None)
                        if diagram_uc:
                            diagram_uc_owner_id = diagram_uc.get("owner")
                            diagram_system_match = next((m for m in report["matchingSystems"] if m["diagramSystem"].get("elementId") == diagram_uc_owner_id), None)
                            if reference_owner and not diagram_system_match:
                                errors.append({
                                    "type": SemanticErrorType.WRONG_USE_CASE_OWNER.value,
                                    "useCase": uc.get("name"),
                                    "elementId": diagram_uc.get("elementId"),
                                })
            for syst in reference.get("systems", []):
                if syst.get("name") not in {m["diagramSystem"]["name"] for m in report["matchingSystems"]}:
                    errors.append({
                        "type": SemanticErrorType.MISSING_SYSTEM.value,
                        "name": syst.get("name")
                    })
            for actor_uc_assoc in reference.get("actorUseCaseAssociations", []):
                source_element = None
                target_element = None
                source_match = None
                target_match = None
                for actor in reference.get("actors", []):
                    if actor.get("elementId") == actor_uc_assoc.get("sourceId"):
                        source_element = actor
                        source_match = next((m for m in report["matchingActors"] if m["referenceActor"] == actor.get("name")), None)
                    if actor.get("elementId") == actor_uc_assoc.get("targetId"):
                        target_element = actor
                        target_match = next((m for m in report["matchingActors"] if m["referenceActor"] == actor.get("name")), None)
                for uc in reference.get("useCases", []):
                    if uc.get("elementId") == actor_uc_assoc.get("sourceId"):
                        source_element = uc
                        source_match = next((m for m in report["matchingUseCases"] if m["referenceUseCase"] == uc.get("name")), None)
                    if uc.get("elementId") == actor_uc_assoc.get("targetId"):
                        target_element = uc
                        target_match = next((m for m in report["matchingUseCases"] if m["referenceUseCase"] == uc.get("name")), None)
                for system in reference.get("systems", []):
                    if system.get("elementId") == actor_uc_assoc.get("sourceId"):
                        source_element = system
                        source_match = next((m for m in report["matchingSystems"] if m["referenceSystem"] == system.get("name")), None)
                    if system.get("elementId") == actor_uc_assoc.get("targetId"):
                        target_element = system
                        target_match = next((m for m in report["matchingSystems"] if m["referenceSystem"] == system.get("name")), None)
                if source_match and target_match:
                    matching_association = None
                    source_match_id = source_match["diagramActor"].get("elementId") if "diagramActor" in source_match else source_match["diagramUseCase"].get("elementId") if "diagramUseCase" in source_match else source_match["diagramSystem"].get("elementId")
                    target_match_id = target_match["diagramActor"].get("elementId") if "diagramActor" in target_match else target_match["diagramUseCase"].get("elementId") if "diagramUseCase" in target_match else target_match["diagramSystem"].get("elementId")
                    for assoc in model.get("actorUseCaseAssociations", []):
                        if (assoc.get("sourceId") == source_match_id and assoc.get("targetId") == target_match_id) or (assoc.get("sourceId") == target_match_id and assoc.get("targetId") == source_match_id):
                            matching_association = assoc
                            break
                    if not matching_association:
                        errors.append({
                            "type": SemanticErrorType.MISSING_ACTOR_USE_CASE_ASSOCIATION.value,
                            "source": source_element.get("name"),
                            "target": target_element.get("name")
                        })
                    else:
                        matched_relationships += 1
            for uc_assoc in reference.get("useCaseAssociations", []):
                source_element = None
                target_element = None
                source_match = None
                target_match = None
                for uc in reference.get("useCases", []):
                    if uc.get("elementId") == uc_assoc.get("sourceId"):
                        source_element = uc
                        source_match = next((m for m in report["matchingUseCases"] if m["referenceUseCase"] == uc.get("name")), None)
                    if uc.get("elementId") == uc_assoc.get("targetId"):
                        target_element = uc
                        target_match = next((m for m in report["matchingUseCases"] if m["referenceUseCase"] == uc.get("name")), None)
                if source_match and target_match:
                    matching_association = None
                    source_match_id = source_match["diagramUseCase"].get("elementId")
                    target_match_id = target_match["diagramUseCase"].get("elementId")
                    for assoc in model.get("useCaseAssociations", []):
                        if (assoc.get("sourceId") == source_match_id and assoc.get("targetId") == target_match_id) or (assoc.get("sourceId") == target_match_id and assoc.get("targetId") == source_match_id):
                            matching_association = assoc
                            break
                    if not matching_association:
                        errors.append({
                            "type": SemanticErrorType.MISSING_USE_CASE_ASSOCIATION.value,
                            "source": source_match.get("diagramUseCase").get("name"),
                            "target": target_match.get("diagramUseCase").get("name")
                        })
                    else:
                        matched_relationships += 1
                        if matching_association.get("isExtend") != uc_assoc.get("isExtend"):
                            errors.append({
                                "type": SemanticErrorType.WRONG_INCLUDE_EXTEND_ASSOCIATION.value,
                                "source": source_match.get("diagramUseCase").get("name"),
                                "target": target_match.get("diagramUseCase").get("name"),
                                "expectedAssociationType": "Extend" if uc_assoc.get("isExtend") else "Include",
                                "foundAssociationType": "Extend" if matching_association.get("isExtend") else "Include",
                                "elementId": matching_association.get("elementId")
                            })
                        elif matching_association.get("sourceId") != source_match_id or matching_association.get("targetId") != target_match_id:
                            errors.append({
                                "type": SemanticErrorType.WRONG_INCLUDE_EXTEND_ASSOCIATION_DIRECTION.value,
                                "source": source_match.get("diagramUseCase").get("name"),
                                "target": target_match.get("diagramUseCase").get("name"),
                                "elementId": matching_association.get("elementId"),
                                "associationType": "Extend" if matching_association.get("isExtend") else "Include"
                            })
            # actor <-> actor generalizations required by the reference. Every entry in
            # reference["actorAssociations"] is implicitly a generalization: the client-side
            # UseCaseDiagramReferenceBuilder only ever pushes into this list for
            # "UseCaseGeneralization" relationships (see MatcherTypes.ts), unlike the submitted
            # diagram's own actorAssociations, which may contain non-generalization associations
            # that are already flagged separately as a NO_ACTOR_GENERALIZATION syntax error.
            for act_assoc in reference.get("actorAssociations", []):
                source_actor = next((a for a in reference.get("actors", []) if a.get("elementId") == act_assoc.get("sourceId")), None)
                target_actor = next((a for a in reference.get("actors", []) if a.get("elementId") == act_assoc.get("targetId")), None)
                if not source_actor or not target_actor:
                    continue
                source_match = next((m for m in report["matchingActors"] if m["referenceActor"] == source_actor.get("name")), None)
                target_match = next((m for m in report["matchingActors"] if m["referenceActor"] == target_actor.get("name")), None)
                if source_match and target_match:
                    source_match_id = source_match["diagramActor"].get("elementId")
                    target_match_id = target_match["diagramActor"].get("elementId")
                    matching_generalization = next((a for a in model.get("actorAssociations", [])
                        if a.get("isGeneralization") and (
                            (a.get("sourceId") == source_match_id and a.get("targetId") == target_match_id)
                            or (a.get("sourceId") == target_match_id and a.get("targetId") == source_match_id)
                        )), None)
                    if not matching_generalization:
                        errors.append({
                            "type": SemanticErrorType.MISSING_GENERALIZATION.value,
                            "source": source_actor.get("name"),
                            "target": target_actor.get("name")
                        })
                    else:
                        matched_relationships += 1
            # forbidden elements found in the submitted diagram - computed earlier in evaluate()
            # into report["forbiddenElements"], surfaced here as actual semantic errors so they
            # reach the student's feedback (mirrors class_diagram_evaluator's forbiddenClasses /
            # forbiddenAssociations handling)
            for fe in report.get("forbiddenElements", []):
                fe_type = fe.get("type")
                if fe_type == "Actor":
                    errors.append({
                        "type": SemanticErrorType.FORBIDDEN_ACTOR.value,
                        "name": fe.get("diagramElement", {}).get("name"),
                        "elementId": fe.get("diagramElement", {}).get("elementId")
                    })
                elif fe_type == "UseCase":
                    errors.append({
                        "type": SemanticErrorType.FORBIDDEN_USE_CASE.value,
                        "name": fe.get("diagramElement", {}).get("name"),
                        "elementId": fe.get("diagramElement", {}).get("elementId")
                    })
                elif fe_type == "System":
                    errors.append({
                        "type": SemanticErrorType.FORBIDDEN_SYSTEM.value,
                        "name": fe.get("diagramElement", {}).get("name"),
                        "elementId": fe.get("diagramElement", {}).get("elementId")
                    })
                elif fe_type == "ActorUseCaseAssociation":
                    errors.append({
                        "type": SemanticErrorType.FORBIDDEN_ACTOR_USE_CASE_ASSOCIATION.value,
                        "source": fe.get("source"),
                        "target": fe.get("target"),
                        "elementId": fe.get("elementId")
                    })
                elif fe_type == "ActorAssociation":
                    errors.append({
                        "type": SemanticErrorType.FORBIDDEN_ACTOR_ASSOCIATION.value,
                        "source": fe.get("source"),
                        "target": fe.get("target"),
                        "elementId": fe.get("elementId")
                    })
                elif fe_type == "UseCaseAssociation":
                    errors.append({
                        "type": SemanticErrorType.FORBIDDEN_USE_CASE_ASSOCIATION.value,
                        "source": fe.get("source"),
                        "target": fe.get("target"),
                        "elementId": fe.get("elementId")
                    })
            report["matchedRelationships"] = matched_relationships
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in use_case_evaluator._get_semantic_errors_from_report: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            raise(e)
        return errors
