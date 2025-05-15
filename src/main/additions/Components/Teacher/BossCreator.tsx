import React, { useState, useEffect, useRef } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconInfoCircle, IconSquareRoundedPlusFilled, IconX } from '@tabler/icons-react';
import { Avatar, Badge, Button, Card, Center, Divider, Fieldset, Flex, Grid, Group, Image, Modal, NativeSelect, Notification, ScrollArea, Stack, Table, Tabs, Text, TextInput, } from '@mantine/core';
import { useForm, } from "@mantine/form"
import cx from 'clsx';
import API from '../../API';
import { User, Roles } from '../Login/UserContext';
import UserTable from './UserTable';
import "./style.scss"
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { createAvatar } from "@dicebear/core"
import { bottts } from '@dicebear/collection';
import { BotBaseColors, BotEyes, BotFaces, BotMouths, BotSides, BotTextures, BotTops, generateRandomBot } from '../../Utils/AvatarUtils';

function BossCreator() {
    const { courseId, exerciseId } = useParams()
    const [botString, setBotString] = useState<string>("")
    const [botOptions, setBotOptions] = useState<any>(generateRandomBot())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successNotif, setSuccessNotif] = useState(false)
    const navigate = useNavigate()


    useEffect(() => {
        if (exerciseId && courseId) {
            API.getCourse(courseId).then((c) => {
                let ex = c.exercises.find((e) => e.exerciseId === exerciseId)
                if (ex) {
                    let botOpts
                    if (ex.boss) {
                        form.setFieldValue("introDialogue", ex.boss.introDialogue)
                        form.setFieldValue("victoryDialogue", ex.boss.victoryDialogue)
                    }
                    ex.boss ? botOpts = JSON.parse(ex.boss.bossOptions) : botOpts = generateRandomBot()
                    setBotOptions(botOpts)
                    let avatarString = createAvatar(bottts, botOpts).toString()
                    setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                }


            })
        }
    }, [])

    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            introDialogue: "",
            victoryDialogue: ""
        },
        validate: (values) => ({
            introDialogue: values.introDialogue.length > 0 ? null : "Intro Dialogue is required",
            victoryDialogue: values.victoryDialogue.length > 0 ? null : "Victory Dialogue is required",
        })
    })

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Grid justify='center' align='center'>
                <Grid.Col span={4}>
                    <Fieldset legend="Boss Dialogues">
                        <form onSubmit={form.onSubmit((values) => {
                            if (courseId && exerciseId) {
                                setLoading(true)
                                API.createBoss(courseId, exerciseId, values.introDialogue, values.victoryDialogue, botOptions).then((res) => {
                                    setLoading(false)
                                    setSuccessNotif(true)
                                    setError(null)
                                    navigate(`/teacher/courses/${courseId}`)
                                    setTimeout(() => {
                                        setSuccessNotif(false)
                                    }, 2000);
                                }).catch((err) => {
                                    setLoading(false)
                                    setError(err.message)
                                    setSuccessNotif(false)
                                    setTimeout(() => {
                                        setError(null)
                                    }, 2000);
                                })
                            }
                        })}>
                            <Stack>
                                <Image radius="xl" src={botString} alt="Boss Avatar" />
                                <TextInput label="Intro Dialogue" placeholder="Intro Dialogue" {...form.getInputProps("introDialogue")} />
                                <TextInput label="Victory Dialogue" placeholder="Victory Dialogue" {...form.getInputProps("victoryDialogue")} />
                            </Stack>
                            <Center mt="md">
                                <Button variant="light" color="green" type='submit' rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save Boss
                                </Button>
                            </Center>
                        </form>

                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={8}>
                    <Fieldset legend="Boss Pieces">
                        <Tabs defaultValue="color" variant="pills" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="color">Color</Tabs.Tab>
                                <Tabs.Tab value="eyes">Eyes</Tabs.Tab>
                                <Tabs.Tab value="face">Face</Tabs.Tab>
                                <Tabs.Tab value="mouth">Mouth</Tabs.Tab>
                                <Tabs.Tab value="side">Side</Tabs.Tab>
                                <Tabs.Tab value="texture">Texture</Tabs.Tab>
                                <Tabs.Tab value="top">Top</Tabs.Tab>
                                <Tabs.Tab value="background">Background Color</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="color">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotBaseColors).map((key) => {
                                        let color = BotBaseColors[key as keyof typeof BotBaseColors]
                                        let botOpts = { ...botOptions, baseColor: [color] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: color === botOptions.baseColor[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, baseColor: [BotBaseColors[key as keyof typeof BotBaseColors]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={color}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="eyes">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotEyes).map((key) => {
                                        let eye = BotEyes[key as keyof typeof BotEyes]
                                        let botOpts = { ...botOptions, eyes: [eye] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: eye === botOptions.eyes[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, eyes: [BotEyes[key as keyof typeof BotEyes]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={"#000000"}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="face">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotFaces).map((key) => {
                                        let face = BotFaces[key as keyof typeof BotFaces]
                                        let botOpts = { ...botOptions, face: [face] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: face === botOptions.face[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, face: [BotFaces[key as keyof typeof BotFaces]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={"#000000"}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="mouth">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotMouths).map((key) => {
                                        let mouth = BotMouths[key as keyof typeof BotMouths]
                                        let botOpts = { ...botOptions, mouth: [mouth] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: mouth === botOptions.mouth[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, mouth: [BotMouths[key as keyof typeof BotMouths]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={"#000000"}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="side">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotSides).map((key) => {
                                        let side = BotSides[key as keyof typeof BotSides]
                                        let botOpts = { ...botOptions, sides: [side] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: side === botOptions.sides[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, sides: [BotSides[key as keyof typeof BotSides]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={"#000000"}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="texture">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotTextures).map((key) => {
                                        let texture = BotTextures[key as keyof typeof BotTextures]
                                        let botOpts = { ...botOptions, texture: [texture] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: texture === botOptions.texture[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, texture: [BotTextures[key as keyof typeof BotTextures]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={"#000000"}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="top">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotTops).map((key) => {
                                        let top = BotTops[key as keyof typeof BotTops]
                                        let botOpts = { ...botOptions, top: [top] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: top === botOptions.top[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, top: [BotTops[key as keyof typeof BotTops]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={"#000000"}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                            <Tabs.Panel value="background">
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {Object.keys(BotBaseColors).map((key) => {
                                        let color = BotBaseColors[key as keyof typeof BotBaseColors]
                                        let botOpts = { ...botOptions, backgroundColor: [color] }
                                        let botStr = createAvatar(bottts, botOpts).toString()
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: color === botOptions.backgroundColor[0] ? '5px solid cyan' : undefined
                                            }} onClick={() => {
                                                let botOpts = { ...botOptions, backgroundColor: [BotBaseColors[key as keyof typeof BotBaseColors]] }
                                                let avatarString = createAvatar(bottts, botOpts).toString()
                                                setBotOptions(botOpts)
                                                setBotString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`)
                                            }} >
                                                <Stack align="center" >
                                                    <Text>{key}</Text>
                                                    <Image w={100} fit="contain" h={100}
                                                        radius="xl"
                                                        color={color}
                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(botStr)}`}
                                                        alt="Boss Avatar" />
                                                </Stack>
                                            </Card>
                                        )
                                    })}
                                </Flex>
                            </Tabs.Panel>
                        </Tabs>
                    </Fieldset>
                </Grid.Col>
            </Grid>
            {successNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Exercise Boss was successfully updated!</Text>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Saving in progress...</Text>
            </Notification>}
        </>
    )
}

export default BossCreator