import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Notification, Stack, TextInput, NativeSelect, Textarea, Group, Loader, Avatar, RingProgress, Popover, UnstyledButton, Drawer, List, ThemeIcon, Mark, Highlight, Divider, Progress, Skeleton } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconCircleDashedCheck, IconCloudUpload, IconDownload, IconExclamationCircle, IconExclamationCircleFilled, IconFileDescriptionFilled, IconHelp, IconJson, IconMedal, IconMenu4, IconPdf, IconReload, IconSquareXFilled, IconSvg, IconTrophyFilled, IconUpload, IconUserUp, IconX } from "@tabler/icons-react";
import { Course, Exercise } from "../../Utils/Models";
import { AvatarUnlockOptions } from "../../Utils/AvatarUtils";
import { useNavigate, useParams } from "react-router-dom";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts } from "@dicebear/collection";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { EvaluationResults } from "../../Utils/EvaluationTypes";
import "csshake/dist/csshake.css"
import { Dropzone } from "@mantine/dropzone";
import 'svg2pdf.js'
import jsPDF from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { Canvg } from "canvg";

function SyntaxErrorsList(props: { syntaxErrors: any[] }) {
    return (
        <>
            <Center>
                <Popover width={500} position="left" withArrow shadow="md">
                    <Popover.Target>
                        <Button variant={props.syntaxErrors.length > 0 ? "light" : "default"} color="orange" leftSection={props.syntaxErrors.length > 0 && <IconExclamationCircleFilled size={14} />} >Syntax Errors</Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                        {props.syntaxErrors.length === 0 ? <Text>There are no syntax errors in your diagram, very good!</Text> : <>
                            <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                {props.syntaxErrors.filter((error: any) => error.type === "missingClassName").length > 0 && <>
                                    <List.Item icon={<IconExclamationCircle size={16} color="orange" />} >
                                        <Highlight
                                            highlight={["missing a name"]}
                                            highlightStyles={{
                                                backgroundColor: "var(--mantine-color-orange-5)",
                                                fontWeight: 700,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent'
                                            }}>
                                            {`At least one class in the diagram is missing a name.`}
                                        </Highlight>
                                    </List.Item>
                                    <Divider my="xs" />
                                </>}
                                {props.syntaxErrors.filter((error: any) => error.type === "duplicateClassName").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.element.name]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`There are two or more classes in the diagram with the same name: ${error.element.name}.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {Object.entries(
                                    props.syntaxErrors
                                        .filter((error: any) => error.type === "missingAttributeName")
                                        .reduce((acc: Record<string, number>, error: any) => {
                                            acc[error.class] = (acc[error.class] || 0) + 1;
                                            return acc;
                                        }, {})
                                ).map(([className, count]) => (
                                    <>
                                        <List.Item key={`missing-attribute-name-${className}`} icon={<IconExclamationCircle size={16} color="orange" />} >
                                            <Highlight
                                                highlight={[className]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The class ${className} is missing a name for at least one attribute.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                ))}
                                {props.syntaxErrors.filter((error: any) => error.type === "duplicateAttributeName").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.class, error.attribute.name]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The class ${error.class} has two or more attributes with the same name: ${error.attribute.name}.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "missingAttributeType").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.class, error.attribute.name]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The attribute ${error.attribute.name} in the class ${error.class} is missing a type.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "missingAssociationName").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.association.source.referenceClass.name, error.association.target.referenceClass.name]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The association between the classes ${error.association.source.referenceClass.name} and ${error.association.target.referenceClass.name} is missing a name.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "missingAssociationMultiplicity").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.association.source.referenceClass.name, error.association.target.referenceClass.name, error.class]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }} >
                                                    {`The association between the classes ${error.association.source.referenceClass.name} and ${error.association.target.referenceClass.name} is missing a multiplicity on the side of class ${error.class}.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "invalidAssociationMultiplicity").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.association.source.referenceClass.name, error.association.target.referenceClass.name, error.class]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The association between the classes ${error.association.source.referenceClass.name} and ${error.association.target.referenceClass.name} has an invalid multiplicity on the side of class ${error.class}.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "missingRecursiveAssociationRole").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.class, "at least one side", "both sides"]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`Class ${error.class} has a recursive association but is missing a role name ${error.count === 1 ? "on at least one side" : `on both sides`}.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "unconnectedClass").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.element.name]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The class ${error.element.name} is not connected to any other class in the diagram.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "foreignKeyReference").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.attribute.name, error.containedClass, error.class]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The attribute ${error.attribute.name} in the class ${error.class} may be a foreign key reference to the class ${error.containedClass}.`}
                                                </Highlight>
                                            </List.Item>
                                            <Divider my="xs" />
                                        </>
                                    )
                                })}
                                {props.syntaxErrors.filter((error: any) => error.type === "invalidAttributeType").map((error: any) => {
                                    return (
                                        <>
                                            <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                <Highlight
                                                    highlight={[error.attribute.name, error.class, error.attribute.types[0]]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-orange-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`The attribute ${error.attribute.name} in the class ${error.class} has an invalid type: ${error.attribute.types[0]}.`}
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
        </>
    )
}

function SemanticErrorsList(props: { semanticErrors: any[] }) {
    return (
        <Center >
            <Popover width={500} position="left" withArrow shadow="md">
                <Popover.Target>
                    <Button variant={props.semanticErrors.length > 0 ? "light" : "default"} color="red" leftSection={props.semanticErrors.length > 0 && <IconExclamationCircleFilled size={14} />}  >Semantic Errors</Button>
                </Popover.Target>
                <Popover.Dropdown>
                    {props.semanticErrors.length === 0 ? <Text>There are no semantic errors in your diagram, very good!</Text> : <>
                        <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                            {props.semanticErrors.filter((error: any) => error.type === "missingClass").map((error: any, id: number) => {
                                return (
                                    <>
                                        <List.Item key={id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.name]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The concept ${error.name} is required but does not have a matching class in your diagram.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors
                                .filter((error) => error.type === "missingAttribute")
                                .reduce((acc, error) => {
                                    acc[error.class] = (acc[error.class] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                                &&
                                Object.entries(
                                    props.semanticErrors
                                        .filter((error) => error.type === "missingAttribute")
                                        .reduce((acc, error) => {
                                            acc[error.class] = (acc[error.class] || 0) + 1;
                                            return acc;
                                        }, {} as Record<string, number>)
                                ).map(([className, count]) => (
                                    <>
                                        <List.Item key={`missing-attribute-${className}`} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[className]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The class that represents the concept ${className} is missing at least one required attribute.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                ))
                            }
                            {props.semanticErrors.filter((error: any) => error.type === "attributeType").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.name, error.class]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The attribute ${error.name} in the class that represents the concept ${error.class} has an incorrect type.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors.filter((error: any) => error.type === "forbiddenClass").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.name]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`Your class ${error.name} represents a concept that should not be present in the diagram.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors.filter((error: any) => error.type === "forbiddenAttribute").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.name, error.class]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The attribute ${error.name} in the class that represents the concept ${error.class} should not be associated to that class.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors.filter((error: any) => error.type === "missingAssociation").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.source, error.target]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`An association between the classes that represent ${error.source} and ${error.target} is required.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors.filter((error: any) => error.type === "associationMultiplicity").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.diagramSource ? error.diagramSource : "null", error.diagramTarget ? error.diagramTarget : "null", error.referenceSource.referenceClass.name, error.referenceTarget.referenceClass.name]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The association between the concepts that match ${error.referenceSource.referenceClass.name} and ${error.referenceTarget.referenceClass.name} has an incorrect multiplicity on the side of ${error.diagramSource ? error.diagramSource : error.diagramTarget}.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors.filter((error: any) => error.type === "associationName").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.diagramSource.name, error.diagramTarget.name]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The association between the classes ${error.diagramSource.name} and ${error.diagramTarget.name} has a name that does not represent their relationship correctly.`}
                                            </Highlight>
                                        </List.Item>
                                        <Divider my="xs" />
                                    </>
                                )
                            })}
                            {props.semanticErrors.filter((error: any) => error.type === "associationType").map((error: any) => {
                                return (
                                    <>
                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                            <Highlight
                                                highlight={[error.diagramSource ? error.diagramSource : "null", error.diagramTarget ? error.diagramTarget : "null", error.diagramType]}
                                                highlightStyles={{
                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                    fontWeight: 700,
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }}>
                                                {`The association between the classes ${error.diagramSource} and ${error.diagramTarget} has an incorrect type, it should not be ${error.diagramType}`}
                                            </Highlight>
                                            <Divider my="xs" />
                                        </List.Item>
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

function MatchingElementsList(props: { results: any }) {
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
                                                {`Your association between ${match.source_pair.diagramInfo.name} and ${match.source_pair.diagramInfo.name} matches the required association between ${match.referenceAssociation.target.referenceClass.name} and ${match.referenceAssociation.source.referenceClass.name}.`}
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

export { SyntaxErrorsList, SemanticErrorsList, MatchingElementsList }