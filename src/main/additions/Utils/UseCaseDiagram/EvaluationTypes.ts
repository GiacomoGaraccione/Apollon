import { UMLModel } from "../../..";
import { EvaluationResults } from "../EvaluationTypes";

export const UseCaseDiagramElementTypes = {
    ACTOR: "actor",
    USE_CASE: "useCase",
    SYSTEM: "system"
}

export const UseCaseDiagramRelationshipTypes = {
    ACTOR_ACTOR_ASSOCIATION: "actorActorAssociation",
    ACTOR_USE_CASE_ASSOCIATION: "actorUseCaseAssociation",
    USE_CASE_USE_CASE_ASSOCIATION: "useCaseUseCaseAssociation",
}

export class MatchingElement {
    referenceElementId: string
    studentElementId: string
    referenceElementName: string
    studentElementName: string
    elementType: string

    constructor(referenceElementId: string, studentElementId: string, referenceElementName: string, studentElementName: string, elementType: string) {
        this.referenceElementId = referenceElementId;
        this.studentElementId = studentElementId;
        this.referenceElementName = referenceElementName;
        this.studentElementName = studentElementName;
        this.elementType = elementType;
    }
}

export class MatchingRelationship {
    referenceSourceId: string
    referenceTargetId: string
    studentSourceId: string
    studentTargetId: string
    relationshipType: string

    constructor(referenceSourceId: string, referenceTargetId: string, studentSourceId: string, studentTargetId: string, relationshipType: string) {
        this.referenceSourceId = referenceSourceId;
        this.referenceTargetId = referenceTargetId;
        this.studentSourceId = studentSourceId;
        this.studentTargetId = studentTargetId;
        this.relationshipType = relationshipType;
    }
}

export class UseCaseDiagramEvaluationResults extends EvaluationResults {
    results: any = {
        matchingElements: [] as MatchingElement[],
        matchingRelationships: [] as MatchingRelationship[]
    }
}