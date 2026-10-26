import React, { useState } from "react";
import { Alert, Badge, Button, Card, Flex, Text, Fieldset, Center, Group } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrashFilled } from "@tabler/icons-react";
import { ProcessPart, PartGroup, GroupElement, ElementVariant } from "../../../../Utils/BPMN/MatcherTypes";
import { GroupElementForm } from "./GroupElementForm";

export function GroupElementsForm(props: {
    part: ProcessPart,
    businessEntityNames: string[],
    actorNames: string[],
    subProcessNames: string[],
    processPartNames: string[],
    onUpdatePart: (updated: ProcessPart) => void,
    onBack: () => void
}) {
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
    const [selectedElement, setSelectedElement] = useState<GroupElement | undefined>(undefined)

    const groups = props.part.possibleGroups
    const groupIndex = groups.length > 0 ? Math.min(selectedGroupIndex, groups.length - 1) : 0
    const group: PartGroup | undefined = groups[groupIndex]
    const elements = group?.elements ?? []

    // Sempre riscritto come l'INTERO array possibleGroups (mai un singolo gruppo isolato): e'
    // quello che prima faceva perdere silenziosamente i gruppi alternativi non selezionati.
    const updateGroups = (newGroups: PartGroup[]) => {
        props.onUpdatePart({ ...props.part, possibleGroups: newGroups })
    }

    const handleAddGroup = () => {
        const newGroup: PartGroup = { groupId: `Group_${groups.length + 1}`, elements: [] }
        updateGroups([...groups, newGroup])
        setSelectedGroupIndex(groups.length)
        setSelectedElement(undefined)
    }

    const handleDeleteGroup = () => {
        if (groups.length <= 1) return
        updateGroups(groups.filter((_, i) => i !== groupIndex))
        setSelectedGroupIndex(0)
        setSelectedElement(undefined)
    }

    const handleAddElement = () => {
        let ge = new GroupElement()
        let variant = new ElementVariant()
        ge.elementVariants = [variant]
        ge.elementId = `${variant.bpmnType}_${elements.length + 1}`

        const updatedGroup: PartGroup = group ? { ...group, elements: [...group.elements, ge] } : { groupId: "Group_1", elements: [ge] }
        const newGroups = groups.length > 0 ? groups.map((g, i) => i === groupIndex ? updatedGroup : g) : [updatedGroup]
        updateGroups(newGroups)
        setSelectedElement(ge)
    }

    const handleSaveElement = (updated: GroupElement) => {
        if (!group) return
        const newElements = group.elements.map((el) => el.elementId === updated.elementId ? updated : el)
        updateGroups(groups.map((g, i) => i === groupIndex ? { ...g, elements: newElements } : g))
        setSelectedElement(undefined)
    }

    const handleDeleteElement = () => {
        if (!group || !selectedElement) return
        const newElements = group.elements.filter((el) => el.elementId !== selectedElement.elementId)
        updateGroups(groups.map((g, i) => i === groupIndex ? { ...g, elements: newElements } : g))
        setSelectedElement(undefined)
    }

    if (selectedElement) {
        return (
            <GroupElementForm
                element={selectedElement}
                businessEntityNames={props.businessEntityNames}
                actorNames={props.actorNames}
                subProcessNames={props.subProcessNames}
                otherElementIds={elements.map((el) => el.elementId).filter((id) => id !== selectedElement.elementId)}
                processPartNames={props.processPartNames}
                onSave={handleSaveElement}
                onCancel={() => setSelectedElement(undefined)}
                onDelete={handleDeleteElement}
            />
        )
    }

    return (
        <Fieldset legend={`Elements of process part: ${props.part.name}`} style={{ width: "100%" }}>
            <Group justify="space-between" mb="md">
                <Button variant="light" color="gray" onClick={props.onBack} rightSection={<IconArrowBackUp size={16} stroke={1.5} />}>
                    Back to process parts
                </Button>
                <Button variant="light" color="green" onClick={handleAddElement} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}>
                    Add new element
                </Button>
            </Group>

            <Text size="xs" color="dimmed" mb={4}>
                Possible groups: alternative, equally valid ways of modeling this process part. A student only needs to match ONE of them completely.
            </Text>
            <Group mb="md">
                {groups.map((g, index) => (
                    <Button key={g.groupId} size="xs" variant={index === groupIndex ? "filled" : "light"} color="cyan"
                        onClick={() => { setSelectedGroupIndex(index); setSelectedElement(undefined) }}>
                        {g.groupId} ({g.elements.length})
                    </Button>
                ))}
                <Button size="xs" variant="light" color="green" onClick={handleAddGroup} rightSection={<IconSquareRoundedPlusFilled size={14} />}>
                    Add alternative group
                </Button>
                {groups.length > 1 && <Button size="xs" variant="light" color="red" onClick={handleDeleteGroup} rightSection={<IconTrashFilled size={14} />}>
                    Delete this group
                </Button>}
            </Group>

            {elements.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                {elements.map((el, index) => (
                    <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setSelectedElement(el)}
                        style={{ width: 'fit-content', margin: 'auto', cursor: "pointer" }} >
                        <Text>{el.elementId}</Text>
                        <Text size="xs" color="dimmed">{el.names[0] || "(no name)"}</Text>
                        <Badge mt="xs" variant="light" color="cyan">{el.elementVariants[0]?.bpmnType}{el.elementVariants.length > 1 ? ` (+${el.elementVariants.length - 1})` : ""}</Badge>
                    </Card>
                ))}
            </Flex>}
            {elements.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No elements found!" >
                This group has no elements yet. Click "Add new element" to create one.
            </Alert>}
        </Fieldset>
    )
}
