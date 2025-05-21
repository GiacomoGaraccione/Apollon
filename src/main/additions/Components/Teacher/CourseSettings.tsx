import React, { useState, useEffect, useRef } from 'react'
import { IconCheck, IconCloudUpload, IconDownload, IconInfoCircle, IconSquareRoundedPlusFilled, IconX } from '@tabler/icons-react';
import { Avatar, Badge, Button, Card, Center, Divider, Fieldset, Flex, Grid, Group, Image, Modal, NativeSelect, Notification, NumberInput, ScrollArea, Stack, Table, Tabs, Text, TextInput, } from '@mantine/core';
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

function CourseSettings() {
    const { courseId } = useParams()
    const [avatarString, setAvatarString] = useState("")
    const [avatarOptions, setAvatarOptions] = useState<any>({ seed: "UMLegend" })
    const [unlockOptions, setUnlockOptions] = useState<AvatarUnlockOptions | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (courseId) {
            API.getCourse(courseId).then((course) => {
                console.log(course)
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
            })
        }
    }, [])

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Grid justify='center' align='center'>
                <Grid.Col span={12}>
                    <Fieldset legend="Pieces">
                        <Center mb="md">
                            <Button variant="outline" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} />} onClick={() => {
                                if (courseId && unlockOptions) {
                                    API.updateCourseSettings(courseId, unlockOptions).then(() => {
                                        navigate("/teacher/courses")
                                    })
                                }
                            }}>Save unlock settings</Button>
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
                                    {renderAvatarOptions(AvatarHatColors, avatarOptions, "hatColor", unlockOptions, setUnlockOptions)}
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
                </Grid.Col>
            </Grid>
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
        let unlockValue = unlockOptions?.[property]?.filter((opt) => opt.name === value)[0]?.unlockConditions[0].minLevel
        if (!unlockValue) unlockValue = 1

        let handleValueChange = (level: number | string) => {
            if (!unlockOptions) return;
            if (typeof level === "string") level = parseInt(level)
            const newUnlockOptions: AvatarUnlockOptions = { ...unlockOptions }
            console.log(newUnlockOptions, property, value)
            console.log(newUnlockOptions[property])
            newUnlockOptions[property].filter((opt) => opt.name === value)[0].unlockConditions[0].minLevel = level
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