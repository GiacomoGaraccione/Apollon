import React, { useState, useEffect } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconExclamationCircleFilled, IconSquareRoundedPlusFilled, IconTrashFilled, IconTrashXFilled, IconUsersGroup, IconX } from '@tabler/icons-react';
import { Alert, Badge, Button, Fieldset, Flex, Grid, Group, Modal, MultiSelect, Notification, ScrollArea, Stack, Table, Text, TextInput, Tooltip, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import cx from 'clsx';
import API from '../../API';
import "./style.scss"
import { Group as GroupModel } from '../../Utils/Models';
import { User } from '../Login/UserContext';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';

function GroupsView() {
    const [groups, setGroups] = useState<GroupModel[]>([])
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [scrolled, setScrolled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successNotif, setSuccessNotif] = useState(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [deleteModalOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)
    const [selectedGroup, setSelectedGroup] = useState<GroupModel | undefined>(undefined)
    const [deleteNotif, setDeleteNotif] = useState(false)
    const [deleteLoad, setDeleteLoad] = useState(false)
    const [csvLoading, setCsvLoading] = useState(false)
    const [reportModalOpened, { open: openReport, close: closeReport }] = useDisclosure(false)
    const [notFoundReport, setNotFoundReport] = useState<{ groupName: string, notFound: string[] }[]>([])
    const [skippedRows, setSkippedRows] = useState<{ line: string, reason: string }[]>([])
    const navigate = useNavigate()

    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            name: "",
            memberUserIds: [] as string[]
        },
        validate: (values) => ({
            name: values.name.length < 1 ? "Group name is required" : undefined
        })
    })

    const refresh = () => {
        API.getAllGroups().then((gs) => {
            setGroups(gs)
        })
        API.getAllUsers().then((users) => {
            setAllUsers(users)
        })
    }

    useEffect(() => {
        refresh()
    }, [])

    const handleCsvDrop = (files: File[]) => {
        if (files.length !== 1) return
        const fileReader = new FileReader()
        fileReader.onload = async (e: ProgressEvent<FileReader>) => {
            if (!e.target || !e.target.result) return
            setCsvLoading(true)

            const text = e.target.result as string
            const lines = text.split("\n").map((l) => l.replace("\r", "")).filter((l) => l.trim().length > 0)

            const userById = new Map(allUsers.map((u) => [u.userId, u]))
            const existingNames = new Set(groups.map((g) => g.name))
            const seenNamesInCsv = new Set<string>()

            const rowsToCreate: { name: string, memberUserIds: string[] }[] = []
            const notFound: { groupName: string, notFound: string[] }[] = []
            const skipped: { line: string, reason: string }[] = []

            for (const line of lines) {
                const fields = line.split(",").map((f) => f.trim())
                const name = fields[0]
                const memberTokens = fields.slice(1).filter((f) => f.length > 0)

                if (!name) {
                    skipped.push({ line, reason: "Missing group name" })
                    continue
                }
                if (seenNamesInCsv.has(name)) {
                    skipped.push({ line, reason: "Duplicate group name within the CSV" })
                    continue
                }
                if (existingNames.has(name)) {
                    skipped.push({ line, reason: "A group with this name already exists" })
                    continue
                }
                seenNamesInCsv.add(name)

                const resolvedIds = new Set<string>()
                const missing: string[] = []
                for (const token of memberTokens) {
                    const user = userById.get(token)
                    if (user) {
                        resolvedIds.add(user.userId)
                    } else {
                        missing.push(token)
                    }
                }
                if (missing.length > 0) {
                    notFound.push({ groupName: name, notFound: missing })
                }
                rowsToCreate.push({ name, memberUserIds: Array.from(resolvedIds) })
            }

            for (const row of rowsToCreate) {
                try {
                    await API.createGroup(row.name, row.memberUserIds)
                } catch (err: any) {
                    skipped.push({ line: row.name, reason: err.message ? err.message : err.error ? err.error : "Error while creating the group" })
                }
            }

            refresh()
            setCsvLoading(false)
            if (notFound.length > 0 || skipped.length > 0) {
                setNotFoundReport(notFound)
                setSkippedRows(skipped)
                openReport()
            } else {
                setSuccessNotif(true)
                setTimeout(() => setSuccessNotif(false), 3000)
            }
        }
        fileReader.readAsText(files[0])
    }

    const downloadNotFoundCsv = () => {
        let csv = "Group,Not Found Member\n"
        for (const entry of notFoundReport) {
            for (const token of entry.notFound) {
                csv += `${entry.groupName},${token}\n`
            }
        }
        const element = document.createElement("a")
        const file = new Blob([csv], { type: MIME_TYPES.csv })
        element.href = URL.createObjectURL(file)
        element.download = "not_found_members.csv"
        document.body.appendChild(element)
        element.click()
        element.remove()
    }

    return (
        <>
            <Fieldset legend={<Flex justify='center' align="center">
                <Badge color="cyan" size="xl" >Groups</Badge>
            </Flex>} style={{ width: "100%" }} >
                <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                    <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout='fixed' captionSide='top' >
                        <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                            <Table.Tr>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Members</Table.Th>
                                <Table.Th>Diagrams</Table.Th>
                                <Table.Th></Table.Th>
                            </Table.Tr>
                        </Table.Tbody>
                        <Table.Tbody>
                            {groups.length > 0 ?
                                <>
                                    {groups.map((group) => (
                                        <Table.Tr key={group.groupId}>
                                            <Table.Td>
                                                <Tooltip label="Click to manage members" position="right" withArrow >
                                                    <Badge style={{ cursor: "pointer" }} size="sm" variant='gradient' gradient={{ from: "cyan", to: "lime", deg: 90 }} onClick={() => navigate("/teacher/groups/" + group.groupId + "/members")} >
                                                        {group.name}
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip label="Click to access the group's workspace" position="right" withArrow>
                                                    <Badge style={{ cursor: "pointer" }} color="yellow" variant="light" onClick={() => navigate("/groups/" + group.groupId + "/workspace")} >
                                                        <IconUsersGroup size={"12"} />
                                                    </Badge>
                                                </Tooltip>
                                                <Tooltip label="Click to delete the group" position="right" withArrow>
                                                    <Badge style={{ cursor: "pointer" }} color="red" variant='light' onClick={() => {
                                                        setSelectedGroup(group)
                                                        openDelete()
                                                    }} ><IconTrashFilled size={"12"} /> </Badge>
                                                </Tooltip>
                                            </Table.Td>
                                            <Table.Td>{group.members.length}</Table.Td>
                                            <Table.Td>{group.diagramCount}</Table.Td>
                                            <Table.Td></Table.Td>
                                        </Table.Tr>
                                    ))}
                                </>
                                : <Table.Tr><Table.Td colSpan={4}>No groups found</Table.Td></Table.Tr>}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Fieldset>

            <Grid mt="md">
                <Grid.Col span={6}>
                    <Fieldset legend="Create Group">
                        <form onSubmit={form.onSubmit((values) => {
                            setLoading(true)
                            API.createGroup(values.name, values.memberUserIds).then(() => {
                                refresh()
                                setLoading(false)
                                setSuccessNotif(true)
                                form.reset()
                                setTimeout(() => {
                                    setSuccessNotif(false)
                                }, 3000)
                            }).catch((err) => {
                                setLoading(false)
                                setError(err.message ? err.message : err.error ? err.error : "Error while creating the group. Please reload the page.")
                                setTimeout(() => {
                                    setError(undefined)
                                }, 3000)
                            })
                        })} >
                            <TextInput label="Group Name" id="name" {...form.getInputProps("name")} />
                            <MultiSelect
                                label="Members"
                                placeholder="Search by username, user ID, name or surname"
                                searchable
                                mt="sm"
                                data={allUsers.map((u) => ({ value: u.userId, label: `${u.username} (${u.userId}) - ${u.role}` }))}
                                {...form.getInputProps("memberUserIds")}
                            />
                            <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" >Create Group</Button>
                        </form>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={6} style={{ alignContent: "center", cursor: "pointer" }}>
                    <Dropzone onDrop={handleCsvDrop} className="dropzone" radius="md" accept={[MIME_TYPES.csv]} maxSize={5 * 1024 ** 2} loading={csvLoading}>
                        <div style={{ pointerEvents: "none" }}>
                            <Fieldset legend="Upload Groups" style={{ pointerEvents: "none" }}>
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
                                    <Dropzone.Idle>Upload groups</Dropzone.Idle>
                                </Text>
                                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                    Drag&apos;n&apos;drop a CSV file here to create multiple groups at once. The expected format for the CSV file is: <br />
                                    <b>groupName, matricola1, matricola2, ...</b>
                                </Text>
                            </Fieldset>
                        </div>
                    </Dropzone>
                </Grid.Col>
            </Grid>

            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Group creation successful!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Group creation in progress...</Text>
            </Notification>}
            {error && <Notification icon={<IconX size={20} />} color="red" title="Error!" mt="md" className='notif' withCloseButton={false}>
                <Text>{error}</Text>
            </Notification>}
            {deleteNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Group deletion successful!</Text>
            </Notification>}

            <Modal opened={deleteModalOpened} onClose={closeDelete} title="Delete Group" size={"sm"} >
                <Stack gap="sm" align='center' justify="center" >
                    <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                        Are you sure you want to delete group <b>{selectedGroup?.name}</b>?
                        This action will permanently erase all diagrams in its workspace and cannot be undone.
                    </Alert>
                    <Group mt="md" justify='flex-end'>
                        <Button loading={deleteLoad} variant="light" color="red" rightSection={<IconTrashXFilled size={16} stroke={1.5} />}
                            onClick={() => {
                                if (selectedGroup) {
                                    setDeleteLoad(true)
                                    API.deleteGroup(selectedGroup.groupId).then(() => {
                                        setDeleteLoad(false)
                                        refresh()
                                        setSelectedGroup(undefined)
                                        closeDelete()
                                        setDeleteNotif(true)
                                        setTimeout(() => {
                                            setDeleteNotif(false)
                                        }, 3000)
                                    })
                                }
                            }} >Delete group</Button>
                        <Button variant="light" color="gray" onClick={() => {
                            closeDelete()
                            setSelectedGroup(undefined)
                        }}>Cancel</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal opened={reportModalOpened} onClose={closeReport} title="Group Import Report" size="100%" >
                <Grid>
                    <Grid.Col span={6}>
                        <Fieldset legend="Members Not Found">
                            {notFoundReport.length > 0 ? (
                                <>
                                    <Text size="sm" c="dimmed" mb="sm">The groups below were created, but the following members could not be matched to any user ID and were skipped.</Text>
                                    <ScrollArea h={300}>
                                        <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                            <Table.Tbody>
                                                <Table.Tr>
                                                    <Table.Th>Group</Table.Th>
                                                    <Table.Th>Not Found Members</Table.Th>
                                                </Table.Tr>
                                            </Table.Tbody>
                                            <Table.Tbody>
                                                {notFoundReport.map((entry, index) => (
                                                    <Table.Tr key={index}>
                                                        <Table.Td>{entry.groupName}</Table.Td>
                                                        <Table.Td>{entry.notFound.join(", ")}</Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </ScrollArea>
                                    <Button mt="sm" variant="light" color="blue" rightSection={<IconDownload size={16} stroke={1.5} />} onClick={downloadNotFoundCsv}>Download CSV</Button>
                                </>
                            ) : <Text color="green">All members were found</Text>}
                        </Fieldset>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Fieldset legend="Skipped Rows">
                            {skippedRows.length > 0 ? (
                                <ScrollArea h={300}>
                                    <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                        <Table.Tbody>
                                            <Table.Tr>
                                                <Table.Th>Line</Table.Th>
                                                <Table.Th>Reason</Table.Th>
                                            </Table.Tr>
                                        </Table.Tbody>
                                        <Table.Tbody>
                                            {skippedRows.map((err, index) => (
                                                <Table.Tr key={index}>
                                                    <Table.Td>{err.line}</Table.Td>
                                                    <Table.Td>{err.reason}</Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            ) : <Text color="green">No rows were skipped</Text>}
                        </Fieldset>
                    </Grid.Col>
                </Grid>
            </Modal>
        </>
    )
}

export default GroupsView
