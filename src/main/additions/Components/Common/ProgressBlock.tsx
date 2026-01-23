import React from "react";
import { EvaluationResults } from "../../Utils/EvaluationTypes";
import { Exercise } from "../../Utils/Models";
import { Skeleton, Grid, Center, Stack, RingProgress, Text } from "@mantine/core";

export function ProgressBlock(props: { load: boolean, results: EvaluationResults, completionRecord: any, exercise: Exercise }) {
    return (
        <Skeleton visible={props.load} >
            <Grid my="md" grow justify="center" align="center">
                <Grid.Col span={6}>
                    <Center>
                        <Stack align="center">
                            <RingProgress sections={[{ value: Math.round(props.results.newProgress), color: "green" }]} label={<Text color="green" ta="center" size="xl">{Math.round(props.results.newProgress)} %</Text>} />
                            <Text size="md" color="green">Exercise Completeness</Text>
                        </Stack>
                    </Center>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Center>
                        <Stack align="center">
                            {!props.completionRecord && <>
                                <RingProgress
                                    sections={[
                                        {
                                            value: props.exercise?.experience
                                                ? Math.round((props.results.newXP) * 100 / props.exercise.experience)
                                                : 0,
                                            color: "blue"
                                        }
                                    ]}
                                    label={<Text color="blue" ta="center" size="xl">{props.results.newXP} XP</Text>}
                                />
                                <Text size="md" color="blue">Available Experience</Text>
                            </>}
                            {props.completionRecord && <> <Text size="md" color="#FFD700">You already completed this exercise!</Text>
                                <Text size="md" color="#FFD700">You cannot earn any more experience but you can still make changes.</Text>
                                <Text size="md" color="#FFD700">Try to reach 100% completeness!</Text>
                            </>}
                        </Stack>
                    </Center>
                </Grid.Col>
            </Grid>
        </Skeleton>
    )
}