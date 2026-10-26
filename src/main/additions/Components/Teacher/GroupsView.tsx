import React, { useState, useEffect } from 'react'
import { IconCheck, IconExclamationCircleFilled, IconSquareRoundedPlusFilled, IconTrashFilled, IconTrashXFilled, IconUsersGroup, IconX } from '@tabler/icons-react';
import { Alert, Badge, Button, Fieldset, Flex, Grid, Group, Modal, MultiSelect, Notification, ScrollArea, Stack, Table, Text, TextInput, Tooltip, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import cx from 'clsx';
import API from '../../API';
import "./style.scss"
import { Group as GroupModel } from '../../Utils/Models';
import { User } from '../Login/UserContext';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';

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
                <Grid.Col span={12}>
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
        </>
    )
}

export default GroupsView
