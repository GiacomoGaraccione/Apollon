import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Card, Flex, Text, Modal, Fieldset, Grid } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconExclamationCircleFilled } from "@tabler/icons-react";
import { Course, Exercise, Solution } from "../../Utils/Models";
import { useParams } from "react-router-dom";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import "csshake/dist/csshake.css"

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: true,
    enablePopups: true
}

function SolutionViewer() {
    const { courseId } = useParams()
    const user = useContext(UserContext)
    const [completedExercises, setCompletedExercises] = useState<Exercise[]>([])
    const [currentSolution, setCurrentSolution] = useState<Solution | null>(null)
    const [opened = false, { open, close }] = useDisclosure(false)
    const [loadModal, setLoadModal] = useState(false)
    const apollonRef = useRef<HTMLDivElement>(null)
    const [editor, setEditor] = useState<ApollonEditor | null>(null)

    useEffect(() => {
        if (courseId && user) {
            API.getCourseInfo(courseId).then((course: Course) => {
                API.getStudentCompletedExercises(courseId, user.username).then((ce) => {
                    let completed: any[] = course.exercises.
                        filter((e: Exercise) => e.gamified && e.visible).map((ex: any) => {
                            let exercise = ce.find((e: Exercise) => e.exerciseId === ex.exerciseId)
                            if (exercise) {
                                return ex
                            }
                        }).filter((e: any) => e !== undefined)
                    setCompletedExercises(completed)
                })
            })

        }
    }, [])

    useEffect(() => {
        if (opened && currentSolution) {
            setLoadModal(true)
            const timer = setTimeout(async () => {
                if (editor) {
                    editor.destroy()
                }
                if (apollonRef.current) {
                    let ed = new ApollonEditor(apollonRef.current, { ...options, type: "ClassDiagram" })
                    await ed.nextRender;
                    if (currentSolution.model) {
                        ed.model = currentSolution.model
                    }
                    setEditor(ed)
                    setLoadModal(false)
                }
            }, 350)

            return () => {
                clearTimeout(timer)
            }
        }
    }, [opened, currentSolution])

    return (
        <>
            <Fieldset legend="Solution Viewer" style={{ marginTop: "1em" }}>
                <Text>Here you can check the solutions of the exercises you have completed.</Text>
                <Grid justify="center" align="center">
                    <Grid.Col span={12}>
                        {completedExercises.length === 0 ? (
                            <Alert icon={<IconExclamationCircleFilled size={16} />} title="No completed exercises" color="yellow">
                                You have not completed any exercises yet.
                            </Alert>
                        ) : (
                            <Flex direction="column" gap={10} style={{ width: "100%" }}>
                                {completedExercises
                                    .filter((ex) => ex.visible)
                                    .flatMap((exercise) =>
                                        exercise.solutions.map((solution, idx) => (
                                            <Card key={solution.solutionId} shadow="sm" padding="lg" radius="md" withBorder
                                                style={{ width: '100%', margin: 'auto', cursor: 'pointer', position: 'relative', overflow: 'hidden', }}
                                                onClick={() => {
                                                    setCurrentSolution(solution)
                                                    open()
                                                }}
                                            >
                                                <Flex align="center" justify="space-between">
                                                    <div>
                                                        <Text color="green">{exercise.title} - Solution n. {idx + 1}</Text>
                                                        <Flex align="center" gap="xs">
                                                            {exercise.gamified && <>
                                                                <Text size="sm">Level: {exercise.level}</Text>
                                                                <Text size="sm" >Reward: {exercise.experience} XP</Text>
                                                            </>}
                                                        </Flex>
                                                    </div>
                                                </Flex>
                                            </Card>
                                        ))
                                    )
                                }
                            </Flex>
                        )}
                    </Grid.Col>
                </Grid>
            </Fieldset>

            {completedExercises && currentSolution && <Modal closeOnEscape={false} opened={opened} onClose={close} fullScreen transitionProps={{ transition: 'fade', duration: 300 }} >
                <div ref={apollonRef} id="apollon" className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
            </Modal>}
        </>
    )
}

export default SolutionViewer