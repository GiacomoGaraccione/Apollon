import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, NativeSelect, Tabs, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceUseCase, ReferenceSystem, UseCaseDiagramReferenceSolution, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceUseCaseAssociation, ReferenceActor } from "../../../../../Utils/UseCaseDiagram/MatcherTypes";
import { uuid } from '../../../../../../utils/uuid';

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
            const normalized = props.associations.map(a => {
                const copy: any = { ...a }
                const byNameSrc = props.actors.find(x => x.name === a.sourceId)
                const byIdSrc = props.actors.find(x => x.elementId === a.sourceId)
                if (byIdSrc) copy.sourceId = byIdSrc.elementId
                else if (byNameSrc) copy.sourceId = byNameSrc.elementId

                const byNameTgt = props.actors.find(x => x.name === a.targetId)
                const byIdTgt = props.actors.find(x => x.elementId === a.targetId)
                if (byIdTgt) copy.targetId = byIdTgt.elementId
                else if (byNameTgt) copy.targetId = byNameTgt.elementId

                return copy as ReferenceActorAssociation
            })
            setRels(normalized)
            setActors(props.actors)
            setSourceId(props.actors.length > 0 ? props.actors[0].name : "")
            setTargetId(props.actors.length > 0 ? props.actors[0].name : "")
        }
    }, [props.associations, props.actors])

    useEffect(() => {
        if (currentRel) {
            const src = props.actors.find(a => a.elementId === currentRel.sourceId)
            const tgt = props.actors.find(a => a.elementId === currentRel.targetId)
            setSourceId(src ? src.name : currentRel.sourceId)
            setTargetId(tgt ? tgt.name : currentRel.targetId)
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
            let newRel: ReferenceActorAssociation = new ReferenceActorAssociation()
                ; (newRel as any).elementId = uuid()
            const foundSrcByName = props.actors.find(a => a.name === sourceId)
            const foundSrcById = props.actors.find(a => a.elementId === sourceId)
            newRel.sourceId = foundSrcById ? foundSrcById.elementId : (foundSrcByName ? foundSrcByName.elementId : sourceId)

            const foundTgtByName = props.actors.find(a => a.name === targetId)
            const foundTgtById = props.actors.find(a => a.elementId === targetId)
            newRel.targetId = foundTgtById ? foundTgtById.elementId : (foundTgtByName ? foundTgtByName.elementId : targetId)
            newRel.message = message.trim()
            const updatedRels = [...rels, newRel]
            setRels(updatedRels)
            props.addActorAssociations(updatedRels)
            resetForm()
        } else {
            const relIndex = rels.findIndex(r => r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId)
            if (relIndex >= 0) {
                const rel = { ...rels[relIndex] } as any
                const foundSrcByName = props.actors.find(a => a.name === sourceId)
                const foundSrcById = props.actors.find(a => a.elementId === sourceId)
                rel.sourceId = foundSrcById ? foundSrcById.elementId : (foundSrcByName ? foundSrcByName.elementId : sourceId)

                const foundTgtByName = props.actors.find(a => a.name === targetId)
                const foundTgtById = props.actors.find(a => a.elementId === targetId)
                rel.targetId = foundTgtById ? foundTgtById.elementId : (foundTgtByName ? foundTgtByName.elementId : targetId)

                rel.message = message.trim()
                const updatedRels = rels.slice()
                updatedRels[relIndex] = rel
                setRels(updatedRels)
                props.addActorAssociations(updatedRels)
            }
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
                                            <Text>{(props.actors.find(actor => actor.elementId === a.sourceId) ? props.actors.find(actor => actor.elementId === a.sourceId)!.name : a.sourceId)} <i>extends</i> {(props.actors.find(actor => actor.elementId === a.targetId) ? props.actors.find(actor => actor.elementId === a.targetId)!.name : a.targetId)}</Text>
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
