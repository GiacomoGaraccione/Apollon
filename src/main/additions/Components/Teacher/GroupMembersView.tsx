import React, { useState, useEffect } from 'react'
import { IconCheck, IconInfoCircle, IconSquareRoundedPlusFilled, IconTrashFilled } from '@tabler/icons-react';
import { Alert, Badge, Button, Center, Fieldset, Grid, MultiSelect, Notification, ScrollArea, Table, Text, Tooltip } from '@mantine/core';
import API from '../../API';
import { User, Roles } from '../Login/UserContext';
import { Group as GroupModel } from '../../Utils/Models';
import { useNavigate, useParams } from 'react-router-dom';
import cx from 'clsx';

function GroupMembersView() {
    const { groupId } = useParams()
    const navigate = useNavigate()
    const [group, setGroup] = useState<GroupModel | undefined>(undefined)
    const [nonMembers, setNonMembers] = useState<User[]>([])
    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [removeLoad, setRemoveLoad] = useState(false)
    const [successNotif, setSuccessNotif] = useState(false)
    const [removeNotif, setRemoveNotif] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    const refresh = () => {
        if (groupId) {
            API.getGroup(groupId).then((g) => {
                setGroup(g)
            })
            API.getNonGroupMembers(groupId).then((users) => {
                setNonMembers(users)
            })
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    const addMembers = () => {
        if (groupId && selectedToAdd.length > 0) {
            setLoading(true)
            API.addGroupMembers(groupId, selectedToAdd).then(() => {
                setLoading(false)
                setSelectedToAdd([])
                refresh()
                setSuccessNotif(true)
                setTimeout(() => setSuccessNotif(false), 2000)
            })
        }
    }

    const removeMember = (userId: string) => {
        if (groupId) {
            setRemoveLoad(true)
            API.removeGroupMember(groupId, userId).then(() => {
                setRemoveLoad(false)
                refresh()
                setRemoveNotif(true)
                setTimeout(() => setRemoveNotif(false), 2000)
            })
        }
    }

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} mb="md">Group: {group?.name}</Badge>
            <Grid justify="center" align="center">
                <Grid.Col span={6}>
                    <Fieldset legend="Members">
                        <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                            <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                                <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                                    <Table.Tr>
                                        <Table.Th>Username</Table.Th>
                                        <Table.Th>User ID</Table.Th>
                                        <Table.Th>Role</Table.Th>
                                        <Table.Th></Table.Th>
                                    </Table.Tr>
                                </Table.Tbody>
                                <Table.Tbody>
                                    {group && group.members.length > 0 ? group.members.map((member) => (
                                        <Table.Tr key={member.userId}>
                                            <Table.Td>{member.username}</Table.Td>
                                            <Table.Td>{member.userId}</Table.Td>
                                            <Table.Td><Badge size="sm" color={member.role === Roles.STUDENT ? "green" : "red"}>{member.role}</Badge></Table.Td>
                                            <Table.Td>
                                                <Tooltip label="Remove from group" position="left" withArrow>
                                                    <Button loading={removeLoad} variant="light" color="red" size="xs" rightSection={<IconTrashFilled size={14} />} onClick={() => removeMember(member.userId)}>Remove</Button>
                                                </Tooltip>
                                            </Table.Td>
                                        </Table.Tr>
                                    )) : <Table.Tr><Table.Td colSpan={4}><Text color='gray'>No members yet</Text></Table.Td></Table.Tr>}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Fieldset legend="Add members">
                        {nonMembers.length > 0 ? <>
                            <MultiSelect
                                label="Users"
                                placeholder="Search by username, user ID, name or surname"
                                searchable
                                data={nonMembers.map((u) => ({ value: u.userId, label: `${u.username} (${u.userId}) - ${u.role}` }))}
                                value={selectedToAdd}
                                onChange={setSelectedToAdd}
                            />
                            <Center mt="md">
                                <Button loading={loading} variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} />} onClick={addMembers} disabled={selectedToAdd.length === 0}>Add selected users</Button>
                            </Center>
                        </> : <Alert variant='light' color="green" icon={<IconInfoCircle />} >All users are already members of this group</Alert>}
                    </Fieldset>
                </Grid.Col>
            </Grid>

            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Members added successfully!</Text>
            </Notification>}
            {removeNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Member removed successfully!</Text>
            </Notification>}

            <Center mt="md">
                <Button variant="light" color="cyan" onClick={() => navigate("/teacher/groups")}>Back to Groups</Button>
            </Center>
        </>
    )
}

export default GroupMembersView
