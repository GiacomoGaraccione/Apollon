import React, { useState, useEffect } from 'react'
import { IconCheck, IconInfoCircle, IconSquareRoundedPlusFilled } from '@tabler/icons-react';
import { Badge, Button, Center, Fieldset, Notification, Text, Textarea, TextInput, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import API from '../../API';
import { ExamCall } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';
import "./style.scss"

const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/

function ExamCallCreator() {
    const { courseId } = useParams()

    return (<>
        <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
        <Fieldset legend="Create Exam Call">
            <ExamCallForm mode="create" />
        </Fieldset>
    </>)
}

function ExamCallEditor() {
    const { courseId, examId } = useParams()
    const [exam, setExam] = useState<ExamCall | undefined>(undefined)

    useEffect(() => {
        if (courseId && examId) {
            API.getExamCall(courseId, examId).then((e) => {
                setExam(e)
            })
        }
    }, [])

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Fieldset legend={`Edit Exam Call ${exam ? exam.title : ""}`}>
                {exam && <ExamCallForm mode="edit" exam={exam} />}
            </Fieldset>
        </>
    )
}

function ExamCallForm(props: { mode: "create" | "edit", exam?: ExamCall }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successNotif, setSuccessNotif] = useState(false)
    const { courseId } = useParams()
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            title: props.exam?.title || "",
            description: props.exam?.description || "",
            startDate: props.exam?.startDate || "",
            endDate: props.exam?.endDate || "",
        },
        validate: (values) => ({
            title: values.title.length < 3 ? "Title must be at least 3 characters" : null,
            description: values.description.length < 10 ? "Description must be at least 10 characters" : null,
            startDate: !TIMESTAMP_REGEX.test(values.startDate) ? "Date must be in YYYY-MM-DD HH:MM format" : null,
            endDate: !TIMESTAMP_REGEX.test(values.endDate) ? "Date must be in YYYY-MM-DD HH:MM format"
                : (values.endDate <= values.startDate ? "End date must be after start date" : null),
        })
    })

    return (
        <>
            <form onSubmit={form.onSubmit((values) => {
                setLoading(true)
                if (courseId) {
                    if (props.mode === "create") {
                        API.createExamCall(courseId, values.title, values.description, values.startDate, values.endDate).then(() => {
                            setLoading(false)
                            setSuccessNotif(true)
                            navigate(`/teacher/courses/${courseId}`)
                            setTimeout(() => setSuccessNotif(false), 3000)
                        }).catch((err: any) => {
                            setLoading(false)
                            setError(err.message ? err.message : err.error ? err.error : "Error while creating a new exam call. Please reload the page.")
                            setTimeout(() => setError(null), 3000)
                        })
                    } else if (props.exam) {
                        API.updateExamCall(courseId, props.exam.examId, values.title, values.description, values.startDate, values.endDate).then(() => {
                            setLoading(false)
                            setSuccessNotif(true)
                            navigate(`/teacher/courses/${courseId}`)
                            setTimeout(() => setSuccessNotif(false), 3000)
                        }).catch((err: any) => {
                            setLoading(false)
                            setError(err.message ? err.message : err.error ? err.error : "Error while editing the exam call. Please reload the page.")
                            setTimeout(() => setError(null), 3000)
                        })
                    }
                }
            })} >
                <TextInput label="Title" placeholder="Title" {...form.getInputProps("title")} />
                <Textarea label="Description" placeholder="Description" {...form.getInputProps("description")} />
                <TextInput label="Start date" placeholder="YYYY-MM-DD HH:MM" description="Date and time when the exam call opens, e.g. 2026-06-15 09:00" {...form.getInputProps("startDate")} />
                <TextInput label="End date" placeholder="YYYY-MM-DD HH:MM" description="Date and time when the exam call closes, e.g. 2026-06-15 11:00" {...form.getInputProps("endDate")} />

                {error && <Text color="red" mt="sm">{error}</Text>}

                <Center mt="md">
                    <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                        {props.mode === "create" ? "Create Exam Call" : "Edit Exam Call"}
                    </Button>
                </Center>
            </form>
            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Exam call {props.mode === "create" ? "creation" : "edit"} successful!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>{props.mode === "create" ? "Exam call creation" : "Exam call edit"} in progress...</Text>
            </Notification>}
        </>
    )
}

export { ExamCallCreator, ExamCallEditor, ExamCallForm }
