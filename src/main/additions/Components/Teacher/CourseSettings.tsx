import React, { useState, useEffect, useRef } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconInfoCircle, IconSquareRoundedPlusFilled, IconUpload, IconX } from '@tabler/icons-react';
import { Avatar, Badge, Button, Card, Center, Divider, Fieldset, Flex, Grid, Group, Image, Modal, NativeSelect, Notification, NumberInput, Progress, RangeSlider, ScrollArea, Slider, Stack, Table, Tabs, Text, TextInput, } from '@mantine/core';
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
import { AvatarAccessories, AvatarAccessoriesColors, AvatarClothesColors, AvatarClothingGraphics, AvatarClothings, AvatarFacialHairColors, AvatarFacialHairs, AvatarHairColors, AvatarHatColors, AvatarSkinColors, AvatarTops, AvatarUnlockOptions, generateDefaultAvatarUnlockOptions, generateRandomAvatar } from '../../Utils/AvatarUtils';
import { avataaars } from '@dicebear/collection';
import { Options } from "@dicebear/avataaars"

const colors = ["#e6ffee", "#d3f9e0", "#a8f2c0", "#7aea9f", "#54e382", "#3bdf70", "#2bdd66", "#1bc455", "#0bae4a", "#00973c"]

function CourseSettings() {
    const { courseId } = useParams()
    const [avatarString, setAvatarString] = useState("")
    const [avatarOptions, setAvatarOptions] = useState<any>({ seed: "UMLegend" })
    const [unlockOptions, setUnlockOptions] = useState<AvatarUnlockOptions | null>(null)
    const [progressMaxMult, setProgressMaxMult] = useState<number | string>(2)
    const [progressSteps, setProgressSteps] = useState<number | string>(5)
    const [progressSettings, setProgressSettings] = useState<any[]>([])
    const [checksMaxMult, setChecksMaxMult] = useState<number | string>(2)
    const [checksSteps, setChecksSteps] = useState<number | string>(5)
    const [checkThreshold, setCheckThreshold] = useState<number | string>(75)
    const [checkSettings, setCheckSettings] = useState<any[]>([])
    const [differenceMaxMult, setDifferenceMaxMult] = useState<number | string>(2)
    const [differenceSteps, setDifferenceSteps] = useState<number | string>(5)
    const [differenceThreshold, setDifferenceThreshold] = useState<number | string>(10)
    const [differenceSettings, setDifferenceSettings] = useState<any[]>([])
    const [levelSettings, setLevelSettings] = useState<any[]>([])
    const [openedUnlock, { open: openUnlock, close: closeUnlock }] = useDisclosure(false)
    const [openedSettings, { open: openSettings, close: closeSettings }] = useDisclosure(false)
    const [uploadNotif, setUploadNotif] = useState<Boolean>(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (courseId) {
            API.getCourse(courseId).then((course) => {
                let avatarOpts = generateRandomAvatar()
                setAvatarOptions(avatarOpts)
                let svg = createAvatar(avataaars, avatarOpts).toString()
                setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)

                if (!course.settings) {
                    let unlockOpts = generateDefaultAvatarUnlockOptions()
                    setUnlockOptions(unlockOpts)
                } else {
                    setUnlockOptions(course.settings)
                }
                if (!course.gameOptions) {
                    updateProgressSettings(Number(progressSteps), Number(progressMaxMult))
                    updateCheckSettings(Number(checksSteps), Number(checksMaxMult), Number(checkThreshold))
                    updateDifferenceSettings(Number(differenceSteps), Number(differenceMaxMult), Number(differenceThreshold))
                    setLevelSettings([{ "level": 1, "min": 0, "max": 40 }])
                } else {
                    let opts = JSON.parse(course.gameOptions)
                    setProgressMaxMult(opts.progress.maxMultiplier)
                    setProgressSteps(opts.progress.steps)
                    setProgressSettings(opts.progress.settings)
                    setChecksMaxMult(opts.checks.maxMultiplier)
                    setChecksSteps(opts.checks.steps)
                    setCheckThreshold(opts.checks.threshold)
                    setCheckSettings(opts.checks.settings)
                    setDifferenceMaxMult(opts.difference.maxMultiplier)
                    setDifferenceSteps(opts.difference.steps)
                    setDifferenceThreshold(opts.difference.threshold)
                    setDifferenceSettings(opts.difference.settings)
                    setLevelSettings(opts.levels)
                }
            })
        }
    }, [])

    const updateDifferenceSettings = (steps: number, maxMult: number, threshold: number) => {
        let stepSize = threshold / steps
        let multStep = (maxMult - 1.0) / steps

        const diffArr = Array.from({ length: steps }, (_, i) => {
            const start = i * stepSize;
            const end = i === steps - 1 ? threshold : (i + 1) * stepSize;
            const multiplier = +(1.0 + multStep * (i + 1)).toFixed(2);
            return {
                range: [Math.round(start), Math.round(end)],
                multiplier
            }
        })
        setDifferenceSettings(diffArr)
    }

    const updateCheckSettings = (steps: number, maxMult: number, threshold: number) => {
        let stepSize = threshold / steps;
        let multStep = (maxMult - 1.0) / steps;

        const checkArr = Array.from({ length: steps }, (_, i) => {
            const start = i * stepSize;
            const end = i === steps - 1 ? threshold : (i + 1) * stepSize;
            const multiplier = +(maxMult - multStep * i).toFixed(2);
            return {
                range: [Math.round(start), Math.round(end)],
                multiplier
            }
        });
        setCheckSettings(checkArr);
    }

    const updateProgressSettings = (steps: number, maxMult: number) => {
        const minScore = 75;
        const maxScore = 100;
        const range = maxScore - minScore;
        const stepSize = range / steps;
        const multStep = (maxMult - 1.0) / steps;

        const progressArr = Array.from({ length: steps }, (_, i) => {
            const start = minScore + i * stepSize;
            const end = i === steps - 1 ? maxScore : minScore + (i + 1) * stepSize;
            const multiplier = +(1.0 + multStep * (i + 1)).toFixed(2);
            return {
                range: [Math.round(start), Math.round(end)],
                multiplier
            }
        })
        setProgressSettings(progressArr);
    }

    const handleUnlockDrop = (files: File[]) => {
        if (files.length !== 1) {
            return
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const contents = e.target?.result;
                if (typeof contents === "string") {
                    try {
                        const json = JSON.parse(contents) as AvatarUnlockOptions
                        setUnlockOptions(json)
                        closeUnlock()
                        setUploadNotif(true)
                        setTimeout(() => {
                            setUploadNotif(false)
                        }, 3000)
                    } catch (err) {
                        console.error("Error parsing JSON:", err);
                    }
                }
            }
            reader.readAsText(files[0])
        }
    }

    const handleSettingsDrop = (files: File[]) => {
        if (files.length !== 1) {
            return
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const contents = e.target?.result;
                if (typeof contents === "string") {
                    try {
                        const json = JSON.parse(contents)
                        setProgressMaxMult(json.progress.maxMultiplier)
                        setProgressSteps(json.progress.steps)
                        setProgressSettings(json.progress.settings)
                        setChecksMaxMult(json.checks.maxMultiplier)
                        setChecksSteps(json.checks.steps)
                        setCheckThreshold(json.checks.threshold)
                        setCheckSettings(json.checks.settings)
                        setDifferenceMaxMult(json.difference.maxMultiplier)
                        setDifferenceSteps(json.difference.steps)
                        setDifferenceThreshold(json.difference.threshold)
                        setDifferenceSettings(json.difference.settings)
                        setLevelSettings(json.levels)
                        closeSettings()
                        setUploadNotif(true)
                        setTimeout(() => {
                            setUploadNotif(false)
                        }, 3000)
                    } catch (err) {
                        console.error("Error parsing JSON:", err);
                    }
                }
            }
            reader.readAsText(files[0])
        }
    }

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Grid justify='center' align='center'>
                <Grid.Col span={12}>
                    <Tabs defaultValue={"avatar"} variant="pills" color="cyan">
                        <Tabs.List>
                            <Tabs.Tab value="avatar">Avatar Piece Unlock</Tabs.Tab>
                            <Tabs.Tab value="settings">Game Settings</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="avatar">
                            <Fieldset legend="Pieces">
                                <Center mb="md">
                                    <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} />} onClick={() => {
                                        if (courseId && unlockOptions) {
                                            API.updateCourseSettings(courseId, unlockOptions).then(() => {
                                                navigate("/teacher/courses")
                                            })
                                        }
                                    }}>Save unlock settings</Button>
                                    <Button variant="light" color="cyan" rightSection={<IconDownload size={16} />} onClick={() => {
                                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(unlockOptions, null, 2));
                                        const downloadAnchorNode = document.createElement('a');
                                        downloadAnchorNode.setAttribute("href", dataStr);
                                        downloadAnchorNode.setAttribute("download", `unlockOptions_${courseId}.json`);
                                        document.body.appendChild(downloadAnchorNode);
                                        downloadAnchorNode.click();
                                        downloadAnchorNode.remove();
                                    }} >Download unlock settings</Button>
                                    <Button variant="light" color="yellow" rightSection={<IconUpload size={16} />} onClick={openUnlock} >Upload unlock settings</Button>
                                </Center>
                                <Tabs defaultValue="accessories" variant="pills" color="cyan">
                                    <Tabs.List>
                                        <Tabs.Tab value="accessories">Accessories</Tabs.Tab>
                                        <Tabs.Tab value="accessoriesColors">Accessories Colors</Tabs.Tab>
                                        <Tabs.Tab value="clothesColor">Clothes Color</Tabs.Tab>
                                        <Tabs.Tab value="clothing">Clothing</Tabs.Tab>
                                        <Tabs.Tab value="clothingGraphics">Clothing Graphics</Tabs.Tab>
                                        <Tabs.Tab value="facialHair">Facial Hair</Tabs.Tab>
                                        <Tabs.Tab value="facialHairColor">Facial Hair Color</Tabs.Tab>
                                        <Tabs.Tab value="hairColor">Hair Color</Tabs.Tab>
                                        <Tabs.Tab value="hatColor">Hat Color</Tabs.Tab>
                                        <Tabs.Tab value="skinColor">Skin Color</Tabs.Tab>
                                        <Tabs.Tab value="top">Top</Tabs.Tab>
                                    </Tabs.List>
                                    <Tabs.Panel value="accessories">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarAccessories, avatarOptions, "accessories", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value='accessoriesColors'>
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarAccessoriesColors, avatarOptions, "accessoriesColor", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="clothesColor">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarClothesColors, avatarOptions, "clothesColor", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="clothing">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarClothings, avatarOptions, "clothing", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="clothingGraphics">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarClothingGraphics, avatarOptions, "clothingGraphic", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="facialHair">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarFacialHairs, avatarOptions, "facialHair", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="facialHairColor">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarFacialHairColors, avatarOptions, "facialHairColor", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="hairColor">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarHairColors, avatarOptions, "hairColor", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="hatColor">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarHatColors, avatarOptions, "hatsColor", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="skinColor">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarSkinColors, avatarOptions, "skinColor", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                    <Tabs.Panel value="top">
                                        <Flex wrap="wrap" gap="xs" justify="center">
                                            {renderAvatarOptions(AvatarTops, avatarOptions, "top", unlockOptions, setUnlockOptions)}
                                        </Flex>
                                    </Tabs.Panel>
                                </Tabs>
                            </Fieldset>
                        </Tabs.Panel>
                        <Tabs.Panel value="settings">
                            <Center mb="md">
                                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} />} onClick={() => {
                                    if (courseId) {
                                        let gameOptions = {
                                            progress: {
                                                maxMultiplier: Number(progressMaxMult),
                                                steps: Number(progressSteps),
                                                settings: progressSettings
                                            },
                                            checks: {
                                                maxMultiplier: Number(checksMaxMult),
                                                steps: Number(checksSteps),
                                                threshold: Number(checkThreshold),
                                                settings: checkSettings
                                            },
                                            difference: {
                                                maxMultiplier: Number(differenceMaxMult),
                                                steps: Number(differenceSteps),
                                                threshold: Number(differenceThreshold),
                                                settings: differenceSettings
                                            },
                                            levels: levelSettings
                                        }
                                        API.updateCourseGameOptions(courseId, gameOptions).then(() => {
                                            navigate("/teacher/courses")
                                        })
                                    }
                                }}>Save game settings</Button>
                                <Button variant="light" color="cyan" rightSection={<IconDownload size={16} />} onClick={() => {
                                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                                        progress: {
                                            maxMultiplier: Number(progressMaxMult),
                                            steps: Number(progressSteps),
                                            settings: progressSettings
                                        },
                                        checks: {
                                            maxMultiplier: Number(checksMaxMult),
                                            steps: Number(checksSteps),
                                            threshold: Number(checkThreshold),
                                            settings: checkSettings
                                        },
                                        difference: {
                                            maxMultiplier: Number(differenceMaxMult),
                                            steps: Number(differenceSteps),
                                            threshold: Number(differenceThreshold),
                                            settings: differenceSettings
                                        },
                                        levels: levelSettings
                                    }, null, 2));
                                    const downloadAnchorNode = document.createElement('a');
                                    downloadAnchorNode.setAttribute("href", dataStr);
                                    downloadAnchorNode.setAttribute("download", `gameOptions_${courseId}.json`);
                                    document.body.appendChild(downloadAnchorNode);
                                    downloadAnchorNode.click();
                                    document.body.removeChild(downloadAnchorNode);
                                }} >Download game settings</Button>
                                <Button variant="light" color="yellow" rightSection={<IconUpload size={16} />} onClick={openSettings} >Upload game settings</Button>
                            </Center>
                            <Stack align="stretch" justify="center" gap="md">
                                <Fieldset legend="Level Thresholds">
                                    <Flex wrap="wrap" gap="xs" justify="center" align="center">
                                        {levelSettings.map((level, index) => (
                                            <Card key={level.level} shadow="sm" padding="lg" radius="md" withBorder style={{ width: 'fit-content', margin: 'auto' }}>
                                                <Stack align="center">
                                                    <Text>Level {level.level}</Text>
                                                    <NumberInput label="Min" min={index > 0 ? levelSettings[index - 1].max + 1 : 0} max={level.max - 1} value={level.min}
                                                        onChange={(value) => {
                                                            setLevelSettings((prev) => prev.map((l) => l.level === level.level ? { ...l, min: value } : l))
                                                        }}
                                                    />
                                                    <NumberInput label="Max" value={level.max}
                                                        onChange={(value) => {
                                                            setLevelSettings((prev) => prev.map((l) => l.level === level.level ? { ...l, max: value } : l))
                                                        }}
                                                    />
                                                    {index === levelSettings.length - 1 && levelSettings.length > 1 && (
                                                        <Button color="red" variant="subtle"
                                                            style={{
                                                                position: "absolute", top: 8, right: 8, zIndex: 1, borderRadius: "50%", padding: 4, minWidth: 32, height: 32, width: 32, display: "flex", alignItems: "center", justifyContent: "center",
                                                            }}
                                                            onClick={() => { setLevelSettings((prev) => prev.slice(0, -1)) }}
                                                        ><IconX size={18} /></Button>
                                                    )}
                                                </Stack>
                                            </Card>
                                        ))}
                                        <Center style={{ height: "100%" }}>
                                            <Button variant="outline" color="green" leftSection={<IconSquareRoundedPlusFilled size={16} />}
                                                onClick={() => {
                                                    setLevelSettings((prev) => [...prev, { level: prev.length + 1, min: prev[prev.length - 1].max + 1, max: prev[prev.length - 1].max + 40 }])
                                                }}>Add Level</Button>
                                        </Center>
                                    </Flex>
                                </Fieldset>
                                <Fieldset legend="Level Difference Multiplier">
                                    <NumberInput min={1} max={2.0} step={0.1} clampBehavior='strict' decimalScale={1} label="Maximum Multiplier" value={differenceMaxMult} onChange={(value) => {
                                        setDifferenceMaxMult(value)
                                        updateDifferenceSettings(Number(differenceSteps), Number(value), Number(differenceThreshold))
                                    }} />
                                    <NumberInput min={2} max={10} label="Steps" clampBehavior='strict' value={differenceSteps} onChange={(value) => {
                                        setDifferenceSteps(value)
                                        updateDifferenceSettings(Number(value), Number(differenceMaxMult), Number(differenceThreshold))
                                    }} />
                                    <NumberInput min={1} max={10} label="Threshold" clampBehavior='strict' value={differenceThreshold} onChange={(value) => {
                                        setDifferenceThreshold(value)
                                        updateDifferenceSettings(Number(differenceSteps), Number(differenceMaxMult), Number(value))
                                    }} />
                                    <Progress.Root size="xl">
                                        {differenceSettings.map((setting, index) => (
                                            <Progress.Section color={colors[index]} key={index} value={100 / differenceSettings.length}>
                                                <Progress.Label style={{ color: "black" }}>{setting.range[0]} - {setting.range[1]}: {setting.multiplier} </Progress.Label>
                                            </Progress.Section>
                                        ))}
                                    </Progress.Root>
                                </Fieldset>
                                <Fieldset legend="Check Multiplier">
                                    <NumberInput min={1} max={2.0} step={0.1} clampBehavior='strict' decimalScale={1} label="Maximum Multiplier" value={checksMaxMult} onChange={(value) => {
                                        setChecksMaxMult(value)
                                        updateCheckSettings(Number(checksSteps), Number(value), Number(checkThreshold))
                                    }} />
                                    <NumberInput min={2} max={10} label="Steps" clampBehavior='strict' value={checksSteps} onChange={(value) => {
                                        setChecksSteps(value)
                                        updateCheckSettings(Number(value), Number(checksMaxMult), Number(checkThreshold))
                                    }} />
                                    <NumberInput min={1} max={100} label="Threshold" clampBehavior='strict' value={checkThreshold} onChange={(value) => {
                                        setCheckThreshold(value)
                                        updateCheckSettings(Number(checksSteps), Number(checksMaxMult), Number(value))
                                    }} />
                                    <Progress.Root size="xl">
                                        {[...checkSettings].reverse().map((setting, index) => (
                                            <Progress.Section
                                                color={colors[index]}
                                                key={checkSettings.length - 1 - index}
                                                value={100 / checkSettings.length}
                                            >
                                                <Progress.Label style={{ color: "black" }}>
                                                    {setting.range[0]} - {setting.range[1]}: {setting.multiplier}
                                                </Progress.Label>
                                            </Progress.Section>
                                        ))}
                                    </Progress.Root>
                                </Fieldset>
                                <Fieldset legend="Progress Multiplier">
                                    <NumberInput min={1} max={2.0} step={0.1} clampBehavior='strict' decimalScale={1} label="Maximum Multiplier" value={progressMaxMult} onChange={(value) => {
                                        setProgressMaxMult(value)
                                        updateProgressSettings(Number(progressSteps), Number(value))
                                    }} />
                                    <NumberInput min={2} max={10} label="Steps" clampBehavior='strict' value={progressSteps} onChange={(value) => {
                                        setProgressSteps(value)
                                        updateProgressSettings(Number(value), Number(progressMaxMult))
                                    }} />
                                    <Progress.Root size="xl">
                                        {progressSettings.map((setting, index) => (
                                            <Progress.Section color={colors[index]} key={index} value={100 / progressSettings.length}>
                                                <Progress.Label style={{ color: "black" }}>{setting.range[0]} - {setting.range[1]}: {setting.multiplier} </Progress.Label>
                                            </Progress.Section>
                                        ))}
                                    </Progress.Root>
                                </Fieldset>
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>

                </Grid.Col>
            </Grid >

            <Modal opened={openedUnlock} onClose={closeUnlock} title="Upload Unlock Settings">
                <Modal.Body>
                    <Dropzone onDrop={handleUnlockDrop} accept={["application/json"]} className="dropzone" radius="md" >
                        <div style={{ pointerEvents: "none", cursor: "pointer" }}>
                            <Fieldset legend="Upload enrolled students">
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
                                    <Dropzone.Idle>Upload enrolled students</Dropzone.Idle>
                                </Text>
                                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                    Drag&apos;n&apos;drop a JSON file with the avatar unlock settings
                                </Text>
                            </Fieldset>
                        </div>
                    </Dropzone>
                </Modal.Body>
            </Modal>

            <Modal opened={openedSettings} onClose={closeSettings} title="Upload Game Settings">
                <Modal.Body>
                    <Dropzone onDrop={handleSettingsDrop} accept={["application/json"]} className="dropzone" radius="md" >
                        <div style={{ pointerEvents: "none", cursor: "pointer" }}>
                            <Fieldset legend="Upload game settings">
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
                                    <Dropzone.Idle>Upload game settings</Dropzone.Idle>
                                </Text>
                                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                    Drag&apos;n&apos;drop a JSON file with the game settings
                                </Text>
                            </Fieldset>
                        </div>
                    </Dropzone>
                </Modal.Body>
            </Modal>


            {uploadNotif && <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className='notif' withCloseButton={false} >
                <Text>Settings updated successfully!</Text>
            </Notification>}
        </>
    )
}

function renderAvatarOptions<T extends object>(
    valuesObj: T,
    avatarOptions: any,
    property: keyof typeof avatarOptions,
    unlockOptions: AvatarUnlockOptions | null,
    setUnlockOptions: (opts: AvatarUnlockOptions) => void
) {
    return Object.keys(valuesObj).map((key) => {
        let value = valuesObj[key as keyof T]
        let avatarOpts = { ...avatarOptions, [property]: [value] }
        let avatarSvg = createAvatar(avataaars, avatarOpts).toString()
        const condition = unlockOptions?.[property as keyof AvatarUnlockOptions]?.filter((opt) => opt.name === value)[0]?.unlockConditions[0]
        let unlockValue = condition && condition.type === "level" ? (condition as any).minLevel : 1
        if (!unlockValue) unlockValue = 1

        let handleValueChange = (level: number | string) => {
            if (!unlockOptions) return;
            if (typeof level === "string") level = parseInt(level)
            const newUnlockOptions: AvatarUnlockOptions = { ...unlockOptions }
            const targetOption = newUnlockOptions[property as keyof AvatarUnlockOptions].find((opt) => opt.name === value)
            if (targetOption && targetOption.unlockConditions[0].type === "level") {
                (targetOption.unlockConditions[0] as any).minLevel = level
            }
            setUnlockOptions(newUnlockOptions)
        }

        return (
            <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                key={key}
                style={{
                    width: 'fit-content',
                    margin: 'auto',
                    //cursor: "pointer",
                    //border: avatarOptions[property]?.[0] === value ? '5px solid cyan' : undefined
                }}
                onClick={() => {/*
                    let botOpts = { ...avatarOptions, [property]: [value] };
                    let avatarString = createAvatar(avataaars, botOpts).toString();
                    setAvatarOptions(botOpts);
                    setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(avatarString)}`);
                */}}
            >
                <Stack align="center">
                    <Text>{key}</Text>
                    <Avatar src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} size={100} radius="xl" />
                    <NumberInput label="Unlock Level" value={unlockValue} onChange={handleValueChange} min={1} max={15} />
                </Stack>
            </Card>
        );
    });
}

export default CourseSettings;