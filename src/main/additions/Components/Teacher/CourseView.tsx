import React, { useState, useEffect, useRef } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconExclamationCircleFilled, IconSettingsFilled, IconSquareRoundedPlusFilled, IconTrashFilled, IconTrashXFilled, IconX } from '@tabler/icons-react';
import { Alert, Badge, Button, Fieldset, Flex, Grid, Group, Modal, Notification, ScrollArea, Stack, Table, Text, TextInput, Tooltip, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import cx from 'clsx';
import API from '../../API';
import "./style.scss"
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { Course } from '../../Utils/Models';
import { useNavigate } from 'react-router-dom';

function CourseView() {
    const [courses, setCourses] = useState<Course[]>([])
    const [scrolled, setScrolled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successNotif, setSuccessNotif] = useState(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [errors, setErrors] = useState<{ line: string, error: string }[]>([])
    const navigate = useNavigate()
    const [errModalOpened, { open, close }] = useDisclosure(false)
    const [deleteModalOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
    const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined)
    const [deleteNotif, setDeleteNotif] = useState(false)
    const [deleteLoad, setDeleteLoad] = useState(false)
    const openRef = useRef<() => void>(null)
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            courseId: "",
            courseName: ""
        },
        validate: (values) => ({
            courseId: (values.courseId.length < 1) ? "Course ID is required" : undefined,
            courseName: (values.courseName.length < 1) ? "Course Name is required" : undefined
        })
    })

    useEffect(() => {
        API.getAllCourses().then((cs) => {
            setCourses(cs)
        })
    }, [])

    const handleDrop = (files: File[]) => {
        let errs: { line: string, error: string }[] = []
        if (files.length !== 1) return
        const reader = new FileReader()
        let newCourses: { courseId: string, courseName: string }[] = []
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target) {
                if (e.target.result) {
                    setLoading(true)
                    let lines = (e.target.result as string).split("\n")
                    for (let line of lines) {
                        let el = line.split(",")
                        if (el.length !== 2) {
                            errs.push({ line: line, error: "Invalid format. Expected format: courseId, courseName" })
                            continue
                        }
                        if (courses.find((c) => c.courseId === el[0])) {
                            errs.push({ line: line, error: "Course already exists" })
                            continue
                        }
                        if (el[0].trim().length < 1 || el[1].trim().length < 1) {
                            errs.push({ line: line, error: "Course ID and name are required" })
                            continue
                        }
                        newCourses.push({ courseId: el[0], courseName: el[1] })
                    }
                    Promise.all(newCourses.map((c) => {
                        API.createCourse(c.courseId, c.courseName).catch((err) => {
                            errs.push({ line: c.courseId + ", " + c.courseName, error: err.message ? err.message : err.error ? err.error : "Error while creating a new course." })
                        })
                    })).then(() => {
                        API.getAllCourses().then((cs) => {
                            if (cs.length !== courses.length) {
                                setCourses(cs)
                                setSuccessNotif(true)
                                setTimeout(() => {
                                    setSuccessNotif(false)
                                }, 3000)
                                setError("")
                            }
                        }).catch((err: any) => {
                            console.error(err)
                        })
                    }).finally(() => {
                        setLoading(false)
                        if (errs.length > 0) {
                            setErrors(errs)
                            open()
                        }
                    })
                }
            }
        }
        reader.readAsText(files[0])
    }

    const download = () => {
        let csv = ""
        courses.forEach((course) => {
            csv += course.courseId + "," + course.courseName + "\n"
        })
        const element = document.createElement("a")
        const file = new Blob([csv], { type: MIME_TYPES.csv })
        element.href = URL.createObjectURL(file)
        element.download = "courses.csv"
        document.body.appendChild(element)
        element.click()
        element.remove()
    }

    return (
        <>
            <Fieldset legend={<Flex justify='center' align="center">
                <Badge color="cyan" size="xl" style={{ cursor: "pointer" }} onClick={() => download()} >Courses <IconDownload /> </Badge>
            </Flex>} style={{ width: "100%" }} >
                <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                    <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout='fixed' captionSide='top' >
                        <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                            <Table.Tr>
                                <Table.Th>Course ID</Table.Th>
                                <Table.Th>Course Name</Table.Th>
                            </Table.Tr>
                        </Table.Tbody>
                        <Table.Tbody>
                            {courses.length > 0 ?
                                <>
                                    {courses.map((course) => (
                                        <Table.Tr>
                                            <Table.Td>
                                                <Tooltip label="Click to view course details" position="right" withArrow >
                                                    <Badge style={{ cursor: "pointer" }} size="sm" variant='gradient' gradient={{ from: "cyan", to: "lime", deg: 90 }} onClick={() => navigate("/teacher/courses/" + course.courseId)} >
                                                        {course.courseId}
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip label="Click to delete the course" position="right" withArrow>
                                                    <Badge style={{ cursor: "pointer" }} color="red" variant='light' onClick={() => {
                                                        setSelectedCourse(course)
                                                        openDelete()
                                                    }} ><IconTrashFilled size={"12"} /> </Badge>
                                                </Tooltip>
                                                <Tooltip label="Click to access course settings" position="right" withArrow>
                                                    <Badge style={{ cursor: "pointer" }} color="yellow" variant="light" onClick={() => navigate("/teacher/courses/" + course.courseId + "/settings")} >
                                                        <IconSettingsFilled size={"12"} />
                                                    </Badge>
                                                </Tooltip>
                                            </Table.Td>
                                            <Table.Td>{course.courseName}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                </>
                                : <Table.Tr><Table.Td colSpan={2}>No courses found</Table.Td></Table.Tr>}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Fieldset>
            <Grid>
                <Grid.Col span={6}>
                    <Fieldset legend="Create Course">
                        <form onSubmit={form.onSubmit((values) => {
                            setLoading(true)
                            API.createCourse(values.courseId, values.courseName).then(() => {
                                API.getAllCourses().then((cs) => {
                                    setCourses(cs)
                                    setLoading(false)
                                    setSuccessNotif(true)
                                    setTimeout(() => {
                                        setSuccessNotif(false)
                                    }, 3000)
                                    setError("")
                                }).catch((err: any) => {
                                    setLoading(false)
                                    setError(err.message ? err.message : err.error ? err.error : "Error while creating a new course. Please reload the page.")
                                    setTimeout(() => {
                                        setError(undefined)
                                    }, 3000)
                                })
                            }).catch((err) => {
                                setLoading(false)
                                setError(err.message ? err.message : err.error ? err.error : "Error while creating a new course. Please reload the page.")
                                setTimeout(() => {
                                    setError(undefined)
                                }, 3000)
                            })
                        })} >
                            <TextInput label="Course ID" id="courseId"  {...form.getInputProps("courseId")} />
                            <TextInput label="Course Name" id="courseName"  {...form.getInputProps("courseName")} />
                            <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" >Add Course</Button>
                        </form>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={6} style={{ alignContent: "center", cursor: "pointer" }}>
                    <Dropzone openRef={openRef} className="dropzone" radius="md" accept={[MIME_TYPES.csv]} maxSize={30 * 1024 ** 2}
                        onDrop={(files) => {
                            handleDrop(files)
                        }}>
                        <div style={{ pointerEvents: "none", cursor: "pointer" }}>
                            <Fieldset legend="Upload Courses">
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
                                    <Dropzone.Idle>Upload courses</Dropzone.Idle>
                                </Text>
                                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                    Drag&apos;n&apos;drop a CSV file here to upload multiple courses at once. The expected format for the CSV file is: <br />
                                    <b>courseId, courseName</b>
                                </Text>
                            </Fieldset>
                        </div>
                    </Dropzone>
                </Grid.Col>
            </Grid>


            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Course creation successful!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Course creation in progress...</Text>
            </Notification>}
            {error && <Notification icon={<IconX size={20} />} color="red" title="Error!" mt="md" className='notif' withCloseButton={false}>
                <Text>{error}</Text>
            </Notification>}
            {deleteNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Course cancellation successful!</Text>
            </Notification>}

            <Modal opened={errModalOpened} onClose={close} title="Error Report" size={"100%"} >
                <Grid>
                    <Grid.Col span={12}>
                        <Fieldset legend="Format Errors">
                            {errors.length > 0 &&
                                <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                                    <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                        <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                            <Table.Tr>
                                                <Table.Th>Line</Table.Th>
                                                <Table.Th>Reason</Table.Th>
                                            </Table.Tr>
                                        </Table.Tbody>
                                        <Table.Tbody>
                                            {errors.map((err, index) => (
                                                <Table.Tr key={index}>
                                                    <Table.Td>{err.line}</Table.Td>
                                                    <Table.Td>{err.error}</Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>}
                            {errors.length === 0 && <Text color="green">No format errors</Text>}
                        </Fieldset>
                    </Grid.Col>
                </Grid>
            </Modal>

            <Modal opened={deleteModalOpened} onClose={closeDelete} title="Delete Course" size={"sm"} >
                <Stack gap="sm" align='center' justify="center" >
                    <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                        Are you sure you want to delete course <b>{selectedCourse?.courseName}</b>?
                        This action will erase all data associated to the course (enrolled students and exercises) and cannot be undone.
                    </Alert>
                    <Group mt="md" justify='flex-end'>
                        <Button loading={deleteLoad} variant="light" color="red" rightSection={<IconTrashXFilled size={16} stroke={1.5} />}
                            onClick={() => {
                                if (selectedCourse) {
                                    setDeleteLoad(true)
                                    API.deleteCourse(selectedCourse.courseId).then(() => {
                                        API.getAllCourses().then((cs) => {
                                            setDeleteLoad(false)
                                            setCourses(cs)
                                            setSelectedCourse(undefined)
                                            closeDelete()
                                            setDeleteNotif(true)
                                            setTimeout(() => {
                                                setDeleteNotif(false)
                                            }, 3000)
                                        })
                                    })
                                }
                            }} >Delete course</Button>
                        <Button variant="light" color="gray" onClick={() => {
                            close()
                            setSelectedCourse(undefined)
                        }}>Cancel</Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    )
}

export default CourseView