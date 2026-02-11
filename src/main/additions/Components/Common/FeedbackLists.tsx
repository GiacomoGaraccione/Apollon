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