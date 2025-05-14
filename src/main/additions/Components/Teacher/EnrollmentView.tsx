import React, { useState, useEffect, useRef, useContext } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconInfoCircle, IconSearch, IconSquareRoundedPlusFilled, IconX } from '@tabler/icons-react';
import { Alert, Button, Checkbox, Fieldset, Flex, Grid, Group, Modal, NativeSelect, Notification, ScrollArea, Table, Text, TextInput, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import cx from 'clsx';
import API from '../../API';
import { User, Roles, UserContext } from '../Login/UserContext';
import UserTable from './UserTable';
import "./style.scss"
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { Course } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';

function EnrollmentView() {
    const navigate = useNavigate()
    const { courseId } = useParams()
    const user = useContext(UserContext)
    const [students, setStudents] = useState<User[]>([])
    const [course, setCourse] = useState<Course | undefined>(undefined)
    const [nonEnrolledStudents, setNonEnrolledStudents] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [successNotif, setSuccessNotif] = useState(false)
    const [errors, setErrors] = useState<{ message: string, userId: string }[]>([])
    const [errModalOpened, { open, close }] = useDisclosure(false)
    const [scrolled, setScrolled] = useState(false)
    const [unenroll, setUnenroll] = useState(false)
    const [unenrollNotif, setUnenrollNotif] = useState(false)
    const openRef = useRef<() => void>(null)

    useEffect(() => {
        if (courseId) {
            API.getCourse(courseId).then((c) => {
                setCourse(c)
                setStudents(c.students)
                API.getNonEnrolledStudents(courseId).then((st) => {
                    setNonEnrolledStudents(st)
                })
            })
        }
    }, [])

    const enrollStudents = async (studentIds: string[]) => {
        if (courseId) {
            setLoading(true)
            setErrors([])
            API.enrollStudents(courseId, studentIds).then((res: any) => {
                API.getCourse(courseId).then((c) => {
                    setCourse(c)
                    setStudents(c.students)
                    API.getNonEnrolledStudents(courseId).then((st) => {
                        setNonEnrolledStudents(st)
                        setLoading(false)
                        console.log(res)
                        if (res.enrolled.length > 0) {
                            setTimeout(() => {
                                setSuccessNotif(false)
                            }, 2000)
                            setSuccessNotif(true)
                        }
                        if (res.failed.length > 0) {
                            setErrors(res.failed)
                            open()
                        }
                    })
                })
            })
        }
    }

    const handleDrop = async (files: File[]) => {
        if (files.length !== 1) {
            return
        } else {
            const fileReader = new FileReader()
            fileReader.onload = async (e: ProgressEvent<FileReader>) => {
                if (e.target) {
                    if (e.target.result) {
                        let res = e.target.result as string
                        let list = res.split("\n")
                        let studentIds = list.map((el: string) => el.trim())
                        await enrollStudents(studentIds)
                    }
                }
            }
            fileReader.readAsText(files[0])
        }
    }

    const removeFromCourse = async (studentId: string) => {
        if (courseId) {
            setUnenroll(true)
            API.unenrollStudent(courseId, studentId).then((res) => {
                API.getCourse(courseId).then((c) => {
                    setCourse(c)
                    setStudents(c.students)
                    API.getNonEnrolledStudents(courseId).then((st) => {
                        setNonEnrolledStudents(st)
                        setUnenroll(false)
                        setUnenrollNotif(true)
                        setTimeout(() => {
                            setUnenrollNotif(false)
                        }, 2000)
                    })
                })
            })
        }
    }

    return (
        <>
            <Grid justify="center" align="center">
                <Grid.Col span={6}>
                    <Fieldset legend="Enrolled Students">
                        <UserTable users={students} location='courses' setUsers={setStudents} remove={removeFromCourse} />
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Fieldset legend="Enroll new student">
                        {nonEnrolledStudents.length > 0 && <EnrollTable students={nonEnrolledStudents} setStudents={setNonEnrolledStudents} enrollStudents={enrollStudents} />}
                        {nonEnrolledStudents.length === 0 && <Alert variant='light' color="green" icon={<IconInfoCircle />} >All students are already enrolled in this course</Alert>}
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Dropzone onDrop={(file) => { handleDrop(file) }} openRef={openRef} className="dropzone" radius="md" accept={[MIME_TYPES.csv]} maxSize={30 * 1024 ** 2}>
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
                                    <Dropzone.Idle>Upload enrolled students</Dropzone.Idle>
                                </Text>
                                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                    Drag&apos;n&apos;drop a CSV file here to enroll multiple students to this course at once. The expected format for the CSV file is: <br />
                                    <b>studentId</b>
                                </Text>
                            </Fieldset>

                        </div>
                    </Dropzone>
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

            <Modal opened={errModalOpened} onClose={close} title="Error Report" size={"100%"} >
                <Fieldset legend="Enrollment Errors">
                    {errors.length > 0 &&
                        <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                            <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                    <Table.Tr>
                                        <Table.Th>Student ID</Table.Th>
                                        <Table.Th>Reason</Table.Th>
                                    </Table.Tr>
                                </Table.Tbody>
                                <Table.Tbody>
                                    {errors.map((err, index) => (
                                        <Table.Tr key={index}>
                                            <Table.Td>{err.userId}</Table.Td>
                                            <Table.Td>{err.message}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>}
                    {errors.length === 0 && <Text color="green">No format errors</Text>}
                </Fieldset>
            </Modal>

        </>
    )
}

function EnrollTable(props: { students: User[], setStudents: (students: User[]) => void, enrollStudents: (studentIds: string[]) => void }) {
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

export default EnrollmentView