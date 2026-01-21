import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";
import { ReferenceActor, UseCaseDiagramReferenceSolution } from "../../../../Utils/UseCaseDiagram/MatcherTypes";

export function ActorForm(props: { reference: UseCaseDiagramReferenceSolution | undefined, addActor: (actors: ReferenceActor[]) => void }) {
    const [currentActor, setCurrentActor] = useState<ReferenceActor | undefined>(undefined)
    const [actors, setActors] = useState<ReferenceActor[]>([])
    const [name, setName] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setActors(props.reference.actors)
        } else {
            setActors([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentActor) {
            setName(currentActor.name)
            setMessage(currentActor.message)
            setSynonyms(currentActor.synonyms)
        } else {
            resetForm()
        }
    }, [currentActor])

    const resetForm = () => {
        setName("")
        setMessage("")
        setSynonyms([])
    }

    const handleSubmit = () => {
        setNameError(null)
        if (!currentActor) {
            if (name.trim().length === 0) {
                setNameError("Actor name cannot be empty")
                return
            }
            if (actors.find(a => a.name === name.trim())) {
                setNameError("Actor name must be unique")
                return
            }
            let newActor: ReferenceActor = new ReferenceActor()
            newActor.name = name.trim()
            newActor.message = message.trim()
            newActor.synonyms = synonyms
            setActors([...actors, newActor])
            resetForm()
            setCurrentActor(undefined)
            props.addActor([...actors, newActor])
        } else {
            if (name.trim().length === 0) {
                setNameError("Actor name cannot be empty")
                return
            }
            let actor = actors.find(a => a.name === currentActor.name)!
            actor.name = name.trim()
            actor.message = message.trim()
            actor.synonyms = synonyms
            setActors([...actors.filter(a => a.name !== currentActor.name), actor])
            resetForm()
            setCurrentActor(undefined)
            props.addActor([...actors.filter(a => a.name !== currentActor.name), actor])
        }
    }

    const handleDelete = () => {
        if (currentActor) {
            setActors(actors.filter(a => a.name !== currentActor.name))
            resetForm()
            setCurrentActor(undefined)
            props.addActor(actors.filter(a => a.name !== currentActor.name))
        }
    }

    return (
        <>
            <Grid justify="center" align="center">
                <Grid.Col span={4}>
                    <Fieldset legend="Current Actor" style={{ width: "100%" }}>
                        <TextInput label="Name" placeholder="Actor name" value={name} onChange={(event) => setName(event.currentTarget.value)} error={nameError} required />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(event) => setMessage(event.currentTarget.value)} minRows={3} mt="md" />
                        <ListEditor mode="synonyms" list={synonyms} onListChange={setSynonyms} onSave={() => { }} />
                        <Group justify="center" p="md">
                            {currentActor && <Button variant="light" color="gray" onClick={() => setCurrentActor(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
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
                        {actors.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No actors found!">
                            There are no actors for this solution yet. You can create one by filling the form on the left.
                        </Alert>}
                        {actors.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                            {actors.map((a, index) => {
                                return (
                                    <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentActor(a)}
                                        style={{
                                            width: 'fit-content', margin: 'auto', cursor: "pointer",
                                            border: currentActor === a ? '5px solid cyan' : undefined
                                        }}>
                                        <Text>{a.name}</Text>
                                    </Card>
                                )
                            })}
                        </Flex>}
                    </Fieldset>
                </Grid.Col>
            </Grid>
        </>
    )
}