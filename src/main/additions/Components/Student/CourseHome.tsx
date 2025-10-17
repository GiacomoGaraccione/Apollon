import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Stack, TextInput, NativeSelect, Notification, Textarea, Group, Loader, Badge, Avatar, Tooltip, Radio, Progress, Divider, Skeleton } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconExclamationCircle, IconInfoCircle, IconLockFilled, IconSquareRoundedPlusFilled } from "@tabler/icons-react";
import { Course } from "../../Utils/Models";
import { AvatarAccessories, AvatarAccessoriesColors, AvatarClothesColors, AvatarClothingGraphics, AvatarClothings, AvatarFacialHairColors, AvatarFacialHairs, AvatarHairColors, AvatarHatColors, AvatarSkinColors, AvatarTops, AvatarUnlockOptions, BackgroundColors, generateRandomAvatar, generateRandomLvl1Avatar, getAvailableAvatarProps } from "../../Utils/AvatarUtils";
import { useNavigate, useParams } from "react-router-dom";
import "./style.scss"
import { createAvatar } from "@dicebear/core"
import { avataaars, bottts } from '@dicebear/collection';
import Leaderboard from "./Leaderboard";
import ErrorTutorial from "./ErrorTutorial";
import SolutionViewer from "./SolutionViewer";

function CourseHome() {
    const user = useContext(UserContext)
    const { courseId } = useParams()
    const [courseInfo, setCourseInfo] = useState<any>(null)
    const [course, setCourse] = useState<Course | null>(null)
    const [avatarOptions, setAvatarOptions] = useState<any>(null)
    const [avatarString, setAvatarString] = useState<string>("")
    const [avatarSettings, setAvatarSettings] = useState<AvatarUnlockOptions>({} as AvatarUnlockOptions)
    const [notif, setNotif] = useState<boolean>(false)
    const [level, setLevel] = useState<number>(1)
    const [experience, setExperience] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(false)
    const [saved, setSaved] = useState<boolean>(false)
    const [rankingType, setRankingType] = useState<string>("level")
    const [currentExercise, setCurrentExercise] = useState<string | null>(null)
    const [levelInfo, setLevelInfo] = useState<any>(null)
    const [load, setLoad] = useState<boolean>(true)
    const [completedExercises, setCompletedExercises] = useState<any[]>([])
    const [maxLevel, setMaxLevel] = useState<boolean>(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (courseId && user) {
            try {
                API.getCourseInfo(courseId).then((c) => {
                    setCourse(c)
                    API.getStudentCourseInfo(courseId, user.username).then((studentCourse) => {
                        setCourseInfo(studentCourse.info)
                        let settings = c.settings as AvatarUnlockOptions
                        setAvatarSettings(settings)
                        if (!studentCourse.info) {
                            setNotif(true)
                            let avatarOpts = generateRandomLvl1Avatar(c.settings as AvatarUnlockOptions)
                            avatarOpts.accessoriesProbability = 0
                            setAvatarOptions(avatarOpts)
                            let svg = createAvatar(avataaars, avatarOpts).toString()
                            setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
                            setLevel(1)
                            let levelInfo = c.gameOptions!.levels[0]
                            setLevelInfo(levelInfo)
                            setTimeout(() => {
                                setNotif(false)
                            }, 5000)
                        } else {
                            setLevel(studentCourse.info.level)
                            setExperience(studentCourse.info.experience)
                            let avatarOpts = JSON.parse(studentCourse.info.avatar)
                            setAvatarOptions(avatarOpts)
                            let svg = createAvatar(avataaars, avatarOpts).toString()
                            setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
                            let levelInfo = c.gameOptions!.levels.find((l: any) => l.min <= studentCourse.info.experience && l.max > studentCourse.info.experience)
                            if (!levelInfo && studentCourse.info.experience >= c.gameOptions!.levels[c.gameOptions!.levels.length - 1].max) {
                                levelInfo = {
                                    min: c.gameOptions!.levels[c.gameOptions!.levels.length - 1].max,
                                    max: studentCourse.info.experience,
                                    level: c.gameOptions!.levels[c.gameOptions!.levels.length - 1].level
                                }
                                setMaxLevel(true)
                            }
                            setLevel(levelInfo.level)
                            API.updateStudentCourseInfo(courseId, user.username, levelInfo.level, studentCourse.info.experience, JSON.parse(studentCourse.info.avatar))
                            setLevelInfo(levelInfo)
                        }

                        setLoad(false)
                    }).then(() => {
                        API.getStudentCompletedExercises(courseId, user.username).then((ce) => {
                            setCompletedExercises(ce)
                        })
                    })
                })
            } catch (error) {
                console.error("Error fetching course info:", error);
            }
        }
    }, [])

    const handleSave = () => {
        if (courseId && user) {
            setLoading(true)
            API.updateStudentCourseInfo(courseId, user.username, level, experience, avatarOptions).then((res) => {
                setLoading(false)
                setSaved(true)
                setTimeout(() => {
                    setSaved(false)
                }, 4000)
                if (!courseInfo) {
                    API.getStudentCourseInfo(courseId, user.username).then((studentCourse) => {
                        setCourseInfo(studentCourse.info)
                        setLevel(studentCourse.info.level)
                        setExperience(studentCourse.info.experience)
                        let levelInfo = course!.gameOptions!.levels.find((l: any) => l.min <= studentCourse.info.experience && l.max > studentCourse.info.experience)
                        if (!levelInfo && studentCourse.info.experience >= course!.gameOptions!.levels[course!.gameOptions!.levels.length - 1].max) {
                            levelInfo = {
                                min: course!.gameOptions!.levels[course!.gameOptions!.levels.length - 1].max,
                                max: studentCourse.info.experience,
                                level: course!.gameOptions!.levels[course!.gameOptions!.levels.length - 1].level
                            }
                            setMaxLevel(true)
                        }
                    })
                }
            })
        }
    }

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Grid my="md" grow justify="center" align="center">
                <Grid.Col span={12}>
                    <Tabs defaultValue="avatar" variant="pills" color="cyan" style={{ width: "100%" }}>
                        <Tabs.List>
                            <Tabs.Tab value="avatar">Avatar</Tabs.Tab>
                            <Tabs.Tab value="exercises">Exercises</Tabs.Tab>
                            <Tabs.Tab value="leaderboards">Leaderboards</Tabs.Tab>
                            <Tabs.Tab value="solutions">Solutions</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="avatar">
                            <Grid justify="center" align="center">
                                <Grid.Col span={3}>
                                    <Fieldset legend="Your Current Avatar" style={{ width: "100%" }}>
                                        <Skeleton visible={load}>
                                            <><Stack align="center">
                                                <Avatar src={avatarString} size={200} radius="xl" />
                                                <Text fw={700} size="lg">Level: {level}</Text>
                                            </Stack>
                                                <Divider my="sm" variant="dashed" />
                                                {levelInfo && <>{!maxLevel && <Text size="sm" color="dimmed" mb={4}>XP needed to reach the next level:</Text>}
                                                    {maxLevel && <Text size="sm" color="dimmed" mb={4}>You have reached the maximum level!</Text>}
                                                    <Group justify="space-between" mb={4}>
                                                        <Text size="xs" color="dimmed">
                                                            {levelInfo.min} XP
                                                        </Text>
                                                        <Text size="xs" color="dimmed">
                                                            {levelInfo.max} XP
                                                        </Text>
                                                    </Group>
                                                    <Progress.Root size="xl">
                                                        <Progress.Section value={((experience - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100} color="green" striped animated>
                                                            <Progress.Label>
                                                                {experience} XP
                                                            </Progress.Label>
                                                        </Progress.Section>
                                                    </Progress.Root>
                                                    <Divider my="sm" variant="dashed" />
                                                </>}

                                                <Text size="sm" w={"auto"} color="gray">You can change your avatar's appearance using the menu on the right.</Text>
                                                {!courseInfo && <>
                                                    <Text size="sm" w={"auto"} color="gray">Please note that this avatar was generated with random available props.</Text>
                                                    <Text size="sm" w={"auto"} color="gray">It is not possible to start exercises unless you save your avatar first.</Text>
                                                </>}
                                                <Center>
                                                    <Button onClick={handleSave} variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                                        Save Avatar
                                                    </Button>
                                                </Center>
                                            </>
                                        </Skeleton>
                                    </Fieldset>
                                </Grid.Col>
                                <Grid.Col span={9}>
                                    <Fieldset legend="Your Avatar Options" style={{ width: "100%" }}>
                                        {Object.keys(avatarSettings).length > 0 && avatarOptions && <Tabs defaultValue="accessories" variant="pills" color="cyan">
                                            <Tabs.List>
                                                <Tabs.Tab value="accessories">Accessories</Tabs.Tab>
                                                <Tabs.Tab value="accessoriesColors">Accessories Colors</Tabs.Tab>
                                                <Tabs.Tab value="clothesColor">Clothes Color</Tabs.Tab>
                                                <Tabs.Tab value="clothing">Clothing</Tabs.Tab>
                                                <Tabs.Tab value="clothingGraphic">Clothing Graphics</Tabs.Tab>
                                                <Tabs.Tab value="facialHair">Facial Hair</Tabs.Tab>
                                                <Tabs.Tab value="facialHairColor">Facial Hair Color</Tabs.Tab>
                                                <Tabs.Tab value="hairColor">Hair Color</Tabs.Tab>
                                                <Tabs.Tab value="hatColor">Headgear Color</Tabs.Tab>
                                                <Tabs.Tab value="skinColor">Skin Color</Tabs.Tab>
                                                <Tabs.Tab value="top">Top</Tabs.Tab>
                                                <Tabs.Tab value="background">Background</Tabs.Tab>
                                            </Tabs.List>
                                            <Tabs.Panel value="background" key={"background"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(BackgroundColors).map((key) => {
                                                        let value = BackgroundColors[key as keyof typeof BackgroundColors]
                                                        let avatarOpts = { ...avatarOptions, backgroundColor: [value] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        return (
                                                            <Stack align="center">
                                                                <Card shadow="sm" padding="lg" radius="md" withBorder key={key} style={{ width: 'fit-content', margin: 'auto', cursor: "pointer", border: avatarOptions.backgroundColor[0] === value ? '5px solid cyan' : undefined }} onClick={() => {
                                                                    if (avatarOptions) {
                                                                        let botOpts = { ...avatarOptions, backgroundColor: [value] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}>
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                </Card>
                                                            </Stack>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="accessories" key={"accessories"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarAccessories).map((key) => {
                                                        let value = AvatarAccessories[key as keyof typeof AvatarAccessories]
                                                        let avatarOpts = { ...avatarOptions, accessories: [value], accessoriesProbability: 100 }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.accessories.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.accessories[0] === value && avatarOptions.accessoriesProbability > 0 ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, accessories: [value], accessoriesProbability: 100 }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}
                                                            >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ width: 'fit-content', margin: 'auto', cursor: 'pointer', border: avatarOptions.accessoriesProbability === 0 ? '5px solid cyan' : undefined }}
                                                        onClick={() => {
                                                            let avatarOpts = { ...avatarOptions, accessoriesProbability: 0 }
                                                            let svg = createAvatar(avataaars, avatarOpts).toString()
                                                            setAvatarOptions(avatarOpts)
                                                            setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
                                                        }}
                                                    >
                                                        <Stack align="center">
                                                            <Text>{"None"}</Text>
                                                            <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(createAvatar(avataaars, { ...avatarOptions, accessoriesProbability: 0 }).toString())}`} size={100} radius="xl" />
                                                            <Flex align="center" gap="xs">
                                                                <IconCheck size={15} color="green" />
                                                                <Text size="sm" color="green">Unlocked</Text>
                                                            </Flex>
                                                        </Stack>
                                                    </Card>
                                                </Flex>

                                            </Tabs.Panel>
                                            <Tabs.Panel value="accessoriesColors" key={"accessoriesColors"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarAccessoriesColors).map((key) => {
                                                        let value = AvatarAccessoriesColors[key as keyof typeof AvatarAccessoriesColors]
                                                        let currentAcc = avatarOptions.accessories[0]
                                                        let avatarOpts = { ...avatarOptions, accessoriesColor: [value], accessoriesProbability: 100, accessories: [currentAcc] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.accessoriesColor.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.accessoriesColor[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, accessoriesColor: [value], accessoriesProbability: 100, accessories: [currentAcc] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}
                                                            >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="clothesColor" key={"clothesColor"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarClothesColors).map((key) => {
                                                        let value = AvatarClothesColors[key as keyof typeof AvatarClothesColors]
                                                        let avatarOpts = { ...avatarOptions, clothesColor: [value] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.clothesColor.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.clothesColor[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, clothesColor: [value] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="clothing" key={"clothing"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarClothings).map((key) => {
                                                        let value = AvatarClothings[key as keyof typeof AvatarClothings]
                                                        let avatarOpts = { ...avatarOptions, clothing: [value] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.clothing.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.clothing[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, clothing: [value] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="clothingGraphic" key={"clothingGraphic"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarClothingGraphics).map((key) => {
                                                        let value = AvatarClothingGraphics[key as keyof typeof AvatarClothingGraphics]
                                                        let avatarOpts = { ...avatarOptions, clothingGraphic: [value], clothing: ["graphicShirt"] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.clothingGraphic.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.clothingGraphic[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, clothingGraphic: [value], clothing: ["graphicShirt"] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="facialHair" key={"facialHair"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarFacialHairs).map((key) => {
                                                        let value = AvatarFacialHairs[key as keyof typeof AvatarFacialHairs]
                                                        let avatarOpts = { ...avatarOptions, facialHair: [value], facialHairProbability: 100 }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.facialHair.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.facialHair[0] === value && avatarOptions.facialHairProbability !== 0 ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, facialHair: [value], facialHairProbability: 100 }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ width: 'fit-content', margin: 'auto', cursor: 'pointer', border: avatarOptions.facialHairProbability === 0 ? '5px solid cyan' : undefined }} onClick={() => {
                                                        if (avatarOptions) {
                                                            let avatarOpts = { ...avatarOptions, facialHairProbability: 0 }
                                                            let svg = createAvatar(avataaars, avatarOpts).toString()
                                                            setAvatarOptions(avatarOpts)
                                                            setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
                                                        }
                                                    }}>
                                                        <Stack align="center">
                                                            <Text>{"None"}</Text>
                                                            <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(createAvatar(avataaars, { ...avatarOptions, facialHairProbability: 0 }).toString())}`} size={100} radius="xl" />
                                                            <Flex align="center" gap="xs">
                                                                <IconCheck size={15} color="green" />
                                                                <Text size="sm" color="green">Unlocked</Text>
                                                            </Flex>
                                                        </Stack>
                                                    </Card>
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="facialHairColor" key={"facialHairColor"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarFacialHairColors).map((key) => {
                                                        let value = AvatarFacialHairColors[key as keyof typeof AvatarFacialHairColors]
                                                        let currentFacialHair = avatarOptions.facialHair[0]
                                                        let avatarOpts = { ...avatarOptions, facialHairColor: [value], facialHairProbability: 100, facialHair: [currentFacialHair] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.facialHairColor.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.facialHairColor[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, facialHairColor: [value], facialHairProbability: 100, facialHair: [currentFacialHair] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="hairColor" key={"hairColor"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarHairColors).map((key) => {
                                                        let value = AvatarHairColors[key as keyof typeof AvatarHairColors]
                                                        let avatarOpts = { ...avatarOptions, hairColor: [value] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.hairColor.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.hairColor[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, hairColor: [value] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="hatColor" key={"hatColor"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarHatColors).map((key) => {
                                                        let value = AvatarHatColors[key as keyof typeof AvatarHatColors]
                                                        let currentHat = "hat"
                                                        let avatarOpts = { ...avatarOptions, hatColor: [value], hatProbability: 100, top: [currentHat] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.hatsColor.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.hatColor[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, hatColor: [value], hatProbability: 100, top: [currentHat] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="skinColor" key={"skinColor"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarSkinColors).map((key) => {
                                                        let value = AvatarSkinColors[key as keyof typeof AvatarSkinColors]
                                                        let avatarOpts = { ...avatarOptions, skinColor: [value] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.skinColor.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.skinColor[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, skinColor: [value] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                            <Tabs.Panel value="top" key={"top"}>
                                                <Flex wrap="wrap" gap="xs" justify="center">
                                                    {Object.keys(AvatarTops).map((key) => {
                                                        let value = AvatarTops[key as keyof typeof AvatarTops]
                                                        let avatarOpts = { ...avatarOptions, top: [value] }
                                                        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
                                                        let opts = avatarSettings.top.find((v: any) => v.name === value)
                                                        let unlocked = opts?.unlockConditions[0].type === "level" && opts?.unlockConditions[0].minLevel <= level
                                                        let unlockLevel = opts?.unlockConditions[0].type === "level" ? opts?.unlockConditions[0].minLevel : 1
                                                        return (
                                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={key}
                                                                style={{ width: 'fit-content', margin: 'auto', opacity: unlocked ? 1 : 0.4, filter: unlocked ? 'none' : 'grayscale(80%)', cursor: unlocked ? 'pointer' : 'not-allowed', border: avatarOptions.top[0] === value ? '5px solid cyan' : undefined }}
                                                                onClick={() => {
                                                                    if (avatarOptions && unlocked) {
                                                                        let botOpts = { ...avatarOptions, top: [value] }
                                                                        let avatarString = createAvatar(avataaars, botOpts).toString();
                                                                        setAvatarOptions(botOpts);
                                                                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                                                                    }
                                                                }}   >
                                                                {unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconCheck size={15} color="green" />
                                                                        <Text size="sm" color="green">Unlocked</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                                {!unlocked && <Stack align="center">
                                                                    <Text>{key}</Text>
                                                                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                                                                    <Flex align="center" gap="xs">
                                                                        <IconLockFilled size={15} color="gray" />
                                                                        <Text size="sm" color="gray">Level {unlockLevel} required</Text>
                                                                    </Flex>
                                                                </Stack>}
                                                            </Card>
                                                        )
                                                    })}
                                                </Flex>
                                            </Tabs.Panel>
                                        </Tabs>}
                                        {(Object.keys(avatarSettings).length === 0 || !avatarOptions) && <Center>
                                            <Loader size={100} type={"bars"} color="cyan" style={{ margin: "auto" }} />
                                        </Center>}
                                    </Fieldset>
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>

                        <Tabs.Panel value="exercises">
                            <Grid justify="center" align="center">
                                <Grid.Col span={12}>
                                    <Fieldset legend="Exercises" style={{ width: "100%" }}>
                                        {!course && <Center>
                                            <Loader size={100} type={"bars"} color="cyan" style={{ margin: "auto" }} />
                                        </Center>}
                                        {course && <>
                                            {course.exercises.filter((ex) => ex.visible).length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No exercises available" color="yellow">
                                                There are no exercises available for this course yet.
                                            </Alert>}
                                            <Flex direction="column" gap={10} style={{ width: "100%" }}>
                                                {course.exercises.filter((ex) => ex.visible).map((exercise) => {
                                                    let isCompleted = completedExercises.find((ex) => ex.exerciseId === exercise.exerciseId)
                                                    let bossStr = exercise.boss?.bossOptions
                                                    return (
                                                        <Card key={exercise.exerciseId} shadow="sm" padding="lg" radius="md" withBorder
                                                            style={{ borderColor: isCompleted ? "#b07100" : "", backgroundColor: isCompleted ? "#ffdd9a" : "", width: '100%', margin: 'auto', cursor: 'pointer', position: 'relative', overflow: 'hidden', }}
                                                            onClick={() => {
                                                                if (courseInfo) {
                                                                    navigate(`/student/courses/${courseId}/exercises/${exercise.exerciseId}`)
                                                                } else {
                                                                    alert("Your avatar has not been saved yet. Please make sure to save it before accessing exercises.")
                                                                }
                                                            }}>
                                                            {isCompleted && (
                                                                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, background: "linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.2) 100%)", animation: "shine 1.5s infinite linear", }} />
                                                            )}
                                                            <style>
                                                                {` @keyframes shine { 0% { transform: translateX(-100%); opacity: 0.7; } 50% { transform: translateX(100%);  opacity: 1; } 100% { transform: translateX(200%); opacity: 0.7;  }  } `}
                                                            </style>
                                                            <Flex align="center" justify="space-between">
                                                                <div>
                                                                    <Text color="green">{exercise.title}</Text>
                                                                    <Flex align="center" gap="xs">
                                                                        {exercise.gamified && <>
                                                                            <Text size="sm">Level: {exercise.level}</Text>
                                                                            <Text size="sm" >Reward: {exercise.experience} XP</Text>
                                                                        </>}
                                                                    </Flex>
                                                                </div>
                                                                {isCompleted && <Tooltip label="You defeated this boss!">
                                                                    <Avatar
                                                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(createAvatar(bottts, JSON.parse(bossStr)).toString())}`}
                                                                        size={80}
                                                                        radius="md"
                                                                    />
                                                                </Tooltip>}
                                                            </Flex>
                                                        </Card>
                                                    )
                                                })}
                                            </Flex>

                                        </>}
                                    </Fieldset>
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>

                        <Tabs.Panel value="leaderboards">
                            <Grid justify="center" align="center">
                                <Grid.Col span={3}>
                                    <Fieldset legend="Available rankings">
                                        <Radio.Group label="Choose a ranking type" style={{ width: "100%" }} value={rankingType} >
                                            <Stack pt="md" gap="xs">
                                                <Radio.Card style={{
                                                    position: "relative",
                                                    padding: "var(--mantine-spacing-md)",
                                                    transition: "border-color 150ms ease",
                                                }} radius={"md"} value="level" key="level" onClick={() => {
                                                    setRankingType("level")
                                                    setCurrentExercise(null)
                                                }}>
                                                    <Group wrap="nowrap" align="flex-start">
                                                        <Radio.Indicator />
                                                        <div>
                                                            <Text style={{
                                                                fontFamily: "var(--mantine-font-family-monospace)",
                                                                fontWeight: "bold",
                                                                fontSize: "var(--mantine-font-size-md)",
                                                                lineHeight: 1.3,
                                                                color: "var(--mantine-color-cyan-7)"
                                                            }}>Level and XP</Text>
                                                        </div>
                                                    </Group>
                                                </Radio.Card>
                                                <Radio.Card style={{
                                                    position: "relative",
                                                    padding: "var(--mantine-spacing-md)",
                                                    transition: "border-color 150ms ease",

                                                }} radius={"md"} value="completedExs" key="completedExs" onClick={() => {
                                                    setRankingType("completedExs")
                                                    setCurrentExercise(null)
                                                }}>
                                                    <Group wrap="nowrap" align="flex-start">
                                                        <Radio.Indicator />
                                                        <div>
                                                            <Text style={{
                                                                fontFamily: "var(--mantine-font-family-monospace)",
                                                                fontWeight: "bold",
                                                                fontSize: "var(--mantine-font-size-md)",
                                                                lineHeight: 1.3,
                                                                color: "var(--mantine-color-cyan-7)"
                                                            }}>Completed Exercises</Text>
                                                        </div>
                                                    </Group>
                                                </Radio.Card>
                                                {course?.exercises.filter((ex) => ex.visible && ex.gamified).map((exercise) => (
                                                    <Radio.Card style={{
                                                        position: "relative",
                                                        padding: "var(--mantine-spacing-md)",
                                                        transition: "border-color 150ms ease",

                                                    }} radius={"md"} value="exercise" key={exercise.exerciseId} onClick={() => {
                                                        setRankingType("exercise")
                                                        setCurrentExercise(exercise.exerciseId)
                                                    }} checked={currentExercise === exercise.exerciseId}>
                                                        <Group wrap="nowrap" align="flex-start">
                                                            <Radio.Indicator />
                                                            <div>
                                                                <Text style={{
                                                                    fontFamily: "var(--mantine-font-family-monospace)",
                                                                    fontWeight: "bold",
                                                                    fontSize: "var(--mantine-font-size-md)",
                                                                    lineHeight: 1.3,
                                                                    color: "var(--mantine-color-cyan-7)"
                                                                }}>Completeness in exercise: {exercise.title}</Text>
                                                            </div>
                                                        </Group>
                                                    </Radio.Card>
                                                ))}
                                            </Stack>
                                        </Radio.Group>
                                    </Fieldset>
                                </Grid.Col>
                                <Grid.Col span={9}>
                                    <Fieldset legend="Leaderboard" style={{ width: "100%" }}>
                                        <Leaderboard ranking={rankingType} exerciseId={currentExercise ?? undefined} />
                                    </Fieldset>
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>

                        <Tabs.Panel value="solutions">
                            <SolutionViewer />
                        </Tabs.Panel>
                    </Tabs>
                </Grid.Col>
            </Grid>

            {notif && <Notification color="yellow" mt="md" className='notif' withCloseButton={false} >
                <Alert variant="light" color="yellow" icon={<IconExclamationCircle size={16} />} title="Warning!" >
                    You do not have an avatar yet! Please create one using the <b>Avatar</b> tab.
                </Alert>
            </Notification>}
            {loading && <Notification loading={true} color="teal" title="Loading" mt="md" className='notif' withCloseButton={false}>
                <Text>Saving avatar changes...</Text>
            </Notification>}
            {saved && <Notification color="teal" title="Success" mt="md" className='notif' withCloseButton={false}>
                <Text>Avatar changes saved successfully!</Text>
            </Notification>}

        </>
    )
}


export default CourseHome