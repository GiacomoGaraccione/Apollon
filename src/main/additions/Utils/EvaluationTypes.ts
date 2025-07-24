import { UMLModel } from "../..";

export class EvaluationResults {
    oldProgress: number = 0;
    newProgress: number = 0;
    oldXP: number = 0;
    newXP: number = 0;
    oldSyntaxErrors: any[] = [];
    newSyntaxErrors: any[] = [];
    oldSemanticErrors: any[] = [];
    newSemanticErrors: any[] = [];
    results: any = { matchingClasses: [] }
}

export enum SyntaxErrorType {
    MISSING_CLASS_NAME = "missingClassName",
    DUPLICATE_CLASS_NAME = "duplicateClassName",
    MISSING_ATTRIBUTE_NAME = "missingAttributeName",
    DUPLICATE_ATTRIBUTE_NAME = "duplicateAttributeName",
    MISSING_ATTRIBUTE_TYPE = "missingAttributeType",
    INVALID_ATTRIBUTE_TYPE = "invalidAttributeType",
    FOREIGN_KEY_REFERENCE = "foreignKeyReference",
    UNCONNECTED_CLASS = "unconnectedClass",
    MISSING_ASSOCIATION_MULTIPLICITY = "missingAssociationMultiplicity",
    INVALID_ASSOCIATION_MULTIPLICITY = "invalidAssociationMultiplicity",
    MISSING_ASSOCIATION_NAME = "missingAssociationName",
    MISSING_RECURSIVE_ASSOCIATION_ROLE = "missingRecursiveAssociationRole",
    ENUMERATION_TYPE_WITH_ATTRIBUTES = "enumerationTypeWithAttributes",
    CLASS_AS_ATTRIBUTE_TYPE = "classAsAttributeType",
    UNCONNECTED_ENUMERATION = "unconnectedEnumeration",
    INVALID_INTERMEDIATE_CLASS_CONNECTIONS = "invalidIntermediateClassConnections"
}

export enum SemanticErrorType {
    MISSING_CLASS = "missingClass",
    MISSING_ATTRIBUTE = "missingAttribute",
    ATTRIBUTE_TYPE = "attributeType",
    FORBIDDEN_CLASS = "forbiddenClass",
    FORBIDDEN_ATTRIBUTE = "forbiddenAttribute",
    MISSING_ASSOCIATION = "missingAssociation",
    ASSOCIATION_NAME = "associationName",
    ASSOCIATION_MULTIPLICITY = "associationMultiplicity",
    ASSOCIATION_TYPE = "associationType",
    CLASS_TYPE = "classType"
}

export class ErrorExample {
    id: SyntaxErrorType | SemanticErrorType
    description: string
    type: string
    key: string
    model: UMLModel

    constructor(id: SyntaxErrorType | SemanticErrorType, description: string, type: string, key: string, model: UMLModel) {
        this.id = id;
        this.description = description;
        this.type = type;
        this.key = key;
        this.model = model;
    }
}