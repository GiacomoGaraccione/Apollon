import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, Group, NativeSelect, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceUseCase, ReferenceUseCaseAssociation } from "../../../../../Utils/UseCaseDiagram/MatcherTypes";

export function ForbiddenUseCaseUseCaseAssociationForm(props: {
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
            setRels(props.associations)
            setUseCases(props.useCases)
            setSourceId(props.useCases.length > 0 ? props.useCases[0].name : "")
            setTargetId(props.useCases.length > 0 ? props.useCases[0].name : "")
            setIsExtend(false)
        }
    }, [props.associations, props.useCases])

    useEffect(() => {
        if (currentRel) {
            setSourceId(currentRel.sourceId)
            setTargetId(currentRel.targetId)
            setMessage(currentRel.message)
            setIsExtend(currentRel.isExtend)
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
            newRel.sourceId = sourceId
            newRel.targetId = targetId
            newRel.message = message.trim()
            newRel.isExtend = isExtend
            const updatedRels = [...rels, newRel]
            setRels(updatedRels)
            props.addUseCaseAssociations(updatedRels)
            resetForm()
        } else {
            let rel = rels.find(r => r.sourceId === currentRel.sourceId && r.targetId === currentRel.targetId)!
            rel.sourceId = sourceId
            rel.targetId = targetId
            rel.message = message.trim()
            rel.isExtend = isExtend
            const updatedRels = rels.map(r => (r.sourceId === rel.sourceId && r.targetId === rel.targetId) ? rel : r)
            setRels(updatedRels)
            props.addUseCaseAssociations(updatedRels)
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
                You need at least two use cases to create forbidden associations.
            </Alert> : <>
                <Grid justify="center" align="center">
                    <Grid.Col span={4}>
                        <Fieldset legend="Current Association" style={{ width: "100%" }}>
                            <NativeSelect label="Specialized Use Case" data={useCases.map((a) => a.name)} value={sourceId} onChange={(ev) => setSourceId(ev.currentTarget.value)} />
                            <NativeSelect label="Base/Included Use Case" data={useCases.map((a) => a.name)} mt="md" value={targetId} onChange={(ev) => setTargetId(ev.currentTarget.value)} />
                            <Group justify="center" p="md">
                                {currentRel && <Button variant="light" color="gray" onClick={() => resetForm()} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selection
                                </Button>}
                                <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save forbidden relationship
                                </Button>
                                {currentRel && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                    Delete selected forbidden relationship
                                </Button>}
                            </Group>
                        </Fieldset>
                    </Grid.Col>
                    <Grid.Col span={8}>
                        <Fieldset legend="Existing Associations" style={{ width: "100%" }}>
                            {rels.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No forbidden relationships found!">
                                There are no forbidden relationships between use cases for this solution yet. You can create one by filling the form on the left.
                            </Alert>}
                            {rels.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                                {rels.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentRel(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentRel === a ? '5px solid cyan' : undefined
                                            }}>
                                            <Text>{a.sourceId} and {a.targetId} <i>cannot be connected</i></Text>
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
