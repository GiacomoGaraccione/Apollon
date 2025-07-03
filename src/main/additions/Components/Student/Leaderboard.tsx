import React, { useState, useEffect, useContext } from 'react'
import { IconCheck, IconChevronDown, IconChevronUp, IconEdit, IconExclamationCircleFilled, IconSearch, IconSelector, IconSquareRoundedPlus, IconSquareRoundedPlusFilled, IconTrashXFilled, IconTrophyFilled } from '@tabler/icons-react';
import { Alert, Badge, Button, Center, Fieldset, Group, keys, Modal, Notification, ScrollArea, Stack, Table, Tabs, Text, TextInput, Tooltip, UnstyledButton, Highlight, Progress, Loader } from '@mantine/core';
import cx from 'clsx';
import API from '../../API';
import { User, Roles, UserContext } from '../Login/UserContext';
import "./style.scss"
import { useDisclosure } from '@mantine/hooks';
import { useParams } from 'react-router-dom';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

function Leaderboard(props: { ranking: string, exerciseId?: string }) {
    const user = useContext(UserContext)
    const { courseId, exerciseId } = useParams()
    const [ranking, setRanking] = useState<any[]>([])
    const [scrolled, setScrolled] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (courseId) {
            setLoading(true)
            if (props.ranking === "exercise") {
                const exId = props.exerciseId || exerciseId;
                if (typeof courseId === "string" && typeof exId === "string") {
                    API.getRankingByExerciseCompleteness(courseId, exId).then((res: any) => {
                        let rank = res.rankings.map((r: any) => {
                            let avatarOpts = JSON.parse(r.avatar || "{}")
                            let svg = createAvatar(avataaars, { ...avatarOpts, eyes: ["happy"], mouth: ["smile"] }).toString()
                            return ({
                                username: r.username,
                                score: r.correctness,
                                avatarString: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                            })
                        })
                        setRanking(rank)
                        setLoading(false)
                    })
                }
            } else if (props.ranking === "level") {
                API.getRankingByLevel(courseId).then((res: any) => {
                    let rank = res.rankings.map((r: any) => {
                        let avatarOpts = JSON.parse(r.avatar || "{}")
                        let svg = createAvatar(avataaars, { ...avatarOpts, eyes: ["happy"], mouth: ["smile"] }).toString()
                        return ({
                            username: r.username,
                            score: `Level ${r.level} - ${r.experience} XP`,
                            avatarString: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                        })
                    })
                    setRanking(rank)
                    setLoading(false)
                })
            } else if (props.ranking === "completedExs") {
                API.getRankingByCompletedExercises(courseId).then((res: any) => {
                    let rank = res.rankings.map((r: any) => {
                        let avatarOpts = JSON.parse(r.avatar || "{}")
                        let svg = createAvatar(avataaars, { ...avatarOpts, eyes: ["happy"], mouth: ["smile"] }).toString()
                        return ({
                            username: r.username,
                            score: r.completed_exercises,
                            avatarString: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
                        })
                    })
                    setRanking(rank)
                    setLoading(false)
                })
            }
        }
    }, [props.ranking, props.exerciseId, courseId, exerciseId])

    return (
        <>
            {!loading && <ScrollArea h={"80vh"} onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
                <Table horizontalSpacing="md" verticalSpacing="xs" layout='fixed'>
                    <Table.Tbody className={cx("header", { scrolled: scrolled })}>
                        <Table.Tr>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Score</Table.Th>
                            <Table.Th>Avatar</Table.Th>
                        </Table.Tr>
                    </Table.Tbody>
                    <Table.Tbody>
                        {ranking.length > 0 ? <> {
                            ranking.map((r, index) => (
                                <Table.Tr
                                    key={index}
                                    style={r.username === user?.username ? { backgroundColor: "var(--mantine-color-cyan-1)" } : undefined}
                                >
                                    <Table.Td>
                                        {index < 3 ? <Highlight
                                            highlight={[r.username]}
                                            highlightStyles={{
                                                backgroundColor: index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze',
                                                fontWeight: 700,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent'
                                            }}>{r.username}</Highlight> : <Text>{r.username}</Text>}

                                    </Table.Td>
                                    <Table.Td>
                                        {props.ranking === "exercise" ? <Progress.Root size="lg">
                                            <Progress.Section value={r.score} color="green" striped animated>
                                                <Progress.Label>{r.score}%</Progress.Label>
                                            </Progress.Section>
                                        </Progress.Root> : <Text>{r.score}</Text>}
                                    </Table.Td>
                                    <Table.Td>
                                        <img src={r.avatarString} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%' }} />
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        } </> : <Table.Tr>
                            <Table.Td colSpan={3}>
                                <Center>
                                    <Text size="sm" color="dimmed">No data available</Text>
                                </Center>
                            </Table.Td>
                        </Table.Tr>}
                    </Table.Tbody>
                </Table>
            </ScrollArea>}
            {loading && <Center>
                <Loader size={150} type={"bars"} color="cyan" style={{ margin: "auto" }} />
            </Center>}
        </>
    )
}

export default Leaderboard;