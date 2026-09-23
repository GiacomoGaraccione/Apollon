import React, { useState, useEffect } from 'react'
import { IconCheck, IconInfoCircle, IconSearch, IconSquareRoundedPlusFilled } from '@tabler/icons-react';
import { Alert, Button, Checkbox, FileInput, Fieldset, Flex, Grid, Notification, ScrollArea, Table, Text, TextInput, } from '@mantine/core';
import cx from 'clsx';
import API from '../../API';
import { User } from '../Login/UserContext';
import UserTable from './UserTable';
import "./style.scss"
import { useParams } from 'react-router-dom';

function ExamEnrollmentView() {
    const { courseId, examId } = useParams()
    const [students, setStudents] = useState<User[]>([])
    const [nonEnrolledStudents, setNonEnrolledStudents] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [successNotif, setSuccessNotif] = useState(false)
    const [unenroll, setUnenroll] = useState(false)
    const [unenrollNotif, setUnenrollNotif] = useState(false)

    const loadStudents = () => {
        if (courseId && examId) {
            API.getExamCall(courseId, examId).then((exam) => {
                setStudents(exam.students)
            })
            API.getExamNonEnrolledStudents(courseId, examId).then((st) => {
                setNonEnrolledStudents(st)
            })
        }
    }

    useEffect(() => {
        loadStudents()
    }, [])

    const enrollStudents = async (studentIds: string[]) => {
        if (courseId && examId) {
            setLoading(true)
            API.enrollExamStudents(courseId, examId, studentIds).then(() => {
                loadStudents()
                setLoading(false)
                setSuccessNotif(true)
                setTimeout(() => setSuccessNotif(false), 2000)
            })
        }
    }

    const handleCsvUpload = async (file: File | null) => {
        if (!file || !courseId || !examId) return
        setLoading(true)
        const text = await file.text()
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l)
        const header = lines[0].toLowerCase().replace(/['"]/g, "")
        const start = (header === "matricola" || header === "studentid" || header === "userid" || header === "id") ? 1 : 0
        const ids = lines.slice(start).map(l => l.replace(/['"]/g, "").trim()).filter(l => l)
        if (ids.length > 0) {
            await API.enrollExamStudents(courseId, examId, ids)
        }
        loadStudents()
        setLoading(false)
        setSuccessNotif(true)
        setTimeout(() => setSuccessNotif(false), 2000)
    }

    const removeFromExam = async (studentId: string) => {
        if (courseId && examId) {
            setUnenroll(true)
            API.unenrollExamStudent(courseId, examId, studentId).then(() => {
                loadStudents()
                setUnenroll(false)
                setUnenrollNotif(true)
                setTimeout(() => setUnenrollNotif(false), 2000)
            })
        }
    }

    return (
        <>
            <Grid justify="center" align="center">
                <Grid.Col span={6}>
                    <Fieldset legend="Enrolled Students">
                        <UserTable users={students} location='exams' setUsers={setStudents} remove={removeFromExam} />
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Fieldset legend="Enroll new student">
                        <Flex gap="sm" align="flex-end" mb="md">
                            <FileInput
                                label="Enroll from CSV"
                                placeholder="Select CSV file"
                                accept=".csv,.txt"
                                style={{ flex: 1 }}
                                onChange={handleCsvUpload}
                            />
                        </Flex>
                        {nonEnrolledStudents.length > 0 && <ExamEnrollTable students={nonEnrolledStudents} enrollStudents={enrollStudents} />}
                        {nonEnrolledStudents.length === 0 && <Alert variant='light' color="green" icon={<IconInfoCircle />} >All course students are already enrolled in this exam call</Alert>}
                    </Fieldset>
                </Grid.Col>
            </Grid>
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Student enrollment in progress...</Text>
            </Notification>}
            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Student enrollment successful!</Text>
            </Notification>}
            {unenrollNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Student unenrollment successful!</Text>
            </Notification>}
            {unenroll && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Student unenrollment in progress...</Text>
            </Notification>}
        </>
    )
}

function ExamEnrollTable(props: { students: User[], enrollStudents: (studentIds: string[]) => void }) {
    const [selection, setSelection] = useState<string[]>([])
    const [ids, setIds] = useState<string[]>([])
    const [displayedIds, setDisplayedIds] = useState<string[]>([])
    const [search, setSearch] = useState("")
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const newIds = props.students.map((s) => s.userId)
        setIds(newIds)
        setDisplayedIds(newIds)
        setSelection([])
    }, [props.students])

    const toggleRow = (id: string) => {
        setSelection((current) =>
            current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
        )
    }
    const toggleAll = () => setSelection((current) => (current.length === ids.length) ? [] : ids)

    const rows = displayedIds.map((id) => {
        return (
            <Table.Tr key={id}>
                <Table.Td>
                    <Checkbox checked={selection.includes(id)} onChange={() => toggleRow(id)} />
                </Table.Td>
                <Table.Td>
                    {id}
                </Table.Td>
            </Table.Tr>
        )
    })

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let { value } = event.currentTarget
        setSearch(value)
        if (!value) {
            setDisplayedIds(ids)
        }
        else {
            setDisplayedIds(ids.filter((id) => id.includes(value)))
        }
    }

    return (<>
        <Flex gap="md" align="center" justify="center" >
            <TextInput placeholder='Search' leftSection={<IconSearch size={16} stroke={1.5} />}
                value={search} onChange={handleSearchChange}></TextInput>
            <Button onClick={() => props.enrollStudents(selection)}
                style={{ alignContent: "center", alignItems: "center" }} variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}  >Add students</Button>
        </Flex>

        <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
            <Table verticalSpacing={"sm"} horizontalSpacing="md" layout='fixed'>
                <Table.Thead className={cx("header", { scrolled: scrolled })}>
                    <Table.Tr>
                        <Table.Th w={40}>
                            <Checkbox onChange={toggleAll} checked={selection.length === ids.length} indeterminate={selection.length > 0 && selection.length !== ids.length} />
                        </Table.Th>
                        <Table.Th>
                            Student ID
                        </Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    </>
    )
}

export default ExamEnrollmentView
