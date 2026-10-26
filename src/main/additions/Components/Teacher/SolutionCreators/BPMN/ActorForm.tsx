import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, NativeSelect, Group } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { Actor, BPMNDiagramReferenceSolution } from "../../../../Utils/BPMN/MatcherTypes";
import { ListEditor } from "../ListEditor";
import { BulkListEditor } from "../BulkListEditor";

export function ActorForm(props: { reference: BPMNDiagramReferenceSolution | undefined, addActor: (actors: Actor[]) => void }) {
    const [currentActor, setCurrentActor] = useState<Actor | undefined>(undefined)
    const [actors, setActors] = useState<Actor[]>([])
    const [businessEntityNames, setBusinessEntityNames] = useState<string[]>([])
    const [name, setName] = useState<string>("")
    const [allowedNames, setAllowedNames] = useState<string[]>([])
    const [businessEntity, setBusinessEntity] = useState<string>("")
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setActors(props.reference.actors)
            setBusinessEntityNames(props.reference.businessEntities.map((be) => be.name))
        } else {
            setActors([])
            setBusinessEntityNames([])
        }
    }, [props.reference])

    useEffect(() => {
        if (businessEntityNames.length > 0 && !businessEntityNames.includes(businessEntity)) {
            setBusinessEntity(businessEntityNames[0])
        }
    }, [businessEntityNames])

    useEffect(() => {
        if (currentActor) {
            setName(currentActor.name)
            setAllowedNames(currentActor.allowedNames)
            setBusinessEntity(currentActor.businessEntity)
        } else {
            resetForm()
        }
    }, [currentActor])

    const resetForm = () => {
        setName("")
        setAllowedNames([])
        setBusinessEntity(businessEntityNames.length > 0 ? businessEntityNames[0] : "")
    }

    const handleSubmit = () => {
        setNameError(null)
        if (name.trim().length === 0) {
            setNameError("Name cannot be empty")
            return
        }
        if (!currentActor) {
            if (actors.find((a) => a.name === name)) {
                setNameError("An actor with this name already exists")
                return
            }
            let actor = new Actor()
            actor.name = name
            actor.allowedNames = allowedNames
            actor.businessEntity = businessEntity
            setActors([...actors, actor])
            props.addActor([...actors, actor])
        } else {
            let actor = actors.find((a) => a.name === currentActor.name)
            if (actor) {
                actor.name = name
                actor.allowedNames = allowedNames
                actor.businessEntity = businessEntity
                let newList = [...actors.filter((a) => a.name !== currentActor.name), actor]
                setActors(newList)
                props.addActor(newList)
            }
        }
        setCurrentActor(undefined)
        resetForm()
    }

    const handleDelete = () => {
        if (currentActor) {
            let newList = actors.filter((a) => a.name !== currentActor.name)
            setActors(newList)
            props.addActor(newList)
            setCurrentActor(undefined)
            resetForm()
        }
    }

    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={4}>
                <Fieldset legend="Current actor" style={{ width: "100%" }}>
                    {businessEntityNames.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No business entities found!" mb="sm">
                        Create at least one business entity on the <b>Business Entities</b> tab before adding actors.
                    </Alert>}
                    <TextInput label="Name" placeholder="Actor name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} disabled={businessEntityNames.length === 0} />
                    <NativeSelect label="Business entity (pool)" data={businessEntityNames} value={businessEntity} onChange={(ev) => setBusinessEntity(ev.target.value)} disabled={businessEntityNames.length === 0} />
                    <div style={{ marginTop: "1rem" }}>
                        <BulkListEditor legend="Bulk add allowed names" list={allowedNames} onAdd={setAllowedNames} />
                        <div style={{ marginTop: "0.5rem" }}>
                            <ListEditor mode="allowedNames" list={allowedNames} onListChange={(newList) => setAllowedNames(newList)} onSave={() => { }} />
                        </div>
                    </div>
                    <Group justify="center" p="md">
                        {currentActor && <Button variant="light" color="gray" onClick={() => setCurrentActor(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                            Cancel selection
                        </Button>}
                        <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" disabled={businessEntityNames.length === 0}>
                            Save actor
                        </Button>
                        {currentActor && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                            Delete selected actor
                        </Button>}
                    </Group>
                </Fieldset>
            </Grid.Col>
            <Grid.Col span={8}>
                <Fieldset legend="Actors" style={{ width: "100%" }}>
                    {actors.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                        {actors.map((actor, index) => (
                            <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentActor(actor)}
                                style={{
                                    width: 'fit-content', margin: 'auto', cursor: "pointer",
                                    border: currentActor === actor ? '5px solid cyan' : undefined
                                }} >
                                <Text>{actor.name}</Text>
                                <Text size="xs" color="dimmed">in {actor.businessEntity}</Text>
                            </Card>
                        ))}
                    </Flex>}
                    {actors.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No actors found!" >
                        There are no actors (lanes) for this solution yet. You can create one by filling the form on the left.
                    </Alert>}
                </Fieldset>
            </Grid.Col>
        </Grid>
    )
}
