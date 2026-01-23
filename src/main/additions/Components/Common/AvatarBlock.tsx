import React from "react";
import { Avatar, Center, Grid, Highlight, Popover, Skeleton, Stack, Text } from "@mantine/core";

export function AvatarBlock(props: { load: boolean, gamified: boolean, bossDefeated: boolean, avatarUrl: string, mood: string, bossUrl: string, dialogue: string }) {
    return (
        <Skeleton visible={props.load} >
            <Grid my="md" grow justify="center" align="center">
                <Grid.Col span={props.bossDefeated ? 12 : 6}>
                    <Center>
                        <Stack align="center">
                            <Avatar src={props.avatarUrl} size={100} radius="md" />
                            <Highlight
                                highlight={[props.mood]}
                                highlightStyles={{
                                    backgroundColor: (props.mood === "Happy" || props.mood === "Ecstatic" || props.mood === "Content") ? "var(--mantine-color-green-5)" : (props.mood === "Worried" || props.mood === "Upset" || props.mood === "Defeated") ? "var(--mantine-color-red-5)" : "var(--mantine-color-cyan-5)",
                                    fontWeight: 700,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                {`Current mood: ${props.mood}`}
                            </Highlight>
                        </Stack>
                    </Center>
                </Grid.Col>
                {!props.bossDefeated && <Grid.Col span={6}>
                    <Center>
                        <Stack align="center">
                            <Popover width={200} position="bottom" withArrow shadow="sm" opened={props.dialogue !== ""} >
                                <Popover.Target>
                                    <Avatar src={props.bossUrl} size={100} radius="md" />
                                </Popover.Target>
                                <Popover.Dropdown>
                                    {props.dialogue && <Text size="md" color="orange" ta="center" >{`"${props.dialogue}"`}</Text>}
                                </Popover.Dropdown>
                            </Popover>
                        </Stack>
                    </Center>
                </Grid.Col>}
            </Grid>
        </Skeleton>
    )
}