import React, { useState, useEffect } from 'react'
import { IconCheck, IconInfoCircle, IconSquareRoundedPlusFilled } from '@tabler/icons-react';
import { Badge, Button, Center, Fieldset, NativeSelect, Notification, Text, Textarea, TextInput, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import API from '../../API';
import { ExamExercise } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';
import "./style.scss"
import { UMLDiagramType } from '../../../typings';


function ExamExerciseCreator() {
    const { courseId, examId } = useParams()

    return (<>
        <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Exam call ID: {examId}</Badge>
        <Fieldset legend="Create Exam Exercise">
            <ExamExerciseForm mode="create" />
        </Fieldset>
    </>)
}

function ExamExerciseEditor() {
    const { courseId, examId, exerciseId } = useParams()
    const [exercise, setExercise] = useState<ExamExercise | undefined>(undefined)

    useEffect(() => {
        if (courseId && examId) {
            API.getExamCall(courseId, examId).then((exam) => {
                const ex = exam.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                }
            })
        }
    }, [])

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Exam call ID: {examId}</Badge>
            <Fieldset legend={`Edit Exercise ${exercise ? exercise.title : ""}`}>
                {exercise && <ExamExerciseForm mode="edit" exercise={exercise} />}
            </Fieldset>
        </>
    )
}

function ExamExerciseForm(props: { mode: "create" | "edit", exercise?: ExamExercise }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successNotif, setSuccessNotif] = useState(false)
    const { courseId, examId } = useParams()
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            title: props.exercise?.title || "",
            description: props.exercise?.description || "",
            exType: props.exercise?.exType || UMLDiagramType.ClassDiagram,
        },
        validate: (values) => ({
            title: values.title.length < 3 ? "Title must be at least 3 characters" : null,
            description: values.description.length < 10 ? "Description must be at least 10 characters" : null,
        })
    })

    return (
        <>
            <form onSubmit={form.onSubmit((values) => {
                setLoading(true)
                if (courseId && examId) {
                    if (props.mode === "create") {
                        API.addExamExercise(courseId, examId, values.title, values.description, values.exType).then(() => {
                            setLoading(false)
                            setSuccessNotif(true)
                            navigate(`/teacher/courses/${courseId}/exams/${examId}`)
                            setTimeout(() => setSuccessNotif(false), 3000)
                        }).catch((err: any) => {
                            setLoading(false)
                            setError(err.message ? err.message : err.error ? err.error : "Error while creating a new exercise. Please reload the page.")
                            setTimeout(() => setError(null), 3000)
                        })
                    } else if (props.exercise) {
                        API.updateExamExercise(courseId, examId, props.exercise.exerciseId, values.title, values.description, values.exType).then(() => {
                            setLoading(false)
                            setSuccessNotif(true)
                            navigate(`/teacher/courses/${courseId}/exams/${examId}`)
                            setTimeout(() => setSuccessNotif(false), 3000)
                        }).catch((err: any) => {
                            setLoading(false)
                            setError(err.message ? err.message : err.error ? err.error : "Error while editing the exercise. Please reload the page.")
                            setTimeout(() => setError(null), 3000)
                        })
                    }
                }
            })} >
                <TextInput label="Title" placeholder="Title" {...form.getInputProps("title")} />
                <Textarea label="Description" placeholder="Description" {...form.getInputProps("description")} />
                <NativeSelect {...form.getInputProps("exType")} label="Diagram Type" data={[UMLDiagramType.ClassDiagram, UMLDiagramType.UseCaseDiagram, UMLDiagramType.DeploymentDiagram]} />

                {error && <Text color="red" mt="sm">{error}</Text>}

                <Center mt="md">
                    <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                        {props.mode === "create" ? "Create Exercise" : "Edit Exercise"}
                    </Button>
                </Center>
            </form>
            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Exercise {props.mode === "create" ? "creation" : "edit"} successful!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Exercise {props.mode === "create" ? "creation" : "edit"} in progress...</Text>
            </Notification>}
        </>
    )
}

export { ExamExerciseCreator, ExamExerciseEditor, ExamExerciseForm }
