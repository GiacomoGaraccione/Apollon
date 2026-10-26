import { EvaluationResults } from "../EvaluationTypes"

export enum BPMNSyntaxErrorType {
    MISSING_TASK_NAME = "missingTaskName",
    DUPLICATE_NAME = "duplicateName",
    UNCONNECTED_ELEMENT = "unconnectedElement",
    GATEWAY_SPLIT_MERGE_MISMATCH = "gatewaySplitMergeMismatch",
    MISSING_INCOMING_MESSAGE_FLOW = "missingIncomingMessageFlow",
    MISSING_OUTGOING_MESSAGE_FLOW = "missingOutgoingMessageFlow",
    EMPTY_POOL = "emptyPool",
    MISSING_START_EVENT = "missingStartEvent",
}

export enum BPMNSemanticErrorCategory {
    MISSING_BUSINESS_ENTITY = "missing-business-entity",
    MISSING_ACTOR = "missing-actor",
    FORBIDDEN_BUSINESS_ENTITY = "forbidden-business-entity",
    FORBIDDEN_ACTOR = "forbidden-actor",
    MISSING_PROCESS_PART = "missing-process-part",
    UNORDERED_PROCESS_PART = "unordered-process-part",
    OUT_OF_ORDER_PROCESS_PART = "out-of-order-process-part",
    PART_WITH_ELEMENTS_IN_WRONG_LANE = "part-with-element-in-wrong-lane",
    PART_WITH_WRONG_MESSAGE_SENDING = "part-with-wrong-message-sending",
    PART_WITH_WRONG_MESSAGE_RECEIVING = "part-with-wrong-message-receiving",
    PART_WITH_WRONG_BOUNDARY_EVENT = "part-with-wrong-boundary-event",
    CLOSE_ELEMENT = "close-element",
    WRONG_COLLAPSED_POOL = "wrong-collapsed-pool",
    MISSING_SUBPROCESS = "missing-subprocess",
}

export class BPMNDiagramEvaluationResults extends EvaluationResults {
    results: any = {
        validBusinessEntities: [], validActors: [], correctlyModeledParts: [], closeParts: [], closeElements: [],
        unorderedParts: [], outOfOrderParts: [], wrongMessageParts: [], wrongLaneParts: [],
        forbiddenBusinessEntities: [], forbiddenActors: [],
    }
}
