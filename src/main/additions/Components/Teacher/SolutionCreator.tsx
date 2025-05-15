import React, { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image } from "@mantine/core";
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
import { Exercise } from "../../Utils/Models";
import { useParams, useNavigate } from "react-router-dom";
import { IconDownload, IconEdit, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrashFilled, IconUpload } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { ReferenceBuilder } from "../../Utils/UMLMatcherTypes";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false
}


function SolutionCreator() {
    const { courseId, exerciseId } = useParams()
    const [exercise, setExercise] = useState<Exercise | undefined>(undefined)
    const [activeTab, setActiveTab] = useState<string | null>("")
    const [editor, setEditor] = useState<ApollonEditor>()
    const [opened, { open, close }] = useDisclosure(false)

    useEffect(() => {
        if (courseId && exerciseId) {
            API.getCourse(courseId).then((c) => {
                const ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    console.log(ex)
                    setExercise(ex)
                }
            })
        }
    }, [])

    useEffect(() => {
        try {
            if (activeTab === "modeler") {
                let cont = document.getElementById("apollon")
                if (cont) {
                    setEditor(new ApollonEditor(cont, { ...options, type: "ClassDiagram" }))
                }
            }
        } catch (error) {

        }
    }, [activeTab])

    const saveSolution = async () => {
        if (editor) {
            let builder = new ReferenceBuilder(editor.model)
            let ref = builder.buildReference()
            let svg = await editor.exportAsSVG({ margin: 5, keepOriginalSize: true })
            if (courseId && exerciseId) {
                API.addSolution(courseId, exerciseId, ref, editor.model, svg)
            }
        }
    }

    return (
        <>
            {exercise && exercise.solutions.length > 0 && (
                <>
                    <Flex wrap="wrap" justify="center" gap="md">
                        {exercise.solutions.map((solution, index) => {
                            console.log(solution)
                            let svgData = solution.image.svg;
                            let svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
                            return (
                                <>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                                        <Card.Section>
                                            <Image src={svgBase64} alt="Solution SVG" height={250} width={250} />
                                        </Card.Section>
                                        <Text>
                                            Solution n. {index + 1}
                                        </Text>
                                        <Center mt="md">
                                            <Button variant="light" color="lime" rightSection={<IconEdit size={16} stroke={1.5} />} mt="sm">Edit solution</Button>
                                            <Button variant="light" color="red" rightSection={<IconTrashFilled size={16} stroke={1.5} />} mt="sm" ml="md">Delete solution</Button>
                                        </Center>
                                    </Card>
                                </>
                            )
                        })}
                    </Flex>
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
                            {activeTab === "modeler" &&
                                <>
                                    <div id="apollon"></div>
                                </>
                            }
                        </Tabs.Panel>
                        <Tabs.Panel value="reference">
                            b
                        </Tabs.Panel>
                    </Tabs>
                    <Center mt="md">
                        <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => { saveSolution() }} >
                            Save solution
                        </Button>
                    </Center>
                </Fieldset>
            </Modal>
        </>
    )
}

export default SolutionCreator;