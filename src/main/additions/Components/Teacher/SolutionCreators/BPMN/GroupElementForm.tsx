import React, { useEffect, useState } from "react";
import { Badge, Button, Fieldset, Grid, Textarea, NativeSelect, MultiSelect, Group, Stack, ActionIcon } from "@mantine/core";
import { IconArrowBackUp, IconSquareRoundedPlusFilled, IconTrash, IconTrashFilled } from "@tabler/icons-react";
import { GroupElement, ElementVariant, ElementReference, TASK_TYPES, GATEWAY_TYPES, EVENT_TYPES, EVENT_DEFINITIONS } from "../../../../Utils/BPMN/MatcherTypes";
import { ListEditor } from "../ListEditor";
import { BulkListEditor } from "../BulkListEditor";

const ALL_BPMN_TYPES = [...TASK_TYPES, ...GATEWAY_TYPES, ...EVENT_TYPES]

function newVariant(): ElementVariant {
    let v = new ElementVariant()
    v.bpmnType = "Task"
    return v
}

function ElementReferenceListEditor(props: {
    legend: string
    list: ElementReference[]
    partNames: string[]
    poolNames: string[]
    onChange: (list: ElementReference[]) => void
}) {
    const optionsFor = (type: string) => type === "Pool" ? props.poolNames : props.partNames

    const handleAdd = () => {
        const ref = new ElementReference()
        ref.type = "Part"
        ref.name = props.partNames[0] || ""
        props.onChange([...props.list, ref])
    }
    const handleUpdate = (index: number, patch: Partial<ElementReference>) => {
        props.onChange(props.list.map((r, i) => i === index ? { ...r, ...patch } : r))
    }
    const handleRemove = (index: number) => {
        props.onChange(props.list.filter((_, i) => i !== index))
    }

    return (
        <Fieldset legend={props.legend} mt="sm">
            <Stack gap="xs">
                {props.list.map((ref, index) => (
                    <Group key={index} align="flex-end">
                        <NativeSelect label="Target type" data={["Part", "Pool"]} value={ref.type}
                            onChange={(ev) => {
                                const newType = ev.target.value
                                handleUpdate(index, { type: newType, name: optionsFor(newType)[0] || "" })
                            }} />
                        <NativeSelect label="Target name" data={optionsFor(ref.type)} value={ref.name}
                            onChange={(ev) => handleUpdate(index, { name: ev.target.value })} />
                        <ActionIcon color="red" variant="light" onClick={() => handleRemove(index)} mb={2}>
                            <IconTrashFilled size={16} />
                        </ActionIcon>
                    </Group>
                ))}
                <Button variant="light" color="green" size="xs" onClick={handleAdd}
                    rightSection={<IconSquareRoundedPlusFilled size={14} />} style={{ alignSelf: "flex-start" }}
                    disabled={props.partNames.length === 0 && props.poolNames.length === 0}>
                    Add reference
                </Button>
            </Stack>
        </Fieldset>
    )
}

export function GroupElementForm(props: {
    element: GroupElement,
    businessEntityNames: string[],
    actorNames: string[],
    subProcessNames: string[],
    otherElementIds: string[],
    processPartNames: string[],
    onSave: (updated: GroupElement) => void,
    onCancel: () => void,
    onDelete: () => void
}) {
    const [elementVariants, setElementVariants] = useState<ElementVariant[]>([newVariant()])
    const [parentType, setParentType] = useState<string>("Pool")
    const [parentName, setParentName] = useState<string>("")
    const [names, setNames] = useState<string[]>([])
    const [previousElements, setPreviousElements] = useState<string[]>([])
    const [actor, setActor] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [messageTo, setMessageTo] = useState<ElementReference[]>([])
    const [messageFrom, setMessageFrom] = useState<ElementReference[]>([])
    const [attachedTo, setAttachedTo] = useState<string>("")
    const [attacher, setAttacher] = useState<string[]>([])

    useEffect(() => {
        setElementVariants(props.element.elementVariants.length > 0 ? props.element.elementVariants : [newVariant()])
        setParentType(props.element.parent?.type || "Pool")
        setParentName(props.element.parent?.name || "")
        setNames(props.element.names)
        setPreviousElements(props.element.previousElements)
        setActor(props.element.actor || "")
        setDescription(props.element.description)
        setMessageTo(props.element.messageTo || [])
        setMessageFrom(props.element.messageFrom || [])
        setAttachedTo(props.element.attachedTo?.name || "")
        setAttacher((props.element.attacher || []).map((r) => r.name))
    }, [props.element])

    const updateVariant = (index: number, patch: Partial<ElementVariant>) => {
        setElementVariants((prev) => prev.map((v, i) => i === index ? { ...v, ...patch } : v))
    }

    const addVariant = () => {
        setElementVariants((prev) => [...prev, newVariant()])
    }

    const removeVariant = (index: number) => {
        if (elementVariants.length === 1) return
        setElementVariants((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        let parent: ElementReference | null = null
        if (parentName) {
            parent = new ElementReference()
            parent.type = parentType
            parent.name = parentName
        }
        let attachedToRef: ElementReference | null = null
        if (attachedTo) {
            attachedToRef = new ElementReference()
            attachedToRef.type = "Part"
            attachedToRef.name = attachedTo
        }
        const attacherRefs: ElementReference[] = attacher.map((id) => {
            const r = new ElementReference()
            r.type = "Part"
            r.name = id
            return r
        })
        let updated: GroupElement = {
            ...props.element,
            elementVariants,
            parent,
            names,
            previousElements,
            actor: actor || null,
            description,
            messageTo,
            messageFrom,
            attachedTo: attachedToRef,
            attacher: attacherRefs,
        }
        props.onSave(updated)
    }

    return (
        <Fieldset legend={`Element: ${props.element.elementId}`} style={{ width: "100%" }}>
            <Badge color="gray" mb="sm">elementId: {props.element.elementId} (fixed)</Badge>

            <Fieldset legend="Element variants (accepted as equivalent alternatives)" mt="sm">
                <Stack gap="sm">
                    {elementVariants.map((variant, index) => {
                        const isGateway = GATEWAY_TYPES.includes(variant.bpmnType)
                        const isEvent = EVENT_TYPES.includes(variant.bpmnType)
                        const isBoundaryEvent = variant.bpmnType === "BoundaryEvent"
                        return (
                            <Group key={index} align="flex-end" wrap="wrap">
                                <NativeSelect label="BPMN type" data={ALL_BPMN_TYPES} value={variant.bpmnType}
                                    onChange={(ev) => updateVariant(index, { bpmnType: ev.target.value, gatewayType: null, eventDefinition: null, interrupting: null })} />
                                <NativeSelect label="Event definition"
                                    data={["", ...EVENT_DEFINITIONS.filter((d) => d !== "Terminate" || variant.bpmnType === "EndEvent")]}
                                    value={variant.eventDefinition || ""}
                                    disabled={!isEvent} onChange={(ev) => updateVariant(index, { eventDefinition: ev.target.value || null })} />
                                <NativeSelect label="Gateway type" data={["", "split", "merge"]} value={variant.gatewayType || ""}
                                    disabled={!isGateway} onChange={(ev) => updateVariant(index, { gatewayType: ev.target.value || null })} />
                                <NativeSelect label="Interrupting" data={["", "Yes", "No"]}
                                    value={variant.interrupting === null ? "" : (variant.interrupting ? "Yes" : "No")}
                                    disabled={!isBoundaryEvent}
                                    onChange={(ev) => updateVariant(index, { interrupting: ev.target.value === "" ? null : ev.target.value === "Yes" })} />
                                <ActionIcon color="red" variant="light" disabled={elementVariants.length === 1} onClick={() => removeVariant(index)} mb={2}>
                                    <IconTrashFilled size={16} />
                                </ActionIcon>
                            </Group>
                        )
                    })}
                    <Button variant="light" color="green" onClick={addVariant} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} style={{ alignSelf: "flex-start" }}>
                        Add variant
                    </Button>
                </Stack>
            </Fieldset>

            <Grid mt="sm">
                <Grid.Col span={3}>
                    <NativeSelect label="Parent type" data={["Pool", "SubProcess"]} value={parentType}
                        onChange={(ev) => {
                            const newType = ev.target.value
                            setParentType(newType)
                            setParentName((newType === "Pool" ? props.businessEntityNames : props.subProcessNames)[0] || "")
                        }} />
                </Grid.Col>
                <Grid.Col span={3}>
                    <NativeSelect label={parentType === "Pool" ? "Parent pool" : "Parent sub-process"}
                        data={["", ...(parentType === "Pool" ? props.businessEntityNames : props.subProcessNames)]}
                        value={parentName} onChange={(ev) => setParentName(ev.target.value)} />
                </Grid.Col>
                <Grid.Col span={6}>
                    <NativeSelect label="Actor (lane)" data={["", ...props.actorNames]} value={actor} onChange={(ev) => setActor(ev.target.value)} />
                </Grid.Col>
            </Grid>

            <MultiSelect mt="sm" label="Previous elements (within this group)" placeholder="Select the elements that must precede this one"
                data={props.otherElementIds} value={previousElements} onChange={setPreviousElements} searchable clearable />

            <Grid mt="sm">
                <Grid.Col span={6}>
                    <NativeSelect label="Attached to (boundary event host, within this group)" data={["", ...props.otherElementIds]}
                        value={attachedTo} onChange={(ev) => setAttachedTo(ev.target.value)} />
                </Grid.Col>
                <Grid.Col span={6}>
                    <MultiSelect label="Attacher(s) (boundary events attached to this task, within this group)" placeholder="Select boundary events"
                        data={props.otherElementIds} value={attacher} onChange={setAttacher} searchable clearable />
                </Grid.Col>
            </Grid>

            <ElementReferenceListEditor legend="Message to (other Process Parts or Pools this element sends a message to)"
                list={messageTo} partNames={props.processPartNames} poolNames={props.businessEntityNames} onChange={setMessageTo} />
            <ElementReferenceListEditor legend="Message from (other Process Parts or Pools this element receives a message from)"
                list={messageFrom} partNames={props.processPartNames} poolNames={props.businessEntityNames} onChange={setMessageFrom} />

            <Textarea mt="sm" label="Description (custom feedback message)" value={description} onChange={(ev) => setDescription(ev.target.value)} />

            <div style={{ marginTop: "1rem" }}>
                <BulkListEditor legend="Bulk add synonyms" list={names} onAdd={setNames} />
                <div style={{ marginTop: "0.5rem" }}>
                    <ListEditor mode="synonyms" list={names} onListChange={setNames} onSave={() => { }} />
                </div>
            </div>

            <Group justify="center" p="md">
                <Button variant="light" color="gray" onClick={props.onCancel} rightSection={<IconArrowBackUp size={16} stroke={1.5} />}>
                    Back to elements list
                </Button>
                <Button variant="light" color="green" onClick={handleSave} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}>
                    Save element
                </Button>
                <Button variant="light" color="red" onClick={props.onDelete} rightSection={<IconTrash size={16} stroke={1.5} />}>
                    Delete element
                </Button>
            </Group>
        </Fieldset>
    )
}
