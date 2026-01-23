import React from "react";
import { Button, Center, Text, Popover, List, Highlight, Divider, Skeleton, Grid } from "@mantine/core";
import { IconCheck, IconExclamationCircle, IconExclamationCircleFilled } from "@tabler/icons-react";
import { UMLDiagramType } from "../../../typings";
import "csshake/dist/csshake.css"
import 'svg2pdf.js'
import { ClassDiagramEvaluationResults } from "../../Utils/ClassDiagram/EvaluationTypes";
import { UseCaseDiagramEvaluationResults } from "../../Utils/UseCaseDiagram/EvaluationTypes";
import { ClassDiagramMatchingElementsList, ClassDiagramSemanticErrorsList, ClassDiagramSyntaxErrorsList, UseCaseDiagramMatchingElementsList, UseCaseDiagramSemanticErrorsList, UseCaseDiagramSyntaxErrorsList } from "./FeedbackLists";

export function FeedbackBlock(props: {
    load: boolean,
    exerciseType: string,
    results: ClassDiagramEvaluationResults | UseCaseDiagramEvaluationResults
}) {
    return (
        <>
            <Skeleton visible={props.load} >
                <Grid my="md" grow justify="center" align="center">
                    {props.exerciseType === UMLDiagramType.ClassDiagram && <>
                        <Grid.Col span={4}>
                            <ClassDiagramSyntaxErrorsList syntaxErrors={(props.results as ClassDiagramEvaluationResults).newSyntaxErrors} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <ClassDiagramSemanticErrorsList semanticErrors={(props.results as ClassDiagramEvaluationResults).newSemanticErrors} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <ClassDiagramMatchingElementsList results={(props.results as ClassDiagramEvaluationResults).results} />
                        </Grid.Col>
                    </>}
                    {props.exerciseType === UMLDiagramType.UseCaseDiagram && <>
                        <Grid.Col span={4}>
                            <UseCaseDiagramSyntaxErrorsList syntaxErrors={(props.results as UseCaseDiagramEvaluationResults).newSyntaxErrors} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <UseCaseDiagramSemanticErrorsList semanticErrors={(props.results as UseCaseDiagramEvaluationResults).newSemanticErrors} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            {props.results.results && <UseCaseDiagramMatchingElementsList results={(props.results as UseCaseDiagramEvaluationResults)} />}
                        </Grid.Col>
                    </>}
                </Grid>
            </Skeleton>
        </>
    )
}