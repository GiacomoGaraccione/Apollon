import React, { useState, useEffect } from 'react'
import { IconBulb, IconCheck, IconExclamationCircleFilled, IconList, IconPencil, IconRobot, IconSquareRoundedPlusFilled, IconTrash, IconX } from '@tabler/icons-react';
import { Alert, Button, Center, Checkbox, Divider, Fieldset, Grid, Menu, Modal, Notification, ScrollArea, Stack, Table, Text, } from '@mantine/core';
import cx from 'clsx';
import API from '../../API';
import "./style.scss"
import { Exercise } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';


function ExerciseTable() {
    const navigate = useNavigate()
    const { courseId } = useParams()
    const [exercises, setExercises] = useState<Exercise[]>([])
    const [scrolled, setScrolled] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [currentExercise, setCurrentExercise] = useState<Exercise | undefined>(undefined)
    const [deleteLoad, setDeleteLoad] = useState(false)
    const [deleteSuccess, setDeleteSuccess] = useState(false)

    useEffect(() => {
        if (courseId) {
            API.getCourse(courseId).then((c) => {
                setExercises(c.exercises)
            })
        }
    }, [])

    const handleDelete = () => {
        if (courseId && currentExercise) {
            setDeleteLoad(true)
            API.deleteExercise(courseId, currentExercise.exerciseId).then((res) => {
                setShowDelete(false)
                setDeleteLoad(false)
                setDeleteSuccess(true)
                API.getCourse(courseId).then((c) => {
                    setExercises(c.exercises)
                    setTimeout(() => {
                        setDeleteSuccess(false)
                    }, 3000)
                })
            })
        }
    }

    return (
        <>
            <Grid justify='center' align='center'>
                <Grid.Col span={12}>
                    <Fieldset legend="Exercises">
                        <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                            <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout='fixed'>
                                <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                    <Table.Tr>
                                        <Table.Th>Title</Table.Th>
                                        <Table.Th>Level</Table.Th>
                                        <Table.Th>Experience</Table.Th>
                                        <Table.Th>Visible</Table.Th>
                                        <Table.Th>Gamified</Table.Th>
                                        <Table.Th></Table.Th>
                                    </Table.Tr>
                                </Table.Tbody>
                                <Table.Tbody>
                                    {exercises.length === 0 ? (<Table.Tr>
                                        <Table.Td colSpan={6}>
                                            <Center>
                                                <Text> No exercises found</Text>
                                            </Center>
                                        </Table.Td>
                                    </Table.Tr>) : (exercises.map((row) => (
                                        <Table.Tr key={row.exerciseId}>
                                            <Table.Td>{row.title}</Table.Td>
                                            <Table.Td>{row.level}</Table.Td>
                                            <Table.Td>{row.experience}</Table.Td>
                                            <Table.Td><Checkbox checked={row.visible} disabled /></Table.Td>
                                            <Table.Td><Checkbox checked={row.gamified} disabled /></Table.Td>
                                            <Table.Td>
                                                <Menu shadow="md" width={200} position="left" withArrow>
                                                    <Menu.Target>
                                                        <Button variant="light" color="cyan" leftSection={<IconList size={16} stroke={1.5} />} >Exercise Actions</Button>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => navigate("/teacher/courses/" + courseId + "/exercises/" + row.exerciseId + "/edit")} >Edit exercise information</Menu.Item>
                                                        <Menu.Item leftSection={<IconBulb size={14} />}>View exercise solutions</Menu.Item>
                                                        <Menu.Item leftSection={<IconRobot size={14} />} onClick={() => navigate("/teacher/courses/" + courseId + "/exercises/" + row.exerciseId + "/boss")} >Edit exercise boss</Menu.Item>
                                                        <Menu.Item color='red' leftSection={<IconTrash size={14} />} onClick={() => {
                                                            setCurrentExercise(row)
                                                            setShowDelete(true)
                                                        }} >Delete exercise</Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Table.Td>
                                        </Table.Tr>
                                    )))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                        <Center mt="sm">
                            <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}
                                onClick={() => navigate("/teacher/courses/" + courseId + "/exercises/new")} >Add Exercise</Button>
                        </Center></Fieldset>
                </Grid.Col>
            </Grid>

            <Modal opened={showDelete} onClose={() => setShowDelete(false)} title="Delete exercise" centered>
                <Stack gap="sm" align='center' justify="center" >
                    <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                        Are you sure you want to delete exercise <b>{currentExercise?.title}</b>?
                        This action will erase all solutions, the eventual boss information, and the progress made by all students. It cannot be undone.
                    </Alert>
                    <Divider />
                    <Grid>
                        <Grid.Col span={6}>
                            <Button variant='light' color="gray" onClick={() => setShowDelete(false)} leftSection={<IconX size={16} stroke={1.5} />}>Cancel</Button>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Button variant="light" color="red" onClick={() => handleDelete()} leftSection={<IconTrash size={16} stroke={1.5} />}>Delete exercise</Button>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Modal>
            {deleteSuccess && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Exercise deletion successful!</Text>
            </Notification>}
            {deleteLoad && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Exercise deletion in progress...</Text>
            </Notification>}
        </>
    )
}

export default ExerciseTable