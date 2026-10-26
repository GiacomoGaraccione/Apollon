import React from "react";
import { Button, Center, Text, Popover, List, Highlight, Divider } from "@mantine/core";
import { IconCheck, IconExclamationCircle, IconExclamationCircleFilled } from "@tabler/icons-react";
import { UseCaseDiagramEvaluationResults } from "../../Utils/UseCaseDiagram/EvaluationTypes";
import { FeedbackListItem } from "./FeedbackListItem";
import { FeedbackPopover } from "./FeedbackPopover";

const groupBy = (arr: any[], key: string) => {
    return arr.reduce((acc: Record<string, any[]>, item: any) => {
        const k: any = item[key] ?? "unknown";
        (acc[k] = acc[k] || []).push(item);
        return acc
    }, {})
}

export function ClassDiagramSyntaxErrorsList(props: { syntaxErrors: any[] }) {
    const errors = props.syntaxErrors ?? []
    const missingClassNameCount = errors.filter((error: any) => error.type === "missingClassName").length
    const duplicateClassName = (e: any) => (
        <FeedbackListItem key={e.id ?? "err"}
            divider={true} variant="syntax" highlights={[e.element.name]} highlightColor="orange-5" error={e}
            message={`There are two or more classes in the diagram with the same name: ${e.element.name}.`} />
    )
    const groupedMissingAttributeName = Object.entries(
        errors.filter((e: any) => e.type === "missingAttributeName")
            .reduce((acc: Record<string, number>, e: any) => {
                acc[e.class] = (acc[e.class] || 0) + 1;
                return acc;
            }, {})
    )
    return (
        <FeedbackPopover title="Syntax Errors" count={errors.length} color="orange"
            emptyMessage="There are no syntax errors in your diagram, very good!" >
            {missingClassNameCount > 0 && (
                <FeedbackListItem divider={true} variant="syntax" highlights={["missing a name"]} highlightColor="orange-5"
                    message={`At least one class in the diagram is missing a name.`} />
            )}
            {errors.filter((e: any) => e.type === "duplicateClassName").map(duplicateClassName)}
            {groupedMissingAttributeName.map(([className]) => (
                <FeedbackListItem key={`missing-attribute-name-${className}`} divider={true} variant="syntax" highlights={[className]} highlightColor="orange-5"
                    message={`The class ${className} is missing a name for at least one attribute.`} />
            ))}
            {errors.filter((e: any) => e.type === "duplicateAttributeName").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `duplicate-attribute-name-${index}`} divider={true} variant="syntax" highlights={[e.class, e.attribute.name]} highlightColor="orange-5" error={e}
                    message={`The class ${e.class} has two or more attributes with the same name: ${e.attribute.name}.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingAttributeType").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-attribute-type-${index}`} divider={true} variant="syntax" highlights={[e.class, e.attribute.name]} highlightColor="orange-5" error={e}
                    message={`The attribute ${e.attribute.name} in the class ${e.class} is missing a type.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingAssociationName").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-association-name-${index}`} divider={true} variant="syntax" highlights={[e.association.source.referenceClass.name, e.association.target.referenceClass.name]} highlightColor="orange-5" error={e}
                    message={`The association between the classes ${e.association.source.referenceClass.name} and ${e.association.target.referenceClass.name} is missing a name.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingAssociationMultiplicity").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-association-multiplicity-${index}`} divider={true} variant="syntax" highlights={[e.association.source.referenceClass.name, e.association.target.referenceClass.name, e.class]} highlightColor="orange-5" error={e}
                    message={`The association between the classes ${e.association.source.referenceClass.name} and ${e.association.target.referenceClass.name} is missing a multiplicity on the side of class ${e.class}.`} />
            ))}
            {errors.filter((e: any) => e.type === "invalidAssociationMultiplicity").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `invalid-association-multiplicity-${index}`} divider={true} variant="syntax" highlights={[e.association.source.referenceClass.name, e.association.target.referenceClass.name, e.class]} highlightColor="orange-5" error={e}
                    message={`The association between the classes ${e.association.source.referenceClass.name} and ${e.association.target.referenceClass.name} has an invalid multiplicity on the side of class ${e.class}.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingRecursiveAssociationRole").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-recursive-association-role-${index}`} divider={true} variant="syntax" highlights={[e.class, "at least one side", "both sides"]} highlightColor="orange-5" error={e}
                    message={`Class ${e.class} has a recursive association but is missing a role name ${e.count === 1 ? "on at least one side" : `on both sides`}.`} />
            ))}
            {errors.filter((e: any) => e.type === "unconnectedClass").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `unconnected-class-${index}`} divider={true} variant="syntax" highlights={[e.element.name]} highlightColor="orange-5" error={e}
                    message={`The class ${e.element.name} is not connected to any other class in the diagram.`} />
            ))}
            {errors.filter((e: any) => e.type === "foreignKeyReference").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `foreign-key-reference-${index}`} divider={true} variant="syntax" highlights={[e.attribute.name, e.containedClass, e.class]} highlightColor="orange-5" error={e}
                    message={`The attribute ${e.attribute.name} in the class ${e.class} may be a foreign key reference to the class ${e.containedClass}.`} />
            ))}
            {errors.filter((e: any) => e.type === "invalidAttributeType").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `invalid-attribute-type-${index}`} divider={true} variant="syntax" highlights={[e.attribute.name, e.class, e.attribute.types[0]]} highlightColor="orange-5" error={e}
                    message={`The attribute ${e.attribute.name} in the class ${e.class} has an invalid type: ${e.attribute.types[0]}.`} />
            ))}
            {errors.filter((e: any) => e.type === "classAsAttributeType").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `class-as-attribute-type-${index}`} divider={true} variant="syntax" highlights={[e.attribute.name, e.class, e.attribute.types[0]]} highlightColor="orange-5" error={e}
                    message={`The attribute ${e.attribute.name} in the class ${e.class} has another class as its type: ${e.attribute.types[0]}.`} />
            ))}
            {errors.filter((e: any) => e.type === "unconnectedEnumeration").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `unconnected-enumeration-${index}`} divider={true} variant="syntax" highlights={[e.class, e.attribute.name, e.attribute.types[0]]} highlightColor="orange-5" error={e}
                    message={`The attribute ${e.attribute.name} in class ${e.class} is an enumeration, but there is no connection between the class and ${e.attribute.types[0]}.`} />
            ))}
            {errors.filter((e: any) => e.type === "invalidIntermediateClassConnections").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `invalid-intermediate-class-connections-${index}`} divider={true} variant="syntax" highlights={[e.element.name, e.connectedClasses.length.toString()]} highlightColor="orange-5" error={e}
                    message={`The intermediate class ${e.element.name} must be connected to exactly two classes but is currently connected to ${e.connectedClasses.length}.`} />
            ))}
        </FeedbackPopover>
    )
}

export function ClassDiagramSemanticErrorsList(props: { semanticErrors: any[] }) {
    const errors = props.semanticErrors ?? []
    return (
        <FeedbackPopover title="Semantic Errors" count={errors.length} color="red"
            emptyMessage="There are no semantic errors in your diagram, very good!" >
            {errors.filter((e) => e.type === "missingClass").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-class-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e
                } message={`The concept ${e.name} is required but does not have a matching element in your diagram.`} />
            ))}
            {Object.entries(errors.filter((error) => error.type === "missingAttribute")
                .reduce((acc: Record<string, number>, error: any) => {
                    acc[error.class] = (acc[error.class] || 0) + 1;
                    return acc;
                }, {})).map(([className, count]) => (
                    <FeedbackListItem key={`missing-attribute-${className}`} divider={true} variant="semantic" highlights={[className]} highlightColor="red-5"
                        message={`The class that represents the concept ${className} is missing at least one required attribute.`} />
                ))}
            {errors.filter((e) => e.type === "attributeType").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `attribute-type-${index}`} divider={true} variant="semantic" highlights={[e.name, e.class]} highlightColor="red-5" error={e
                } message={`The attribute ${e.name} in the class that represents the concept ${e.class} has an incorrect type.`} />
            ))}
            {errors.filter((e) => e.type === "classType").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `class-type-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e
                } message={`The class ${e.name} has an incorrect type.`} />
            ))}
            {errors.filter((e) => e.type === "forbiddenClass").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `forbidden-class-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`Your class ${e.name} represents a concept that should not be present in the diagram.`} />
            ))}
            {errors.filter((e) => e.type === "forbiddenAttribute").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `forbidden-attribute-${index}`} divider={true} variant="semantic" highlights={[e.name, e.class]} highlightColor="red-5" error={e}
                    message={`The attribute ${e.name} in the class that represents the concept ${e.class} should not be associated to that class.`} />
            ))}
            {errors.filter((e) => e.type === "missingAssociation").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-association-${index}`} divider={true} variant="semantic" highlights={[e.source, e.target]} highlightColor="red-5" error={e}
                    message={`An association between the classes that represent ${e.source} and ${e.target} is required.`} />
            ))}
            {errors.filter((e) => e.type === "associationMultiplicity").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `association-multiplicity-${index}`} divider={true} variant="semantic" highlights={[e.diagramSource ? e.diagramSource : "null", e.diagramTarget ? e.diagramTarget : "null", e.referenceSource.referenceClass.name, e.referenceTarget.referenceClass.name]} highlightColor="red-5" error={e}
                    message={`The association between the classes that represent ${e.referenceSource.referenceClass.name} and ${e.referenceTarget.referenceClass.name} has an incorrect multiplicity.`} />
            ))}
            {errors.filter((e) => e.type === "associationName").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `association-name-${index}`} divider={true} variant="semantic" highlights={[e.diagramSource.name, e.diagramTarget.name]} highlightColor="red-5" error={e}
                    message={`The association between the classes ${e.diagramSource.name} and ${e.diagramTarget.name} has a name that does not represent their relationship correctly.`} />
            ))}
            {errors.filter((e) => e.type === "associationType").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `association-type-${index}`} divider={true} variant="semantic" highlights={[e.diagramSource ? e.diagramSource : "null", e.diagramTarget ? e.diagramTarget : "null", e.diagramType]} highlightColor="red-5" error={e}
                    message={`The association between the classes ${e.diagramSource} and ${e.diagramTarget} has an incorrect type, it should not be ${e.diagramType}`} />
            ))}
            {errors.filter((e) => e.type === "forbiddenAssociation").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `forbidden-association-${index}`} divider={true} variant="semantic" highlights={[e.diagramSource ? e.diagramSource : "null", e.diagramTarget ? e.diagramTarget : "null"]} highlightColor="red-5" error={e}
                    message={`The association between the classes ${e.diagramSource} and ${e.diagramTarget} should not be present in the diagram.`} />
            ))}
        </FeedbackPopover>
    )
}

export function ClassDiagramMatchingElementsList(props: { results: any }) {
    const results = props.results ?? { matchingClasses: [], matchingAssociations: [] }
    if (!results.matchingAssociations) results.matchingAssociations = []
    if (!results.matchingClasses) results.matchingClasses = []

    return (
        <FeedbackPopover title="Found Elements" count={results.matchingClasses.length + results.matchingAssociations.length} color="green"
            emptyMessage="There are no matching elements in your diagram, keep trying!" >
            {results.matchingClasses?.map((match: any, id: number) => (
                <FeedbackListItem key={match.id ?? `matching-class-${id}`} divider={true} variant="success" highlights={[match.referenceClass, match.diagramClass.name]} highlightColor="green-5"
                    message={`Your class ${match.diagramClass.name} matches the required concept ${match.referenceClass}.`}>
                    {match.matchingAttributes.length > 0 && (
                        <List>
                            {match.matchingAttributes.map((attr: any, attrId: number) => (
                                <FeedbackListItem key={attr.id ?? `matching-attribute-${attrId}`} divider={true} variant="success" highlights={[attr.referenceAttribute, attr.diagramAttribute.name]} highlightColor="green-5"
                                    message={`Its attribute ${attr.diagramAttribute.name} matches the required attribute ${attr.referenceAttribute}.`} />
                            ))}
                        </List>
                    )}
                </FeedbackListItem>
            ))}
            {results.matchingAssociations?.map((match: any, id: number) => (
                <FeedbackListItem key={match.id ?? `matching-association-${id}`} divider={true} variant="success" highlights={[match.referenceAssociation.source.referenceClass.name, match.referenceAssociation.target.referenceClass.name, match.source_pair.diagramInfo.name, match.target_pair.diagramInfo.name]} highlightColor="green-5"
                    message={`Your association between ${match.source_pair.diagramInfo.name} and ${match.target_pair.diagramInfo.name} matches the required association between ${match.referenceAssociation.target.referenceClass.name} and ${match.referenceAssociation.source.referenceClass.name}.`} />
            ))}
        </FeedbackPopover>
    )
}

export function UseCaseDiagramSyntaxErrorsList(props: { syntaxErrors: any[] }) {
    const errors = props.syntaxErrors ?? []
    return (
        <>
            <FeedbackPopover title="Syntax Errors" count={errors.length} color="orange"
                emptyMessage="There are no syntax errors in your diagram, very good!">
                {errors.filter((e) => e.type === "missingActorName").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-actor-name-${index}`} divider={true} variant="syntax" highlights={["actor", "missing a name"]} highlightColor="orange-5" error={e
                    } message={`At least one actor in the diagram is missing a name.`} />
                ))}
                {errors.filter((e) => e.type === "missingUseCaseName").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-usecase-name-${index}`} divider={true} variant="syntax" highlights={["use case", "missing a name"]} highlightColor="orange-5" error={e
                    } message={`At least one use case in the diagram is missing a name.`} />
                ))}
                {errors.filter((e) => e.type === "missingSystemName").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-system-name-${index}`} divider={true} variant="syntax" highlights={["system", "missing a name"]} highlightColor="orange-5" error={e
                    } message={`At least one system in the diagram is missing a name.`} />
                ))}
                {errors.filter((e) => e.type === "duplicateActorName").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `duplicate-actor-name-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`There are two or more actors in the diagram with the same name: ${e.name}.`} />
                ))}
                {errors.filter((e) => e.type === "duplicateUseCaseName").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `duplicate-usecase-name-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`There are two or more use cases in the diagram with the same name: ${e.name}.`} />
                ))}
                {errors.filter((e) => e.type === "duplicateSystemName").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `duplicate-system-name-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`There are two or more systems in the diagram with the same name: ${e.name}.`} />
                ))}
                {errors.filter((e) => e.type === "unconnectedUseCase").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `unconnected-usecase-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`The use case ${e.name} is not connected to any actor in the diagram.`} />
                ))}
                {errors.filter((e) => e.type === "noActorGeneralization").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `no-actor-generalization-${index}`} divider={true} variant="syntax" highlights={[e.source, e.target]} highlightColor="orange-5" error={e
                    } message={`The association between actors ${e.source} and ${e.target} should be a generalization but is not.`} />
                ))}
                {errors.filter((e) => e.type === "wrongUseCaseAssociation").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `wrong-use-case-association-${index}`} divider={true} variant="syntax" highlights={[e.source, e.target, "Include", "Extend"]} highlightColor="orange-5" error={e
                    } message={`The association between ${e.source} and ${e.target} is neither Include nor Extend.`} />
                ))}
                {errors.filter((e) => e.type === "displacedUseCase").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `displaced-use-case-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`The use case ${e.name} is not placed inside one of the existing systems in the diagram.`} />
                ))}
                {errors.filter((e) => e.type === "misplacedActor").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `misplaced-actor-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`The actor ${e.name} is placed inside a system in the diagram, but it should be outside of all systems.`} />
                ))}
                {errors.filter((e) => e.type === "multipleConnectedActors").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `multiple-connected-actors-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e
                    } message={`The use case ${e.name} is connected to multiple actors with no explicit Support relationship.`} />
                ))}
            </FeedbackPopover>
        </>
    )
}

export function UseCaseDiagramSemanticErrorsList(props: { semanticErrors: any[] }) {
    const errors = props.semanticErrors ?? []
    return (
        <>
            <FeedbackPopover title="Semantic Errors" count={errors.length} color="red"
                emptyMessage="There are no semantic errors in your diagram, very good!">
                {errors.filter((e) => e.type === "missingActor").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-actor-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e
                    } message={`The required actor ${e.name} is missing from your diagram.`} />
                ))}
                {errors.filter((e) => e.type === "missingUseCase").length > 0 && (
                    <FeedbackListItem key={"missing-usecase"} divider={true} variant="semantic" highlights={["missing"]} highlightColor="red-5"
                        message={`At least one required use case is missing from your diagram.`} />
                )}
                {errors.filter((e) => e.type === "missingSystem").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-system-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e
                    } message={`The required system ${e.name} is missing from your diagram.`} />
                ))}
                {errors.filter((e) => e.type === "missingActorUseCaseAssociation").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-actor-use-case-association-${index}`} divider={true} variant="semantic" highlights={[e.source, e.target]} highlightColor="red-5" error={e
                    } message={`The required association between ${e.source} and ${e.target} is missing from your diagram.`} />
                ))}
                {errors.filter((e) => e.type === "missingUseCaseAssociation").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `missing-use-case-association-${index}`} divider={true} variant="semantic" highlights={[e.source, e.target]} highlightColor="red-5" error={e
                    } message={`An association between ${e.source} and ${e.target} is required but missing from your diagram.`} />
                ))}
                {errors.filter((e) => e.type === "wrongIncludeExtendAssociation").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `wrong-include-extend-association-${index}`} divider={true} variant="semantic" highlights={[e.source, e.target, e.expectedAssociationType]} highlightColor="red-5" error={e
                    } message={`The association between ${e.source} and ${e.target} should be an ${e.expectedAssociationType} one.`} />
                ))}
                {errors.filter((e) => e.type === "wrongIncludeExtendAssociationDirection").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `wrong-include-extend-association-direction-${index}`} divider={true} variant="semantic" highlights={[e.source, e.target, e.associationType]} highlightColor="red-5" error={e
                    } message={`The use cases ${e.source} and ${e.target} have an ${e.associationType} association with the wrong direction.`} />
                ))}
                {errors.filter((e) => e.type === "wrongUseCaseOwner").map((e: any, index: number) => (
                    <FeedbackListItem key={e.id ?? `wrong-use-case-owner-${index}`} divider={true} variant="semantic" highlights={[e.useCase]} highlightColor="red-5" error={e
                    } message={`The use case ${e.useCase} belongs to the wrong system.`} />
                ))}
            </FeedbackPopover>
        </>
    )
}

export function BPMNSyntaxErrorsList(props: { syntaxErrors: any[] }) {
    const errors = props.syntaxErrors ?? []
    const missingTaskNameCount = errors.filter((e: any) => e.type === "missingTaskName").length
    return (
        <FeedbackPopover title="Syntax Errors" count={errors.length} color="orange"
            emptyMessage="There are no syntax errors in your diagram, very good!" >
            {missingTaskNameCount > 0 && (
                <FeedbackListItem divider={true} variant="syntax" highlights={["missing a name"]} highlightColor="orange-5"
                    message={`At least one task in the diagram is missing a name.`} />
            )}
            {errors.filter((e: any) => e.type === "duplicateName").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `duplicate-name-${index}`} divider={true} variant="syntax" highlights={[e.name]} highlightColor="orange-5" error={e}
                    message={`There are two or more elements in the diagram with the same name: ${e.name}.`} />
            ))}
            {errors.filter((e: any) => e.type === "unconnectedElement").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `unconnected-element-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The element "${e.name ?? e.elementId}" is missing an incoming or outgoing connection.`} />
            ))}
            {errors.filter((e: any) => e.type === "gatewaySplitMergeMismatch").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `gateway-split-merge-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The gateway "${e.name ?? e.elementId}" both splits and merges the flow at once, consider using two separate gateways.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingIncomingMessageFlow").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-incoming-message-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The message element "${e.name ?? e.elementId}" is expected to receive a message but has no incoming message flow.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingOutgoingMessageFlow").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-outgoing-message-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The message element "${e.name ?? e.elementId}" is expected to send a message but has no outgoing message flow.`} />
            ))}
            {errors.filter((e: any) => e.type === "emptyPool").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `empty-pool-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The pool "${e.name ?? e.elementId}" does not contain any elements.`} />
            ))}
            {errors.filter((e: any) => e.type === "missingStartEvent").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-start-event-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The pool "${e.name ?? e.elementId}" does not have a start event.`} />
            ))}
            {errors.filter((e: any) => e.type === "eventSubprocessBlankStartEvent").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `event-subprocess-blank-start-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The event sub-process "${e.name ?? e.elementId}" has a blank start event: it must define what triggers it (message, timer, signal, ...).`} />
            ))}
            {errors.filter((e: any) => e.type === "signalThrowWithoutCatch").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `signal-throw-without-catch-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The signal "${e.name ?? e.elementId}" is thrown but there is no matching catch event anywhere in the diagram.`} />
            ))}
            {errors.filter((e: any) => e.type === "signalCatchWithoutThrow").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `signal-catch-without-throw-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The signal "${e.name ?? e.elementId}" is caught but it is never thrown anywhere in the diagram.`} />
            ))}
            {errors.filter((e: any) => e.type === "eventBasedGatewayInvalidTarget").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `event-based-gateway-invalid-target-${index}`} divider={true} variant="syntax" highlights={[e.name ?? e.elementId]} highlightColor="orange-5" error={e}
                    message={`The event-based gateway "${e.name ?? e.elementId}" has an outgoing path that does not lead to a catch event.`} />
            ))}
        </FeedbackPopover>
    )
}

export function BPMNSemanticErrorsList(props: { semanticErrors: any[] }) {
    const errors = props.semanticErrors ?? []
    return (
        <FeedbackPopover title="Semantic Errors" count={errors.length} color="red"
            emptyMessage="There are no semantic errors in your diagram, very good!" >
            {errors.filter((e: any) => e.category === "missing-business-entity").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-be-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The pool representing ${e.name} is required but is missing from your diagram.`} />
            ))}
            {errors.filter((e: any) => e.category === "missing-actor").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-actor-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The lane representing ${e.name} is required but is missing from your diagram.`} />
            ))}
            {errors.filter((e: any) => e.category === "forbidden-business-entity").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `forbidden-be-${index}`} divider={true} variant="semantic" highlights={[e.elementId]} highlightColor="red-5" error={e}
                    message={`Your diagram contains a pool (${e.elementId}) that should not be present.`} />
            ))}
            {errors.filter((e: any) => e.category === "forbidden-actor").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `forbidden-actor-${index}`} divider={true} variant="semantic" highlights={[e.elementId]} highlightColor="red-5" error={e}
                    message={`Your diagram contains a lane (${e.elementId}) that should not be present.`} />
            ))}
            {errors.filter((e: any) => e.category === "missing-process-part").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-part-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The process step "${e.name}" is required but is missing or incomplete in your diagram.`} />
            ))}
            {errors.filter((e: any) => e.category === "unordered-process-part").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `unordered-part-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The elements that model the step "${e.name}" are present but not connected in the correct order.`} />
            ))}
            {errors.filter((e: any) => e.category === "out-of-order-process-part").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `out-of-order-part-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The step "${e.name}" is not connected after the step(s) that should come before it in the process.`} />
            ))}
            {errors.filter((e: any) => e.category === "part-with-element-in-wrong-lane").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-lane-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`One or more elements that model the step "${e.name}" are placed in the wrong lane.`} />
            ))}
            {errors.filter((e: any) => e.category === "part-with-wrong-message-sending").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-message-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The step "${e.name}" is not correctly sending a required message to another part of the process.`} />
            ))}
            {errors.filter((e: any) => e.category === "part-with-wrong-message-receiving").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-message-receiving-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The step "${e.name}" is not correctly receiving a required message from another part of the process.`} />
            ))}
            {errors.filter((e: any) => e.category === "wrong-collapsed-pool").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-collapsed-pool-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The pool representing ${e.name} should be collapsed/expanded differently than how you modeled it.`} />
            ))}
            {errors.filter((e: any) => e.category === "wrong-boundary-event-interrupting").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-boundary-interrupting-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`A boundary event in the step "${e.name}" should be interrupting/non-interrupting differently than how you modeled it.`} />
            ))}
            {errors.filter((e: any) => e.category === "missing-subprocess").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-subprocess-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The sub-process representing ${e.name} is required but is missing from your diagram.`} />
            ))}
            {errors.filter((e: any) => e.category === "wrong-subprocess-interrupting").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-subprocess-interrupting-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={`The sub-process "${e.name}" should be interrupting/non-interrupting differently than how you modeled it.`} />
            ))}
            {errors.filter((e: any) => e.category === "missing-subprocess-boundary-event").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `missing-subprocess-boundary-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={e.description || `The sub-process "${e.name}" is missing a required boundary event.`} />
            ))}
            {errors.filter((e: any) => e.category === "wrong-subprocess-boundary-event").map((e: any, index: number) => (
                <FeedbackListItem key={e.id ?? `wrong-subprocess-boundary-${index}`} divider={true} variant="semantic" highlights={[e.name]} highlightColor="red-5" error={e}
                    message={e.description || `A boundary event on the sub-process "${e.name}" does not match what is expected.`} />
            ))}
        </FeedbackPopover>
    )
}

export function BPMNMatchingElementsList(props: { results: any }) {
    const results = props.results ?? {}
    const validBusinessEntities = results.validBusinessEntities ?? []
    const validActors = results.validActors ?? []
    const correctlyModeledParts = results.correctlyModeledParts ?? []
    const total = validBusinessEntities.length + validActors.length + correctlyModeledParts.length
    return (
        <FeedbackPopover title="Found Elements" count={total} color="green"
            emptyMessage="There are no matching elements in your diagram, keep trying!" >
            {validBusinessEntities.map((match: any, id: number) => (
                <FeedbackListItem key={`matching-be-${id}`} divider={true} variant="success" highlights={[match.businessEntity.name, match.element.name]} highlightColor="green-5"
                    message={`Your pool ${match.element.name} matches the required participant ${match.businessEntity.name}.`} />
            ))}
            {validActors.map((match: any, id: number) => (
                <FeedbackListItem key={`matching-actor-${id}`} divider={true} variant="success" highlights={[match.actor.name, match.element.name]} highlightColor="green-5"
                    message={`Your lane ${match.element.name} matches the required actor ${match.actor.name}.`} />
            ))}
            {correctlyModeledParts.map((part: any, id: number) => (
                <FeedbackListItem key={`matching-part-${id}`} divider={true} variant="success" highlights={[part.name]} highlightColor="green-5"
                    message={`Your diagram correctly models the process step "${part.name}".`} />
            ))}
        </FeedbackPopover>
    )
}

export function BPMNClosePartsList(props: { results: any }) {
    const closeParts = props.results?.closeParts ?? []
    return (
        <FeedbackPopover title="Close Parts" count={closeParts.length} color="yellow"
            emptyMessage="There are no partially modeled process steps in your diagram." >
            {closeParts.map((cp: any, id: number) => (
                <FeedbackListItem key={`close-part-${id}`} divider={true} variant="semantic" highlights={[cp.name]} highlightColor="yellow-7"
                    message={`You are close to correctly modeling the process step "${cp.name}", but it is not yet complete.`}>
                    <List>
                        {cp.found.map((f: any, i: number) => (
                            <FeedbackListItem key={`found-${i}`} variant="success" highlights={[f.diagram.name || f.diagram.elementId]} highlightColor="green-5"
                                message={`Found: ${f.diagram.name || f.diagram.elementId}`} />
                        ))}
                        {cp.missing.map((m: any, i: number) => (
                            <FeedbackListItem key={`missing-${i}`} variant="syntax" highlights={[m.description || (m.names && m.names[0]) || m.elementId]} highlightColor="yellow-7"
                                message={`Still missing: ${m.description || (m.names && m.names[0]) || m.elementId}`} />
                        ))}
                    </List>
                </FeedbackListItem>
            ))}
        </FeedbackPopover>
    )
}

export function BPMNCloseElementsList(props: { results: any }) {
    const closeElements = props.results?.closeElements ?? []
    const causeMessage = (cause: string) =>
        cause === "Both" ? "it belongs to the wrong pool and is also of the wrong type" :
            cause === "Type" ? "it is of the wrong type" :
                "it belongs to the wrong pool"
    return (
        <FeedbackPopover title="Close Elements" count={closeElements.length} color="grape"
            emptyMessage="There are no elements in your diagram that closely, but incorrectly, match a required element." >
            {closeElements.map((ce: any, id: number) => (
                <FeedbackListItem key={`close-element-${id}`} divider={true} variant="semantic" highlights={[ce.diagramElementId, ce.name, ce.partName]} highlightColor="grape-5" error={ce}
                    message={(e: any) => `The element ${e.diagramElementId} looks like it could represent "${e.description || e.name}" for the process step "${e.partName}", but ${causeMessage(e.cause)}.`} />
            ))}
        </FeedbackPopover>
    )
}

export function UseCaseDiagramMatchingElementsList(props: { results: UseCaseDiagramEvaluationResults }) {
    let matchingElements: any = []
    matchingElements = matchingElements.concat(props.results.results.matchingActors)
    matchingElements = matchingElements.concat(props.results.results.matchingUseCases)
    matchingElements = matchingElements.concat(props.results.results.matchingSystems)
    matchingElements = matchingElements.concat(props.results.results.matchingAssociations)
    return (
        <>
            <FeedbackPopover title="Found Elements" count={matchingElements.length} color="green"
                emptyMessage="There are no matching elements in your diagram, keep trying!">
                {props.results.results.matchingActors?.map((match: any, id: number) => (
                    <FeedbackListItem key={match.id ?? `matching-actor-${id}`} divider={true} variant="success" highlights={[match.referenceActor, match.diagramActor.name]} highlightColor="green-5"
                        message={`Your actor ${match.diagramActor.name} matches the required actor ${match.referenceActor}.`} />
                ))}
                {props.results.results.matchingSystems?.map((match: any, id: number) => (
                    <FeedbackListItem key={match.id ?? `matching-system-${id}`} divider={true} variant="success" highlights={[match.referenceSystem, match.diagramSystem.name]} highlightColor="green-5"
                        message={`Your system ${match.diagramSystem.name} matches the required system ${match.referenceSystem}.`} />
                ))}
                {props.results.results.matchingUseCases?.map((match: any, id: number) => (
                    <FeedbackListItem key={match.id ?? `matching-usecase-${id}`} divider={true} variant="success" highlights={[match.diagramUseCase.name]} highlightColor="green-5"
                        message={`Your use case ${match.diagramUseCase.name} matches a required use case.`} />
                ))}
            </FeedbackPopover>
        </>
    )
}