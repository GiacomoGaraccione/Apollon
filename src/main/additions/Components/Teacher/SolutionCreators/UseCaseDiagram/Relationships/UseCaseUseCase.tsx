import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, NativeSelect, Tabs, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceUseCase, ReferenceSystem, UseCaseDiagramReferenceSolution, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceUseCaseAssociation, ReferenceActor } from "../../../../../Utils/UseCaseDiagram/MatcherTypes";
import { uuid } from '../../../../../../utils/uuid';

export function UseCaseUseCaseAssociationForm(props: {
    useCases: ReferenceUseCase[],
    associations: ReferenceUseCaseAssociation[] | undefined,
    addUseCaseAssociations: (associations: ReferenceUseCaseAssociation[]) => void
}) {
    const [rels, setRels] = useState<ReferenceUseCaseAssociation[]>([])
    const [currentRel, setCurrentRel] = useState<ReferenceUseCaseAssociation | undefined>(undefined)
    const [sourceId, setSourceId] = useState<string>("")
    const [targetId, setTargetId] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [isExtend, setIsExtend] = useState<boolean>(true)
    const [useCases, setUseCases] = useState<ReferenceUseCase[]>([])

    useEffect(() => {
        if (props.associations) {
            const normalized = props.associations.map(a => {
                const copy: any = { ...a }
                const byNameSrc = props.useCases.find(x => x.name === a.sourceId)
                const byIdSrc = props.useCases.find(x => x.elementId === a.sourceId)
                if (byIdSrc) copy.sourceId = byIdSrc.elementId
                else if (byNameSrc) copy.sourceId = byNameSrc.elementId

                const byNameTgt = props.useCases.find(x => x.name === a.targetId)
                const byIdTgt = props.useCases.find(x => x.elementId === a.targetId)
                if (byIdTgt) copy.targetId = byIdTgt.elementId
                else if (byNameTgt) copy.targetId = byNameTgt.elementId

                return copy as ReferenceUseCaseAssociation
            })
            setRels(normalized)
            setUseCases(props.useCases)
            setSourceId(props.useCases.length > 0 ? props.useCases[0].name : "")
            setTargetId(props.useCases.length > 0 ? props.useCases[0].name : "")
            setIsExtend(false)
        }
    }, [props.associations, props.useCases])

    useEffect(() => {
        if (currentRel) {
            const src = props.useCases.find(uc => uc.elementId === currentRel.sourceId)
            const tgt = props.useCases.find(uc => uc.elementId === currentRel.targetId)
            setSourceId(src ? src.name : currentRel.sourceId)
            setTargetId(tgt ? tgt.name : currentRel.targetId)
            setMessage(currentRel.message)
            setIsExtend(!!currentRel.isExtend)
        } else {
            resetForm()
        }
    }, [currentRel])

    const resetForm = () => {
        setSourceId(props.useCases.length > 0 ? props.useCases[0].name : "")
        setTargetId(props.useCases.length > 0 ? props.useCases[0].name : "")
        setMessage("")
        setCurrentRel(undefined)
        setIsExtend(false)
    }

    const handleSubmit = () => {
        if (!currentRel) {
            let newRel: ReferenceUseCaseAssociation = new ReferenceUseCaseAssociation()
                ; (newRel as any).elementId = uuid()
            const foundSrcByName = props.useCases.find(uc => uc.name === sourceId)
            const foundSrcById = props.useCases.find(uc => uc.elementId === sourceId)
            newRel.sourceId = foundSrcById ? foundSrcById.elementId : (foundSrcByName ? foundSrcByName.elementId : sourceId)

            const foundTgtByName = props.useCases.find(uc => uc.name === targetId)
            const foundTgtById = props.useCases.find(uc => uc.elementId === targetId)
            newRel.targetId = foundTgtById ? foundTgtById.elementId : (foundTgtByName ? foundTgtByName.elementId : targetId)
            newRel.message = message.trim()
            newRel.isExtend = isExtend
            const updatedRels = [...rels, newRel]
            setRels(updatedRels)
            props.addUseCaseAssociations(updatedRels)
            resetForm()
        } else {
            const relIndex = rels.findIndex(r => r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId)
            if (relIndex >= 0) {
                const rel = { ...rels[relIndex] } as any
                const foundSrcByName = props.useCases.find(uc => uc.name === sourceId)
                const foundSrcById = props.useCases.find(uc => uc.elementId === sourceId)
                rel.sourceId = foundSrcById ? foundSrcById.elementId : (foundSrcByName ? foundSrcByName.elementId : sourceId)

                const foundTgtByName = props.useCases.find(uc => uc.name === targetId)
                const foundTgtById = props.useCases.find(uc => uc.elementId === targetId)
                rel.targetId = foundTgtById ? foundTgtById.elementId : (foundTgtByName ? foundTgtByName.elementId : targetId)

                rel.message = message.trim()
                rel.isExtend = isExtend
                const updatedRels = rels.slice()
                updatedRels[relIndex] = rel
                setRels(updatedRels)
                props.addUseCaseAssociations(updatedRels)
            }
            resetForm()
        }
    }

    const handleDelete = () => {
        if (currentRel) {
            const updatedRels = rels.filter(r => !(r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId))
            setRels(updatedRels)
            props.addUseCaseAssociations(updatedRels)
            resetForm()
        }
    }

    return (
        <>
            {useCases.length < 2 ? <Alert icon={<IconExclamationCircle size={16} />} title="Insufficient elements" mb="md">
                You need at least two use cases to create associations.
            </Alert> : <>
                <Grid justify="center" align="center">
                    <Grid.Col span={4}>
                        <Fieldset legend="Current Association" style={{ width: "100%" }}>
                            <NativeSelect label="Specialized Use Case" data={useCases.map((a) => a.name)} value={sourceId} onChange={(ev) => setSourceId(ev.currentTarget.value)} />
                            <NativeSelect label="Base/Included Use Case" data={useCases.map((a) => a.name)} mt="md" value={targetId} onChange={(ev) => setTargetId(ev.currentTarget.value)} />
                            <Checkbox label="Is Extend Relationship?" mt="md" checked={isExtend} onChange={(event) => setIsExtend(event.currentTarget.checked)} />
                            <Group justify="center" p="md">
                                {currentRel && <Button variant="light" color="gray" onClick={() => resetForm()} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selection
                                </Button>}
                                <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save relationship
                                </Button>
                                {currentRel && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                    Delete selected relationship
                                </Button>}
                            </Group>
                        </Fieldset>
                    </Grid.Col>
                    <Grid.Col span={8}>
                        <Fieldset legend="Existing Associations" style={{ width: "100%" }}>
                            {rels.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No relationships found!">
                                There are no relationships between use cases for this solution yet. You can create one by filling the form on the left.
                            </Alert>}
                            {rels.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                                {rels.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentRel(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentRel === a ? '5px solid cyan' : undefined
                                            }}>
                                            <Text>{(props.useCases.find(uc => uc.elementId === a.sourceId) ? props.useCases.find(uc => uc.elementId === a.sourceId)!.name : a.sourceId)} <i>{a.isExtend ? "extends" : "includes"}</i> {(props.useCases.find(uc => uc.elementId === a.targetId) ? props.useCases.find(uc => uc.elementId === a.targetId)!.name : a.targetId)}</Text>
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
