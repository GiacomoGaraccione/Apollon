import React, { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Grid, Stack, RingProgress, Divider, Skeleton } from "@mantine/core";
import API from "../../API";
import { IconDownload, IconExclamationCircleFilled } from "@tabler/icons-react";
import { Course, Exercise } from "../../Utils/Models";
import { useParams } from "react-router-dom";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import "csshake/dist/csshake.css"
import 'svg2pdf.js'
import JSZip from 'jszip'
import { MatchingElementsList, SemanticErrorsList, SyntaxErrorsList } from "../Common/FeedbackLists";
import { saveAs } from "file-saver"
import * as XLSX from 'xlsx'

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: true,
    enablePopups: true
}

function DiagramView() {
    const { courseId, exerciseId } = useParams()
    const [diagrams, setDiagrams] = useState<any[]>([])
    const [exercise, setExercise] = useState<Exercise | null>(null)
    const [load, setLoad] = useState(true)
    const [currentDiagram, setCurrentDiagram] = useState<any | null>(null)
    const [showDiagram, { open: openDiagram, close: closeDiagram }] = useDisclosure(false)
    const [editor, setEditor] = useState<ApollonEditor | null>(null)
    const [loadModal, setLoadModal] = useState(false)
    const apollonRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (courseId && exerciseId) {
            API.getCourse(courseId).then((course: Course) => {
                if (course) {
                    setExercise(course.exercises.find((e) => e.exerciseId === exerciseId) || null)
                    API.getStudentDiagrams(courseId, exerciseId).then((d) => {
                        setLoad(false)
                        console.log(d)
                        setDiagrams(d)
                    })
                }
            })
        }
    }, [])

    useEffect(() => {
        if (showDiagram && currentDiagram) {
            setLoadModal(true)
            const timer = setTimeout(async () => {
                if (editor) {
                    editor.destroy()
                }
                if (apollonRef.current) {
                    let ed = new ApollonEditor(apollonRef.current, { ...options, type: "ClassDiagram" })
                    await ed.nextRender;
                    if (currentDiagram.model) {
                        ed.model = JSON.parse(currentDiagram.model)
                    }
                    setEditor(ed)
                    setLoadModal(false)
                }
            }, 350)

            return () => {
                clearTimeout(timer)
            }
        }
    }, [showDiagram, currentDiagram])

    const downloadSources = () => {
        if (exercise && diagrams) {
            try {
                let zip = new JSZip()
                Promise.all(
                    diagrams.map(async (diagram: any) => {
                        let tempContainer = document.createElement("div")
                        tempContainer.style.position = "absolute"
                        tempContainer.style.left = "-9999px"
                        tempContainer.style.width = "800px"
                        tempContainer.style.height = "600px"
                        document.body.appendChild(tempContainer);
                        let ed = new ApollonEditor(tempContainer, { ...options, type: "ClassDiagram" });
                        await ed.nextRender;
                        let model = JSON.parse(diagram.model);
                        Object.keys(model.elements).forEach((key) => {
                            let element = model.elements[key];
                            element.strokeColor = "#000000";
                            element.textColor = "#000000";
                            element.fillColor = "#FFFFFF";
                        });
                        Object.keys(model.relationships).forEach((key) => {
                            let element = model.relationships[key];
                            element.strokeColor = "#000000";
                            element.textColor = "#000000";
                        });
                        ed.model = model;
                        await ed.nextRender;
                        let { svg } = await ed.exportAsSVG({ margin: 5, keepOriginalSize: true });
                        zip?.file(`${diagram.username}.svg`, svg);
                        zip?.file(`${diagram.username}.json`, JSON.stringify(model, null, 2));
                        ed.destroy();
                        document.body.removeChild(tempContainer);
                    })
                ).then(() => {
                    zip.generateAsync({ type: "blob" })
                        .then((content) => saveAs(content, exercise.title + " - diagrams.zip"));
                }).catch((error) => {
                    console.error(error);
                });
            } catch (error) {
                console.error("Error downloading diagrams:", error);
            }
        }
    }

    const downloadStats = () => {
        if (exercise && diagrams) {
            let workbook = XLSX.utils.book_new();
            let statsData = [
                ["Username", "Correctness", "Checks", "Experience", "Timestamp", "Class Completeness", "Attribute Completeness", "Association Completeness", "Syntax Errors", "Semantic Errors"],
            ]
            let syntaxErrorsData = [
                ["Username", "Type", "Message"],
            ]
            let semanticErrorsData = [
                ["Username", "Type", "Message", "Info"],
            ]
            let resultsData = [
                ["Username", "ReferenceElement", "MatchingElement", "Type"],
            ]
            diagrams.forEach((diagram: any) => {
                let results = JSON.parse(diagram.results)
                let syntaxErrors = JSON.parse(diagram.syntax_errors);
                let semanticErrors = JSON.parse(diagram.semantic_errors);
                statsData.push([
                    diagram.username,
                    diagram.correctness,
                    diagram.checks,
                    diagram.experience,
                    diagram.timestamp,
                    results.classCompleteness,
                    results.attributeCompleteness,
                    results.associationCompleteness,
                    syntaxErrors.length,
                    semanticErrors.length
                ])
                results.matchingClasses.forEach((cls: any) => {
                    resultsData.push([
                        diagram.username,
                        cls.referenceClass,
                        cls.diagramClass.name,
                        "Class"
                    ])
                    cls.matchingAttributes.forEach((attr: any) => {
                        resultsData.push([
                            diagram.username,
                            `${cls.referenceClass}.${attr.referenceAttribute}`,
                            `${cls.diagramClass.name}.${attr.diagramAttribute.name}`,
                            "Attribute"
                        ])
                    })
                })
                results.matchingAssociations.forEach((assoc: any) => {
                    resultsData.push([
                        diagram.username,
                        `${assoc.source_pair.referenceInfo.referenceClass.name} - ${assoc.target_pair.referenceInfo.referenceClass.name}`,
                        `${assoc.source_pair.diagramInfo.name} - ${assoc.target_pair.diagramInfo.name}`,
                        `Association (${assoc.diagramAssociation.type})`
                    ])
                })

                syntaxErrors.forEach((error: any) => {
                    syntaxErrorsData.push([diagram.username, error.type, error.message])
                })
                semanticErrors.forEach((error: any) => {
                    let { type, message, ...rest } = error
                    semanticErrorsData.push([diagram.username, type, message, JSON.stringify(rest)])
                })
            })
            let statsSheet = XLSX.utils.aoa_to_sheet(statsData)
            let syntaxErrorsSheet = XLSX.utils.aoa_to_sheet(syntaxErrorsData)
            let semanticErrorsSheet = XLSX.utils.aoa_to_sheet(semanticErrorsData)
            let resultsSheet = XLSX.utils.aoa_to_sheet(resultsData)
            XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistics")
            XLSX.utils.book_append_sheet(workbook, syntaxErrorsSheet, "Syntax Errors")
            XLSX.utils.book_append_sheet(workbook, semanticErrorsSheet, "Semantic Errors")
            XLSX.utils.book_append_sheet(workbook, resultsSheet, "Results")
            XLSX.writeFile(workbook, `${exercise.title} - statistics.xlsx`)
        }
    }

    return (<>
        <Skeleton visible={load} height={50} width="100%" h="100%" style={{ marginBottom: 20 }}>
            <Fieldset legend="Student Diagrams" style={{ width: "100%" }}>
                {diagrams.length > 0 ? (
                    <>
                        <Center>
                            <Button leftSection={<IconDownload size={16} />} variant="light" color="blue" onClick={downloadSources}>Download all diagrams</Button>
                            <Button leftSection={<IconDownload size={16} />} variant="light" color="blue" onClick={downloadStats} style={{ marginLeft: 10 }}>Download statistics</Button>
                        </Center>
                        <Flex direction="column" gap={10} style={{ width: "100%", maxHeight: "80vh", overflowY: "auto", flex: "1 1 auto" }}>
                            <>
                                <Divider my="md" />
                                {diagrams.map((diagram, index) => (
                                    <Card key={index} shadow="xs" padding="lg" style={{ width: "100%", margin: 'auto', cursor: "pointer", position: "relative", minHeight: "80px", height: "80px", flexShrink: 0 }}
                                        onClick={async () => {
                                            setCurrentDiagram({ ...diagram, results: JSON.parse(diagram.results), syntax_errors: JSON.parse(diagram.syntax_errors), semantic_errors: JSON.parse(diagram.semantic_errors) })
                                            openDiagram()
                                        }}>
                                        <Flex justify="space-between" align="center" style={{ height: "100%" }}>
                                            <Text w={300} size="md">{diagram.username}</Text>
                                            <Text w={300} size="sm" color="dimmed">Last saved version: {diagram.timestamp}</Text>
                                            <Text w={300} size="sm" color="dimmed">{diagram.checks} checks</Text>
                                        </Flex>
                                    </Card>
                                ))}
                            </>
                        </Flex>
                    </>
                ) : (<Alert icon={<IconExclamationCircleFilled size={16} />} title="No diagrams found" color="yellow">
                    No diagrams have been submitted for this exercise yet.
                </Alert>)}
            </Fieldset>
        </Skeleton>
        {exercise && currentDiagram && <Modal opened={showDiagram} onClose={closeDiagram} fullScreen transitionProps={{ transition: 'fade', duration: 300 }}>
            <Skeleton visible={loadModal} height="100%" >
                <Stack align="center" justify="center">
                    {exercise.gamified && <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                        <Grid.Col span={3}>
                            <Center>
                                <Stack align="center">
                                    <RingProgress sections={[{ value: currentDiagram.correctness, color: "green" }]} label={<Text color="green" ta="center" size="xl">{currentDiagram.correctness} %</Text>} />
                                    <Text size="md" color="green">Exercise Completeness</Text>
                                </Stack>
                            </Center>
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <Center>
                                <SyntaxErrorsList syntaxErrors={currentDiagram.syntax_errors} />
                            </Center>
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <SemanticErrorsList semanticErrors={currentDiagram.semantic_errors} />
                        </Grid.Col>
                        <Grid.Col span={3}>
                            <MatchingElementsList results={currentDiagram.results} />
                        </Grid.Col>
                    </Grid>}
                    <div ref={apollonRef} id="apollon" className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
                </Stack>
            </Skeleton>
        </Modal>}
    </>)
}

export default DiagramView
