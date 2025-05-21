import React, { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Stack, TextInput, NativeSelect, Textarea, Group } from "@mantine/core";
import API from "../../API";
import ReactMarkdown from "react-markdown";
import { Puff } from "@agney/react-loading"
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
//import { UMLStructureBuilderFromLLM, UMLStructureBuilderFromReference } from "../operations/UMLStructureBuilder";
//import { ReferenceBuilder, ReferenceSolution } from "../operations/UMLMatcherTypes";
//import { ReferenceDisplayer, DividerLine } from "./ReferenceDisplayer";
import JSZip from "jszip";
import saveAs from "file-saver";
import { Exercise, Solution } from "../../Utils/Models";
import { useParams, useNavigate } from "react-router-dom";
import { IconArrowBackUp, IconArrowLeft, IconArrowRight, IconDownload, IconEdit, IconExclamationCircle, IconExclamationCircleFilled, IconSquareRoundedPlusFilled, IconTrash, IconTrashFilled, IconUpload, IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Carousel } from "@mantine/carousel";
import { AssociationType, ReferenceAssociation, ReferenceAttribute, ReferenceBuilder, ReferenceClass, ReferenceClassInAssociation, ReferenceSolution, Weight } from "../../Utils/UMLMatcherTypes";
import { UMLStructureBuilderFromReference } from "../../Utils/UMLStructureBuilder";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false
}


function SolutionCreator() {
    const { courseId, exerciseId } = useParams()
    const [exercise, setExercise] = useState<Exercise | undefined>(undefined)
    const [activeTab, setActiveTab] = useState<string | null>("reference")
    const [editor, setEditor] = useState<ApollonEditor>()
    const [openDelete, setOpenDelete] = useState(false)
    const [currentSolution, setCurrentSolution] = useState<Solution | undefined>(undefined)
    const [currentReference, setCurrentReference] = useState<ReferenceSolution | undefined>(undefined)
    const [opened, { open, close }] = useDisclosure(false)

    useEffect(() => {
        if (courseId && exerciseId) {
            API.getCourse(courseId).then((c) => {
                const ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                }
            })
        }
    }, [])

    useEffect(() => {
        let isMounted = true;
        const setupEditor = async () => {
            if (activeTab === "modeler") {
                let cont = document.getElementById("apollon");
                if (cont) {
                    let ed = new ApollonEditor(cont, { ...options, type: "ClassDiagram" });
                    await ed.nextRender;
                    if (!isMounted) return;
                    if (currentSolution) {
                        ed.model = currentSolution.model;
                    }
                    setEditor(ed);
                }
            }
        };
        setupEditor();
        return () => {
            isMounted = false;
        };
    }, [activeTab]);

    useEffect(() => {
        setCurrentReference(currentSolution?.reference)
    }, [currentSolution])

    const saveSolution = async () => {
        if (activeTab === "modeler") {
            if (editor) {
                let builder = new ReferenceBuilder(editor.model)
                let ref = builder.buildReference()
                let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
                if (courseId && exerciseId) {
                    API.addSolution(courseId, exerciseId, ref, editor.model, svg)
                } else {

                }
            }
        } else {
            if (currentReference) {
                let builder = new UMLStructureBuilderFromReference(currentReference)
                let model = builder.createUMLStructure()
                if (editor) {
                    await editor.nextRender
                    editor.model = model
                    let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
                    console.log(svg)
                    if (courseId && exerciseId) { API.addSolution(courseId, exerciseId, currentReference, model, svg) }
                } else {
                    const tempContainer = document.createElement("div");
                    tempContainer.style.position = "absolute";
                    tempContainer.style.left = "-9999px";
                    tempContainer.style.width = "800px";
                    tempContainer.style.height = "600px";
                    document.body.appendChild(tempContainer);

                    let ed = new ApollonEditor(tempContainer, { ...options, type: "ClassDiagram" });
                    await ed.nextRender;

                    ed.model = model;
                    await ed.nextRender;

                    let svg = await ed.exportAsSVG({ margin: 5, keepOriginalSize: true });
                    if (courseId && exerciseId) {
                        API.addSolution(courseId, exerciseId, currentReference, model, svg);
                    }

                    document.body.removeChild(tempContainer);
                }

            }
        }
        if (courseId && exerciseId) {
            API.getCourse(courseId).then((c) => {
                const ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                    setCurrentReference(undefined)
                    setCurrentSolution(undefined)
                    setActiveTab("reference")
                    close()
                }
            })
        }
    }

    const handleDelete = () => {
        if (courseId && exerciseId && currentSolution) {
            API.deleteSolution(courseId, exerciseId, currentSolution.solutionId).then((res) => {
                setOpenDelete(false)
                API.getCourse(courseId).then((c) => {
                    const ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                    if (ex) {
                        setExercise(ex)
                    }
                })
            })
        }
    }

    const addClass = (classes: ReferenceClass[]) => {
        if (exercise) {
            if (!currentReference) {
                let ref = new ReferenceSolution()
                ref.classes = classes
                ref.associations = []
                ref.enumerations = []
                ref.forbiddenClasses = []
                ref.forbiddenAssociations = []
                ref.enumerationAssociations = []
                setCurrentReference(ref)
            } else {
                let ref = { ...currentReference, classes: classes }
                setCurrentReference(ref)
            }
        }
    }

    const addAssociation = (associations: ReferenceAssociation[]) => {
        if (exercise) {
            if (currentReference) {
                let ref = { ...currentReference, associations: associations }
                setCurrentReference(ref)
            }
        }
    }

    const addForbiddenClasses = (forbiddenClasses: string[]) => {
        if (exercise) {
            if (currentReference) {
                let ref = { ...currentReference, forbiddenClasses: forbiddenClasses }
                setCurrentReference(ref)
            }
        }
    }

    const addForbiddenAssociations = (forbiddenAssociations: { source: string, target: string }[]) => {
        if (exercise) {
            if (currentReference) {
                let ref = { ...currentReference, forbiddenAssociations: forbiddenAssociations }
                setCurrentReference(ref)
            }
        }
    }

    return (
        <>
            {exercise && exercise.solutions.length > 0 && (
                <>
                    <Carousel withIndicators height={700} slideGap="md" nextControlIcon={<IconArrowRight size={16} />}
                        previousControlIcon={<IconArrowLeft size={16} />} emblaOptions={{ loop: true }} style={{ backgroundColor: " rgba(21, 170, 191, 0.1)" }} >
                        {exercise.solutions.map((solution, index) => {
                            let svgData = solution.image.svg;
                            let svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
                            return (
                                <Carousel.Slide key={index}>
                                    <Center style={{ height: "100%" }}>
                                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: 600, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                            <Card.Section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
                                                <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto" }}>
                                                    <img
                                                        src={svgBase64}
                                                        alt="Solution SVG"
                                                        style={{
                                                            maxWidth: "100%",
                                                            maxHeight: "600px",
                                                            width: "auto",
                                                            height: "100%",
                                                            objectFit: "contain",
                                                            display: "block"
                                                        }}
                                                    />
                                                </div>
                                            </Card.Section>
                                            <Text>
                                                Solution n. {index + 1}
                                            </Text>
                                            <Center mt="md">
                                                <Button variant="light" color="lime" rightSection={<IconEdit size={16} stroke={1.5} />} mt="sm" onClick={() => {
                                                    setCurrentSolution(solution)
                                                    setCurrentReference(solution.reference)
                                                    setActiveTab("reference")
                                                    open()
                                                }} >Edit solution</Button>
                                                <Button variant="light" color="red" rightSection={<IconTrashFilled size={16} stroke={1.5} />} mt="sm" ml="md"
                                                    onClick={() => {
                                                        setCurrentSolution(solution)
                                                        setOpenDelete(true)
                                                    }} >Delete solution</Button>
                                            </Center>
                                        </Card>
                                    </Center>
                                </Carousel.Slide>
                            );
                        })}
                    </Carousel>
                </>
            )}
            {exercise && exercise.solutions.length === 0 && (
                <>
                    <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No solutions found!" >
                        There are no solutions for this exercise yet. You can create one by clicking the button below.
                    </Alert>
                </>
            )}
            <Center mt="md">
                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => {
                    setActiveTab("reference")
                    setCurrentReference(undefined)
                    setCurrentSolution(undefined)
                    open()
                }} >
                    Create new solution
                </Button>
                <Button variant="light" color="orange" rightSection={<IconUpload size={16} stroke={1.5} />} mt="sm" ml="md">
                    Upload solution
                </Button>
                <Button variant="light" color="cyan" rightSection={<IconDownload size={16} stroke={1.5} />} mt="sm" ml="md">
                    Download all solutions
                </Button>
            </Center>

            <Modal opened={opened} onClose={close} fullScreen transitionProps={{ transition: 'fade', duration: 300 }} >
                <Fieldset legend="Solution Creator" style={{ width: "100%" }}>
                    <Tabs value={activeTab} onChange={setActiveTab} variant="pills" color="cyan">
                        <Tabs.List>
                            <Tabs.Tab value="reference">Reference</Tabs.Tab>
                            <Tabs.Tab value="modeler">Modeler</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="modeler">
                            {activeTab === "modeler" && <div id="apollon"></div>}
                        </Tabs.Panel>
                        <Tabs.Panel value="reference">
                            <Tabs defaultValue="classes" color="cyan">
                                <Tabs.List>
                                    <Tabs.Tab value="classes">Classes</Tabs.Tab>
                                    <Tabs.Tab value="attributes">Attributes</Tabs.Tab>
                                    <Tabs.Tab value="associations">Associations</Tabs.Tab>
                                    <Tabs.Tab value="enumerations">Enumerations</Tabs.Tab>
                                    <Tabs.Tab value="enumerationAssociations">Enumeration Associations</Tabs.Tab>
                                    <Tabs.Tab value="forbidden">Forbidden Elements</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="classes">
                                    <ClassForm reference={currentReference} addClass={addClass} />
                                </Tabs.Panel>
                                <Tabs.Panel value="attributes">
                                    <AttributeForm reference={currentReference} addClass={addClass} />
                                </Tabs.Panel>
                                <Tabs.Panel value="associations">
                                    <AssociationForm reference={currentReference} addAssociation={addAssociation} />
                                </Tabs.Panel>
                                <Tabs.Panel value="enumerations">
                                    enumerations
                                </Tabs.Panel>
                                <Tabs.Panel value="enumerationAssociations">
                                    enumeration associations
                                </Tabs.Panel>
                                <Tabs.Panel value="forbidden">
                                    <ForbiddenElementsForm reference={currentReference} addForbiddenClasses={addForbiddenClasses} addForbiddenAssociations={addForbiddenAssociations} />
                                </Tabs.Panel>
                            </Tabs>
                        </Tabs.Panel>
                    </Tabs>
                    <Center mt="md">
                        <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => { saveSolution() }} >
                            Save solution
                        </Button>
                    </Center>
                </Fieldset>
            </Modal>

            <Modal opened={openDelete} onClose={() => setOpenDelete(false)} title="Delete solution" centered>
                <Stack gap="sm" align='center' justify="center">
                    <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                        Are you sure you want to delete this solution? This action cannot be undone.
                    </Alert>
                    <Grid>
                        <Grid.Col span={6}>
                            <Button variant='light' color="gray" onClick={() => setOpenDelete(false)} leftSection={<IconX size={16} stroke={1.5} />}>Cancel</Button>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Button variant="light" color="red" onClick={() => handleDelete()} leftSection={<IconTrash size={16} stroke={1.5} />}>Delete solution</Button>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Modal>
        </>
    )
}

function ListEditor(props: { onSave: () => void, mode: string, list: string[], onListChange: (newList: string[]) => void }) {
    const [list, setList] = useState(props.list)
    const [legend, setLegend] = useState("")

    useEffect(() => {
        setList(props.list);
    }, [props.list]);

    useEffect(() => {
        switch (props.mode) {
            case "forbiddenAttributes":
                setLegend("Forbidden Attributes")
                break;
            case "synonyms":
                setLegend("Synonyms")
                break;
            case "types":
                setLegend("Attribute Types")
                break;
            case "multiplicities":
                setLegend("Association Multiplicities")
                break;
            case "forbiddenClasses":
                setLegend("Forbidden Classes")
                break;
            default:
                setLegend("Attributes")
                break;
        }
    }, [props.mode])

    const handleEdit = (index: number, newValue: string) => {
        const newList = [...list];
        newList[index] = newValue;
        setList(newList);
        props.onListChange(newList);
    };

    const handleAdd = () => {
        const newList = [...list, ""];
        setList(newList);
        props.onListChange(newList);
    };

    const handleRemove = (index: number) => {
        if (props.mode === "attributeTypes" && list.length === 1) {
            return; // Prevent removing the last element if mode is "attributeTypes"
        }
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
        props.onListChange(newList);
    };
    return (
        <>
            <Fieldset legend={legend} style={{ width: "100%" }}>
                {list.map((item, index) => (
                    <TextInput value={item} onChange={(e) => handleEdit(index, e.currentTarget.value)}
                        key={index} placeholder={`Item ${index + 1}`} style={{ marginBottom: "10px", width: "100%" }}
                        rightSection={<IconTrashFilled color="red" onClick={() => handleRemove(index)} />} />
                ))}
                <Center mt="md">
                    <Button variant="light" color="green" onClick={handleAdd} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                        Add new item
                    </Button>
                </Center>
            </Fieldset>
        </>
    )
}

function ClassForm(props: { reference: ReferenceSolution | undefined, addClass: (classes: ReferenceClass[]) => void }) {
    const [currentClass, setCurrentClass] = useState<ReferenceClass | undefined>(undefined)
    const [classes, setClasses] = useState<ReferenceClass[]>([])
    const [forbiddenAttributes, setForbiddenAttributes] = useState<string[]>([])
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [name, setName] = useState<string>("")
    const [weight, setWeight] = useState<string>("STRONG")
    const [message, setMessage] = useState<string>("")
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        console.log(props.reference)
        if (props.reference) {
            setClasses(props.reference.classes)
        } else {
            setClasses([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentClass) {
            setName(currentClass.name)
            setWeight(currentClass.weight)
            setMessage(currentClass.message)
            setForbiddenAttributes(currentClass.forbiddenAttributes)
            setSynonyms(currentClass.synonyms)
        } else {
            setName("")
            setWeight("STRONG")
            setMessage("")
            setForbiddenAttributes([])
            setSynonyms([])
        }
    }, [currentClass])

    const resetForm = () => {
        setName("")
        setWeight("STRONG")
        setMessage("")
        setForbiddenAttributes([])
        setSynonyms([])
    }

    const handleSubmit = () => {
        setNameError(null)
        if (!currentClass) {
            if (name.trim().length === 0) {
                setNameError("Class name cannot be empty")
                return
            }
            if (classes.find((c) => c.name === name)) {
                setNameError("Class name already exists")
                return
            }
            let cl: ReferenceClass = new ReferenceClass()
            cl.name = name
            cl.weight = weight as Weight
            cl.message = message
            cl.forbiddenAttributes = forbiddenAttributes
            cl.synonyms = synonyms
            setClasses([...classes, cl])
            resetForm()
            setCurrentClass(undefined)
            props.addClass([...classes, cl])
        } else {
            if (name.trim().length === 0) {
                setNameError("Class name cannot be empty")
                return
            }
            let cl = classes.find((c) => c.name === currentClass?.name)
            if (cl) {
                cl.name = name
                cl.weight = weight as Weight
                cl.message = message
                cl.forbiddenAttributes = forbiddenAttributes
                cl.synonyms = synonyms
                setClasses([...classes.filter((c) => c.name !== currentClass?.name), cl])
                resetForm()
                setCurrentClass(undefined)
                props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
            }
        }
    }

    const handleDelete = () => {
        if (currentClass) {
            setClasses(classes.filter((c) => c.name !== currentClass?.name))
            setCurrentClass(undefined)
            resetForm()
            props.addClass(classes.filter((c) => c.name !== currentClass?.name))
        }
    }

    return (
        <>
            <Grid justify='center' align='center'>
                <Grid.Col span={4}>
                    <Fieldset legend="Current class" style={{ width: "100%" }}>
                        <TextInput label="Class name" placeholder="Class name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} />
                        <NativeSelect label="Weight" data={["STRONG", "MEDIUM", "WEAK", "NONE"]} value={weight} onChange={(ev) => setWeight(ev.target.value)} />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                        <Tabs defaultValue="forbiddenAttributes" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="forbiddenAttributes">Forbidden Attributes</Tabs.Tab>
                                <Tabs.Tab value="synonyms">Synonyms</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="forbiddenAttributes">
                                <ListEditor mode="forbiddenAttributes" list={forbiddenAttributes} onListChange={(newList) => {
                                    setForbiddenAttributes(newList)
                                }} onSave={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="synonyms">
                                <ListEditor mode="synonyms" list={synonyms} onListChange={(newList) => {
                                    setSynonyms(newList)
                                }} onSave={() => { }} />
                            </Tabs.Panel>
                        </Tabs>
                        <Group justify="center" p="md">
                            {currentClass && <Button variant="light" color="gray" onClick={() => setCurrentClass(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                Save class
                            </Button>
                            {currentClass && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                Delete selected class
                            </Button>}
                        </Group>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={8}>
                    <Fieldset legend="Classes" style={{ width: "100%" }}>
                        {classes.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                            {classes.map((c, index) => {
                                return (
                                    <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentClass(c)}
                                        style={{
                                            width: 'fit-content', margin: 'auto', cursor: "pointer",
                                            border: currentClass === c ? '5px solid cyan' : undefined
                                        }} >
                                        <Text>{c.name}</Text>
                                    </Card>
                                )
                            })}
                        </Flex>}
                        {classes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                            There are no classes for this solution yet. You can create one by filling the form on the left.
                        </Alert>}
                    </Fieldset>
                </Grid.Col>
            </Grid>
        </>
    )
}

function AttributeForm(props: { reference: ReferenceSolution | undefined, addClass: (classes: ReferenceClass[]) => void }) {
    const [name, setName] = useState<string>("")
    const [types, setTypes] = useState<string[]>([""])
    const [weight, setWeight] = useState("")
    const [message, setMessage] = useState("")
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [classes, setClasses] = useState<ReferenceClass[]>([])
    const [currentClass, setCurrentClass] = useState<ReferenceClass | undefined>(undefined)
    const [currentAttribute, setCurrentAttribute] = useState<ReferenceAttribute | undefined>(undefined)
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setClasses(props.reference.classes)
        } else {
            setClasses([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentAttribute) {
            setName(currentAttribute.name)
            setTypes(currentAttribute.types)
            setWeight(currentAttribute.weight)
            setMessage(currentAttribute.message)
            setSynonyms(currentAttribute.synonyms)
        }
    }, [currentAttribute])

    const resetForm = () => {
        setName("")
        setTypes([""])
        setWeight("STRONG")
        setMessage("")
        setSynonyms([])
    }

    const handleSubmit = () => {
        setNameError(null)
        if (name.trim().length === 0) {
            setNameError("Attribute name cannot be empty")
            return
        }
        if (types.length === 0) {
            setNameError("Attribute must have at least one type")
            return
        }
        if (types.some((type) => type.trim() === "")) {
            setNameError("Attribute types cannot be empty")
            return
        }
        if (!currentClass) {
            setNameError("Please select a class to add the attribute to")
            return
        }
        if (!currentAttribute) {
            if (currentClass.attributes.find((a) => a.name === name)) {
                setNameError("Attribute name already exists")
                return
            }
            let attr = new ReferenceAttribute()
            attr.name = name
            attr.types = types
            attr.weight = weight as Weight
            attr.message = message
            attr.synonyms = synonyms
            let cl = currentClass
            cl.attributes.push(attr)
            resetForm()
            setCurrentAttribute(undefined)
            setCurrentClass(cl)
            props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
        } else {
            let attr = currentClass?.attributes.find((a) => a.name === currentAttribute?.name)
            if (attr) {
                attr.name = name
                attr.types = types
                attr.weight = weight as Weight
                attr.message = message
                attr.synonyms = synonyms
                let cl = currentClass
                setCurrentClass(cl)
                resetForm()
                setCurrentAttribute(undefined)
                props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
            }
        }
    }

    const handleDelete = () => {
        if (currentClass && currentAttribute) {
            let cl = currentClass
            cl.attributes = cl.attributes.filter((a) => a.name !== currentAttribute?.name)
            setCurrentClass(cl)
            setCurrentAttribute(undefined)
            resetForm()
            props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
        }
    }

    return (
        <>
            <Grid justify='center' align='center'>
                <Grid.Col span={4}>
                    <Fieldset legend="Attribute" style={{ width: "100%" }}>
                        {currentClass && <> <TextInput label="Attribute name" placeholder="Attribute name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} />
                            <NativeSelect label="Weight" data={["STRONG", "MEDIUM", "WEAK", "NONE"]} value={weight} onChange={(ev) => setWeight(ev.target.value)} />
                            <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                            <Tabs defaultValue="types" color="cyan">
                                <Tabs.List>
                                    <Tabs.Tab value="types">Types</Tabs.Tab>
                                    <Tabs.Tab value="synonyms">Synonyms</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="types">
                                    <ListEditor mode="types" list={types} onListChange={(newList) => {
                                        setTypes(newList)
                                    }} onSave={() => { }} />
                                </Tabs.Panel>
                                <Tabs.Panel value="synonyms">
                                    <ListEditor mode="synonyms" list={synonyms} onListChange={(newList) => {
                                        setSynonyms(newList)
                                    }} onSave={() => { }} />
                                </Tabs.Panel>
                            </Tabs>
                            <Group justify="center" p="md">
                                {currentClass && <Button variant="light" color="gray" onClick={() => {
                                    setCurrentAttribute(undefined)
                                    setCurrentClass(undefined)
                                    resetForm()
                                }} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selected class
                                </Button>}
                                {currentAttribute && <Button variant="light" color="gray" onClick={() => {
                                    resetForm()
                                    setCurrentAttribute(undefined)
                                }} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selected attribute
                                </Button>}
                                <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save attribute
                                </Button>
                                {currentAttribute && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                    Delete selected attribute
                                </Button>}
                            </Group>
                        </>}
                        {!currentClass && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No attribute selected!" >
                            Please select a class from the list on the right to edit its attributes.
                        </Alert>}
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={8}>
                    <Stack>
                        <Fieldset legend="Classes" style={{ width: "100%" }}>
                            {classes.length > 0 && <> <Flex wrap="wrap" justify="center" gap="md">
                                {classes.map((c, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentClass(c)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentClass === c ? '5px solid cyan' : undefined
                                            }} >
                                            <Text>{c.name}</Text>
                                        </Card>
                                    )
                                })}
                            </Flex>
                            </>}
                            {classes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                                There are no classes for this solution yet. You can create one on the <b>Classes</b> tab.
                            </Alert>}
                        </Fieldset>
                        {currentClass && <Fieldset legend={"Attributes of " + currentClass.name} style={{ width: "100%" }}>
                            {currentClass.attributes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No attributes found!" >
                                There are no attributes for this class yet. You can create one by filling the form on the left.
                            </Alert>}
                            {currentClass.attributes.length > 0 && <>
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {currentClass.attributes.map((a, index) => {
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentAttribute(a)} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentAttribute === a ? '5px solid cyan' : undefined
                                            }} >
                                                <Text>{a.name}</Text>
                                            </Card>
                                        )
                                    })}
                                </Flex>

                            </>}

                        </Fieldset>}
                    </Stack>

                </Grid.Col>
            </Grid>

        </>
    )
}

function AssociationForm(props: { reference: ReferenceSolution | undefined, addAssociation: (associations: ReferenceAssociation[]) => void }) {
    const [name, setName] = useState<string>("")
    const [weight, setWeight] = useState<string>("STRONG")
    const [type, setType] = useState<string>("Default")
    const [message, setMessage] = useState<string>("")
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [classes, setClasses] = useState<ReferenceClass[]>([])
    const [associations, setAssociations] = useState<ReferenceAssociation[]>([])
    const [sourceClass, setSourceClass] = useState<string>("")
    const [targetClass, setTargetClass] = useState<string>("")
    const [sourceRole, setSourceRole] = useState<string>("")
    const [targetRole, setTargetRole] = useState<string>("")
    const [sourceMultiplicity, setSourceMultiplicity] = useState<string[]>([])
    const [targetMultiplicity, setTargetMultiplicity] = useState<string[]>([])
    const [currentAssociation, setCurrentAssociation] = useState<ReferenceAssociation | undefined>(undefined)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setClasses(props.reference.classes)
            setAssociations(props.reference.associations)
        } else {
            setClasses([])
            setAssociations([])
        }
    }, [props.reference])

    useEffect(() => {
        if (classes.length > 0) {
            setSourceClass(classes[0].name)
            setTargetClass(classes[0].name)
        }
    }, [classes])

    useEffect(() => {
        if (currentAssociation) {
            setName(currentAssociation.name)
            setWeight(currentAssociation.weight)
            setType(currentAssociation.type)
            setMessage(currentAssociation.message)
            setSynonyms(currentAssociation.synonyms)
            setSourceClass(currentAssociation.source.referenceClass.name)
            setTargetClass(currentAssociation.target.referenceClass.name)
            setSourceRole(currentAssociation.source.role)
            setTargetRole(currentAssociation.target.role)
            setSourceMultiplicity(currentAssociation.source.multiplicities)
            setTargetMultiplicity(currentAssociation.target.multiplicities)
        }
    }, [currentAssociation])

    const resetForm = () => {
        setName("")
        setWeight("STRONG")
        setType("Default")
        setMessage("")
        setSynonyms([])
        setSourceClass("")
        setTargetClass("")
        setSourceRole("")
        setTargetRole("")
        setSourceMultiplicity([])
        setTargetMultiplicity([])
    }

    const handleSubmit = () => {
        setError(null)
        if (sourceClass.trim().length === 0 || targetClass.trim().length === 0) {
            setError("Please select a source and target class")
            return
        }
        if (sourceMultiplicity.length === 0 || targetMultiplicity.length === 0) {
            setError("Please enter at least one multiplicity value for both source and target classes")
            return
        }
        if (!currentAssociation) {
            let assoc = new ReferenceAssociation()
            assoc.name = name
            assoc.weight = weight as Weight
            assoc.type = type
            assoc.message = message
            assoc.synonyms = synonyms
            let src = new ReferenceClassInAssociation()
            src.referenceClass = classes.find((c) => c.name === sourceClass) as ReferenceClass
            src.role = sourceRole
            src.multiplicities = sourceMultiplicity
            assoc.source = src
            let tgt = new ReferenceClassInAssociation()
            tgt.referenceClass = classes.find((c) => c.name === targetClass) as ReferenceClass
            tgt.role = targetRole
            tgt.multiplicities = targetMultiplicity
            assoc.target = tgt
            resetForm()
            setCurrentAssociation(undefined)
            setAssociations([...associations, assoc])
            props.addAssociation([...associations, assoc])
        } else {
            let assoc = associations.find((a) => a === currentAssociation)
            if (assoc) {
                assoc.name = name
                assoc.weight = weight as Weight
                assoc.type = type
                assoc.message = message
                assoc.synonyms = synonyms
                let src = new ReferenceClassInAssociation()
                src.referenceClass = classes.find((c) => c.name === sourceClass) as ReferenceClass
                src.role = sourceRole
                src.multiplicities = sourceMultiplicity
                assoc.source = src
                let tgt = new ReferenceClassInAssociation()
                tgt.referenceClass = classes.find((c) => c.name === targetClass) as ReferenceClass
                tgt.role = targetRole
                tgt.multiplicities = targetMultiplicity
                resetForm()
                setCurrentAssociation(undefined)
                setAssociations([...associations.filter((a) => a !== currentAssociation), assoc])
                props.addAssociation([...associations.filter((a) => a !== currentAssociation), assoc])
            }
        }
    }

    const handleDelete = () => {
        if (currentAssociation) {
            setAssociations(associations.filter((a) => a !== currentAssociation));
            setCurrentAssociation(undefined);
            resetForm();
            props.addAssociation(associations.filter((a) => a !== currentAssociation));
        }
    }

    return (
        <Grid justify='center' align='center'>
            {classes.length > 0 && <> <Grid.Col span={4}>
                <Fieldset legend="Association" style={{ width: "100%" }}>
                    {classes.length > 0 && <>
                        <TextInput label="Association name" placeholder="Association name" value={name} onChange={(ev) => setName(ev.target.value)} error={error} />
                        <NativeSelect label="Weight" data={["STRONG", "MEDIUM", "WEAK", "NONE"]} value={weight} onChange={(ev) => setWeight(ev.target.value)} />
                        <NativeSelect label="Association type" data={["Default", "Inheritance"]} value={type} onChange={(ev) => setType(ev.target.value)} />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                        <ListEditor mode="synonyms" list={synonyms} onListChange={(newList) => {
                            setSynonyms(newList)
                        }} onSave={() => { }} />
                        <Tabs defaultValue="source" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="source">Source</Tabs.Tab>
                                <Tabs.Tab value="target">Target</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="source">
                                <NativeSelect label="Source class" data={classes.map((c) => c.name)} value={sourceClass} onChange={(ev) => {
                                    setSourceClass(ev.target.value)
                                }} />
                                <ListEditor mode="multiplicities" list={sourceMultiplicity} onListChange={(newList) => { setSourceMultiplicity(newList) }} onSave={() => { }} />
                                <TextInput label="Source role" placeholder="Source role" value={sourceRole} onChange={(ev) => { setSourceRole(ev.target.value) }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="target">
                                <NativeSelect label="Target class" data={classes.map((c) => c.name)} value={targetClass} onChange={(ev) => { setTargetClass(ev.target.value) }} />
                                <ListEditor mode="multiplicities" list={targetMultiplicity} onListChange={(newList) => { setTargetMultiplicity(newList) }} onSave={() => { }} />
                                <TextInput label="Target role" placeholder="Target role" value={targetRole} onChange={(ev) => { setTargetRole(ev.target.value) }} />
                            </Tabs.Panel>
                        </Tabs>
                        <Group justify="center" p="md">
                            {currentAssociation && <Button variant="light" color="gray" onClick={() => {
                                setCurrentAssociation(undefined)
                                resetForm()
                            }} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                Save association
                            </Button>
                            {currentAssociation && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                Delete selected association
                            </Button>}
                        </Group>
                    </>}

                </Fieldset>
            </Grid.Col>
                <Grid.Col span={8}>
                    <Fieldset legend="Associations" style={{ width: "100%" }}>
                        {associations.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No associations found!" >
                            There are no associations for this solution yet. You can create one using the form on the left.
                        </Alert>}
                        {associations.length > 0 && <>
                            <Flex wrap="wrap" justify="center" gap="md">
                                {associations.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentAssociation(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentAssociation === a ? '5px solid cyan' : undefined
                                            }} >
                                            <Text>{a.source.referenceClass.name} - {a.target.referenceClass.name}</Text>
                                        </Card>
                                    )
                                })}
                            </Flex>
                        </>}
                    </Fieldset>

                </Grid.Col>
            </>}
            {classes.length === 0 && <Grid.Col span={12}>
                <Fieldset legend="Associations" style={{ width: "100%" }}>
                    <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                        There are no classes for this solution yet. You can create one on the <b>Classes</b> tab.
                    </Alert>
                </Fieldset>
            </Grid.Col>}
        </Grid>
    )
}

function ForbiddenElementsForm(props: {
    reference: ReferenceSolution | undefined,
    addForbiddenClasses: (forbiddenClasses: string[]) => void,
    addForbiddenAssociations: (forbiddenAssociations: { source: string, target: string }[]) => void
}) {
    const [forbiddenClasses, setForbiddenClasses] = useState<string[]>([])
    const [forbiddenAssociations, setForbiddenAssociations] = useState<{ source: string, target: string }[]>([])
    const [classes, setClasses] = useState<ReferenceClass[]>([])

    useEffect(() => {
        if (props.reference) {
            setForbiddenClasses(props.reference.forbiddenClasses)
            setForbiddenAssociations(props.reference.forbiddenAssociations)
            setClasses(props.reference.classes)
        } else {
            setForbiddenClasses([])
            setForbiddenAssociations([])
            setClasses([])
        }
    }, [props.reference])


    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={6}>
                <ListEditor mode="forbiddenClasses" list={forbiddenClasses} onListChange={(newList) => {
                    setForbiddenClasses(newList)
                    props.addForbiddenClasses(newList)
                }} onSave={() => { }} />
            </Grid.Col>
            <Grid.Col span={6}>
                <Fieldset legend="Forbidden associations" style={{ width: "100%" }}>
                    {classes.length > 0 && <>
                        <ClassSelectEditor classes={classes.map((c) => { return { name: c.name } })} selectedList={forbiddenAssociations.map((a) => a.source + " - " + a.target)} onListChange={(newList) => {
                            const newForbiddenAssociations = newList.map((item) => {
                                const [source, target] = item.split(" - ");
                                return { source, target };
                            });
                            setForbiddenAssociations(newForbiddenAssociations);
                            props.addForbiddenAssociations(newForbiddenAssociations);
                        }} legend="Select forbidden associations" />
                    </>}
                    {classes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                        There are no classes for this solution yet. You can create one on the <b>Classes</b> tab.
                    </Alert>}
                </Fieldset>
            </Grid.Col>
        </Grid>
    )
}

interface ClassSelectEditorProps {
    classes: { name: string }[];
    selectedList: string[];
    onListChange: (newList: string[]) => void;
    legend?: string;
}

function ClassSelectEditor(props: ClassSelectEditorProps) {
    const [list, setList] = useState<string[]>(props.selectedList);

    useEffect(() => {
        setList(props.selectedList);
    }, [props.selectedList]);

    const parseItem = (item: string): [string, string] => {
        const [source, target] = item.split(" - ");
        return [source || "", target || ""];
    };

    const handleEdit = (index: number, newSource: string, newTarget: string) => {
        const newList = [...list];
        newList[index] = `${newSource} - ${newTarget}`;
        setList(newList);
        props.onListChange(newList);
    };

    const handleAdd = () => {
        const defaultSource = props.classes.length > 0 ? props.classes[0].name : "";
        const defaultTarget = props.classes.length > 0 ? props.classes[0].name : "";
        const newList = [...list, `${defaultSource} - ${defaultTarget}`];
        setList(newList);
        props.onListChange(newList);
    };

    const handleRemove = (index: number) => {
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
        props.onListChange(newList);
    };

    return (
        <Fieldset legend={props.legend || "Seleziona elementi"} style={{ width: "100%" }}>
            {list.map((item, index) => {
                const [source, target] = parseItem(item);
                return (
                    <Group key={index} mb="xs" align="center">
                        <NativeSelect
                            data={props.classes.map((c) => c.name)}
                            value={source}
                            onChange={(e) => handleEdit(index, e.currentTarget.value, target)}
                            style={{ flex: 1 }}
                        />
                        <Text>→</Text>
                        <NativeSelect
                            data={props.classes.map((c) => c.name)}
                            value={target}
                            onChange={(e) => handleEdit(index, source, e.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <IconTrashFilled color="red" style={{ cursor: "pointer" }} onClick={() => handleRemove(index)} />
                    </Group>
                );
            })}
            <Center mt="md">
                <Button
                    variant="light"
                    color="green"
                    onClick={handleAdd}
                    rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}
                    mt="sm"
                    disabled={props.classes.length === 0}
                >
                    Add new forbidden pair of classes
                </Button>
            </Center>
        </Fieldset>
    );
}

export default SolutionCreator;