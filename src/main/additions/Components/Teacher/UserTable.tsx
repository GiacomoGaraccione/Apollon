import React, { useState, useEffect } from 'react'
import { IconCheck, IconChevronDown, IconChevronUp, IconEdit, IconExclamationCircleFilled, IconSearch, IconSelector, IconSquareRoundedPlus, IconSquareRoundedPlusFilled, IconTrashXFilled } from '@tabler/icons-react';
import { Alert, Badge, Button, Center, Fieldset, Group, keys, Modal, Notification, ScrollArea, Stack, Table, Tabs, Text, TextInput, Tooltip, UnstyledButton, } from '@mantine/core';
import cx from 'clsx';
import API from '../../API';
import { User, Roles } from '../Login/UserContext';
import "./style.scss"
import { useDisclosure } from '@mantine/hooks';

interface RowData {
    username: string;
    userId: string;
    name: string;
    surname: string;
    role: Roles;
}

interface ThProps {
    children: React.ReactNode;
    reversed: boolean;
    sorted: boolean
    onSort: () => void
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
    const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector

    return (
        <Table.Th className='th'>
            <UnstyledButton onClick={onSort} className='control'>
                <Group justify='space-between'>
                    <Text fw={500} fz="sm">{children}</Text>
                    <Center className='icon'>
                        <Icon size={16} stroke={1.5} />
                    </Center>
                </Group>
            </UnstyledButton>
        </Table.Th>
    )
}

function filterData(data: User[], search: string) {
    const query = search.toLowerCase().trim()
    if (data.length === 0) return []
    return data.filter((item) =>
        (['username', 'userId', 'name', 'surname', 'role'] as (keyof RowData)[])
            .some((key) => String(item[key]).toLowerCase().includes(query))
    )
}

function sortData(data: User[], payload: { sortBy: keyof RowData | null, reversed: boolean, search: string }) {
    const { sortBy } = payload
    if (!sortBy) return filterData(data, payload.search)

    return filterData(
        [...data].sort((a, b) => {
            const aValue = String(a[sortBy] ?? '')
            const bValue = String(b[sortBy] ?? '')
            if (payload.reversed) {
                return bValue.localeCompare(aValue)
            }
            return aValue.localeCompare(bValue)
        }), payload.search
    )
}

function UserTable(props: { users: User[], location: string, setUsers: React.Dispatch<React.SetStateAction<User[]>>, remove: (studentId: string) => void }) {
    const [sortedUsers, setSortedUsers] = useState<User[]>([])
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState<keyof RowData | null>(null)
    const [reversed, setReversed] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [modalOpened, { open, close }] = useDisclosure(false)
    const [currentStudent, setCurrentStudent] = useState<User | undefined>(undefined)
    const [deleteNotif, setDeleteNotif] = useState(false)
    const [newId, setNewId] = useState("")
    const [editError, setEditError] = useState("")
    const [editLoad, setEditLoad] = useState(false)
    const [deleteLoad, setDeleteLoad] = useState(false)

    useEffect(() => {
        setSortedUsers(props.users)
    }, [props.users])

    const setSorting = (field: keyof RowData) => {
        const reverse = field === sortBy ? !reversed : false
        setReversed(reverse)
        setSortBy(field)
        setSortedUsers(sortData(props.users, { sortBy: field, reversed: reverse, search }))
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget
        setSearch(value)
        if (!value) {
            setSortedUsers(sortData(props.users, { sortBy, reversed, search: "" }))
        }
        setSortedUsers(sortData(props.users, { sortBy, reversed, search: value }))
    }

    const rows = sortedUsers.map((row) => (
        <Table.Tr key={row.userId}>
            <Table.Td>
                {row.role === Roles.STUDENT && props.location === "users" && <Tooltip label="Click to perform user operations" position='right' withArrow>
                    <Badge style={{ cursor: "pointer" }} size="sm" variant='gradient' gradient={{ from: "cyan", to: "lime", deg: 90 }}
                        onClick={() => {
                            setCurrentStudent(row)
                            open()
                        }} > {row.username}</Badge>
                </Tooltip>}
                {row.role === Roles.STUDENT && props.location !== "users" && <Tooltip label="Click to remove this student from the course" position='right' withArrow>
                    <Badge style={{ cursor: "pointer" }} size="sm" variant='gradient' gradient={{ from: "cyan", to: "lime", deg: 90 }}
                        onClick={() => { props.remove(row.userId) }} > {row.username}</Badge>
                </Tooltip>}
                {row.role === Roles.TEACHER && <Badge size="sm" variant='gradient' gradient={{ from: 'red', to: 'yellow', deg: 90 }} >{row.username}</Badge>}
            </Table.Td>
            <Table.Td>{row.userId}</Table.Td>
            <Table.Td>{row.name}</Table.Td>
            <Table.Td>{row.surname}</Table.Td>
            <Table.Td><Badge size="sm" color={row.role === Roles.STUDENT ? "green" : "red"}>{row.role}</Badge></Table.Td>
        </Table.Tr>
    ))

    return (
        <>
            <TextInput placeholder='Search' mb="md" leftSection={<IconSearch size={16} stroke={1.5} />}
                value={search} onChange={handleSearchChange} />
            <ScrollArea h={300} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout='fixed'>
                    <Table.Tbody className={cx("header", { scrolled: scrolled })} >
                        <Table.Tr>
                            <Th sorted={sortBy === "username"} reversed={reversed} onSort={() => setSorting("username")}>Username</Th>
                            <Th sorted={sortBy === "userId"} reversed={reversed} onSort={() => setSorting("userId")}>User ID</Th>
                            <Th sorted={sortBy === "name"} reversed={reversed} onSort={() => setSorting("name")}>Name</Th>
                            <Th sorted={sortBy === "surname"} reversed={reversed} onSort={() => setSorting("surname")}>Surname</Th>
                            <Th sorted={sortBy === "role"} reversed={reversed} onSort={() => setSorting("role")}>Role</Th>
                        </Table.Tr>
                    </Table.Tbody>
                    <Table.Tbody>
                        {rows.length > 0 ? (
                            rows
                        ) : (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <Text color='gray'>No users found</Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </ScrollArea>

            <Modal opened={modalOpened} onClose={() => {
                close()
                setEditError("")
            }} title="User Operations" centered>
                <Tabs defaultValue={"edit"}>
                    <Tabs.List>
                        <Tabs.Tab value="edit" leftSection={<IconEdit size={16} stroke={1.5} />}>Edit student ID</Tabs.Tab>
                        <Tabs.Tab value="delete" leftSection={<IconTrashXFilled size={16} stroke={1.5} />}>Delete</Tabs.Tab>
                        <Tabs.Tab value="enroll" leftSection={<IconSquareRoundedPlus size={16} stroke={1.5} />}>Enroll</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="edit">
                        <Fieldset >
                            <Stack gap="sm" align='center' justify="center" >
                                <Text>Current student ID: <b>{currentStudent?.userId}</b></Text>
                                <TextInput placeholder='New student ID' mt="md" onChange={(event) => setNewId(event.target.value)} />
                                <Group justify='flex-end' mt="md">
                                    <Button loading={editLoad} variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}
                                        onClick={() => {
                                            setEditError("")
                                            if (currentStudent) {
                                                if (!/^[s]\d{0,6}$/.test(newId)) {
                                                    setEditError("Invalid student ID. Format is sXXXXXX.")
                                                    return
                                                }
                                                setEditLoad(true)
                                                API.updateStudentId(currentStudent.username, newId).then(() => {
                                                    API.getAllUsers().then((users) => {
                                                        props.setUsers(users)
                                                        setSortedUsers(users)
                                                    })
                                                }).catch((err: any) => {
                                                    console.log(err)
                                                    setEditLoad(false)
                                                    setEditError(err.message ? err.message : err.error ? err.error : "Error while creating a new user. Please reload the page.")
                                                }).finally(() => {
                                                    setCurrentStudent(undefined)
                                                    close()
                                                    setNewId("")
                                                    setEditLoad(false)
                                                })
                                            }
                                        }} >Update</Button>
                                    <Button variant="light" color="gray" onClick={close}>Cancel</Button>
                                </Group>
                                {editError && <Alert variant="light" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />} color="red" withCloseButton onClose={() => setEditError("")} >{editError}</Alert>}
                            </Stack>
                        </Fieldset>
                    </Tabs.Panel>
                    <Tabs.Panel value="delete">
                        <Stack gap="sm" align='center' justify="center" >
                            <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                                Are you sure you want to delete student <b>{currentStudent?.username}</b>?
                                This action will erase the student's data across all courses and cannot be undone.
                            </Alert>
                            <Group mt="md" justify='flex-end'>
                                <Button loading={deleteLoad} variant="light" color="red" rightSection={<IconTrashXFilled size={16} stroke={1.5} />}
                                    onClick={() => {
                                        if (currentStudent) {
                                            setDeleteLoad(true)
                                            API.deleteUser(currentStudent.username).then(() => {
                                                API.getAllUsers().then((users) => {
                                                    setDeleteLoad(false)
                                                    props.setUsers(users)
                                                    setSortedUsers(users)
                                                    setCurrentStudent(undefined)
                                                    close()
                                                    setDeleteNotif(true)
                                                    setTimeout(() => setDeleteNotif(false), 3000)
                                                })
                                            })
                                        }
                                    }} >Delete student</Button>
                                <Button variant="light" color="gray" onClick={close}>Cancel</Button>
                            </Group>
                        </Stack>
                    </Tabs.Panel>
                    <Tabs.Panel value="enroll">
                        <Text>Enrolling student</Text>
                    </Tabs.Panel>
                </Tabs>
            </Modal>

            {deleteNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>User cancellation successful!</Text>
            </Notification>}
        </>
    )
}

export default UserTable