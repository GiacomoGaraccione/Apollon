import React, { useState, useEffect } from 'react'
import { IconCheck, IconDeviceGamepad2, IconEye, IconInfoCircle, IconSquareRoundedPlusFilled } from '@tabler/icons-react';
import { Badge, Button, Center, Checkbox, Fieldset, Group, NativeSelect, Notification, NumberInput, SimpleGrid, Text, Textarea, TextInput, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import API from '../../API';
import { Exercise } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';
import "./style.scss"
import { UMLDiagramType } from '../../../typings';


function ExerciseCreator() {
    const { courseId } = useParams()
    const [exercise, setExercise] = useState<Exercise | undefined>(undefined)

    useEffect(() => {
        if (courseId) {
            let ex = new Exercise("", "", "", 1, 0, true, false, UMLDiagramType.ClassDiagram, null, [])
            setExercise(ex)
        }
    }, [])

    return (<>
        <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
        <Fieldset legend="Create Exercise">
            {exercise && <ExerciseForm exercise={exercise} mode={"create"} />}
        </Fieldset>
    </>)
}

function ExerciseEditor() {
    const { courseId, exerciseId } = useParams()
    const [exercise, setExercise] = useState<Exercise | undefined>(undefined)

    useEffect(() => {
        if (courseId) {
            API.getCourse(courseId).then((c) => {
                const ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                }
            })
        }
    }, [])

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Fieldset legend={`Edit Exercise ${exercise ? exercise.title : ""}`}>
                {exercise && <ExerciseForm exercise={exercise} mode={"edit"} />}
            </Fieldset>
        </>
    )
}


function ExerciseForm(props: { exercise: Exercise, mode: string }) {
    const [exercise, setExercise] = useState<Exercise>(props.exercise)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successNotif, setSuccessNotif] = useState(false)
    let { courseId } = useParams()
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            title: exercise.title,
            description: exercise.description,
            level: exercise.level,
            experience: exercise.experience,
            visible: exercise.visible,
            gamified: exercise.gamified,
            exType: exercise.exType
        },
        validate: (values) => ({
            title: values.title.length < 3 ? "Title must be at least 3 characters" : null,
            description: values.description.length < 10 ? "Description must be at least 10 characters" : null,
            level: values.level < 1 || values.level > 10 ? "Level must be between 1 and 1" : null,
            experience: values.experience <= 0 ? "Experience must be greater than 0" : null,
        })
    })



    return (
        <>
            <form onSubmit={form.onSubmit((values) => {
                setLoading(true)
                if (courseId) {
                    console.log(values)
                    if (props.mode === "create") {
                        API.addExercise(courseId, values.title, values.description, values.level, values.experience, values.visible, values.gamified, values.exType).then(() => {
                            setLoading(false)
                            setSuccessNotif(true)
                            navigate(`/teacher/courses/${courseId}`)
                            setTimeout(() => {
                                setSuccessNotif(false)
                            }, 3000)
                        }).catch((err: any) => {
                            setLoading(false)
                            setError(err.message ? err.message : err.error ? err.error : "Error while creating a new exercise. Please reload the page.")
                            setTimeout(() => {
                                setError(null)
                            }, 3000)
                        })
                    } else {
                        API.updateExercise(courseId, props.exercise.exerciseId, values.title, values.description, values.level, values.experience, values.visible, values.gamified, values.exType).then(() => {
                            setLoading(false)
                            setSuccessNotif(true)
                            navigate(`/teacher/courses/${courseId}`)
                            setTimeout(() => {
                                setSuccessNotif(false)
                            }, 3000)
                        }).catch((err: any) => {
                            setLoading(false)
                            setError(err.message ? err.message : err.error ? err.error : "Error while editing an exercise. Please reload the page.")
                            setTimeout(() => {
                                setError(null)
                            }, 3000)
                        })
                    }
                }
            })} >
                <TextInput label="Title" placeholder="Title" {...form.getInputProps("title")} />
                <Textarea label="Description" placeholder="Description" {...form.getInputProps("description")} />
                <NumberInput label="Level" placeholder="Level must be between 1 and 10" {...form.getInputProps("level")} min={1} max={10} />
                <NumberInput label="Experience" placeholder="Experience" {...form.getInputProps("experience")} min={1} />
                <SimpleGrid cols={3} mt="md">
                    <Checkbox.Card className='checkbox-root' radius="md"  {...form.getInputProps("visible", { type: "checkbox" })} >
                        <Group wrap="nowrap" align="center">
                            <IconEye size={32} />
                            <div>
                                <Text className='checkbox-label'>Visible</Text>
                                <Text className='checkbox-description'>Can the exercise be attempted by students?</Text>
                            </div>
                        </Group>
                    </Checkbox.Card>
                    <Checkbox.Card className='checkbox-root' radius="md"  {...form.getInputProps("gamified", { type: "checkbox" })} >
                        <Group wrap="nowrap" align="center">
                            <IconDeviceGamepad2 size={32} />
                            <div>
                                <Text className='checkbox-label'>Gamified</Text>
                                <Text className='checkbox-description'>Is the exercise gamified?</Text>
                            </div>
                        </Group>
                    </Checkbox.Card>
                    <NativeSelect {...form.getInputProps("exType")} label="Diagram Type" data={[UMLDiagramType.ClassDiagram, UMLDiagramType.UseCaseDiagram, UMLDiagramType.DeploymentDiagram]} />
                </SimpleGrid>

                <Center mt="md">
                    <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                        {props.mode === "create" ? "Create Exercise" : "Edit Exercise"}
                    </Button>
                </Center>
            </form>
            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Exercise creation successful!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Exercise creation in progress...</Text>
            </Notification>}
        </>
    )
}

export { ExerciseCreator, ExerciseForm, ExerciseEditor }