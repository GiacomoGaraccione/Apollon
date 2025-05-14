import React, { useState, useEffect, useRef } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconSquareRoundedPlusFilled, IconX } from '@tabler/icons-react';
import { Badge, Button, Fieldset, Flex, Grid, Group, Modal, NativeSelect, Notification, ScrollArea, Table, Text, TextInput, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import cx from 'clsx';
import API from '../../API';
import { User, Roles } from '../Login/UserContext';
import UserTable from './UserTable';
import "./style.scss"
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';



function UsersView() {
    const [users, setUsers] = useState<User[]>([])
    const [successNotif, setSuccessNotif] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [errModalOpened, { open, close }] = useDisclosure(false)
    const [formatErrors, setFormatErrors] = useState<{ line: string, reason: string }[]>([])
    const [duplicateUsers, setDuplicateUsers] = useState<{ username: string, userId: string }[]>([])
    const [scrolled, setScrolled] = useState(false)
    const openRef = useRef<() => void>(null)
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            userId: "",
            name: "",
            surname: "",
            role: Roles.STUDENT
        },
        validate: (values) => ({
            name: (values.name.length >= 2 && values.name.length <= 50) ? null : "Name must be between 2 and 50 characters",
            surname: (values.surname.length >= 2 && values.surname.length <= 50) ? null : "Surname must be between 2 and 50 characters",
            role: values.role === Roles.STUDENT || values.role === Roles.TEACHER ? null : "Invalid role",
            userId: !/^[sd]\d{0,6}$/.test(values.userId) ? "Invalid user ID. Format is sXXXXXX or dXXXXXX" :
                values.userId.charAt(0) === "s" && values.role !== Roles.STUDENT ? "Student IDs must have a student role" :
                    values.userId.charAt(0) === "d" && values.role !== Roles.TEACHER ? "Teacher IDs must have a teacher role" : null
        })
    })

    useEffect(() => {
        API.getAllUsers().then((users) => {
            setUsers(users)
        })
    }, [])

    const handleDrop = (files: File[]) => {
        let errors = {
            invalidFormat: [] as { line: string, reason: string }[],
            duplicateUsers: [] as { username: string, userId: string }[],
        }
        if (files.length !== 1) {
            return
        } else {
            const fileReader = new FileReader()
            let newUsers = [] as { userId: string, name: string, surname: string, role: string }[]
            fileReader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target) {
                    if (e.target.result) {
                        setLoading(true)
                        let res = e.target.result as string
                        let list = res.split("\n")
                        for (let el of list) {
                            let line = el.split(",")
                            if (line.length !== 4) {
                                errors.invalidFormat.push({ "line": el, "reason": "Missing fields" })
                                continue
                            }
                            let userId = line[0].trim()
                            if (users.find((u) => u.userId === userId)) {
                                errors.duplicateUsers.push({ username: line[1] + line[2], userId: userId })
                                continue
                            }
                            if (!/^[sd]\d{0,6}$/.test(userId)) {
                                errors.invalidFormat.push({ "line": el, "reason": "Invalid user ID. Format is sXXXXXX or dXXXXXX" })
                                continue
                            }
                            let name = line[1].trim()
                            if (name.length < 2 || name.length > 50) {
                                errors.invalidFormat.push({ "line": el, "reason": "Name must be between 2 and 50 characters" })
                                continue
                            }
                            let surname = line[2].trim()
                            if (surname.length < 2 || surname.length > 50) {
                                errors.invalidFormat.push({ "line": el, "reason": "Surname must be between 2 and 50 characters" })
                                continue
                            }
                            if (users.find((u) => u.username === name + surname)) {
                                errors.duplicateUsers.push({ username: name + surname, userId: userId })
                                continue
                            }
                            let role = line[3].trim()
                            if (role !== Roles.STUDENT && role !== Roles.TEACHER) {
                                errors.invalidFormat.push({ "line": el, "reason": "Invalid role" })
                                continue
                            }
                            if (userId.charAt(0) === "s" && role !== Roles.STUDENT) {
                                errors.invalidFormat.push({ "line": el, "reason": "Student IDs must have a student role" })
                                continue
                            }
                            if (userId.charAt(0) === "d" && role !== Roles.TEACHER) {
                                errors.invalidFormat.push({ "line": el, "reason": "Teacher IDs must have a teacher role" })
                                continue
                            }
                            newUsers.push({ userId: userId, name: name, surname: surname, role: role })
                        }
                        Promise.all(newUsers.map(user =>
                            API.createUser(user.userId, user.name, user.surname, user.role).catch((err) => {
                                errors.invalidFormat.push({
                                    "line": user.userId, "reason": err.message
                                        ? err.message : err.error ? err.error : "Error while creating a new user."
                                })
                            })
                        )).then(() => {
                            API.getAllUsers().then((updatedUsers) => {
                                if (users.length !== updatedUsers.length) {
                                    setUsers(updatedUsers)
                                    setSuccessNotif(true)
                                    setTimeout(() => {
                                        setSuccessNotif(false)
                                    }, 3000)
                                }
                            }).catch((err) => {
                                console.error("Error fetching updated users:", err)
                            }).finally(() => {
                                setLoading(false)
                            });
                        }).catch((err) => {
                            setError(err.message ? err.message : err.error ? err.error : "Error while creating users. Please reload the page.")
                            setLoading(false)
                        }).finally(() => {
                            if (errors.invalidFormat.length > 0 || errors.duplicateUsers.length > 0) {
                                setDuplicateUsers(errors.duplicateUsers)
                                setFormatErrors([...errors.invalidFormat])
                                open()
                            }
                        })
                    }
                }
            }
            fileReader.readAsText(files[0])
        }
    }

    const download = () => {
        let csv = ""
        for (let user of users) {
            csv += `${user.username},${user.userId},${user.name},${user.surname},${user.role}\n`
        }
        const element = document.createElement("a")
        const file = new Blob([csv], { type: MIME_TYPES.csv })
        element.href = URL.createObjectURL(file)
        element.download = "users.csv"
        document.body.appendChild(element)
        element.click()
        element.remove()
    }

    return (
        <>
            <Fieldset legend={
                <Flex justify="center" align="center">
                    <Badge color="cyan" size="xl" style={{ cursor: "pointer" }} onClick={() => download()} >Users <IconDownload /> </Badge>
                </Flex>
            }>
                <UserTable users={users} location={"users"} setUsers={setUsers} remove={() => { }} />
            </Fieldset>
            <Grid>
                <Grid.Col span={6}>
                    <Fieldset legend="Add User">
                        <form onSubmit={form.onSubmit((values) => {
                            setLoading(true)
                            API.createUser(values.userId, values.name, values.surname, values.role).then(() => {
                                API.getAllUsers().then((us) => {
                                    setUsers(us)
                                    setLoading(false)
                                    setSuccessNotif(true)
                                    setTimeout(() => {
                                        setSuccessNotif(false)
                                    }, 3000)
                                }).catch((err: any) => {
                                    setLoading(false)
                                    setError(err.message ? err.message : err.error ? err.error : "Error while creating a new user. Please reload the page.")
                                    setTimeout(() => {
                                        setError(null)
                                    }, 3000)
                                })
                            }).catch((err) => {
                                setLoading(false)
                                setError(err.message ? err.message : err.error ? err.error : "Error while creating a new user. Please reload the page.")
                                setTimeout(() => {
                                    setError(null)
                                }, 3000)
                            })
                        })}>
                            <TextInput label="User ID" placeholder="sXXXXXX" {...form.getInputProps("userId")} />
                            <TextInput label="Name" placeholder="Name" {...form.getInputProps("name")} />
                            <TextInput label="Surname" placeholder="Surname" {...form.getInputProps("surname")} />
                            <NativeSelect label="Role" data={[Roles.STUDENT, Roles.TEACHER]} {...form.getInputProps("role")} />
                            <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" >Add User</Button>
                        </form>
                        <Text mt="sm" color="blue">The username will be generated automatically as <b>name+surname</b></Text>
                        <Text mt="sm" color="blue">The password will be generated automatically as <b>!!name+surname!!</b> </Text>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={6} style={{ alignContent: "center", cursor: "pointer" }}>
                    <Dropzone openRef={openRef} onDrop={(file) => handleDrop(file)} className="dropzone" radius="md" accept={[MIME_TYPES.csv]} maxSize={30 * 1024 ** 2}>
                        <div style={{ pointerEvents: "none" }}>
                            <Fieldset legend="Upload Users" style={{ pointerEvents: "none" }}>
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
                                    <Dropzone.Idle>Upload users</Dropzone.Idle>
                                </Text>
                                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                    Drag&apos;n&apos;drop a CSV file here to upload multiple users at once. The expected format for the CSV file is: <br />
                                    <b>userId, name, surname, role</b>
                                </Text>
                            </Fieldset>

                        </div>
                    </Dropzone>
                </Grid.Col>
            </Grid>
            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>User creation successful!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>User creation in progress...</Text>
            </Notification>}
            {error && <Notification icon={<IconX size={20} />} color="red" title="Error!" mt="md" className='notif' withCloseButton={false}>
                <Text>{error}</Text>
            </Notification>}

            <Modal opened={errModalOpened} onClose={close} title="Error Report" size={"100%"} >
                <Grid>
                    <Grid.Col span={6}>
                        <Fieldset legend="Format Errors">
                            {formatErrors.length > 0 &&
                                <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                                    <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                        <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                            <Table.Tr>
                                                <Table.Th>Line</Table.Th>
                                                <Table.Th>Reason</Table.Th>
                                            </Table.Tr>
                                        </Table.Tbody>
                                        <Table.Tbody>
                                            {formatErrors.map((err, index) => (
                                                <Table.Tr key={index}>
                                                    <Table.Td>{err.line}</Table.Td>
                                                    <Table.Td>{err.reason}</Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>}
                            {formatErrors.length === 0 && <Text color="green">No format errors</Text>}
                        </Fieldset>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Fieldset legend="Duplicate Users">
                            {duplicateUsers.length > 0 &&
                                <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                                    <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                        <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                            <Table.Tr>
                                                <Table.Th>Username</Table.Th>
                                                <Table.Th>User ID</Table.Th>
                                            </Table.Tr>
                                        </Table.Tbody>
                                        <Table.Tbody>
                                            {duplicateUsers.map((dup, index) => (
                                                <Table.Tr key={index}>
                                                    <Table.Td>{dup.username}</Table.Td>
                                                    <Table.Td>{dup.userId}</Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            }
                            {duplicateUsers.length === 0 && <Text color="green">No duplicate users</Text>}
                        </Fieldset>
                    </Grid.Col>
                </Grid>
            </Modal>
        </>
    )
}



export default UsersView