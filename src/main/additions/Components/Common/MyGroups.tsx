import React, { useEffect, useState, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Fieldset, Stack, Loader } from "@mantine/core";
import API from "../../API";
import { Roles, UserContext } from "../Login/UserContext";
import { IconExclamationCircle } from "@tabler/icons-react";
import { Group } from "../../Utils/Models";
import { useNavigate } from "react-router-dom";

function MyGroups() {
    const user = useContext(UserContext)
    const [groups, setGroups] = useState<Group[]>([])
    const [load, setLoad] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            API.getMyGroups().then((gs) => {
                setGroups(gs)
                setLoad(false)
            }).catch(() => {
                setGroups([])
                setLoad(false)
            })
        }
    }, [user])

    return (
        <>
            {user?.role === Roles.TEACHER && (
                <Alert variant="light" color="cyan" mb="md">
                    As a teacher you can also access every group's workspace, and manage groups and their members, from the <b>Manage Groups</b> page.
                    <Center mt="sm">
                        <Button variant="light" color="cyan" onClick={() => navigate("/teacher/groups")}>Manage Groups</Button>
                    </Center>
                </Alert>
            )}
            <Fieldset legend="Your groups" style={{ width: "100%" }}>
                <Flex direction="column" gap={10} style={{ width: "100%" }}>
                    {load && <Center><Loader size={100} type={"bars"} color="cyan" /></Center>}
                    {!load && groups.length === 0 && (
                        <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No groups found!" >
                            You are not a member of any group yet. Ask a teacher to add you to one.
                        </Alert>
                    )}
                    {!load && groups.map((group) => (
                        <Card key={group.groupId} shadow="sm" padding="lg" style={{ width: "100%", margin: "auto", cursor: "pointer" }}
                            onClick={() => navigate("/groups/" + group.groupId + "/workspace")}>
                            <Flex align="flex-start" gap={16}>
                                <Stack style={{ flex: 1, minWidth: 0 }}>
                                    <Text w={500} size="lg">{group.name}</Text>
                                    <Text w={500} size="sm" color="dimmed">{group.members.length} member{group.members.length !== 1 ? "s" : ""}</Text>
                                    <Text w={500} size="sm">{group.diagramCount} diagram{group.diagramCount !== 1 ? "s" : ""} in the workspace</Text>
                                </Stack>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            </Fieldset>
        </>
    )
}

export default MyGroups
