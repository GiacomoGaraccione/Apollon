import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, NativeSelect, Tabs, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceUseCase, ReferenceSystem, UseCaseDiagramReferenceSolution, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceUseCaseAssociation, ReferenceActor } from "../../../../../Utils/UseCaseDiagram/MatcherTypes";

export function ActorActorAssociationForm(props: {
    actors: ReferenceActor[],
    associations: ReferenceActorAssociation[] | undefined,
    addActorAssociations: (associations: ReferenceActorAssociation[]) => void
}) {
    const [rels, setRels] = useState<ReferenceActorAssociation[]>([])
    const [currentRel, setCurrentRel] = useState<ReferenceActorAssociation | undefined>(undefined)
    const [sourceId, setSourceId] = useState<string>("")
    const [targetId, setTargetId] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [actors, setActors] = useState<ReferenceActor[]>([])

    useEffect(() => {
        if (props.associations) {
            setRels(props.associations)
            setActors(props.actors)
            setSourceId(props.actors.length > 0 ? props.actors[0].name : "")
            setTargetId(props.actors.length > 0 ? props.actors[0].name : "")
        }
    }, [props.associations, props.actors])

    useEffect(() => {
        if (currentRel) {
            setSourceId(currentRel.sourceId)
            setTargetId(currentRel.targetId)
            setMessage(currentRel.message)
        } else {
            resetForm()
        }
    }, [currentRel])

    const resetForm = () => {
        setSourceId(props.actors.length > 0 ? props.actors[0].name : "")
        setTargetId(props.actors.length > 0 ? props.actors[0].name : "")
        setMessage("")
        setCurrentRel(undefined)
    }

    const handleSubmit = () => {
        if (!currentRel) {
            let newRel: ReferenceActorUseCaseAssociation = new ReferenceActorUseCaseAssociation()
            newRel.sourceId = sourceId
            newRel.targetId = targetId
            newRel.message = message.trim()
            const updatedRels = [...rels, newRel]
            setRels(updatedRels)
            props.addActorAssociations(updatedRels)
            resetForm()
        } else {
            let rel = rels.find(r => r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId)!
            rel.sourceId = sourceId
            rel.targetId = targetId
            rel.message = message.trim()
            const updatedRels = rels.map(r => (r.sourceId === rel.sourceId && r.targetId === rel.targetId) ? rel : r)
            setRels(updatedRels)
            props.addActorAssociations(updatedRels)
            resetForm()
        }
    }

    const handleDelete = () => {
        if (currentRel) {
            const updatedRels = rels.filter(r => !(r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId))
            setRels(updatedRels)
            props.addActorAssociations(updatedRels)
            resetForm()
        }
    }

    return (
        <>
            {actors.length < 2 ? <Alert icon={<IconExclamationCircle size={16} />} title="Insufficient elements" mb="md">
                You need at least two actors to create associations.
            </Alert> : <>
                <Grid justify="center" align="center">
                    <Grid.Col span={4}>
                        <Fieldset legend="Current Association" style={{ width: "100%" }}>
                            <NativeSelect label="Specialized Actor" data={actors.map((a) => a.name)} value={sourceId} onChange={(ev) => setSourceId(ev.currentTarget.value)} />
                            <NativeSelect label="Generalized Actor" data={actors.map((a) => a.name)} mt="md" value={targetId} onChange={(ev) => setTargetId(ev.currentTarget.value)} />
                            <Group justify="center" p="md">
                                {currentRel && <Button variant="light" color="gray" onClick={() => resetForm()} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selection
                                </Button>}
                                <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save specialization
                                </Button>
                                {currentRel && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                    Delete selected specialization
                                </Button>}
                            </Group>
                        </Fieldset>
                    </Grid.Col>
                    <Grid.Col span={8}>
                        <Fieldset legend="Existing Associations" style={{ width: "100%" }}>
                            {rels.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No specializations found!">
                                There are no specializations between actors for this solution yet. You can create one by filling the form on the left.
                            </Alert>}
                            {rels.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                                {rels.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentRel(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentRel === a ? '5px solid cyan' : undefined
                                            }}>
                                            <Text>{a.sourceId} <i>extends</i> {a.targetId}</Text>
                                        </Card>
                                    )
                                })}
                            </Flex>}
                        </Fieldset>
                    </Grid.Col>
                </Grid>
            </>}
        </>
    )
}
