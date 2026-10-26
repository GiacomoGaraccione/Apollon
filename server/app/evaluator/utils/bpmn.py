import xml.etree.ElementTree as ET
from enum import Enum

BPMN_NS = "{http://www.omg.org/spec/BPMN/20100524/MODEL}"

# tag XML (lowerCamelCase) -> bpmnType usato dal reference (PascalCase, senza prefisso "bpmn:"),
# stessa convenzione di BIPMIN's GroupElement.elementVariants[].bpmnType
TASK_TAGS = {
    "task": "Task", "userTask": "UserTask", "serviceTask": "ServiceTask",
    "sendTask": "SendTask", "receiveTask": "ReceiveTask", "manualTask": "ManualTask",
    "scriptTask": "ScriptTask", "businessRuleTask": "BusinessRuleTask",
}
GATEWAY_TAGS = {
    "exclusiveGateway": "ExclusiveGateway", "parallelGateway": "ParallelGateway",
    "inclusiveGateway": "InclusiveGateway", "eventBasedGateway": "EventBasedGateway",
}
EVENT_TAGS = {
    "startEvent": ("StartEvent", "Start"),
    "endEvent": ("EndEvent", "End"),
    "intermediateThrowEvent": ("IntermediateThrowEvent", "Intermediate"),
    "intermediateCatchEvent": ("IntermediateCatchEvent", "Intermediate"),
    "boundaryEvent": ("BoundaryEvent", "Boundary"),
}
EVENT_DEFINITION_TAGS = {
    "messageEventDefinition": "Message", "timerEventDefinition": "Timer",
    "signalEventDefinition": "Signal", "errorEventDefinition": "Error",
    "conditionalEventDefinition": "Conditional", "terminateEventDefinition": "Terminate",
}


class SyntaxErrorType(Enum):
    MISSING_TASK_NAME = "missingTaskName"
    DUPLICATE_NAME = "duplicateName"
    UNCONNECTED_ELEMENT = "unconnectedElement"
    GATEWAY_SPLIT_MERGE_MISMATCH = "gatewaySplitMergeMismatch"
    MISSING_INCOMING_MESSAGE_FLOW = "missingIncomingMessageFlow"
    MISSING_OUTGOING_MESSAGE_FLOW = "missingOutgoingMessageFlow"
    EMPTY_POOL = "emptyPool"
    MISSING_START_EVENT = "missingStartEvent"
    EVENT_SUBPROCESS_BLANK_START_EVENT = "eventSubprocessBlankStartEvent"
    SIGNAL_THROW_WITHOUT_CATCH = "signalThrowWithoutCatch"
    SIGNAL_CATCH_WITHOUT_THROW = "signalCatchWithoutThrow"
    EVENT_BASED_GATEWAY_INVALID_TARGET = "eventBasedGatewayInvalidTarget"


class Penalty(Enum):
    MISSING_BUSINESS_ENTITY = 3
    MISSING_ACTOR = 2
    FORBIDDEN_BUSINESS_ENTITY = 2
    FORBIDDEN_ACTOR = 1
    MISSING_PROCESS_PART = 3
    UNORDERED_PROCESS_PART = 1
    OUT_OF_ORDER_PROCESS_PART = 1
    PART_WITH_ELEMENTS_IN_WRONG_LANE = 0.5
    PART_WITH_WRONG_MESSAGE_SENDING = 0.5
    PART_WITH_WRONG_MESSAGE_RECEIVING = 0.5
    PART_WITH_WRONG_BOUNDARY_EVENT = 0.5
    WRONG_BOUNDARY_EVENT_INTERRUPTING = 0.5
    CLOSE_ELEMENT = 1  # bonus: sottratto dal totale penalita', non aggiunto
    WRONG_COLLAPSED_POOL = 1
    MISSING_SUBPROCESS = 0.5
    WRONG_SUBPROCESS_INTERRUPTING = 0.5
    MISSING_SUBPROCESS_BOUNDARY_EVENT = 0.5
    WRONG_SUBPROCESS_BOUNDARY_EVENT = 0.5


class SemanticErrorCategory(Enum):
    MISSING_BUSINESS_ENTITY = "missing-business-entity"
    MISSING_ACTOR = "missing-actor"
    FORBIDDEN_BUSINESS_ENTITY = "forbidden-business-entity"
    FORBIDDEN_ACTOR = "forbidden-actor"
    MISSING_PROCESS_PART = "missing-process-part"
    UNORDERED_PROCESS_PART = "unordered-process-part"
    OUT_OF_ORDER_PROCESS_PART = "out-of-order-process-part"
    PART_WITH_ELEMENTS_IN_WRONG_LANE = "part-with-element-in-wrong-lane"
    PART_WITH_WRONG_MESSAGE_SENDING = "part-with-wrong-message-sending"
    PART_WITH_WRONG_MESSAGE_RECEIVING = "part-with-wrong-message-receiving"
    PART_WITH_WRONG_BOUNDARY_EVENT = "part-with-wrong-boundary-event"
    WRONG_BOUNDARY_EVENT_INTERRUPTING = "wrong-boundary-event-interrupting"
    CLOSE_ELEMENT = "close-element"
    WRONG_COLLAPSED_POOL = "wrong-collapsed-pool"
    MISSING_SUBPROCESS = "missing-subprocess"
    WRONG_SUBPROCESS_INTERRUPTING = "wrong-subprocess-interrupting"
    MISSING_SUBPROCESS_BOUNDARY_EVENT = "missing-subprocess-boundary-event"
    WRONG_SUBPROCESS_BOUNDARY_EVENT = "wrong-subprocess-boundary-event"


def convert_bpmn_xml_to_diagram(xml_string: str) -> dict:
    """Converte l'XML BPMN 2.0 dello studente in una struttura piatta valutabile:
    {pools, lanes, elements (task+gateway+event unificati), sequenceFlows, messageFlows}.
    I campi sinonimi/pesi non esistono qui (solo il lato reference li ha, caricati dal JSON salvato)."""
    root = ET.fromstring(xml_string)
    pools: dict = {}
    lanes: dict = {}
    flow_node_lane: dict = {}
    elements: list = []
    sequence_flows: list = []
    message_flows: list = []

    collaboration = root.find(f"{BPMN_NS}collaboration")
    if collaboration is not None:
        for participant in collaboration.findall(f"{BPMN_NS}participant"):
            pid = participant.get("id")
            pools[pid] = {
                "elementId": pid,
                "name": participant.get("name", ""),
                "synonyms": [],
                "processRef": participant.get("processRef"),
                "isExternal": participant.get("processRef") is None,
            }
        for mf in collaboration.findall(f"{BPMN_NS}messageFlow"):
            message_flows.append({
                "elementId": mf.get("id"),
                "sourceId": mf.get("sourceRef"),
                "targetId": mf.get("targetRef"),
            })

    for process in root.findall(f"{BPMN_NS}process"):
        process_id = process.get("id")
        owning_pool = next((p["elementId"] for p in pools.values() if p["processRef"] == process_id), None)
        if owning_pool is None and not pools:
            # nessun <collaboration>: processo singolo trattato come un unico pool implicito
            owning_pool = process_id
            pools[owning_pool] = {"elementId": owning_pool, "name": "", "synonyms": [],
                                   "processRef": owning_pool, "isExternal": False}

        for lane_set in process.findall(f"{BPMN_NS}laneSet"):
            for lane in lane_set.findall(f"{BPMN_NS}lane"):
                lid = lane.get("id")
                refs = {ref.text for ref in lane.findall(f"{BPMN_NS}flowNodeRef") if ref.text}
                lanes[lid] = {"elementId": lid, "name": lane.get("name", ""), "synonyms": [], "pool": owning_pool}
                for ref in refs:
                    flow_node_lane[ref] = lid

        def build_node(el, bpmn_type, sub_process_id):
            nid = el.get("id")
            return {
                "elementId": nid,
                "name": el.get("name", ""),
                "synonyms": [],
                "type": bpmn_type,
                "pool": owning_pool,
                "lane": flow_node_lane.get(nid),
                "subProcess": sub_process_id,
                "incomingIds": [i.text for i in el.findall(f"{BPMN_NS}incoming") if i.text],
                "outgoingIds": [o.text for o in el.findall(f"{BPMN_NS}outgoing") if o.text],
                "eventDefinition": None,
                "eventPosition": None,
                "gatewayType": None,
                "attachedToId": None,
                "interrupting": None,
                "isEvent": None,
            }

        def parse_container(container, sub_process_id):
            """Estrae i flow node figli DIRETTI di un <bpmn:process> o <bpmn:subProcess>.
            Un <bpmn:subProcess> trovato qui diventa a sua volta un nodo (type "SubProcess") e, se
            sub_process_id e' None (cioe' non siamo gia' dentro un altro subprocess), si ricorre UNA
            volta nei suoi figli - un subprocess dentro un subprocess non viene espanso ulteriormente,
            scelta di design per non dover rappresentare un contenitore ricorsivo arbitrario."""
            for tag, bpmn_type in TASK_TAGS.items():
                for el in container.findall(f"{BPMN_NS}{tag}"):
                    elements.append(build_node(el, bpmn_type, sub_process_id))

            for tag, bpmn_type in GATEWAY_TAGS.items():
                for el in container.findall(f"{BPMN_NS}{tag}"):
                    node = build_node(el, bpmn_type, sub_process_id)
                    if len(node["outgoingIds"]) > 1:
                        node["gatewayType"] = "split"
                    elif len(node["incomingIds"]) > 1:
                        node["gatewayType"] = "merge"
                    elements.append(node)

            for tag, (bpmn_type, position) in EVENT_TAGS.items():
                for el in container.findall(f"{BPMN_NS}{tag}"):
                    node = build_node(el, bpmn_type, sub_process_id)
                    node["eventPosition"] = position
                    node["eventDefinition"] = "None"
                    for def_tag, def_name in EVENT_DEFINITION_TAGS.items():
                        if el.find(f"{BPMN_NS}{def_tag}") is not None:
                            node["eventDefinition"] = def_name
                            break
                    if tag == "boundaryEvent":
                        node["attachedToId"] = el.get("attachedToRef")
                        # cancelActivity di default e' "true" quando assente (spec BPMN 2.0, tBoundaryEvent).
                        node["interrupting"] = el.get("cancelActivity", "true") != "false"
                    elements.append(node)

            for sf in container.findall(f"{BPMN_NS}sequenceFlow"):
                sequence_flows.append({
                    "elementId": sf.get("id"),
                    "sourceId": sf.get("sourceRef"),
                    "targetId": sf.get("targetRef"),
                })

            for sp in container.findall(f"{BPMN_NS}subProcess"):
                sp_id = sp.get("id")
                sp_node = build_node(sp, "SubProcess", sub_process_id)
                sp_node["isEvent"] = sp.get("triggeredByEvent") == "true"
                start_events = sp.findall(f"{BPMN_NS}startEvent")
                if start_events:
                    # isInterrupting di default e' "true" quando assente (spec BPMN 2.0, tStartEvent) -
                    # e' una proprieta' dello start event che lo triggera, non del subprocess stesso.
                    sp_node["interrupting"] = start_events[0].get("isInterrupting", "true") != "false"
                elements.append(sp_node)
                if sub_process_id is None:
                    parse_container(sp, sp_id)

        parse_container(process, None)

    return {
        "pools": list(pools.values()),
        "lanes": list(lanes.values()),
        "elements": elements,
        "sequenceFlows": sequence_flows,
        "messageFlows": message_flows,
    }
