import React, { useState, useEffect } from 'react'
import { IconCheck, IconExclamationCircleFilled, IconList, IconPencil, IconSettings, IconSquareRoundedPlusFilled, IconTrash, IconX } from '@tabler/icons-react';
import { Alert, Badge, Button, Center, Divider, Fieldset, Grid, Menu, Modal, Notification, ScrollArea, Stack, Table, Text, } from '@mantine/core';
import cx from 'clsx';
import API from '../../API';
import "./style.scss"
import { ExamCall } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';
import { examStatusColor, examStatusLabel, getExamStatus } from '../../Utils/ExamUtils';


function ExamCallTable() {
    const navigate = useNavigate()
    const { courseId } = useParams()
    const [exams, setExams] = useState<ExamCall[]>([])
    const [scrolled, setScrolled] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [currentExam, setCurrentExam] = useState<ExamCall | undefined>(undefined)
    const [deleteLoad, setDeleteLoad] = useState(false)
    const [deleteSuccess, setDeleteSuccess] = useState(false)

    const loadExams = () => {
        if (courseId) {
            API.getExamCalls(courseId).then((exams) => {
                setExams(exams)
            })
        }
    }

    useEffect(() => {
        loadExams()
    }, [])

    const handleDelete = () => {
        if (courseId && currentExam) {
            setDeleteLoad(true)
            API.deleteExamCall(courseId, currentExam.examId).then(() => {
                setShowDelete(false)
                setDeleteLoad(false)
                setDeleteSuccess(true)
                loadExams()
                setTimeout(() => {
                    setDeleteSuccess(false)
                }, 3000)
            })
        }
    }

    return (
        <>
            <Grid justify='center' align='center'>
                <Grid.Col span={12}>
                    <Fieldset legend="Exam calls">
                        <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                            <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout='fixed'>
                                <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                    <Table.Tr>
                                        <Table.Th>Title</Table.Th>
                                        <Table.Th>Start date</Table.Th>
                                        <Table.Th>End date</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th>Exercises</Table.Th>
                                        <Table.Th>Enrolled</Table.Th>
                                        <Table.Th></Table.Th>
                                    </Table.Tr>
                                </Table.Tbody>
                                <Table.Tbody>
                                    {exams.length === 0 ? (<Table.Tr>
                                        <Table.Td colSpan={7}>
                                            <Center>
                                                <Text> No exam calls found</Text>
                                            </Center>
                                        </Table.Td>
                                    </Table.Tr>) : (exams.map((row) => {
                                        const status = getExamStatus(row.startDate, row.endDate)
                                        return (
                                            <Table.Tr key={row.examId}>
                                                <Table.Td>{row.title}</Table.Td>
                                                <Table.Td>{row.startDate}</Table.Td>
                                                <Table.Td>{row.endDate}</Table.Td>
                                                <Table.Td><Badge variant="light" color={examStatusColor(status)}>{examStatusLabel(status)}</Badge></Table.Td>
                                                <Table.Td>{row.exercises.length}</Table.Td>
                                                <Table.Td>{row.students.length}</Table.Td>
                                                <Table.Td>
                                                    <Menu shadow="md" width={200} position="left" withArrow>
                                                        <Menu.Target>
                                                            <Button variant="light" color="cyan" leftSection={<IconList size={16} stroke={1.5} />} >Exam call actions</Button>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item leftSection={<IconSettings size={14} />} onClick={() => navigate("/teacher/courses/" + courseId + "/exams/" + row.examId)} >Manage exam call</Menu.Item>
                                                            <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => navigate("/teacher/courses/" + courseId + "/exams/" + row.examId + "/edit")} >Edit exam call information</Menu.Item>
                                                            <Menu.Item color='red' leftSection={<IconTrash size={14} />} onClick={() => {
                                                                setCurrentExam(row)
                                                                setShowDelete(true)
                                                            }} >Delete exam call</Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Table.Td>
                                            </Table.Tr>
                                        )
                                    }))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                        <Center mt="sm">
                            <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}
                                onClick={() => navigate("/teacher/courses/" + courseId + "/exams/new")} >Add Exam Call</Button>
                        </Center></Fieldset>
                </Grid.Col>
            </Grid>

            <Modal opened={showDelete} onClose={() => setShowDelete(false)} title="Delete exam call" centered>
                <Stack gap="sm" align='center' justify="center" >
                    <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                        Are you sure you want to delete exam call <b>{currentExam?.title}</b>?
                        This action will erase all of its exercises, enrollments and student submissions. It cannot be undone.
                    </Alert>
                    <Divider />
                    <Grid>
                        <Grid.Col span={6}>
                            <Button variant='light' color="gray" onClick={() => setShowDelete(false)} leftSection={<IconX size={16} stroke={1.5} />}>Cancel</Button>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Button variant="light" color="red" onClick={() => handleDelete()} leftSection={<IconTrash size={16} stroke={1.5} />}>Delete exam call</Button>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Modal>
            {deleteSuccess && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Exam call deletion successful!</Text>
            </Notification>}
            {deleteLoad && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Exam call deletion in progress...</Text>
            </Notification>}
        </>
    )
}

export default ExamCallTable
