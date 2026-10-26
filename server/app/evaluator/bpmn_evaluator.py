import json
import math
import sys

from app.evaluator.base_evaluator import BaseEvaluator
from app.evaluator.utils.common import find_closest_strings
from app.evaluator.utils.bpmn import (
    convert_bpmn_xml_to_diagram, SyntaxErrorType, SemanticErrorCategory, Penalty, TASK_TAGS,
)

SIMILARITY_THRESHOLD = 0.7


def best_match(ref_dict, candidates, threshold=SIMILARITY_THRESHOLD):
    """Trova, tra i candidati non ancora usati, quello con la similarita' di nome piu' alta sopra soglia."""
    best, best_sim = None, threshold
    for el in candidates:
        _, _, sim = find_closest_strings(ref_dict, {"name": el["name"], "synonyms": el.get("synonyms", [])})
        if sim > best_sim:
            best_sim, best = sim, el
    return best


def _normalize_event_definition(value):
    """Il valore puo' arrivare sia nella forma corta usata dal form ("Timer", vedi
    EVENT_DEFINITION_TAGS in utils/bpmn.py, l'unica che il diagramma dello studente puo' avere)
    sia gia' con il suffisso "EventDefinition" (i $type di bpmn-moddle, usati da alcune reference
    importate): senza normalizzare, "TimerEventDefinition" != "Timer" fa fallire silenziosamente
    il match di OGNI elemento con un eventDefinition in quella reference, stessa causa del bug gia'
    corretto lato client in StructureBuilder.ts:eventDefinitionTag."""
    if value and value.endswith("EventDefinition"):
        return value[:-len("EventDefinition")]
    return value


def find_matching_variant(diagram_el, element_variants):
    """Trova, tra le varianti accettate come equivalenti, quella che descrive l'elemento del
    diagramma (stesso bpmnType, eventDefinition e gatewayType se dichiarati) - a differenza di
    element_matches_variants() restituisce la variante stessa, non solo se esiste, cosi' i
    controlli successivi (es. interrupting) sanno CHI l'ha fatto matchare quando ce ne sono piu'
    di una accettata come alternativa."""
    for variant in element_variants:
        if variant.get("bpmnType") != diagram_el["type"]:
            continue
        if variant.get("eventDefinition") and _normalize_event_definition(variant["eventDefinition"]) != diagram_el.get("eventDefinition"):
            continue
        if variant.get("gatewayType") and variant["gatewayType"] != diagram_el.get("gatewayType"):
            continue
        return variant
    return None


def element_matches_variants(diagram_el, element_variants):
    return find_matching_variant(diagram_el, element_variants) is not None


def find_matching_element(group_element, elements, used_ids, valid_business_entities, valid_subprocesses=None):
    candidates = [el for el in elements if el["elementId"] not in used_ids
                  and element_matches_variants(el, group_element.get("elementVariants", []))]

    parent = group_element.get("parent")
    if parent and parent.get("type") == "Pool":
        expected_pool_id = next((vbe["element"]["elementId"] for vbe in valid_business_entities
                                  if vbe["businessEntity"]["name"] == parent.get("name")), None)
        # "direttamente nel pool" esclude un elemento annidato in un subprocess di quello stesso
        # pool: altrimenti basterebbe infilare il task in un subprocess qualsiasi per soddisfare un
        # vincolo "deve stare nel pool", perdendo il senso del contenimento.
        candidates = [el for el in candidates if el["pool"] == expected_pool_id and not el.get("subProcess")]
    elif parent and parent.get("type") == "SubProcess":
        expected_subprocess_id = next((vsp["element"]["elementId"] for vsp in (valid_subprocesses or [])
                                        if vsp["subProcess"]["name"] == parent.get("name")), None)
        candidates = [el for el in candidates if el.get("subProcess") == expected_subprocess_id]

    names = group_element.get("names", [])
    if not names:
        return candidates[0] if candidates else None
    ref_dict = {"name": names[0], "synonyms": names[1:]}
    return best_match(ref_dict, candidates)


def get_valid_business_entities(diagram, business_entities):
    valid = []
    used_ids = set()
    for be in business_entities:
        candidates = [p for p in diagram["pools"] if p["elementId"] not in used_ids]
        match = best_match({"name": be["name"], "synonyms": be.get("allowedNames", [])}, candidates)
        if match:
            used_ids.add(match["elementId"])
            valid.append({"businessEntity": be, "element": match})
    return valid


def get_valid_actors(diagram, actors, valid_business_entities):
    valid = []
    used_ids = set()
    pool_id_by_be_name = {vbe["businessEntity"]["name"]: vbe["element"]["elementId"] for vbe in valid_business_entities}
    for actor in actors:
        expected_pool_id = pool_id_by_be_name.get(actor.get("businessEntity"))
        candidates = [l for l in diagram["lanes"] if l["elementId"] not in used_ids
                      and (expected_pool_id is None or l["pool"] == expected_pool_id)]
        match = best_match({"name": actor["name"], "synonyms": actor.get("allowedNames", [])}, candidates)
        if match:
            used_ids.add(match["elementId"])
            valid.append({"actor": actor, "element": match})
    return valid


def get_valid_subprocesses(diagram, sub_processes, valid_business_entities):
    """Stesso schema di get_valid_actors: match per nome (fuzzy) tra i subprocess dichiarati in
    reference e i nodi type=="SubProcess" del diagramma, vincolato al pool dichiarato come parent
    (se presente) e a isEvent (criterio rigido, come bpmnType/eventDefinition per gli altri
    elementi: un subprocess "normale" non puo' soddisfare un requisito di event subprocess e
    viceversa)."""
    valid = []
    used_ids = set()
    pool_id_by_be_name = {vbe["businessEntity"]["name"]: vbe["element"]["elementId"] for vbe in valid_business_entities}
    sub_process_nodes = [n for n in diagram["elements"] if n["type"] == "SubProcess"]
    for sp in sub_processes:
        parent = sp.get("parent")
        expected_pool_id = pool_id_by_be_name.get(parent.get("name")) if parent else None
        candidates = [n for n in sub_process_nodes if n["elementId"] not in used_ids
                      and bool(n.get("isEvent")) == bool(sp.get("isEvent"))
                      and (expected_pool_id is None or n["pool"] == expected_pool_id)]
        match = best_match({"name": sp["name"], "synonyms": sp.get("allowedNames", [])}, candidates)
        if match:
            used_ids.add(match["elementId"])
            valid.append({"subProcess": sp, "element": match})
    return valid


def get_wrong_subprocess_interrupting(valid_subprocesses):
    """Analogo a get_wrong_collapsed_pools/get_parts_with_wrong_boundary_event_interrupting:
    confronta isInterrupting dichiarato (solo se il subprocess e' isEvent e il campo e' valorizzato
    - None vuol dire 'non verificato', stesso tri-stato gia' usato per i boundary event) con
    l'isInterrupting del suo start event nel diagramma."""
    wrong = []
    for vsp in valid_subprocesses:
        declared = vsp["subProcess"].get("isInterrupting")
        if not vsp["subProcess"].get("isEvent") or declared is None:
            continue
        if bool(declared) != bool(vsp["element"].get("interrupting")):
            wrong.append(vsp)
    return wrong


def get_subprocess_boundary_event_issues(valid_subprocesses, diagram_elements):
    """Verifica i boundary event dichiarati su un SubProcess (campo `boundaryEvents`, vedi
    MatcherTypes.ts) come condizione A PARTE, non come ProcessPart/GroupElement: evita cosi' il
    problema di dover referenziare un elementId locale (che un SubProcess non ha, essendo
    un'entita' top-level come BusinessEntity/Actor, non un elemento di un gruppo). Per ogni
    subprocess validato con almeno un boundaryEvent dichiarato, cerca tra gli elementi del
    diagramma quelli di tipo BoundaryEvent il cui attachedToId punta al subprocess matchato, e
    prova ad associare ciascun boundaryEvent dichiarato (per nome, come find_matching_element) a
    uno di quei candidati non ancora usato. Nessun candidato col nome giusto -> 'missing'; candidato
    trovato ma eventDefinition/interrupting non coincidono (solo se dichiarati, stesso tri-stato
    degli altri controlli) -> 'wrong'. Non verifica "cosa succede dopo" che il boundary event
    scatta - quello resta una ProcessPart indipendente, stessa convenzione delle relazioni
    cross-pool via messageTo/messageFrom."""
    missing, wrong = [], []
    for vsp in valid_subprocesses:
        declared_list = vsp["subProcess"].get("boundaryEvents") or []
        if not declared_list:
            continue
        subprocess_id = vsp["element"]["elementId"]
        candidates = [n for n in diagram_elements
                      if n["type"] == "BoundaryEvent" and n.get("attachedToId") == subprocess_id]
        used_ids = set()
        for declared in declared_list:
            available = [c for c in candidates if c["elementId"] not in used_ids]
            names = declared.get("names", [])
            match = best_match({"name": names[0], "synonyms": names[1:]}, available) if names else (available[0] if available else None)
            if not match:
                missing.append({"subProcess": vsp["subProcess"], "element": vsp["element"], "boundaryEvent": declared})
                continue
            used_ids.add(match["elementId"])
            expected_def = declared.get("eventDefinition")
            expected_interrupting = declared.get("interrupting")
            type_ok = not expected_def or _normalize_event_definition(expected_def) == match.get("eventDefinition")
            interrupting_ok = expected_interrupting is None or bool(expected_interrupting) == bool(match.get("interrupting"))
            if not (type_ok and interrupting_ok):
                wrong.append({"subProcess": vsp["subProcess"], "element": vsp["element"],
                              "boundaryEvent": declared, "diagramElement": match})
    return missing, wrong


def get_forbidden_named(diagram_items, forbidden_names):
    if not forbidden_names:
        return []
    forbidden = []
    for item in diagram_items:
        _, _, sim = find_closest_strings({"name": item["name"], "synonyms": []}, {"name": "", "synonyms": forbidden_names})
        if sim > SIMILARITY_THRESHOLD:
            forbidden.append(item)
    return forbidden


def get_forbidden_business_entities(diagram, forbidden_names, valid_business_entities):
    matched_ids = {vbe["element"]["elementId"] for vbe in valid_business_entities}
    return get_forbidden_named([p for p in diagram["pools"] if p["elementId"] not in matched_ids], forbidden_names)


def get_forbidden_actors(diagram, forbidden_names, valid_actors):
    matched_ids = {va["element"]["elementId"] for va in valid_actors}
    return get_forbidden_named([l for l in diagram["lanes"] if l["elementId"] not in matched_ids], forbidden_names)


def get_correctly_modeled_parts(elements, process_parts, valid_business_entities, valid_subprocesses=None):
    """Per ogni ProcessPart prova ogni possibleGroup finche' uno non risulta interamente
    soddisfatto: il primo gruppo completo vince, senza backtracking (stessa scelta greedy di BIPMIN).
    Una parte i cui elementi non sono TUTTI presenti non conta affatto, anche se ne mancasse solo uno.

    Se nessun gruppo e' interamente soddisfatto, tiene traccia del gruppo "piu' vicino" (closeness =
    percentuale di elementi trovati sul totale del gruppo) come ClosePart - ma solo se la sua closeness
    e' almeno 0.5 e solo il migliore tra i gruppi della stessa parte (mai piu' di un ClosePart per parte),
    esattamente come SolutionChecking.getCorrectlyModeledParts in BIPMIN."""
    correctly_modeled_parts = []
    close_parts = []
    used_ids = set()

    for part in process_parts:
        is_close = False
        close_part = None
        closeness = 0.5
        for group in part.get("possibleGroups", []):
            group_elements = group.get("elements", [])
            if not group_elements:
                continue
            found = []
            for group_element in group_elements:
                already_found_ids = {f["diagram"]["elementId"] for f in found}
                match = find_matching_element(group_element, elements, used_ids | already_found_ids, valid_business_entities, valid_subprocesses)
                if match:
                    found.append({"reference": group_element, "diagram": match})

            if len(found) == len(group_elements):
                for f in found:
                    used_ids.add(f["diagram"]["elementId"])
                correctly_modeled_parts.append({"name": part["name"], "groupId": group.get("groupId"), "elements": found})
                is_close = False
                break
            else:
                ratio = len(found) / len(group_elements)
                if ratio >= closeness:
                    closeness = ratio
                    is_close = True
                    found_ids = {f["reference"]["elementId"] for f in found}
                    missing = [ge for ge in group_elements if ge["elementId"] not in found_ids]
                    close_part = {"name": part["name"], "groupId": group.get("groupId"), "found": found, "missing": missing}
        if is_close and close_part:
            close_parts.append(close_part)
        # se ne' matched ne' close, la parte non compare in nessuna delle due liste (= completamente mancante)

    return correctly_modeled_parts, close_parts


def get_close_elements(elements, missing_parts, correctly_modeled_parts, close_parts, valid_business_entities, valid_subprocesses=None):
    """Elementi del diagramma non ancora utilizzati il cui nome e' simile a quello richiesto da un
    GroupElement di una ProcessPart mancante, ma che hanno il tipo bpmn e/o il pool sbagliati - stessa
    euristica "near miss" di SolutionChecking.getCloseElements in BIPMIN, usata come bonus in punteggio."""
    used_ids = set()
    for part in correctly_modeled_parts:
        for f in part["elements"]:
            used_ids.add(f["diagram"]["elementId"])
    for part in close_parts:
        for f in part["found"]:
            used_ids.add(f["diagram"]["elementId"])
    remaining = [el for el in elements if el["elementId"] not in used_ids]

    close_elements = []
    for part in missing_parts:
        for group in part.get("possibleGroups", []):
            for group_element in group.get("elements", []):
                names = group_element.get("names", [])
                if not names:
                    continue
                ref_dict = {"name": names[0], "synonyms": names[1:]}
                closest = best_match(ref_dict, remaining)
                if not closest:
                    continue
                variant_types = {v.get("bpmnType") for v in group_element.get("elementVariants", [])}
                is_different_type = closest["type"] not in variant_types
                is_parent_wrong = False
                parent = group_element.get("parent")
                if parent and parent.get("type") == "Pool":
                    expected_pool_id = next((vbe["element"]["elementId"] for vbe in valid_business_entities
                                              if vbe["businessEntity"]["name"] == parent.get("name")), None)
                    is_parent_wrong = expected_pool_id is None or closest["pool"] != expected_pool_id or bool(closest.get("subProcess"))
                elif parent and parent.get("type") == "SubProcess":
                    expected_subprocess_id = next((vsp["element"]["elementId"] for vsp in (valid_subprocesses or [])
                                                    if vsp["subProcess"]["name"] == parent.get("name")), None)
                    is_parent_wrong = expected_subprocess_id is None or closest.get("subProcess") != expected_subprocess_id
                if is_different_type and is_parent_wrong:
                    cause = "Both"
                elif is_different_type:
                    cause = "Type"
                else:
                    cause = "Parent"
                close_elements.append({
                    "partName": part["name"], "elementId": group_element["elementId"],
                    "name": names[0], "description": group_element.get("description", ""),
                    "diagramElementId": closest["elementId"], "cause": cause,
                })
    return close_elements


def get_unordered_parts(correctly_modeled_parts, sequence_flows_by_id):
    """Ordine DENTRO un gruppo: previousElements (id locali al gruppo) confrontati con le
    sequence flow realmente entranti nell'elemento del diagramma. Ritorna sia le parti coinvolte
    (una sola volta ciascuna, per conteggio/penalita') sia il dettaglio per singolo elemento con
    il riferimento all'elemento atteso come predecessore - stessa doppia uscita
    {unorderedParts, unorderedElements} di SolutionChecking.getUnorderedParts in BIPMIN, usata
    poi per l'overlay sul canvas."""
    unordered_parts = []
    unordered_part_names = set()
    unordered_elements = []
    for part in correctly_modeled_parts:
        if len(part["elements"]) <= 1:
            continue
        by_local_id = {f["reference"]["elementId"]: f for f in part["elements"]}
        for f in part["elements"]:
            predecessor_ids = {sequence_flows_by_id[fid]["sourceId"] for fid in f["diagram"]["incomingIds"] if fid in sequence_flows_by_id}
            for expected_prev_local_id in f["reference"].get("previousElements", []):
                expected_prev = by_local_id.get(expected_prev_local_id)
                if expected_prev and expected_prev["diagram"]["elementId"] not in predecessor_ids:
                    if part["name"] not in unordered_part_names:
                        unordered_part_names.add(part["name"])
                        unordered_parts.append(part)
                    unordered_elements.append({
                        "element": f, "reference": expected_prev["reference"].get("description", ""),
                        "partName": part["name"],
                    })
    return unordered_parts, unordered_elements


def get_out_of_order_parts(process_parts, correctly_modeled_parts, sequence_flows_by_id):
    """Ordine TRA parti: previousParts (nomi di altre ProcessPart) - almeno un elemento della
    parte corrente deve avere una sequence flow in ingresso da un elemento della parte precedente."""
    out_of_order = []
    parts_by_name = {p["name"]: p for p in correctly_modeled_parts}
    part_defs_by_name = {p["name"]: p for p in process_parts}
    for part in correctly_modeled_parts:
        part_def = part_defs_by_name.get(part["name"])
        if not part_def:
            continue
        for previous_part_name in part_def.get("previousParts", []):
            previous_part = parts_by_name.get(previous_part_name)
            if not previous_part:
                continue  # la parte precedente manca del tutto: gia' segnalata come MISSING_PROCESS_PART
            previous_ids = {f["diagram"]["elementId"] for f in previous_part["elements"]}
            connected = any(
                sequence_flows_by_id.get(fid, {}).get("sourceId") in previous_ids
                for f in part["elements"] for fid in f["diagram"]["incomingIds"]
            )
            if not connected:
                out_of_order.append(part)
                break
    return out_of_order


def _message_flows_by_source(message_flows):
    idx = {}
    for mf in message_flows:
        idx.setdefault(mf["sourceId"], []).append(mf)
    return idx


def _message_flows_by_target(message_flows):
    idx = {}
    for mf in message_flows:
        idx.setdefault(mf["targetId"], []).append(mf)
    return idx


def get_parts_with_wrong_message_sending(correctly_modeled_parts, valid_business_entities, message_flows):
    """Per ogni FoundElement, per ogni target dichiarato nel suo messageTo: se il target e' un'altra
    ProcessPart, verifica che sia stata trovata, che al suo interno esista un elemento il cui
    messageFrom referenzi la parte corrente, e che tra i due elementi specifici esista davvero una
    message flow nel diagramma; se il target e' un pool, verifica una message flow uscente verso
    l'elemento del pool valido corrispondente. Una entry per violazione (non deduplicata per parte -
    una stessa parte puo' comparire piu' volte), inclusi gli early-break asimmetrici: stessa identica
    logica di SolutionChecking.getPartsWithWrongMessageSending in BIPMIN."""
    wrong = []
    parts_by_name = {p["name"]: p for p in correctly_modeled_parts}
    by_target = _message_flows_by_target(message_flows)
    by_source = _message_flows_by_source(message_flows)

    for part in correctly_modeled_parts:
        for f in part["elements"]:
            for target_ref in f["reference"].get("messageTo", []):
                if target_ref.get("type") == "Part":
                    target_part = parts_by_name.get(target_ref.get("name"))
                    if not target_part:
                        wrong.append({"element": f, "type": "send", "reference": target_ref, "partName": part["name"]})
                        break
                    receiving_element = next((tf for tf in target_part["elements"]
                                               if any(mf.get("name") == part["name"] for mf in tf["reference"].get("messageFrom", []))), None)
                    if not receiving_element:
                        wrong.append({"element": f, "type": "send", "reference": target_ref, "partName": part["name"]})
                        break
                    receives = any(mf["sourceId"] == f["diagram"]["elementId"]
                                   for mf in by_target.get(receiving_element["diagram"]["elementId"], []))
                    if not receives:
                        wrong.append({"element": f, "type": "send", "reference": target_ref, "partName": part["name"]})
                        break
                else:
                    pool = next((vbe for vbe in valid_business_entities if vbe["businessEntity"]["name"] == target_ref.get("name")), None)
                    if not pool:
                        wrong.append({"element": f, "type": "send", "reference": target_ref, "partName": part["name"]})
                    else:
                        outgoing = by_source.get(f["diagram"]["elementId"], [])
                        if not outgoing or not any(mf["targetId"] == pool["element"]["elementId"] for mf in outgoing):
                            wrong.append({"element": f, "type": "send", "reference": target_ref, "partName": part["name"]})
    return wrong


def get_parts_with_wrong_message_receiving(correctly_modeled_parts, valid_business_entities, message_flows):
    """Speculare a get_parts_with_wrong_message_sending ma su messageFrom, stessa asimmetria di
    SolutionChecking.getPartsWithWrongMessageReceiving: il ramo 'parte sorgente non trovata' NON
    interrompe il controllo dei successivi messageSender dello stesso elemento (a differenza degli
    altri due rami, che interrompono) - riprodotta cosi' com'e' in BIPMIN, non "corretta"."""
    wrong = []
    parts_by_name = {p["name"]: p for p in correctly_modeled_parts}
    by_target = _message_flows_by_target(message_flows)

    for part in correctly_modeled_parts:
        for f in part["elements"]:
            for source_ref in f["reference"].get("messageFrom", []):
                if source_ref.get("type") == "Part":
                    source_part = parts_by_name.get(source_ref.get("name"))
                    if not source_part:
                        wrong.append({"element": f, "type": "receive", "reference": source_ref, "partName": part["name"]})
                    else:
                        sending_element = next((sf for sf in source_part["elements"]
                                                 if any(mt.get("name") == part["name"] for mt in sf["reference"].get("messageTo", []))), None)
                        if not sending_element:
                            wrong.append({"element": f, "type": "receive", "reference": source_ref, "partName": part["name"]})
                            break
                        sends = any(mf["sourceId"] == sending_element["diagram"]["elementId"]
                                    for mf in by_target.get(f["diagram"]["elementId"], []))
                        if not sends:
                            wrong.append({"element": f, "type": "receive", "reference": source_ref, "partName": part["name"]})
                            break
                else:
                    pool = next((vbe for vbe in valid_business_entities if vbe["businessEntity"]["name"] == source_ref.get("name")), None)
                    if not pool:
                        wrong.append({"element": f, "type": "receive", "reference": source_ref, "partName": part["name"]})
                    else:
                        incoming = by_target.get(f["diagram"]["elementId"], [])
                        if not incoming or not any(mf["sourceId"] == pool["element"]["elementId"] for mf in incoming):
                            wrong.append({"element": f, "type": "receive", "reference": source_ref, "partName": part["name"]})
    return wrong


def get_wrong_collapsed_pools(valid_business_entities):
    """Una BusinessEntity di riferimento con isCollapsed=True ma il cui pool nel diagramma ha
    comunque un processRef (quindi e' espanso, non collassato), o viceversa isCollapsed=False ma il
    pool nel diagramma non ha processRef (quindi e' effettivamente collassato) - stessa condizione
    (booleana XOR) di SolutionChecking.getWrongCollapsedPools."""
    wrong = []
    for vbe in valid_business_entities:
        is_collapsed = bool(vbe["businessEntity"].get("isCollapsed", False))
        has_process_ref = bool(vbe["element"].get("processRef"))
        if (is_collapsed and has_process_ref) or (not is_collapsed and not has_process_ref):
            wrong.append(vbe)
    return wrong


def get_parts_with_wrong_boundary_events(correctly_modeled_parts):
    """Due controlli, entrambi solo per elementi dentro la STESSA parte trovata: (1) per ogni boundary
    event con un attachedTo dichiarato, l'elemento del diagramma a cui e' realmente attaccato deve
    coincidere col task referenziato; (2) per ogni task con degli attacher dichiarati, ciascun boundary
    event referenziato deve risultare davvero attaccato a quel task nel diagramma. Stessa logica di
    SolutionChecking.getPartsWithWrongBoundaryEvents - NON contribuisce alla penalita' in BIPMIN
    (assente da getPenalties), e' solo un segnale visivo (colorazione)."""
    wrong = []
    for part in correctly_modeled_parts:
        by_local_id = {f["reference"]["elementId"]: f for f in part["elements"]}
        for event in part["elements"]:
            attached_to = event["reference"].get("attachedTo")
            if not attached_to:
                continue
            corresponding_task = by_local_id.get(attached_to.get("name"))
            if corresponding_task and event["diagram"].get("attachedToId") != corresponding_task["diagram"]["elementId"]:
                wrong.append({"element": event, "type": "event",
                              "reference": corresponding_task["reference"].get("description", ""), "partName": part["name"]})
        for task in part["elements"]:
            for attacher_ref in task["reference"].get("attacher", []):
                corresponding_event = by_local_id.get(attacher_ref.get("name"))
                if not corresponding_event:
                    continue
                if corresponding_event["diagram"].get("attachedToId") != task["diagram"]["elementId"]:
                    wrong.append({"element": task, "type": "task",
                                  "reference": corresponding_event["reference"].get("description", ""), "partName": part["name"]})
    return wrong


def get_parts_with_wrong_boundary_event_interrupting(correctly_modeled_parts):
    """Per ogni BoundaryEvent trovato, confronta se e' effettivamente interrompente
    (cancelActivity nel diagramma, vedi convert_bpmn_xml_to_diagram) con quanto dichiara la
    variante di riferimento che lo ha fatto matchare (find_matching_variant, non semplicemente la
    prima elementVariant: se ce ne sono piu' di una accettata come alternativa, conta quella
    davvero corrispondente per tipo/eventDefinition). variant["interrupting"] puo' essere None
    (non specificato in reference, es. per le reference create prima di questo controllo): in quel
    caso non si verifica nulla, per non penalizzare retroattivamente chi non se n'e' mai occupato -
    a differenza di bpmnType/eventDefinition/gatewayType, "interrupting" e' un booleano sempre
    valorizzato lato TS di default, quindi qui l'unico modo per rappresentare 'non mi interessa' e'
    None, non False."""
    wrong = []
    for part in correctly_modeled_parts:
        for f in part["elements"]:
            if f["diagram"]["type"] != "BoundaryEvent":
                continue
            variant = find_matching_variant(f["diagram"], f["reference"].get("elementVariants", []))
            if variant is None or variant.get("interrupting") is None:
                continue
            if bool(variant["interrupting"]) != bool(f["diagram"].get("interrupting")):
                wrong.append({"element": f, "partName": part["name"]})
    return wrong


def get_parts_with_elements_in_wrong_lanes(correctly_modeled_parts, valid_actors):
    wrong = []
    lane_id_by_actor_name = {va["actor"]["name"]: va["element"]["elementId"] for va in valid_actors}
    for part in correctly_modeled_parts:
        part_wrong = False
        for f in part["elements"]:
            expected_actor = f["reference"].get("actor")
            if not expected_actor:
                continue
            expected_lane_id = lane_id_by_actor_name.get(expected_actor)
            if expected_lane_id and f["diagram"].get("lane") != expected_lane_id:
                part_wrong = True
                break
        if part_wrong:
            wrong.append(part)
    return wrong


class BPMNEvaluator(BaseEvaluator):

    def validate_solution(self, solution):
        pass

    def check_solution(self, diagram, possible_solution):
        valid_business_entities = get_valid_business_entities(diagram, possible_solution.get("businessEntities", []))
        valid_actors = get_valid_actors(diagram, possible_solution.get("actors", []), valid_business_entities)
        valid_subprocesses = get_valid_subprocesses(diagram, possible_solution.get("subProcesses", []), valid_business_entities)
        process_parts = possible_solution.get("processParts", [])
        correctly_modeled_parts, close_parts = get_correctly_modeled_parts(
            diagram["elements"], process_parts, valid_business_entities, valid_subprocesses)
        missing_parts = [p for p in process_parts if p["name"] not in {cmp["name"] for cmp in correctly_modeled_parts}]
        close_elements = get_close_elements(diagram["elements"], missing_parts, correctly_modeled_parts, close_parts, valid_business_entities, valid_subprocesses)

        sequence_flows_by_id = {sf["elementId"]: sf for sf in diagram["sequenceFlows"]}
        unordered_parts, unordered_elements = get_unordered_parts(correctly_modeled_parts, sequence_flows_by_id)
        out_of_order_parts = get_out_of_order_parts(possible_solution.get("processParts", []), correctly_modeled_parts, sequence_flows_by_id)
        wrong_message_parts = get_parts_with_wrong_message_sending(correctly_modeled_parts, valid_business_entities, diagram["messageFlows"])
        wrong_message_receiving_parts = get_parts_with_wrong_message_receiving(correctly_modeled_parts, valid_business_entities, diagram["messageFlows"])
        wrong_lane_parts = get_parts_with_elements_in_wrong_lanes(correctly_modeled_parts, valid_actors)
        wrong_boundary_event_parts = get_parts_with_wrong_boundary_events(correctly_modeled_parts)
        wrong_boundary_event_interrupting_parts = get_parts_with_wrong_boundary_event_interrupting(correctly_modeled_parts)
        forbidden_business_entities = get_forbidden_business_entities(diagram, possible_solution.get("forbiddenEntities", []), valid_business_entities)
        forbidden_actors = get_forbidden_actors(diagram, possible_solution.get("forbiddenActors", []), valid_actors)
        wrong_collapsed_pools = get_wrong_collapsed_pools(valid_business_entities)
        wrong_subprocess_interrupting = get_wrong_subprocess_interrupting(valid_subprocesses)
        missing_subprocess_boundary_events, wrong_subprocess_boundary_events = get_subprocess_boundary_event_issues(
            valid_subprocesses, diagram["elements"])

        return {
            "validBusinessEntities": valid_business_entities, "validActors": valid_actors,
            "validSubProcesses": valid_subprocesses,
            "correctlyModeledParts": correctly_modeled_parts, "closeParts": close_parts,
            "closeElements": close_elements,
            "unorderedParts": unordered_parts, "unorderedElements": unordered_elements,
            "outOfOrderParts": out_of_order_parts,
            "wrongMessageParts": wrong_message_parts, "wrongMessageReceivingParts": wrong_message_receiving_parts,
            "wrongLaneParts": wrong_lane_parts, "wrongBoundaryEventParts": wrong_boundary_event_parts,
            "wrongBoundaryEventInterruptingParts": wrong_boundary_event_interrupting_parts,
            "forbiddenBusinessEntities": forbidden_business_entities, "forbiddenActors": forbidden_actors,
            "wrongCollapsedPools": wrong_collapsed_pools,
            "wrongSubProcessInterrupting": wrong_subprocess_interrupting,
            "missingSubProcessBoundaryEvents": missing_subprocess_boundary_events,
            "wrongSubProcessBoundaryEvents": wrong_subprocess_boundary_events,
        }

    def get_penalties(self, results):
        total = 0
        total += len(results["forbiddenBusinessEntities"]) * Penalty.FORBIDDEN_BUSINESS_ENTITY.value
        total += len(results["forbiddenActors"]) * Penalty.FORBIDDEN_ACTOR.value
        total += len(results["unorderedParts"]) * Penalty.UNORDERED_PROCESS_PART.value
        total += len(results["outOfOrderParts"]) * Penalty.OUT_OF_ORDER_PROCESS_PART.value
        total += math.floor(len(results["wrongLaneParts"]) * Penalty.PART_WITH_ELEMENTS_IN_WRONG_LANE.value)
        total += math.floor(len(results["wrongMessageParts"]) * Penalty.PART_WITH_WRONG_MESSAGE_SENDING.value)
        total += math.floor(len(results.get("wrongMessageReceivingParts", [])) * Penalty.PART_WITH_WRONG_MESSAGE_RECEIVING.value)
        total -= len(results.get("closeElements", [])) * Penalty.CLOSE_ELEMENT.value
        total += len(results.get("wrongCollapsedPools", [])) * Penalty.WRONG_COLLAPSED_POOL.value
        total += math.floor(len(results.get("wrongSubProcessInterrupting", [])) * Penalty.WRONG_SUBPROCESS_INTERRUPTING.value)
        total += math.floor(len(results.get("missingSubProcessBoundaryEvents", [])) * Penalty.MISSING_SUBPROCESS_BOUNDARY_EVENT.value)
        total += math.floor(len(results.get("wrongSubProcessBoundaryEvents", [])) * Penalty.WRONG_SUBPROCESS_BOUNDARY_EVENT.value)
        # partsWithWrongBoundaryEvents (aggancio sbagliato) NON contribuisce alla penalita' in BIPMIN
        # (assente da getPenalties() nell'originale) - e' solo un segnale visivo, riprodotto identico
        # qui. wrongBoundaryEventInterruptingParts e' invece un controllo nuovo (non presente in
        # BIPMIN), quindi ha una vera penalita' come le altre categorie "wrong *".
        total += math.floor(len(results.get("wrongBoundaryEventInterruptingParts", [])) * Penalty.WRONG_BOUNDARY_EVENT_INTERRUPTING.value)
        return total

    def get_progress(self, possible_solution, results):
        # subProcesses segue lo stesso schema di businessEntities/actors/processParts (conta nel
        # rapporto presente/atteso, non come penalita' additiva): coerente con MISSING_BUSINESS_ENTITY/
        # MISSING_ACTOR/MISSING_PROCESS_PART, i cui valori in Penalty non sono infatti mai usati qui.
        total_expected = (len(possible_solution.get("businessEntities", [])) +
                           len(possible_solution.get("actors", [])) +
                           len(possible_solution.get("processParts", [])) +
                           len(possible_solution.get("subProcesses", [])))
        total_present = (len(results["validBusinessEntities"]) +
                          len(results["validActors"]) +
                          len(results["correctlyModeledParts"]) +
                          len(results.get("validSubProcesses", [])))
        progress = round(total_present * 100 / total_expected) if total_expected else 0
        progress -= self.get_penalties(results)
        return max(0, min(100, progress))

    def _get_syntax_errors_from_model(self, diagram):
        errors = []
        names_seen = {}
        task_types = set(TASK_TAGS.values())
        # Signal e' un broadcast: si accoppia per nome (non per messageFlow, che in BPMN esiste solo
        # per Message) in tutto il diagramma, anche tra pool diversi - a differenza del controllo
        # MISSING_INCOMING/OUTGOING_MESSAGE_FLOW, cardinalita' libera in entrambe le direzioni (piu'
        # throw e/o piu' catch con lo stesso nome sono normali, e' il punto del broadcast): serve solo
        # che throw e catch dello stesso nome coesistano, non un conteggio 1 a 1.
        signal_throws = {}
        signal_catches = {}
        for node in diagram["elements"]:
            name = (node.get("name") or "").strip().lower()
            # eventPosition e' valorizzato solo per i nodi Start/End/Intermediate/Boundary (vedi
            # convert_bpmn_xml_to_diagram): un evento con lo stesso nome usato altrove nel processo
            # e' normale in BPMN (es. piu' "Fuori tempo"/boundary event di timeout omonimi su parti
            # diverse) e non deve contare ne' far scattare DUPLICATE_NAME ne' bloccare quel nome per
            # un task successivo - solo task/gateway restano soggetti al controllo.
            is_event = node.get("eventPosition") is not None
            if node["type"] in task_types and not name:
                errors.append({"type": SyntaxErrorType.MISSING_TASK_NAME.value, "elementId": node["elementId"]})
            elif name and not is_event and name in names_seen:
                errors.append({"type": SyntaxErrorType.DUPLICATE_NAME.value, "elementId": node["elementId"], "name": node["name"]})
            elif name and not is_event:
                names_seen[name] = node

            is_start = node.get("eventPosition") == "Start"
            is_end = node.get("eventPosition") == "End"
            is_boundary = node["type"] == "BoundaryEvent"
            # un event subprocess non e' collegato al flusso sequenziale che lo contiene - scatta
            # dal proprio start event interno, non da una sequence flow in ingresso/uscita.
            is_event_subprocess = node["type"] == "SubProcess" and node.get("isEvent")
            # per i messaggi mostrati al docente/studente si preferisce sempre il nome leggibile
            # dell'elemento; solo se non ha un nome (caso limite, dato che MISSING_TASK_NAME copre
            # gia' i task senza nome) si ripiega sull'id tecnico del diagramma.
            node_label = node.get("name") or node["elementId"]
            # un boundary event si aggancia al task tramite attachedToRef, non una sequence flow in
            # ingresso - quindi non deve mai essere segnalato come "senza predecessore".
            if not node["incomingIds"] and not is_start and not is_boundary and not is_event_subprocess:
                errors.append({"type": SyntaxErrorType.UNCONNECTED_ELEMENT.value, "elementId": node["elementId"], "name": node_label})
            if not node["outgoingIds"] and not is_end and not is_boundary and not is_event_subprocess:
                errors.append({"type": SyntaxErrorType.UNCONNECTED_ELEMENT.value, "elementId": node["elementId"], "name": node_label})

            if node.get("gatewayType") and len(node["incomingIds"]) > 1 and len(node["outgoingIds"]) > 1:
                errors.append({"type": SyntaxErrorType.GATEWAY_SPLIT_MERGE_MISMATCH.value, "elementId": node["elementId"], "name": node_label})

            if node.get("eventDefinition") == "Message":
                # "Intermediate" e' la eventPosition sia di IntermediateThrowEvent che di
                # IntermediateCatchEvent (vedi EVENT_TAGS in utils/bpmn.py): un controllo basato
                # solo sulla posizione pretenderebbe, da un evento di solo invio o di sola
                # ricezione, ENTRAMBE le direzioni di message flow. Il tipo va quindi guardato
                # esplicitamente per sapere quale direzione ha davvero senso pretendere.
                expects_incoming = node["type"] in ("StartEvent", "IntermediateCatchEvent", "BoundaryEvent")
                expects_outgoing = node["type"] in ("EndEvent", "IntermediateThrowEvent")
                if expects_incoming and not any(
                        mf["targetId"] == node["elementId"] for mf in diagram["messageFlows"]):
                    errors.append({"type": SyntaxErrorType.MISSING_INCOMING_MESSAGE_FLOW.value, "elementId": node["elementId"], "name": node_label})
                if expects_outgoing and not any(
                        mf["sourceId"] == node["elementId"] for mf in diagram["messageFlows"]):
                    errors.append({"type": SyntaxErrorType.MISSING_OUTGOING_MESSAGE_FLOW.value, "elementId": node["elementId"], "name": node_label})

            if node.get("eventDefinition") == "Signal" and name:
                is_throw = node["type"] in ("EndEvent", "IntermediateThrowEvent")
                is_catch = node["type"] in ("StartEvent", "IntermediateCatchEvent", "BoundaryEvent")
                if is_throw:
                    signal_throws.setdefault(name, []).append((node["elementId"], node_label))
                if is_catch:
                    signal_catches.setdefault(name, []).append((node["elementId"], node_label))

            if node["type"] == "EventBasedGateway":
                # spec BPMN 2.0 (tEventBasedGateway): le sequence flow uscenti devono raggiungere un
                # IntermediateCatchEvent - un gateway event-based non ha senso se porta a un task
                # "normale", perche' il suo scopo e' scegliere quale EVENTO accade prima. Una
                # ReceiveTask sarebbe tecnicamente ammessa dalla spec, ma SOLO quando sia il gateway
                # sia la task dichiarano `instantiate="true"` (pattern di avvio multiplo del processo)
                # - attributo che qui non tracciamo affatto, quindi accettarla sempre finirebbe per
                # validare anche il caso normale (gateway non instantiate a meta' processo), dove una
                # ReceiveTask come target NON e' invece valida.
                for sf_id in node["outgoingIds"]:
                    sf = next((s for s in diagram["sequenceFlows"] if s["elementId"] == sf_id), None)
                    target = next((n for n in diagram["elements"] if sf and n["elementId"] == sf["targetId"]), None)
                    if target and target["type"] != "IntermediateCatchEvent":
                        errors.append({"type": SyntaxErrorType.EVENT_BASED_GATEWAY_INVALID_TARGET.value, "elementId": node["elementId"], "name": node_label})
                        break

        for name, throws in signal_throws.items():
            if name not in signal_catches:
                for elementId, label in throws:
                    errors.append({"type": SyntaxErrorType.SIGNAL_THROW_WITHOUT_CATCH.value, "elementId": elementId, "name": label})
        for name, catches in signal_catches.items():
            if name not in signal_throws:
                for elementId, label in catches:
                    errors.append({"type": SyntaxErrorType.SIGNAL_CATCH_WITHOUT_THROW.value, "elementId": elementId, "name": label})

        for pool in diagram["pools"]:
            pool_label = pool.get("name") or pool["elementId"]
            # gli elementi annidati in un subprocess non contano per il controllo "start event del
            # pool": sono raggiungibili solo quando il subprocess si attiva, non sono l'ingresso
            # principale del processo - quel requisito si verifica a parte, per subprocess.
            contained = [n for n in diagram["elements"] if n["pool"] == pool["elementId"] and not n.get("subProcess")]
            if not contained and not pool["isExternal"]:
                errors.append({"type": SyntaxErrorType.EMPTY_POOL.value, "elementId": pool["elementId"], "name": pool_label})
            elif contained and not any(n.get("eventPosition") == "Start" for n in contained):
                errors.append({"type": SyntaxErrorType.MISSING_START_EVENT.value, "elementId": pool["elementId"], "name": pool_label})

        for sp in [n for n in diagram["elements"] if n["type"] == "SubProcess"]:
            sp_label = sp.get("name") or sp["elementId"]
            sp_contained = [n for n in diagram["elements"] if n.get("subProcess") == sp["elementId"]]
            start_events = [n for n in sp_contained if n.get("eventPosition") == "Start"]
            if not start_events:
                errors.append({"type": SyntaxErrorType.MISSING_START_EVENT.value, "elementId": sp["elementId"], "name": sp_label})
            elif sp.get("isEvent") and any(se.get("eventDefinition") == "None" for se in start_events):
                # un event subprocess (triggeredByEvent) DEVE avere uno start event con un
                # eventDefinition (Message/Timer/Signal/...): uno start event "bianco" non ha senso,
                # non c'e' nulla che lo farebbe scattare.
                errors.append({"type": SyntaxErrorType.EVENT_SUBPROCESS_BLANK_START_EVENT.value, "elementId": sp["elementId"], "name": sp_label})
        return errors

    def _get_semantic_errors_from_report(self, results, possible_solution):
        errors = []
        matched_be_names = {r["businessEntity"]["name"] for r in results["validBusinessEntities"]}
        for be in possible_solution.get("businessEntities", []):
            if be["name"] not in matched_be_names:
                errors.append({"category": SemanticErrorCategory.MISSING_BUSINESS_ENTITY.value, "name": be["name"]})

        matched_actor_names = {r["actor"]["name"] for r in results["validActors"]}
        for actor in possible_solution.get("actors", []):
            if actor["name"] not in matched_actor_names:
                errors.append({"category": SemanticErrorCategory.MISSING_ACTOR.value, "name": actor["name"]})

        matched_subprocess_names = {r["subProcess"]["name"] for r in results.get("validSubProcesses", [])}
        for sp in possible_solution.get("subProcesses", []):
            if sp["name"] not in matched_subprocess_names:
                errors.append({"category": SemanticErrorCategory.MISSING_SUBPROCESS.value, "name": sp["name"]})

        for entity in results["forbiddenBusinessEntities"]:
            errors.append({"category": SemanticErrorCategory.FORBIDDEN_BUSINESS_ENTITY.value, "elementId": entity["elementId"]})
        for actor in results["forbiddenActors"]:
            errors.append({"category": SemanticErrorCategory.FORBIDDEN_ACTOR.value, "elementId": actor["elementId"]})

        matched_part_names = {p["name"] for p in results["correctlyModeledParts"]}
        for part in possible_solution.get("processParts", []):
            if part["name"] not in matched_part_names:
                errors.append({"category": SemanticErrorCategory.MISSING_PROCESS_PART.value, "name": part["name"]})

        for p in results["unorderedParts"]:
            errors.append({"category": SemanticErrorCategory.UNORDERED_PROCESS_PART.value, "name": p["name"]})
        for p in results["outOfOrderParts"]:
            errors.append({"category": SemanticErrorCategory.OUT_OF_ORDER_PROCESS_PART.value, "name": p["name"]})
        for p in results["wrongLaneParts"]:
            errors.append({"category": SemanticErrorCategory.PART_WITH_ELEMENTS_IN_WRONG_LANE.value, "name": p["name"]})

        # wrongMessageParts/wrongMessageReceivingParts sono liste per-violazione (una parte puo'
        # comparire piu' volte, stessa semantica di BIPMIN) - qui vengono raggruppate per nome di
        # parte per evitare voci di testo duplicate nella lista errori mostrata allo studente.
        seen_sending = set()
        for p in results["wrongMessageParts"]:
            if p["partName"] not in seen_sending:
                seen_sending.add(p["partName"])
                errors.append({"category": SemanticErrorCategory.PART_WITH_WRONG_MESSAGE_SENDING.value, "name": p["partName"]})
        seen_receiving = set()
        for p in results.get("wrongMessageReceivingParts", []):
            if p["partName"] not in seen_receiving:
                seen_receiving.add(p["partName"])
                errors.append({"category": SemanticErrorCategory.PART_WITH_WRONG_MESSAGE_RECEIVING.value, "name": p["partName"]})

        for vbe in results.get("wrongCollapsedPools", []):
            errors.append({"category": SemanticErrorCategory.WRONG_COLLAPSED_POOL.value,
                            "name": vbe["businessEntity"]["name"], "elementId": vbe["element"]["elementId"]})
        # wrongBoundaryEventParts (aggancio sbagliato) non genera semantic_errors, coerentemente col
        # fatto che in BIPMIN e' solo un segnale visivo (colorazione), non un errore testuale ne' una
        # penalita'. wrongBoundaryEventInterruptingParts e' invece un controllo nuovo e genera un
        # vero errore testuale, raggruppato per parte come i controlli message-sending/-receiving.
        seen_interrupting = set()
        for p in results.get("wrongBoundaryEventInterruptingParts", []):
            if p["partName"] not in seen_interrupting:
                seen_interrupting.add(p["partName"])
                errors.append({"category": SemanticErrorCategory.WRONG_BOUNDARY_EVENT_INTERRUPTING.value, "name": p["partName"]})

        for vsp in results.get("wrongSubProcessInterrupting", []):
            errors.append({"category": SemanticErrorCategory.WRONG_SUBPROCESS_INTERRUPTING.value,
                            "name": vsp["subProcess"]["name"], "elementId": vsp["element"]["elementId"]})

        # "description" sul boundaryEvent dichiarato e' il messaggio pensato apposta per lo
        # studente (es. "il sottoprocesso deve prevedere una condizione temporale") - stessa idea
        # di GroupElement.description, qui passato per intero invece di un messaggio generico.
        for m in results.get("missingSubProcessBoundaryEvents", []):
            errors.append({"category": SemanticErrorCategory.MISSING_SUBPROCESS_BOUNDARY_EVENT.value,
                            "name": m["subProcess"]["name"], "description": m["boundaryEvent"].get("description", "")})
        for w in results.get("wrongSubProcessBoundaryEvents", []):
            errors.append({"category": SemanticErrorCategory.WRONG_SUBPROCESS_BOUNDARY_EVENT.value,
                            "name": w["subProcess"]["name"], "elementId": w["diagramElement"]["elementId"],
                            "description": w["boundaryEvent"].get("description", "")})
        return errors

    def evaluate(self, solutions, model):
        try:
            diagram = convert_bpmn_xml_to_diagram(model)
            best, best_completeness, best_reference = None, -1, None
            first, first_reference = None, None

            for sol in solutions:
                content = json.loads(sol.get("content"))
                reference = content.get("reference")
                if reference is None:
                    continue
                if first_reference is None:
                    first_reference = reference

                results = self.check_solution(diagram, reference)
                completeness = self.get_progress(reference, results)
                results["completeness"] = completeness

                if first is None:
                    first = results
                if completeness > best_completeness:
                    best, best_completeness, best_reference = results, completeness, reference

            if best is None:
                best = first if first is not None else {
                    "completeness": 0, "validBusinessEntities": [], "validActors": [], "validSubProcesses": [],
                    "correctlyModeledParts": [], "closeParts": [], "closeElements": [],
                    "unorderedParts": [], "unorderedElements": [], "outOfOrderParts": [],
                    "wrongMessageParts": [], "wrongMessageReceivingParts": [],
                    "wrongLaneParts": [], "wrongBoundaryEventParts": [], "wrongBoundaryEventInterruptingParts": [],
                    "wrongCollapsedPools": [], "wrongSubProcessInterrupting": [],
                    "missingSubProcessBoundaryEvents": [], "wrongSubProcessBoundaryEvents": [],
                    "forbiddenBusinessEntities": [], "forbiddenActors": [],
                }
            if best_reference is None:
                best_reference = first_reference if first_reference is not None else {}

            best["syntax_errors"] = self._get_syntax_errors_from_model(diagram)
            best["semantic_errors"] = self._get_semantic_errors_from_report(best, best_reference)
            return best
        except Exception as e:
            exc_type, exc_obj, exc_tb = sys.exc_info()
            print(f"Error in bpmn_evaluator.evaluate: {exc_type}, {exc_obj}, {exc_tb.tb_lineno}")
            raise e
