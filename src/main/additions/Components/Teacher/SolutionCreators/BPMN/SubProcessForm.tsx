import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, NativeSelect, Checkbox, Group, Stack, Center, Badge, ActionIcon } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash, IconTrashFilled } from "@tabler/icons-react";
import { SubProcess, SubProcessBoundaryEvent, ElementReference, EVENT_DEFINITIONS, BPMNDiagramReferenceSolution } from "../../../../Utils/BPMN/MatcherTypes";
import { ListEditor } from "../ListEditor";
import { BulkListEditor } from "../BulkListEditor";

export function SubProcessForm(props: { reference: BPMNDiagramReferenceSolution | undefined, addSubProcess: (subProcesses: SubProcess[]) => void }) {
    const [currentSubProcess, setCurrentSubProcess] = useState<SubProcess | undefined>(undefined)
    const [subProcesses, setSubProcesses] = useState<SubProcess[]>([])
    const [businessEntityNames, setBusinessEntityNames] = useState<string[]>([])
    const [name, setName] = useState<string>("")
    const [allowedNames, setAllowedNames] = useState<string[]>([])
    const [parentPool, setParentPool] = useState<string>("")
    const [isEvent, setIsEvent] = useState<boolean>(false)
    const [isInterrupting, setIsInterrupting] = useState<boolean | null>(null)
    const [boundaryEvents, setBoundaryEvents] = useState<SubProcessBoundaryEvent[]>([])
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setSubProcesses(props.reference.subProcesses)
            setBusinessEntityNames(props.reference.businessEntities.map((be) => be.name))
        } else {
            setSubProcesses([])
            setBusinessEntityNames([])
        }
    }, [props.reference])

    useEffect(() => {
        if (businessEntityNames.length > 0 && !businessEntityNames.includes(parentPool)) {
            setParentPool(businessEntityNames[0])
        }
    }, [businessEntityNames])

    useEffect(() => {
        if (currentSubProcess) {
            setName(currentSubProcess.name)
            setAllowedNames(currentSubProcess.allowedNames)
            setParentPool(currentSubProcess.parent?.name || (businessEntityNames[0] || ""))
            setIsEvent(currentSubProcess.isEvent)
            setIsInterrupting(currentSubProcess.isInterrupting)
            setBoundaryEvents(currentSubProcess.boundaryEvents || [])
        } else {
            resetForm()
        }
    }, [currentSubProcess])

    const resetForm = () => {
        setName("")
        setAllowedNames([])
        setParentPool(businessEntityNames.length > 0 ? businessEntityNames[0] : "")
        setIsEvent(false)
        setIsInterrupting(null)
        setBoundaryEvents([])
    }

    const updateBoundaryEvent = (index: number, patch: Partial<SubProcessBoundaryEvent>) => {
        setBoundaryEvents((prev) => prev.map((b, i) => i === index ? { ...b, ...patch } : b))
    }
    const addBoundaryEvent = () => {
        setBoundaryEvents((prev) => [...prev, new SubProcessBoundaryEvent()])
    }
    const removeBoundaryEvent = (index: number) => {
        setBoundaryEvents((prev) => prev.filter((_, i) => i !== index))
    }

    const buildSubProcess = (): SubProcess => {
        let sp = new SubProcess()
        sp.name = name
        sp.allowedNames = allowedNames
        sp.isEvent = isEvent
        sp.isInterrupting = isEvent ? isInterrupting : null
        sp.boundaryEvents = boundaryEvents
        if (parentPool) {
            let parent = new ElementReference()
            parent.type = "Pool"
            parent.name = parentPool
            sp.parent = parent
        }
        return sp
    }

    const handleSubmit = () => {
        setNameError(null)
        if (name.trim().length === 0) {
            setNameError("Name cannot be empty")
            return
        }
        if (!currentSubProcess) {
            if (subProcesses.find((s) => s.name === name)) {
                setNameError("A sub-process with this name already exists")
                return
            }
            const newList = [...subProcesses, buildSubProcess()]
            setSubProcesses(newList)
            props.addSubProcess(newList)
        } else {
            const updated = buildSubProcess()
            const newList = [...subProcesses.filter((s) => s.name !== currentSubProcess.name), updated]
            setSubProcesses(newList)
            props.addSubProcess(newList)
        }
        setCurrentSubProcess(undefined)
        resetForm()
    }

    const handleDelete = () => {
        if (currentSubProcess) {
            let newList = subProcesses.filter((s) => s.name !== currentSubProcess.name)
            setSubProcesses(newList)
            props.addSubProcess(newList)
            setCurrentSubProcess(undefined)
            resetForm()
        }
    }

    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={4}>
                <Fieldset legend="Current sub-process" style={{ width: "100%" }}>
                    {businessEntityNames.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No business entities found!" mb="sm">
                        Create at least one business entity on the <b>Business Entities</b> tab before adding sub-processes.
                    </Alert>}
                    <TextInput label="Name" placeholder="Sub-process name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} disabled={businessEntityNames.length === 0} />
                    <NativeSelect label="Parent pool" data={businessEntityNames} value={parentPool} onChange={(ev) => setParentPool(ev.target.value)} disabled={businessEntityNames.length === 0} />
                    <Checkbox label="Event sub-process (triggeredByEvent)" checked={isEvent}
                        onChange={(ev) => { setIsEvent(ev.currentTarget.checked); if (!ev.currentTarget.checked) setIsInterrupting(null) }}
                        mt="sm" disabled={businessEntityNames.length === 0} />
                    <NativeSelect label="Interrupting" data={["", "Yes", "No"]}
                        value={isInterrupting === null ? "" : (isInterrupting ? "Yes" : "No")}
                        disabled={!isEvent}
                        onChange={(ev) => setIsInterrupting(ev.target.value === "" ? null : ev.target.value === "Yes")}
                        mt="sm" />

                    <Fieldset legend="Boundary events expected on this sub-process" mt="sm">
                        <Text size="xs" color="dimmed" mb={4}>
                            Checked as a condition on the sub-process itself (not a process part): the student's diagram just needs a matching boundary event attached to it somewhere, regardless of which process part models what happens afterwards.
                        </Text>
                        <Stack gap="sm">
                            {boundaryEvents.map((be, index) => (
                                <Fieldset key={index} legend={`Boundary event ${index + 1}`}>
                                    <Grid>
                                        <Grid.Col span={6}>
                                            <NativeSelect label="Event definition" data={["", ...EVENT_DEFINITIONS.filter((d) => d !== "Terminate")]} value={be.eventDefinition || ""}
                                                onChange={(ev) => updateBoundaryEvent(index, { eventDefinition: ev.target.value || null })} />
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <NativeSelect label="Interrupting" data={["", "Yes", "No"]}
                                                value={be.interrupting === null ? "" : (be.interrupting ? "Yes" : "No")}
                                                onChange={(ev) => updateBoundaryEvent(index, { interrupting: ev.target.value === "" ? null : ev.target.value === "Yes" })} />
                                        </Grid.Col>
                                    </Grid>
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <BulkListEditor legend="Bulk add names" list={be.names} onAdd={(newList) => updateBoundaryEvent(index, { names: newList })} />
                                        <div style={{ marginTop: "0.5rem" }}>
                                            <ListEditor mode="synonyms" list={be.names} onListChange={(newList) => updateBoundaryEvent(index, { names: newList })} onSave={() => { }} />
                                        </div>
                                    </div>
                                    <Textarea mt="sm" label="Description (custom feedback message)" placeholder='e.g. "The sub-process must account for a time-based condition."'
                                        value={be.description} onChange={(ev) => updateBoundaryEvent(index, { description: ev.target.value })} />
                                    <Center mt="sm">
                                        <ActionIcon color="red" variant="light" onClick={() => removeBoundaryEvent(index)}>
                                            <IconTrashFilled size={16} />
                                        </ActionIcon>
                                    </Center>
                                </Fieldset>
                            ))}
                            <Button variant="light" color="green" size="xs" onClick={addBoundaryEvent}
                                rightSection={<IconSquareRoundedPlusFilled size={14} />} style={{ alignSelf: "flex-start" }}>
                                Add boundary event
                            </Button>
                        </Stack>
                    </Fieldset>

                    <div style={{ marginTop: "1rem" }}>
                        <BulkListEditor legend="Bulk add allowed names" list={allowedNames} onAdd={setAllowedNames} />
                        <div style={{ marginTop: "0.5rem" }}>
                            <ListEditor mode="allowedNames" list={allowedNames} onListChange={(newList) => setAllowedNames(newList)} onSave={() => { }} />
                        </div>
                    </div>
                    <Group justify="center" p="md">
                        {currentSubProcess && <Button variant="light" color="gray" onClick={() => setCurrentSubProcess(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                            Cancel selection
                        </Button>}
                        <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" disabled={businessEntityNames.length === 0}>
                            Save sub-process
                        </Button>
                        {currentSubProcess && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                            Delete selected sub-process
                        </Button>}
                    </Group>
                </Fieldset>
            </Grid.Col>
            <Grid.Col span={8}>
                <Fieldset legend="Sub-processes" style={{ width: "100%" }}>
                    {subProcesses.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                        {subProcesses.map((sp, index) => (
                            <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentSubProcess(sp)}
                                style={{
                                    width: 'fit-content', margin: 'auto', cursor: "pointer",
                                    border: currentSubProcess === sp ? '5px solid cyan' : undefined
                                }} >
                                <Text>{sp.name}</Text>
                                <Text size="xs" color="dimmed">in {sp.parent?.name}</Text>
                                {sp.isEvent && <Badge color="grape" variant="light" mt={4}>
                                    event{sp.isInterrupting === null ? "" : sp.isInterrupting ? ", interrupting" : ", non-interrupting"}
                                </Badge>}
                                {sp.boundaryEvents?.length > 0 && <Badge color="orange" variant="light" mt={4} ml={4}>
                                    {sp.boundaryEvents.length} boundary event{sp.boundaryEvents.length === 1 ? "" : "s"}
                                </Badge>}
                            </Card>
                        ))}
                    </Flex>}
                    {subProcesses.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No sub-processes found!" >
                        There are no sub-processes for this solution yet. You can create one by filling the form on the left.
                    </Alert>}
                </Fieldset>
            </Grid.Col>
        </Grid>
    )
}
