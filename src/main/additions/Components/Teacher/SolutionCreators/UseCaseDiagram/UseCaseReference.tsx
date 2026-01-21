import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, NativeSelect } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";
import { ReferenceUseCase, ReferenceSystem, UseCaseDiagramReferenceSolution } from "../../../../Utils/UseCaseDiagram/MatcherTypes";

export function UseCaseForm(props: { reference: UseCaseDiagramReferenceSolution | undefined, addUseCase: (useCases: ReferenceUseCase[]) => void }) {
    const [currentUseCase, setCurrentUseCase] = useState<ReferenceUseCase | undefined>(undefined)
    const [useCases, setUseCases] = useState<ReferenceUseCase[]>([])
    const [name, setName] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [nameError, setNameError] = useState<string | null>(null)
    const [owner, setOwner] = useState<string>("")
    const [systems, setSystems] = useState<ReferenceSystem[]>([])

    useEffect(() => {
        if (props.reference) {
            setUseCases(props.reference.useCases)
            setSystems(props.reference.systems)
            setOwner(props.reference.systems.length > 0 ? props.reference.systems[0].name : "")
        } else {
            setUseCases([])
            setSystems([])
            setOwner("")
        }
    }, [props.reference])

    useEffect(() => {
        if (currentUseCase) {
            setName(currentUseCase.name)
            setMessage(currentUseCase.message)
            setSynonyms(currentUseCase.synonyms)
            setOwner(currentUseCase.owner)
        } else {
            resetForm()
        }
    }, [currentUseCase])

    const resetForm = () => {
        setName("")
        setMessage("")
        setSynonyms([])
        setOwner("")
    }

    const handleSubmit = () => {
        setNameError(null)
        if (!currentUseCase) {
            if (name.trim().length === 0) {
                setNameError("Use case name cannot be empty")
                return
            }
            let newUC: ReferenceUseCase = new ReferenceUseCase()
            newUC.name = name.trim()
            newUC.message = message.trim()
            newUC.synonyms = synonyms
            newUC.owner = owner
            setUseCases([...useCases, newUC])
            resetForm()
            setCurrentUseCase(undefined)
            props.addUseCase([...useCases, newUC])
        } else {
            if (name.trim().length === 0) {
                setNameError("Use case name cannot be empty")
                return
            }
            let uc = useCases.find(uc => uc.name === currentUseCase.name)!
            uc.name = name.trim()
            uc.message = message.trim()
            uc.synonyms = synonyms
            uc.owner = owner
            setUseCases([...useCases.filter(uc => uc.name !== currentUseCase.name), uc])
            resetForm()
            setCurrentUseCase(undefined)
            props.addUseCase([...useCases.filter(uc => uc.name !== currentUseCase.name), uc])
        }
    }

    const handleDelete = () => {
        if (currentUseCase) {
            const updatedUseCases = useCases.filter(uc => uc.name !== currentUseCase.name)
            setUseCases(updatedUseCases)
            resetForm()
            setCurrentUseCase(undefined)
            props.addUseCase(updatedUseCases)
        }
    }

    return (
        <>
            <Grid justify="center" align="center">
                {systems.length === 0 && <Grid.Col span={12}>
                    <Alert icon={<IconExclamationCircle size={16} />} title="No systems found!">
                        There are no systems for this solution yet. Please create at least one system before adding use cases.
                    </Alert>
                </Grid.Col>}
                {systems.length > 0 && <><Grid.Col span={4}>
                    <Fieldset legend="Current Use Case" style={{ width: "100%" }}>
                        <TextInput label="Name" placeholder="Use case name" value={name} onChange={(event) => setName(event.currentTarget.value)} error={nameError} required />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(event) => setMessage(event.currentTarget.value)} minRows={3} mt="md" />
                        <NativeSelect label="Owner System" data={systems.filter((s) => !s.isExternal).map((s) => s.name)} value={owner} onChange={(event) => setOwner(event.currentTarget.value)} mt="md" />
                        <ListEditor mode="synonyms" list={synonyms} onListChange={setSynonyms} onSave={() => { }} />
                        <Group justify="center" p="md">
                            {currentUseCase && <Button variant="light" color="gray" onClick={() => setCurrentUseCase(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                Save use case
                            </Button>
                            {currentUseCase && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                Delete selected use case
                            </Button>}
                        </Group>
                    </Fieldset>
                </Grid.Col>
                    <Grid.Col span={8}>
                        <Fieldset legend="Use Cases" style={{ width: "100%" }}>
                            {useCases.length === 0 && <Alert icon={<IconExclamationCircle size={16} />} title="No use cases found!">
                                There are no use cases for this solution yet. You can create one by filling the form on the left.
                            </Alert>}
                            {useCases.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                                {useCases.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentUseCase(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentUseCase === a ? '5px solid cyan' : undefined
                                            }}>
                                            <Text>{a.name}</Text>
                                        </Card>
                                    )
                                })}
                            </Flex>}
                        </Fieldset>
                    </Grid.Col>
                </>}
            </Grid>
        </>
    )
}