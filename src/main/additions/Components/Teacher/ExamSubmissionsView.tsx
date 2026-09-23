import React, { useEffect, useState, useRef } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Stack, Skeleton, Badge } from "@mantine/core";
import API from "../../API";
import { IconDownload, IconExclamationCircleFilled, IconInfoCircle } from "@tabler/icons-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ExamCall, ExamExercise, ExamSubmission } from "../../Utils/Models";
import { useParams } from "react-router-dom";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: true,
    enablePopups: true
}

function ExamSubmissionsView() {
    const { courseId, examId, exerciseId } = useParams()
    const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
    const [exercise, setExercise] = useState<ExamExercise | null>(null)
    const [load, setLoad] = useState(true)
    const [currentSubmission, setCurrentSubmission] = useState<ExamSubmission | null>(null)
    const [showDiagram, { open: openDiagram, close: closeDiagram }] = useDisclosure(false)
    const [editor, setEditor] = useState<ApollonEditor | null>(null)
    const [loadModal, setLoadModal] = useState(false)
    const apollonRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (courseId && examId && exerciseId) {
            API.getExamCall(courseId, examId).then((exam: ExamCall) => {
                setExercise(exam.exercises.find((e) => e.exerciseId === exerciseId) || null)
            })
            API.getExamSubmissions(courseId, examId, exerciseId).then((subs) => {
                setLoad(false)
                setSubmissions(subs)
            })
        }
    }, [])

    useEffect(() => {
        if (showDiagram && currentSubmission) {
            setLoadModal(true)
            const timer = setTimeout(async () => {
                if (editor) {
                    editor.destroy()
                }
                if (apollonRef.current && exercise) {
                    let ed = new ApollonEditor(apollonRef.current, { ...options, type: exercise.exType })
                    await ed.nextRender;
                    if (currentSubmission.model) {
                        ed.model = JSON.parse(currentSubmission.model)
                    }
                    setEditor(ed)
                    setLoadModal(false)
                }
            }, 350)

            return () => {
                clearTimeout(timer)
            }
        }
    }, [showDiagram, currentSubmission])

    const downloadSubmissions = async () => {
        if (!exercise || submissions.length === 0) return
        try {
            const zip = new JSZip()
            for (const sub of submissions) {
                if (!sub.model) continue
                const modelStr = typeof sub.model === "string" ? sub.model : JSON.stringify(sub.model)
                zip.file(`${sub.username}.json`, modelStr)
                const tempContainer = document.createElement("div")
                tempContainer.style.position = "absolute"
                tempContainer.style.left = "-9999px"
                tempContainer.style.width = "800px"
                tempContainer.style.height = "600px"
                document.body.appendChild(tempContainer)
                const ed = new ApollonEditor(tempContainer, { ...options, type: exercise.exType as any })
                await ed.nextRender
                const model = typeof sub.model === "string" ? JSON.parse(sub.model) : sub.model
                ed.model = model
                await ed.nextRender
                const { svg } = await ed.exportAsSVG({ margin: 5, keepOriginalSize: true })
                zip.file(`${sub.username}.svg`, svg)
                ed.destroy()
                document.body.removeChild(tempContainer)
            }
            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `${exercise.title} - submissions.zip`)
        } catch (error) {
            console.error("Error downloading submissions:", error)
        }
    }

    return (<>
        <Skeleton visible={load} height={50} width="100%" h="100%" style={{ marginBottom: 20 }}>
            <Fieldset legend="Student Submissions" style={{ width: "100%" }}>
                {submissions.length > 0 && (
                    <Center mb="md">
                        <Button leftSection={<IconDownload size={16} />} variant="light" color="blue" onClick={downloadSubmissions}>Download all submissions</Button>
                    </Center>
                )}
                {submissions.length > 0 ? (
                    <Flex direction="column" gap={10} style={{ width: "100%", maxHeight: "80vh", overflowY: "auto", flex: "1 1 auto" }}>
                        {submissions.map((submission, index) => (
                            <Card key={index} shadow="xs" padding="lg" style={{ width: "100%", margin: 'auto', cursor: "pointer", position: "relative", minHeight: "80px", height: "80px", flexShrink: 0 }}
                                onClick={() => {
                                    setCurrentSubmission(submission)
                                    openDiagram()
                                }}>
                                <Flex justify="space-between" align="center" style={{ height: "100%" }}>
                                    <Text w={300} size="md">{submission.username}</Text>
                                    <Text w={300} size="sm" c="dimmed">Last saved version: {submission.lastUpdated}</Text>
                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                ) : (<Alert icon={<IconExclamationCircleFilled size={16} />} title="No submissions found" color="yellow">
                    No students have submitted a diagram for this exercise yet.
                </Alert>)}
            </Fieldset>
        </Skeleton>
        {exercise && currentSubmission && <Modal closeOnEscape={false} opened={showDiagram} onClose={closeDiagram} fullScreen transitionProps={{ transition: 'fade', duration: 300 }}>
            <Skeleton visible={loadModal} height="100%" >
                <Stack align="center" justify="center">
                    <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >{currentSubmission.username} - Last saved: {currentSubmission.lastUpdated}</Badge>
                    <div ref={apollonRef} id="apollon" className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
                </Stack>
            </Skeleton>
        </Modal>}
    </>)
}

export default ExamSubmissionsView
