import React, { useEffect, useState } from "react";
import { Grid } from "@mantine/core";
import { BPMNDiagramReferenceSolution } from "../../../../Utils/BPMN/MatcherTypes";
import { ListEditor } from "../ListEditor";
import { BulkListEditor } from "../BulkListEditor";

export function ForbiddenElementsForm(props: {
    reference: BPMNDiagramReferenceSolution | undefined,
    addForbiddenEntities: (forbiddenEntities: string[]) => void,
    addForbiddenActors: (forbiddenActors: string[]) => void
}) {
    const [forbiddenEntities, setForbiddenEntities] = useState<string[]>([])
    const [forbiddenActors, setForbiddenActors] = useState<string[]>([])

    useEffect(() => {
        if (props.reference) {
            setForbiddenEntities(props.reference.forbiddenEntities)
            setForbiddenActors(props.reference.forbiddenActors)
        } else {
            setForbiddenEntities([])
            setForbiddenActors([])
        }
    }, [props.reference])

    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={6}>
                <BulkListEditor legend="Bulk add forbidden business entities" list={forbiddenEntities} onAdd={(newList) => {
                    setForbiddenEntities(newList)
                    props.addForbiddenEntities(newList)
                }} />
                <div style={{ marginTop: "0.5rem" }}>
                    <ListEditor mode="forbiddenEntities" list={forbiddenEntities} onListChange={(newList) => {
                        setForbiddenEntities(newList)
                        props.addForbiddenEntities(newList)
                    }} onSave={() => { }} />
                </div>
            </Grid.Col>
            <Grid.Col span={6}>
                <BulkListEditor legend="Bulk add forbidden actors" list={forbiddenActors} onAdd={(newList) => {
                    setForbiddenActors(newList)
                    props.addForbiddenActors(newList)
                }} />
                <div style={{ marginTop: "0.5rem" }}>
                    <ListEditor mode="forbiddenActors" list={forbiddenActors} onListChange={(newList) => {
                        setForbiddenActors(newList)
                        props.addForbiddenActors(newList)
                    }} onSave={() => { }} />
                </div>
            </Grid.Col>
        </Grid>
    )
}
