import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";
import { ReferenceSystem, UseCaseDiagramReferenceSolution } from "../../../../Utils/UseCaseDiagram/MatcherTypes";

export function SystemForm(props: { reference: UseCaseDiagramReferenceSolution | undefined, addSystem: (systems: ReferenceSystem[]) => void }) {
    const [currentSystem, setCurrentSystem] = useState<ReferenceSystem | undefined>(undefined)
    const [systems, setSystems] = useState<ReferenceSystem[]>([])
    const [name, setName] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [isExternal, setIsExternal] = useState<boolean>(false)
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setSystems(props.reference.systems)
        } else {
            setSystems([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentSystem) {
            setName(currentSystem.name)
            setMessage(currentSystem.message)
            setIsExternal(currentSystem.isExternal)
            setSynonyms(currentSystem.synonyms)
        } else {
            resetForm()
        }
    }, [currentSystem])

    const resetForm = () => {
        setName("")
        setMessage("")
        setIsExternal(false)
        setSynonyms([])
    }

    const handleSubmit = () => {
        setNameError(null)
        if (!currentSystem) {
            if (name.trim().length === 0) {
                setNameError("System name cannot be empty")
                return
            }
            if (systems.find(s => s.name === name.trim())) {
                setNameError("System name must be unique")
                return
            }
            let newSystem: ReferenceSystem = new ReferenceSystem()
            newSystem.name = name.trim()
            newSystem.message = message.trim()
            newSystem.isExternal = isExternal
            newSystem.synonyms = synonyms
            setSystems([...systems, newSystem])
            resetForm()
            setCurrentSystem(undefined)
            props.addSystem([...systems, newSystem])
        } else {
            if (name.trim().length === 0) {
                setNameError("System name cannot be empty")
                return
            }
            let system = systems.find(s => s.name === currentSystem.name)!
            system.name = name.trim()
            system.message = message.trim()
            system.isExternal = isExternal
            system.synonyms = synonyms
            setSystems([...systems.filter(s => s.name !== currentSystem.name), system])
            resetForm()
            setCurrentSystem(undefined)
            props.addSystem([...systems.filter(s => s.name !== currentSystem.name), system])
        }
    }

    const handleDelete = () => {
        if (currentSystem) {
            const updatedSystems = systems.filter(s => s.name !== currentSystem.name)
            setSystems(updatedSystems)
            resetForm()
            setCurrentSystem(undefined)
            props.addSystem(updatedSystems)
        }
    }

    return (
        <>
            <Grid justify="center" align="center">
                <Grid.Col span={4}>
                    <Fieldset legend="Current System" style={{ width: "100%" }}>
                        <TextInput label="Name" placeholder="System name" value={name} onChange={(event) => setName(event.currentTarget.value)} error={nameError} required />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(event) => setMessage(event.currentTarget.value)} minRows={3} mt="md" />
                        <Checkbox label="Is the system external?" checked={isExternal} onChange={(event) => setIsExternal(event.currentTarget.checked)} mt="md" />
                        <ListEditor mode="synonyms" list={synonyms} onListChange={setSynonyms} onSave={() => { }} />
                        <Group justify="center" p="md">
                            {currentSystem && <Button variant="light" color="gray" onClick={() => setCurrentSystem(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                Save system
                            </Button>
                            {currentSystem && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                Delete selected system
                            </Button>}
                        </Group>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={8}>
                    <Fieldset legend="Systems" style={{ width: "100%" }}>
                        {systems.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No systems found!">
                            There are no systems for this solution yet. You can create one by filling the form on the left.
                        </Alert>}
                        {systems.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                            {systems.map((s, index) => {
                                return (
                                    <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentSystem(s)}
                                        style={{
                                            width: 'fit-content', margin: 'auto', cursor: "pointer",
                                            border: currentSystem === s ? '5px solid cyan' : undefined
                                        }}>
                                        <Text>{s.name}</Text>
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