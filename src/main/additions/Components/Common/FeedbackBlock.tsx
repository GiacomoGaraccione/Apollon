import React from "react";
import { Button, Center, Text, Popover, List, Highlight, Divider, Skeleton, Grid } from "@mantine/core";
import { IconCheck, IconExclamationCircle, IconExclamationCircleFilled } from "@tabler/icons-react";
import { UMLDiagramType } from "../../../typings";
import "csshake/dist/csshake.css"
import 'svg2pdf.js'
import { ClassDiagramEvaluationResults } from "../../Utils/ClassDiagram/EvaluationTypes";
import { UseCaseDiagramEvaluationResults } from "../../Utils/UseCaseDiagram/EvaluationTypes";
import { BPMNDiagramEvaluationResults } from "../../Utils/BPMN/EvaluationTypes";
import { ClassDiagramMatchingElementsList, ClassDiagramSemanticErrorsList, ClassDiagramSyntaxErrorsList, UseCaseDiagramMatchingElementsList, UseCaseDiagramSemanticErrorsList, UseCaseDiagramSyntaxErrorsList, BPMNMatchingElementsList, BPMNSemanticErrorsList, BPMNSyntaxErrorsList, BPMNClosePartsList, BPMNCloseElementsList } from "./FeedbackLists";

export function FeedbackBlock(props: {
    load: boolean,
    exerciseType: string,
    results: ClassDiagramEvaluationResults | UseCaseDiagramEvaluationResults | BPMNDiagramEvaluationResults
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
                    {props.exerciseType === UMLDiagramType.BPMN && <>
                        <Grid.Col span={4}>
                            <BPMNSyntaxErrorsList syntaxErrors={(props.results as BPMNDiagramEvaluationResults).newSyntaxErrors} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <BPMNSemanticErrorsList semanticErrors={(props.results as BPMNDiagramEvaluationResults).newSemanticErrors} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <BPMNMatchingElementsList results={(props.results as BPMNDiagramEvaluationResults).results} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <BPMNClosePartsList results={(props.results as BPMNDiagramEvaluationResults).results} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <BPMNCloseElementsList results={(props.results as BPMNDiagramEvaluationResults).results} />
                        </Grid.Col>
                    </>}
                </Grid>
            </Skeleton>
        </>
    )
}