import React, { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, Center, Text, Modal, Fieldset, Tabs, Grid, Stack, Group } from "@mantine/core";
import API from "../../API";
import { ApollonMode, UMLModel } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import JSZip from "jszip";
import { Exercise, Solution } from "../../Utils/Models";
import { useParams } from "react-router-dom";
import { IconArrowLeft, IconArrowRight, IconCloudUpload, IconDownload, IconEdit, IconExclamationCircle, IconExclamationCircleFilled, IconSquareRoundedPlusFilled, IconTrash, IconTrashFilled, IconUpload, IconX, IconZoomCheckFilled } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Carousel } from "@mantine/carousel";
import { ReferenceAssociation, ClassDiagramReferenceBuilder, ReferenceClass, ClassDiagramReferenceSolution } from "../../Utils/ClassDiagram/MatcherTypes";
import { ClassDiagramStructureBuilderFromReference } from "../../Utils/ClassDiagram/StructureBuilder";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { ClassDiagramReferenceFormModal } from "./SolutionCreators/ClassDiagram/ClassDiagramCreator";
import { ReferenceActor, ReferenceSystem, ReferenceUseCase, UseCaseDiagramReferenceBuilder, UseCaseDiagramReferenceSolution } from "../../Utils/UseCaseDiagram/MatcherTypes";
import { UseCaseDiagramReferenceFormModal } from "./SolutionCreators/UseCaseDiagram/UseCaseDiagramCreator";
import UseCaseDiagramStructureBuilderFromReference from "../../Utils/UseCaseDiagram/StructureBuilder";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false
}

function SolutionCreator() {
    const { courseId, exerciseId } = useParams()
    const [exercise, setExercise] = useState<Exercise | undefined>(undefined)
    const [editor, setEditor] = useState<ApollonEditor | undefined>()
    const [openDelete, setOpenDelete] = useState(false)
    const [currentSolution, setCurrentSolution] = useState<Solution | undefined>(undefined)
    const [currentReference, setCurrentReference] = useState<ClassDiagramReferenceSolution | undefined>(undefined)
    const [currentUCReference, setCurrentUCReference] = useState<UseCaseDiagramReferenceSolution | undefined>(new UseCaseDiagramReferenceSolution())
    const [successUpload, setSuccessUpload] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [openedModel, { open: openModel, close: closeModel }] = useDisclosure(false)
    const [openedReference, { open: openReference, close: closeReference }] = useDisclosure(false)
    const [openedUpload, { open: openUpload, close: closeUpload }] = useDisclosure(false)
    const [preview, setPreview] = useState(false)
    const apollonRef = useRef<HTMLDivElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)

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
        return () => {
            if (editor) {
                editor.destroy?.();
            }
        };
    }, [])

    useEffect(() => {
        if (openedModel) {
            const timer = setTimeout(async () => {
                if (editor) {
                    editor.destroy?.()
                    setEditor(undefined)
                }
                if (exercise) {
                    if (apollonRef.current) {
                        let ed = new ApollonEditor(apollonRef.current, { ...options, type: exercise.exType as any })
                        await ed.nextRender
                        if (currentSolution?.model) {
                            ed.model = currentSolution.model as UMLModel
                        }
                        setEditor(ed)
                    }
                }
            }, 350)

            return () => {
                clearTimeout(timer)
            }
        }
    }, [openedModel])


    useEffect(() => {
        setCurrentReference(currentSolution?.reference)
    }, [currentSolution])

    const confirmPreview = () => {
        if (exercise) {
            let builder
            if (exercise.exType === "ClassDiagram" && currentReference) {
                builder = new ClassDiagramStructureBuilderFromReference(currentReference)
                let model = builder.createUMLStructure()
                if (previewRef.current) {
                    let ed = new ApollonEditor(previewRef.current, { ...options, type: "ClassDiagram", readonly: true })
                    ed.nextRender.then(() => {
                        ed.model = model as UMLModel
                        setEditor(ed)
                        ed.nextRender.then(() => { })
                    })
                }
            } else if (exercise.exType === "UseCaseDiagram" && currentUCReference) {
                builder = new UseCaseDiagramStructureBuilderFromReference(currentUCReference)
                let model = builder.createUMLStructure()
                if (previewRef.current) {
                    let ed = new ApollonEditor(previewRef.current, { ...options, type: "UseCaseDiagram", readonly: false })
                    ed.nextRender.then(() => {
                        ed.model = model as UMLModel
                        setEditor(ed)
                        ed.nextRender.then(() => { })
                    })
                }
            }
        }
    }

    useEffect(() => {
        if (preview) {
            confirmPreview()
        }
    }, [preview])

    const updateEx = () => {
        if (courseId && exerciseId) {
            API.getCourse(courseId).then((c) => {
                const ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                    setCurrentReference(undefined)
                    setCurrentSolution(undefined)
                    closeModel()
                    closeReference()
                    setPreview(false)
                }
            })
        }
    }

    const saveModel = async () => {
        if (editor && exercise) {
            let builder
            if (exercise.exType === "ClassDiagram") {
                builder = new ClassDiagramReferenceBuilder(editor.model as UMLModel)
                let ref = builder.buildReference()
                let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
                if (courseId && exerciseId) {
                    if (currentSolution) {
                        API.updateSolution(courseId, exerciseId, currentSolution.solutionId, builder.updateReference(currentSolution.reference), editor.model, svg).then(() => updateEx())
                    } else {
                        API.addSolution(courseId, exerciseId, ref, editor.model, svg).then(() => updateEx())
                    }
                }
            } else {
                builder = new UseCaseDiagramReferenceBuilder(editor.model as UMLModel)
                let ref = builder.buildReference()
                let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
                if (courseId && exerciseId) {
                    if (currentSolution) {
                        //API.updateSolution(courseId, exerciseId, currentSolution.solutionId, builder.updateReference(currentSolution.reference), editor.model, svg).then(() => updateEx())
                    } else {
                        API.addSolution(courseId, exerciseId, ref, editor.model, svg).then(() => updateEx())
                    }
                }
            }
        }
    }

    const saveReference = async () => {
        if (exercise && editor) {
            if (exercise.exType === "ClassDiagram" && currentReference) {
                let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
                if (courseId && exerciseId) {
                    if (!currentSolution) {
                        API.addSolution(courseId, exerciseId, currentReference, editor.model, svg).then(() => updateEx())
                    } else {
                        API.updateSolution(courseId, exerciseId, currentSolution.solutionId, currentReference, editor.model, svg).then(() => updateEx())
                    }
                }
            } else if (exercise.exType === "UseCaseDiagram" && currentUCReference) {
                let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
                if (courseId && exerciseId) {
                    if (!currentSolution) {
                        API.addSolution(courseId, exerciseId, currentUCReference, editor.model, svg).then(() => updateEx())
                    } else {
                        API.updateSolution(courseId, exerciseId, currentSolution.solutionId, currentUCReference, editor.model, svg).then(() => updateEx())
                    }
                }
            }
        }
        if (currentReference && editor) {

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
                let ref = new ClassDiagramReferenceSolution()
                ref.classes = classes
                ref.associations = []
                ref.forbiddenClasses = []
                ref.forbiddenAssociations = []
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

    const downloadSolutions = async () => {
        if (exercise && exercise.solutions.length > 0) {
            const zip = new JSZip()
            exercise.solutions.forEach((solution, index) => {
                let svgData = solution.image.svg;
                const folderName = `solution-${index + 1}.zip`;
                const solutionZip = new JSZip();
                solutionZip.file(`solution.svg`, svgData);
                solutionZip.file(`solution.json`, JSON.stringify({
                    reference: solution.reference,
                    model: solution.model
                }, null, 2));
                zip.file(folderName, solutionZip.generateAsync({ type: "blob" }));
            })
            zip.generateAsync({ type: "blob" }).then((content) => {
                const element = document.createElement("a");
                const fileURL = URL.createObjectURL(content);
                element.href = fileURL;
                element.download = `exercise-${exercise.exerciseId}-solutions.zip`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            })
        }
    }

    const handleDrop = (files: File[]) => {
        if (files.length !== 1) {
            return
        }
        const file = files[0];
        JSZip.loadAsync(file).then(async (zip) => {
            let jsonContent = ""
            let svgContent = ""

            for (const filename of Object.keys(zip.files)) {
                const fileObj = zip.files[filename];
                if (!fileObj.dir) {
                    if (filename.endsWith(".json")) {
                        jsonContent = await fileObj.async("string");
                    } else if (filename.endsWith(".svg")) {
                        svgContent = await fileObj.async("string");
                    }
                }
            }
            if (courseId && exerciseId && jsonContent && svgContent) {
                API.addSolution(courseId, exerciseId, JSON.parse(jsonContent).reference, JSON.parse(jsonContent).model, { svg: svgContent }).then(() => {
                    setSuccessUpload(true)
                    setTimeout(() => {
                        setSuccessUpload(false)
                        setUploading(false)
                        closeUpload()
                        updateEx()
                    }, 3000)
                })
            }
        }).catch((err) => {
            console.error("Error reading zip file:", err);
        });
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
                                                    openModel()
                                                }} >Edit solution in UML modeler</Button>
                                                <Button variant="light" color="lime" rightSection={<IconEdit size={16} stroke={1.5} />} mt="sm" ml="md" onClick={() => {
                                                    setCurrentSolution(solution)
                                                    setCurrentReference(solution.reference)
                                                    openReference()
                                                }} >
                                                    Edit solution with reference form
                                                </Button>
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
                    openModel()
                    setCurrentReference(undefined)
                    setCurrentSolution(undefined)
                }} >
                    Create new solution with UML modeler
                </Button>
                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" ml="md" onClick={() => {
                    openReference()
                    setCurrentReference(undefined)
                    setCurrentSolution(undefined)
                }} >
                    Create new solution with reference form
                </Button>
                <Button variant="light" color="orange" onClick={openUpload} rightSection={<IconUpload size={16} stroke={1.5} />} mt="sm" ml="md">
                    Upload solution
                </Button>
                <Button variant="light" color="cyan" onClick={() => downloadSolutions()} rightSection={<IconDownload size={16} stroke={1.5} />} mt="sm" ml="md">
                    Download all solutions
                </Button>
            </Center>

            <Modal opened={openedUpload} onClose={closeUpload}>
                {!successUpload && <Dropzone loading={uploading} onDrop={(file) => handleDrop(file)} className="dropzone" radius="md" accept={[MIME_TYPES.zip]} maxSize={30 * 1024 ** 2}>
                    <div style={{ pointerEvents: "none", cursor: "pointer" }}>
                        <Fieldset legend="Upload enrolled students">
                            <Group justify='center' align='center'>
                                <Dropzone.Accept>
                                    <IconDownload size={50} color="blue" stroke={1.5} />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                    <IconX size={50} color="red" stroke={1.5} />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                    <IconCloudUpload size={50} color="gray" stroke={1.5} />
                                </Dropzone.Idle>
                            </Group>
                            <Text ta="center" fw={700} fz="lg" mt="xl">
                                <Dropzone.Accept>File accepted</Dropzone.Accept>
                                <Dropzone.Reject>File not valid</Dropzone.Reject>
                                <Dropzone.Idle>Upload new solution</Dropzone.Idle>
                            </Text>
                            <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                Drag&apos;n&apos;drop a ZIP folder to upload a new solution. The file must be a valid solution exported from the UML modeler.
                            </Text>
                        </Fieldset>
                    </div>
                </Dropzone>}
                {successUpload && <Alert variant="light" title="Success!" color="green" icon={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} >
                    Your solution has been uploaded successfully!
                </Alert>}
            </Modal>

            {exercise && exercise.exType === "ClassDiagram" && <ClassDiagramReferenceFormModal openedReference={openedReference} closeReference={closeReference} setPreview={setPreview} preview={preview} currentReference={currentReference!} addClass={addClass} addAssociation={addAssociation}
                addForbiddenClasses={addForbiddenClasses} addForbiddenAssociations={addForbiddenAssociations} saveReference={saveReference} previewRef={previewRef}
            />}

            {exercise && exercise.exType === "UseCaseDiagram" && <UseCaseDiagramReferenceFormModal openedReference={openedReference} closeReference={closeReference} setPreview={setPreview} preview={preview} currentReference={currentUCReference!}
                saveReference={saveReference} previewRef={previewRef} setCurrentReference={setCurrentUCReference} />}

            <Modal opened={openedModel} onClose={() => {
                if (editor) {
                    editor.destroy?.()
                    setEditor(undefined)
                }
                closeModel()
            }} fullScreen transitionProps={{ transition: 'fade', duration: 300 }} >
                <Fieldset legend="Solution Creator" style={{ width: "100%" }}>
                    <div ref={apollonRef} id="apollon" style={{ height: "80vh" }} ></div>
                    <Center mt="md">
                        <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => { saveModel() }} >
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

export default SolutionCreator;