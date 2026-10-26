import React, { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Flex, Text, Fieldset, Grid, TextInput, MultiSelect, Group } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconListDetails, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ProcessPart, BPMNDiagramReferenceSolution } from "../../../../Utils/BPMN/MatcherTypes";

export function ProcessPartForm(props: {
    reference: BPMNDiagramReferenceSolution | undefined,
    addProcessPart: (processParts: ProcessPart[]) => void,
    onEditElements: (part: ProcessPart) => void
}) {
    const [currentPart, setCurrentPart] = useState<ProcessPart | undefined>(undefined)
    const [processParts, setProcessParts] = useState<ProcessPart[]>([])
    const [name, setName] = useState<string>("")
    const [previousParts, setPreviousParts] = useState<string[]>([])
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setProcessParts(props.reference.processParts)
        } else {
            setProcessParts([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentPart) {
            setName(currentPart.name)
            setPreviousParts(currentPart.previousParts)
        } else {
            resetForm()
        }
    }, [currentPart])

    const resetForm = () => {
        setName("")
        setPreviousParts([])
    }

    const otherPartNames = processParts.filter((p) => p.name !== currentPart?.name).map((p) => p.name)

    const handleSubmit = () => {
        setNameError(null)
        if (name.trim().length === 0) {
            setNameError("Name cannot be empty")
            return
        }
        if (!currentPart) {
            if (processParts.find((p) => p.name === name)) {
                setNameError("A process part with this name already exists")
                return
            }
            let part = new ProcessPart()
            part.name = name
            part.previousParts = previousParts
            part.possibleGroups = []
            setProcessParts([...processParts, part])
            props.addProcessPart([...processParts, part])
        } else {
            let part = processParts.find((p) => p.name === currentPart.name)
            if (part) {
                part.name = name
                part.previousParts = previousParts
                let newList = [...processParts.filter((p) => p.name !== currentPart.name), part]
                setProcessParts(newList)
                props.addProcessPart(newList)
            }
        }
        setCurrentPart(undefined)
        resetForm()
    }

    const handleDelete = () => {
        if (currentPart) {
            let newList = processParts.filter((p) => p.name !== currentPart.name)
            setProcessParts(newList)
            props.addProcessPart(newList)
            setCurrentPart(undefined)
            resetForm()
        }
    }

    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={4}>
                <Fieldset legend="Current process part" style={{ width: "100%" }}>
                    <TextInput label="Name" placeholder="Process part name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} />
                    <MultiSelect label="Previous process parts" placeholder="Select the parts that must precede this one"
                        data={otherPartNames} value={previousParts} onChange={setPreviousParts} mt="sm" searchable clearable />
                    <Group justify="center" p="md">
                        {currentPart && <Button variant="light" color="gray" onClick={() => setCurrentPart(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                            Cancel selection
                        </Button>}
                        <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                            Save process part
                        </Button>
                        {currentPart && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                            Delete selected process part
                        </Button>}
                    </Group>
                </Fieldset>
            </Grid.Col>
            <Grid.Col span={8}>
                <Fieldset legend="Process parts" style={{ width: "100%" }}>
                    {processParts.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                        {processParts.map((part, index) => {
                            const groupCount = part.possibleGroups.length
                            const elementCount = part.possibleGroups.reduce((sum, g) => sum + g.elements.length, 0)
                            return (
                                <Card shadow="sm" padding="lg" radius="md" withBorder key={index}
                                    style={{
                                        width: 'fit-content', margin: 'auto',
                                        border: currentPart === part ? '5px solid cyan' : undefined
                                    }} >
                                    <Text onClick={() => setCurrentPart(part)} style={{ cursor: "pointer" }}>{part.name}</Text>
                                    <Group mt="xs" justify="space-between">
                                        <Badge color={elementCount > 0 ? "green" : "gray"} variant="light">
                                            {elementCount} element{elementCount === 1 ? "" : "s"}{groupCount > 1 ? ` across ${groupCount} groups` : ""}
                                        </Badge>
                                        <Button variant="light" color="cyan" size="xs" rightSection={<IconListDetails size={14} />} onClick={() => props.onEditElements(part)}>
                                            Edit elements
                                        </Button>
                                    </Group>
                                </Card>
                            )
                        })}
                    </Flex>}
                    {processParts.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No process parts found!" >
                        There are no process parts for this solution yet. You can create one by filling the form on the left.
                    </Alert>}
                </Fieldset>
            </Grid.Col>
        </Grid>
    )
}
