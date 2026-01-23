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

export function OldClassDiagramMatchingElementsList(props: { results: any }) {
    return (
        <Center >
            <Popover width={500} position="left" withArrow shadow="md">
                <Popover.Target>
                    <Button variant={props.results.matchingClasses.length > 0 ? "light" : "default"} color="green" leftSection={props.results.matchingClasses.length > 0 && <IconCheck size={14} />} >Found Elements</Button>
                </Popover.Target>
                <Popover.Dropdown>
                    {props.results.matchingClasses.length === 0 ? <Text>There are no matching elements in your diagram, keep trying!</Text> : <>
                        <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                            {props.results.matchingClasses.map((match: any, id: number) => {
                                return (
                                    <>
                                        <List.Item key={id} icon={<IconCheck size={16} color="green" />} >
                                            <Highlight
                                                highlight={[match.referenceClass, match.diagramClass.name]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-green-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}
                                            >
                                                {`Your class ${match.diagramClass.name} matches the required concept ${match.referenceClass}.`}
                                            </Highlight>
                                            {match.matchingAttributes.length > 0 && (
                                                <List>
                                                    {match.matchingAttributes.map((attr: any, attrId: number) => (
                                                        <>
                                                            <Divider my="xs" />
                                                            <List.Item key={attrId} icon={<IconCheck size={16} color="green" />} >
                                                                <Highlight
                                                                    highlight={[attr.referenceAttribute]} highlightStyles={{
                                                                        backgroundColor: "var(--mantine-color-green-5)",
                                                                        fontWeight: 700,
                                                                        WebkitBackgroundClip: 'text',
                                                                        WebkitTextFillColor: 'transparent'
                                                                    }}>
                                                                    {`Its attribute ${attr.diagramAttribute.name} matches the required attribute ${attr.referenceAttribute}.`}
                                                                </Highlight>
                                                            </List.Item>
                                                        </>
                                                    ))}
                                                </List>
                                            )}
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.results.matchingAssociations.map((match: any, id: number) => {
                                return (
                                    <>
                                        <List.Item key={id} icon={<IconCheck size={16} color="green" />} >
                                            <Highlight
                                                highlight={[match.referenceAssociation.source.referenceClass.name, match.referenceAssociation.target.referenceClass.name, match.source_pair.diagramInfo.name, match.target_pair.diagramInfo.name]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-green-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`Your association between ${match.source_pair.diagramInfo.name} and ${match.target_pair.diagramInfo.name} matches the required association between ${match.referenceAssociation.target.referenceClass.name} and ${match.referenceAssociation.source.referenceClass.name}.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                        </List>
                    </>}
                </Popover.Dropdown>
            </Popover>
        </Center>
    )
}

export function UseCaseDiagramSyntaxErrorsList(props: { syntaxErrors: any[] }) {
    return (
        <>
            <Center>
                <Popover width={500} position="left" withArrow shadow="md">
                    <Popover.Target>
                        <Button variant={props.syntaxErrors.length > 0 ? "light" : "default"} color="orange" leftSection={props.syntaxErrors.length > 0 && <IconExclamationCircleFilled size={14} />} >Syntax Errors</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        {props.syntaxErrors.length === 0 ? <Text>There are no syntax errors in your diagram, very good!</Text> : <></>}
                    </Popover.Dropdown>
                </Popover>
            </Center>
        </>
    )
}

export function UseCaseDiagramSemanticErrorsList(props: { semanticErrors: any[] }) {
    return (
        <>
            <Center>
                <Popover width={500} position="left" withArrow shadow="md">
                    <Popover.Target>
                        <Button variant={props.semanticErrors.length > 0 ? "light" : "default"} color="red" leftSection={props.semanticErrors.length > 0 && <IconExclamationCircleFilled size={14} />}  >Semantic Errors</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        {props.semanticErrors.length === 0 ? <Text>There are no semantic errors in your diagram, very good!</Text> : <></>}
                    </Popover.Dropdown>
                </Popover>
            </Center>
        </>
    )
}

export function UseCaseDiagramMatchingElementsList(props: { results: UseCaseDiagramEvaluationResults }) {
    return (
        <>
            <Center >
                <Popover width={500} position="left" withArrow shadow="md">
                    <Popover.Target>
                        <Button variant={props.results.results.matchingElements.length > 0 ? "light" : "default"} color="green" leftSection={props.results.results.matchingElements.length > 0 && <IconCheck size={14} />} >Found Elements</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        {props.results.results.matchingElements.length === 0 ? <Text>There are no matching elements in your diagram, keep trying!</Text> : <></>}
                    </Popover.Dropdown>
                </Popover>
            </Center>
        </>
    )
}