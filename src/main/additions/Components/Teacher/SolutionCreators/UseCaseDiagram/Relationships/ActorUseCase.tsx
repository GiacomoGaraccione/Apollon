import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, NativeSelect, Tabs, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceUseCase, ReferenceSystem, UseCaseDiagramReferenceSolution, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceUseCaseAssociation, ReferenceActor } from "../../../../../Utils/UseCaseDiagram/MatcherTypes";
import { uuid } from '../../../../../../utils/uuid';

export function ActorUseCaseAssociationForm(props: {
    actors: ReferenceActor[],
    useCases: ReferenceUseCase[],
    systems: ReferenceSystem[],
    associations: ReferenceActorUseCaseAssociation[],
    setAssociations: (assocs: ReferenceActorUseCaseAssociation[]) => void
}) {
    const [rels, setRels] = useState<ReferenceActorUseCaseAssociation[]>([])
    const [currentRel, setCurrentRel] = useState<ReferenceActorUseCaseAssociation | undefined>(undefined)
    const [sourceId, setSourceId] = useState<string>("")
    const [targetId, setTargetId] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [isSupportingActor, setIsSupportingActor] = useState<boolean>(false)
    const [actors, setActors] = useState<ReferenceActor[]>([])
    const [useCases, setUseCases] = useState<ReferenceUseCase[]>([])
    const [systems, setSystems] = useState<ReferenceSystem[]>([])

    useEffect(() => {
        if (props.associations) {
            // normalize associations to use elementId for source/target when possible
            const normalized = props.associations.map(a => {
                const copy: any = { ...a }
                // source may be actor name or elementId, or system name/elementId
                const actorByName = props.actors.find(x => x.name === a.sourceId)
                const actorById = props.actors.find(x => x.elementId === a.sourceId)
                const sysByName = props.systems.find(x => x.name === a.sourceId)
                const sysById = props.systems.find(x => x.elementId === a.sourceId)
                if (actorById) copy.sourceId = actorById.elementId
                else if (actorByName) copy.sourceId = actorByName.elementId
                else if (sysById) copy.sourceId = sysById.elementId
                else if (sysByName) copy.sourceId = sysByName.elementId

                // target should be use case
                const ucByName = props.useCases.find(x => x.name === a.targetId)
                const ucById = props.useCases.find(x => x.elementId === a.targetId)
                if (ucById) copy.targetId = ucById.elementId
                else if (ucByName) copy.targetId = ucByName.elementId

                return copy as ReferenceActorUseCaseAssociation
            })
            setRels(normalized)
            setActors(props.actors)
            setUseCases(props.useCases)
            setSystems(props.systems)
            setSourceId(props.actors.length > 0 ? props.actors[0].name : (props.systems.length > 0 ? props.systems[0].name : ""))
            setTargetId(props.useCases.length > 0 ? props.useCases[0].name : "")
        }
    }, [props.associations, props.actors, props.useCases])

    useEffect(() => {
        if (currentRel) {
            const srcActor = props.actors.find(a => a.elementId === currentRel.sourceId)
            const srcSystem = props.systems.find(s => s.elementId === currentRel.sourceId)
            const src = srcActor || srcSystem
            setSourceId(src ? src.name : currentRel.sourceId)
            const tgtUc = props.useCases.find((uc) => uc.elementId === currentRel.targetId)
            setTargetId(tgtUc ? tgtUc.name : currentRel.targetId)
            setMessage(currentRel.message)
            setIsSupportingActor(!!currentRel.isSupportingActor)
        } else {
            resetForm()
        }
    }, [currentRel])

    const resetForm = () => {
        setSourceId(props.actors.length > 0 ? props.actors[0].name : (props.systems.length > 0 ? props.systems[0].name : ""))
        setTargetId(props.useCases.length > 0 ? props.useCases[0].name : "")
        setMessage("")
        setIsSupportingActor(false)
        setCurrentRel(undefined)
    }

    const handleSubmit = () => {
        if (!currentRel) {
            let newRel: ReferenceActorUseCaseAssociation = new ReferenceActorUseCaseAssociation()
                ; (newRel as any).elementId = uuid()
            const foundActorByName = props.actors.find(a => a.name === sourceId)
            const foundActorById = props.actors.find(a => a.elementId === sourceId)
            const foundSysByName = props.systems.find(s => s.name === sourceId)
            const foundSysById = props.systems.find(s => s.elementId === sourceId)
            if (foundActorByName) newRel.sourceId = foundActorByName.elementId
            else if (foundActorById) newRel.sourceId = foundActorById.elementId
            else if (foundSysByName) newRel.sourceId = foundSysByName.elementId
            else if (foundSysById) newRel.sourceId = foundSysById.elementId
            else newRel.sourceId = sourceId

            const foundUcByName = props.useCases.find(uc => uc.name === targetId)
            const foundUcById = props.useCases.find(uc => uc.elementId === targetId)
            newRel.targetId = foundUcById ? foundUcById.elementId : (foundUcByName ? foundUcByName.elementId : targetId)
            newRel.message = message.trim()
            newRel.isSupportingActor = isSupportingActor
            const updatedRels = [...rels, newRel]
            setRels(updatedRels)
            props.setAssociations(updatedRels)
            resetForm()
        } else {
            let relIndex = rels.findIndex(r => r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId)
            if (relIndex >= 0) {
                const rel = { ...rels[relIndex] } as any
                const foundActorByName = props.actors.find(a => a.name === sourceId)
                const foundActorById = props.actors.find(a => a.elementId === sourceId)
                const foundSysByName = props.systems.find(s => s.name === sourceId)
                const foundSysById = props.systems.find(s => s.elementId === sourceId)
                if (foundActorByName) rel.sourceId = foundActorByName.elementId
                else if (foundActorById) rel.sourceId = foundActorById.elementId
                else if (foundSysByName) rel.sourceId = foundSysByName.elementId
                else if (foundSysById) rel.sourceId = foundSysById.elementId
                else rel.sourceId = sourceId

                const foundUcByName = props.useCases.find(uc => uc.name === targetId)
                const foundUcById = props.useCases.find(uc => uc.elementId === targetId)
                rel.targetId = foundUcById ? foundUcById.elementId : (foundUcByName ? foundUcByName.elementId : targetId)

                rel.message = message.trim()
                rel.isSupportingActor = isSupportingActor
                const updatedRels = rels.slice()
                updatedRels[relIndex] = rel
                setRels(updatedRels)
                props.setAssociations(updatedRels)
            }
            resetForm()
        }
    }

    const handleDelete = () => {
        if (currentRel) {
            const updatedRels = rels.filter(r => !(r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId))
            setRels(updatedRels)
            props.setAssociations(updatedRels)
            resetForm()
        }
    }

    return (
        <>
            {((actors.length + systems.length) === 0 || useCases.length === 0) ? <Alert icon={<IconExclamationCircle size={16} />} title="Insufficient elements" mb="md">
                You need at least one actor/external system and one use case to create associations.
            </Alert> : <>
                <Grid justify="center" align="center">
                    <Grid.Col span={4}>
                        <Fieldset legend="Current Association" style={{ width: "100%" }}>
                            <NativeSelect label="Actor / System" data={actors.concat(systems.filter(s => s.isExternal)).map((a) => a.name)} value={sourceId} onChange={(ev) => setSourceId(ev.currentTarget.value)} />
                            <NativeSelect label="Use Case" data={useCases.map((uc) => uc.name)} mt="md" value={targetId} onChange={(ev) => setTargetId(ev.currentTarget.value)} />
                            <Checkbox label="Is this a supporting actor?" mt="md" checked={isSupportingActor} onChange={(ev) => setIsSupportingActor(ev.currentTarget.checked)} />
                            <Group justify="center" p="md">
                                {currentRel && <Button variant="light" color="gray" onClick={() => resetForm()} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selection
                                </Button>}
                                <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save association
                                </Button>
                                {currentRel && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                    Delete selected association
                                </Button>}
                            </Group>
                        </Fieldset>
                    </Grid.Col>
                    <Grid.Col span={8}>
                        <Fieldset legend="Existing Associations" style={{ width: "100%" }}>
                            {rels.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No use cases found!">
                                There are no associations between actors and use cases for this solution yet. You can create one by filling the form on the left.
                            </Alert>}
                            {rels.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                                {rels.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentRel(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentRel === a ? '5px solid cyan' : undefined
                                            }}>
                                            <Text>{(props.actors.find((act) => act.elementId === a.sourceId) ? props.actors.find((act) => act.elementId === a.sourceId)!.name : (props.systems.find((sys) => sys.elementId === a.sourceId) ? props.systems.find((sys) => sys.elementId === a.sourceId)!.name : a.sourceId))} → {(props.useCases.find((uc) => uc.elementId === a.targetId) ? props.useCases.find((uc) => uc.elementId === a.targetId)!.name : a.targetId)}</Text>
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
