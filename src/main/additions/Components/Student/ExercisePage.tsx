import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Notification, Stack, TextInput, NativeSelect, Textarea, Group, Loader, Avatar, RingProgress, Popover, UnstyledButton, Drawer, List, ThemeIcon, Mark, Highlight, Divider } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconCircleDashedCheck, IconExclamationCircle, IconExclamationCircleFilled, IconUserUp } from "@tabler/icons-react";
import { Course, Exercise } from "../../Utils/Models";
import { AvatarUnlockOptions } from "../../Utils/AvatarUtils";
import { useNavigate, useParams } from "react-router-dom";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts } from "@dicebear/collection";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { EvaluationResults } from "../../Utils/EvaluationTypes";
import { Preview } from "../../../components/create-pane/preview-element-component";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false,
    enablePopups: true
}

function ExercisePage() {
    const user = useContext(UserContext)
    const { courseId, exerciseId } = useParams()
    const [gamified, setGamified] = useState(false)
    const [bossSettings, setBossSettings] = useState<any>(null)
    const [bossString, setBossString] = useState("")
    const [courseInfo, setCourseInfo] = useState<any>(null)
    const [avatarOptions, setAvatarOptions] = useState<any>(null)
    const [avatarString, setAvatarString] = useState<string>("")
    const [currentXP, setCurrentXP] = useState<number>(0)
    const [xpIncreased, setXpIncreased] = useState<boolean>(false)
    const [currentProgress, setCurrentProgress] = useState<number>(0)
    const [progressIncreased, setProgressIncreased] = useState<boolean>(false)
    const [editor, setEditor] = useState<ApollonEditor>()
    const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false)
    const [resultsOpened, { open: openResults, close: closeResults }] = useDisclosure(false)
    const [exercise, setExercise] = useState<Exercise | null>(null)
    const [checking, setChecking] = useState<boolean>(false)
    const [results, setResults] = useState<EvaluationResults>(new EvaluationResults())

    useEffect(() => {
        if (user && courseId && exerciseId) {
            API.getCourseInfo(courseId).then((course) => {
                let ex = course.exercises.find((ex) => ex.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                    setGamified(ex.gamified)
                    let opts = JSON.parse(ex.boss?.bossOptions)
                    setBossSettings(opts)
                    let bossStr = createAvatar(bottts, opts).toString()
                    setBossString(`data:image/svg+xml;utf8,${encodeURIComponent(bossStr)}`)
                    API.getStudentCourseInfo(courseId, user.username).then(async (studentCourse) => {
                        let avatarOpts = JSON.parse(studentCourse.info.avatar)
                        setAvatarOptions(avatarOpts)
                        let svg = createAvatar(avataaars, { ...avatarOpts, style: ["default"] }).toString()
                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
                        try {
                            let cont = document.getElementById("apollon");
                            if (cont) {
                                let ed = new ApollonEditor(cont, { ...options, type: "ClassDiagram", });
                                setEditor(ed)
                            }
                        } catch (error) {
                            console.error("Error creating Apollon editor:", error);
                        }
                        API.getStudentExerciseRecord(courseId, exerciseId, user.username).then((res) => {
                            handleFeedback(res, false)
                        }).catch((err) => {
                            console.error(err)
                            setResults({ ...results, oldXP: ex.experience, newXP: ex.experience, oldProgress: 0, newProgress: 0 });
                        })
                    })
                }
            })
        }
    }, [])

    const handleFeedback = (res: any, afterCheck: boolean) => {
        try {
            let r = new EvaluationResults()
            if (afterCheck) {
                console.log(res)
                r.oldXP = results.newXP
                r.newXP = res.experience
                r.oldProgress = results.newProgress
                r.newProgress = res.correctness
                r.oldSyntaxErrors = results.newSyntaxErrors
                r.newSyntaxErrors = JSON.parse(res.syntax_errors || "[]")
                r.oldSemanticErrors = results.newSemanticErrors
                r.newSemanticErrors = JSON.parse(res.semantic_errors || "[]")
                r.results = JSON.parse(res.results || "{}")
            } else {
                r.oldXP = res.experience
                r.newXP = res.experience
                r.oldProgress = res.correctness
                r.newProgress = res.correctness
                r.oldSyntaxErrors = JSON.parse(res.syntax_errors || "[]")
                r.newSyntaxErrors = JSON.parse(res.syntax_errors || "[]")
                r.oldSemanticErrors = JSON.parse(res.semantic_errors || "[]")
                r.newSemanticErrors = JSON.parse(res.semantic_errors || "[]")
                r.results = JSON.parse(res.results || "{}")
            }
            setResults(r)
            let model = JSON.parse(res.model)
            Object.keys(model.elements).forEach((key) => {
                let element = model.elements[key]
                element.strokeColor = "#000000"
                element.textColor = "#000000"
                element.fillColor = "#FFFFFF"
            })
            Object.keys(model.relationships).forEach((key) => {
                let element = model.relationships[key]
                element.strokeColor = "#000000"
                element.textColor = "#000000"
            })
            r.newSyntaxErrors.filter((error: any) => error.type === "missingClassName").forEach((error: any) => {
                let element = model.elements[error.element.elementId]
                element.textColor = "var(--mantine-color-orange-7)"
                element.strokeColor = "var(--mantine-color-orange-7)"
            })
            r.newSyntaxErrors.filter((error: any) => error.type === "duplicateClassName" || error.type === "unconnectedClass").forEach((error: any) => {
                let element = model.elements[error.element.elementId]
                element.fillColor = "var(--mantine-color-orange-1)"
            })
            r.newSyntaxErrors.filter((error: any) => error.type === "missingAttributeName" ||
                error.type === "duplicateAttributeName" ||
                error.type === "missingAttributeType" ||
                error.type === "foreignKeyReference" ||
                error.type === "invalidAttributeType").forEach((error: any) => {
                    let element = model.elements[error.attribute.elementId]
                    element.fillColor = "var(--mantine-color-orange-1)"
                })
            r.newSyntaxErrors.filter((error: any) => error.type === "missingAssociationName" ||
                error.type === "missingAssociationMultiplicity" ||
                error.type === "invalidAssociationMultiplicity" ||
                error.type === "missingRecursiveAssociationRole").forEach((error: any) => {
                    let element = model.relationships[error.association.elementId]
                    element.strokeColor = "var(--mantine-color-orange-7)"
                    element.textColor = "var(--mantine-color-orange-7)"
                })
            r.newSemanticErrors.filter((error: any) => error.type === "attributeType").forEach((error: any) => {
                let element = model.elements[error.id]
                element.textColor = "var(--mantine-color-red-5)"
            })
            r.newSemanticErrors.filter((error: any) => error.type === "forbiddenClass").forEach((error: any) => {
                let element = model.elements[error.id]
                element.textColor = "var(--mantine-color-red-5)"
                element.strokeColor = "var(--mantine-color-red-5)"
            })
            r.newSemanticErrors.filter((error: any) => error.type === "forbiddenAttribute").forEach((error: any) => {
                let element = model.elements[error.id]
                element.textColor = "var(--mantine-color-red-5)"
                element.strokeColor = "var(--mantine-color-red-5)"
            })
            r.results.matchingClasses.forEach((match: any) => {
                let id = match.diagramClass.elementId
                let element = model.elements[id]
                element.strokeColor = "var(--mantine-color-green-5)";
                element.textColor = "var(--mantine-color-green-5)";
                match.matchingAttributes.forEach((attr: any) => {
                    let attrId = attr.diagramAttribute.elementId
                    let attrElement = model.elements[attrId]
                    attrElement.fillColor = "var(--mantine-color-green-1)"
                })
            })
            r.results.matchingAssociations.forEach((match: any) => {
                let id = match.diagramAssociation.id
                let element = model.relationships[id]
                element.strokeColor = "var(--mantine-color-green-5)";
                element.textColor = "var(--mantine-color-green-5)";
            })
            let cont = document.getElementById("apollon");
            if (cont) {
                let ed = new ApollonEditor(cont, { ...options, type: "ClassDiagram", model: model });
                setEditor(ed);
            }
        } catch (error) {
            console.error("Error handling feedback:", error);
        }
    }

    const evaluate = () => {
        try {
            setChecking(true)
            setTimeout(() => {
                setChecking(false)
                if (courseId && exerciseId && user && editor) {
                    API.saveExerciseRecord(courseId, exerciseId, user.username, editor.model, true).then((res: any) => {
                        handleFeedback(res.record, true)
                    }).catch((err) => {
                        console.error(err)
                    })
                }
                openResults()
            }, 50)
        } catch (error) {
            console.error("Error evaluating exercise:", error);
        }
    }

    return (
        <>
            <Stack align="center" justify="center" >
                {gamified && <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                    <>
                        <Grid.Col span={4}>
                            <Grid my="md" grow justify="center" align="center">
                                <Grid.Col span={6}>
                                    <Center>
                                        <Avatar src={avatarString} size={100} radius="md" />
                                    </Center>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Center>
                                        <Avatar src={bossString} size={100} radius="md" />
                                    </Center>
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Grid my="md" grow justify="center" align="center">
                                <Grid.Col span={6}>
                                    <Center>
                                        <Stack align="center">
                                            <RingProgress sections={[{ value: results.newProgress, color: "green" }]} label={<Text color="green" ta="center" size="xl">{results.newProgress} %</Text>} />
                                            <Text size="md" color="green">Exercise Completeness</Text>
                                        </Stack>
                                    </Center>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Center>
                                        <Stack align="center">
                                            <RingProgress sections={[{ value: results.newXP, color: "blue" }]} label={<Text color="blue" ta="center" size="xl">{results.newXP} XP</Text>} />
                                            <Text size="md" color="blue">Available Experience</Text>
                                        </Stack>
                                    </Center>
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Grid my="md" grow justify="center" align="center">
                                <Grid.Col span={4}>
                                    <Center>
                                        <Popover width={500} position="left" withArrow shadow="md">
                                            <Popover.Target>
                                                <Button variant={results.newSyntaxErrors.length > 0 ? "light" : "default"} color="orange" leftSection={results.newSyntaxErrors.length > 0 && <IconExclamationCircleFilled size={14} />} >Syntax Errors</Button>
                                            </Popover.Target>
                                            <Popover.Dropdown>
                                                {results.newSyntaxErrors.length === 0 ? <Text>There are no syntax errors in your diagram, very good!</Text> : <>
                                                    <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "missingClassName").length > 0 && <>
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "duplicateClassName").map((error: any) => {
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
                                                            results.newSyntaxErrors
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "duplicateAttributeName").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "missingAttributeType").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "missingAssociationName").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "missingAssociationMultiplicity").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "invalidAssociationMultiplicity").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "missingRecursiveAssociationRole").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "unconnectedClass").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "foreignKeyReference").map((error: any) => {
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
                                                        {results.newSyntaxErrors.filter((error: any) => error.type === "invalidAttributeType").map((error: any) => {
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
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <Center >
                                        <Popover width={500} position="left" withArrow shadow="md">
                                            <Popover.Target>
                                                <Button variant={results.newSemanticErrors.length > 0 ? "light" : "default"} color="red" leftSection={results.newSemanticErrors.length > 0 && <IconExclamationCircleFilled size={14} />}  >Semantic Errors</Button>
                                            </Popover.Target>
                                            <Popover.Dropdown>
                                                {results.newSemanticErrors.length === 0 ? <Text>There are no semantic errors in your diagram, very good!</Text> : <>
                                                    <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "missingClass").map((error: any, id: number) => {
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
                                                        {results.newSemanticErrors
                                                            .filter((error) => error.type === "missingAttribute")
                                                            .reduce((acc, error) => {
                                                                acc[error.class] = (acc[error.class] || 0) + 1;
                                                                return acc;
                                                            }, {} as Record<string, number>)
                                                            &&
                                                            Object.entries(
                                                                results.newSemanticErrors
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "attributeType").map((error: any) => {
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "forbiddenClass").map((error: any) => {
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "forbiddenAttribute").map((error: any) => {
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "missingAssociation").map((error: any) => {
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "associationMultiplicity").map((error: any) => {
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "associationName").map((error: any) => {
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
                                                        {results.newSemanticErrors.filter((error: any) => error.type === "associationType").map((error: any) => {
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
                                </Grid.Col>
                                <Grid.Col span={4}>
                                    <Center >
                                        <Popover width={300} position="bottom" withArrow shadow="md">
                                            <Popover.Target>
                                                <Button variant={results.results.matchingClasses.length > 0 ? "light" : "default"} color="green" leftSection={results.results.matchingClasses.length > 0 && <IconCheck size={14} />} >Found Elements</Button>
                                            </Popover.Target>
                                            <Popover.Dropdown>
                                                {results.results.matchingClasses.length === 0 ? <Text>There are no matching elements in your diagram, keep trying!</Text> : <>
                                                    <List>
                                                        {results.results.matchingClasses.map((match: any, id: number) => {
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
                                                        {results.results.matchingAssociations.map((match: any, id: number) => {
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
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>

                    </>
                </Grid>}
                <div id="apollon" className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
                <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                    <Grid.Col span={4}>
                        <Center>
                            <Button variant="light" color="grape" onClick={openMenu}>Menu</Button>
                        </Center>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Center>
                            <Button variant="light" color="grape">Save</Button>
                            <Button variant="light" color="green" onClick={evaluate}>Check</Button>
                            <Button variant="light" color="red">Exit</Button>
                        </Center>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Center>
                            <Button variant="light" color="grape">Settings</Button>
                            <Button variant="light" color="grape">Restore last</Button>
                            <Button variant="light" color="grape">Erase all</Button>
                        </Center>
                    </Grid.Col>
                </Grid>
            </Stack>


            <Drawer opened={menuOpened} onClose={closeMenu} size={"lg"} offset={10} radius={"md"} position="right" >
                {exercise && (
                    <Text>{exercise.description}</Text>
                )}
            </Drawer>

            <Modal opened={resultsOpened} onClose={closeResults} size={"lg"} radius={"md"} title="Exercise Results">
                <List spacing={"md"} size="lg" center>
                    <List.Item icon={<ThemeIcon size="lg" color="green">
                        <IconCircleDashedCheck size={24} />
                    </ThemeIcon>}>
                        <Highlight highlight={["changed", "increased", "reduced", results.newProgress.toString(), results.oldProgress.toString()]} highlightStyles={{
                            backgroundImage: results.newProgress < results.oldProgress ? 'linear-gradient(45deg, var(--mantine-color-orange-5), var(--mantine-color-red-5))' : 'linear-gradient(45deg, var(--mantine-color-lime-5), var(--mantine-color-green-5))',
                            fontWeight: 700,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}  >
                            {`Exercise correctness ${results.newProgress > results.oldProgress ? "increased" : "reduced"} from ${results.oldProgress.toString()} to ${results.newProgress.toString()}`}
                        </Highlight>
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="blue">
                        <IconUserUp size={24} />
                    </ThemeIcon>} >
                        <Highlight highlight={["changed", "increased", "reduced", results.newXP.toString(), results.oldXP.toString()]} highlightStyles={{
                            backgroundImage: results.newXP < results.oldXP ? 'linear-gradient(45deg, var(--mantine-color-orange-5), var(--mantine-color-red-5))' : 'linear-gradient(45deg, var(--mantine-color-lime-5), var(--mantine-color-green-5))',
                            fontWeight: 700,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }} >
                            {`Available experience ${results.newXP > results.oldXP ? "increased" : "reduced"} from ${results.oldXP.toString()} to ${results.newXP.toString()}`}
                        </Highlight>
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="red">
                        <IconExclamationCircle size={24} />
                    </ThemeIcon>}>
                        {results.newSyntaxErrors.filter(
                            (newErr: any) =>
                                !results.oldSyntaxErrors.some(
                                    (oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr)
                                )
                        ).length > 0 ? <Highlight highlight={[results.newSyntaxErrors.filter((newErr: any) => !results.oldSyntaxErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length.toString()]} highlightStyles={{
                            backgroundImage: 'linear-gradient(45deg, var(--mantine-color-orange-5), var(--mantine-color-red-5))',
                            fontWeight: 700,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {`There are ${results.newSyntaxErrors.filter((newErr: any) => !results.oldSyntaxErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length} new syntax errors compared to the previous evaluation.`}
                        </Highlight> : <Text>There are no new syntax errors compared to the previous evaluation.</Text>}
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="red">
                        <IconExclamationCircle size={24} />
                    </ThemeIcon>}>
                        {results.newSemanticErrors.filter((newErr: any) => !results.oldSemanticErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length > 0 ?
                            <Highlight highlight={[results.newSemanticErrors.filter((newErr: any) => !results.oldSemanticErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length.toString()]} highlightStyles={{
                                backgroundImage: 'linear-gradient(45deg, var(--mantine-color-orange-5), var(--mantine-color-red-5))',
                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {`There are ${results.newSemanticErrors.filter((newErr: any) => !results.oldSemanticErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length} new semantic errors compared to the previous evaluation.`}
                            </Highlight> : <Text>There are no new semantic errors compared to the previous evaluation.</Text>}
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="lime">
                        <IconCheck size={24} />
                    </ThemeIcon>}>
                        {results.oldSyntaxErrors.filter((oldErr: any) => !results.newSyntaxErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length > 0 ?
                            <Highlight highlight={[results.oldSyntaxErrors.filter((oldErr: any) => !results.newSyntaxErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length.toString()]} highlightStyles={{
                                backgroundImage: 'linear-gradient(45deg, var(--mantine-color-lime-5), var(--mantine-color-green-5))',
                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {`You fixed ${results.oldSyntaxErrors.filter((oldErr: any) => !results.newSyntaxErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length} syntax error(s) that were found in the previous evaluation.`}
                            </Highlight> : <Text>You did not fix any syntax error that was found in the previous evaluation.</Text>}
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="lime">
                        <IconCheck size={24} />
                    </ThemeIcon>}>
                        {results.oldSemanticErrors.filter((oldErr: any) => !results.newSemanticErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length > 0 ?
                            <Highlight highlight={[results.oldSemanticErrors.filter((oldErr: any) => !results.newSemanticErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length.toString()]} highlightStyles={{
                                backgroundImage: 'linear-gradient(45deg, var(--mantine-color-lime-5), var(--mantine-color-green-5))',
                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {`You fixed ${results.oldSemanticErrors.filter((oldErr: any) => !results.newSemanticErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length} semantic error(s) that were found in the previous evaluation.`}
                            </Highlight> : <Text>You did not fix any semantic error that was found in the previous evaluation.</Text>}
                    </List.Item>
                </List>
            </Modal>

            {checking && <Notification color="yellow" mt="md" className='notif' loading={true} >
                <Alert variant="light" color="yellow" icon={<IconExclamationCircle size={16} />} title="Warning!" >
                    Exercise evaluation is in progress. Please wait...
                </Alert>
            </Notification>}
        </>
    )
}

export default ExercisePage