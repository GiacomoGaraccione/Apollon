import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Checkbox, Flex, Text, Fieldset, Grid, TextInput, Group } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { BusinessEntity, BPMNDiagramReferenceSolution } from "../../../../Utils/BPMN/MatcherTypes";
import { ListEditor } from "../ListEditor";
import { BulkListEditor } from "../BulkListEditor";

export function BusinessEntityForm(props: { reference: BPMNDiagramReferenceSolution | undefined, addBusinessEntity: (businessEntities: BusinessEntity[]) => void }) {
    const [currentEntity, setCurrentEntity] = useState<BusinessEntity | undefined>(undefined)
    const [businessEntities, setBusinessEntities] = useState<BusinessEntity[]>([])
    const [name, setName] = useState<string>("")
    const [allowedNames, setAllowedNames] = useState<string[]>([])
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
    const [isOptional, setIsOptional] = useState<boolean>(false)
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setBusinessEntities(props.reference.businessEntities)
        } else {
            setBusinessEntities([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentEntity) {
            setName(currentEntity.name)
            setAllowedNames(currentEntity.allowedNames)
            setIsCollapsed(currentEntity.isCollapsed)
            setIsOptional(currentEntity.isOptional)
        } else {
            resetForm()
        }
    }, [currentEntity])

    const resetForm = () => {
        setName("")
        setAllowedNames([])
        setIsCollapsed(false)
        setIsOptional(false)
    }

    const handleSubmit = () => {
        setNameError(null)
        if (name.trim().length === 0) {
            setNameError("Name cannot be empty")
            return
        }
        if (!currentEntity) {
            if (businessEntities.find((be) => be.name === name)) {
                setNameError("A business entity with this name already exists")
                return
            }
            let be = new BusinessEntity()
            be.name = name
            be.allowedNames = allowedNames
            be.isCollapsed = isCollapsed
            be.isOptional = isOptional
            setBusinessEntities([...businessEntities, be])
            props.addBusinessEntity([...businessEntities, be])
        } else {
            let be = businessEntities.find((b) => b.name === currentEntity.name)
            if (be) {
                be.name = name
                be.allowedNames = allowedNames
                be.isCollapsed = isCollapsed
                be.isOptional = isOptional
                let newList = [...businessEntities.filter((b) => b.name !== currentEntity.name), be]
                setBusinessEntities(newList)
                props.addBusinessEntity(newList)
            }
        }
        setCurrentEntity(undefined)
        resetForm()
    }

    const handleDelete = () => {
        if (currentEntity) {
            let newList = businessEntities.filter((b) => b.name !== currentEntity.name)
            setBusinessEntities(newList)
            props.addBusinessEntity(newList)
            setCurrentEntity(undefined)
            resetForm()
        }
    }

    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={4}>
                <Fieldset legend="Current business entity" style={{ width: "100%" }}>
                    <TextInput label="Name" placeholder="Business entity name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} />
                    <Group grow mt="sm">
                        <Checkbox label="Collapsed pool" checked={isCollapsed} onChange={(ev) => setIsCollapsed(ev.currentTarget.checked)} />
                        <Checkbox label="Optional" checked={isOptional} onChange={(ev) => setIsOptional(ev.currentTarget.checked)} />
                    </Group>
                    <div style={{ marginTop: "1rem" }}>
                        <BulkListEditor legend="Bulk add allowed names" list={allowedNames} onAdd={setAllowedNames} />
                        <div style={{ marginTop: "0.5rem" }}>
                            <ListEditor mode="allowedNames" list={allowedNames} onListChange={(newList) => setAllowedNames(newList)} onSave={() => { }} />
                        </div>
                    </div>
                    <Group justify="center" p="md">
                        {currentEntity && <Button variant="light" color="gray" onClick={() => setCurrentEntity(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                            Cancel selection
                        </Button>}
                        <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                            Save business entity
                        </Button>
                        {currentEntity && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                            Delete selected business entity
                        </Button>}
                    </Group>
                </Fieldset>
            </Grid.Col>
            <Grid.Col span={8}>
                <Fieldset legend="Business entities" style={{ width: "100%" }}>
                    {businessEntities.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
                        {businessEntities.map((be, index) => (
                            <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentEntity(be)}
                                style={{
                                    width: 'fit-content', margin: 'auto', cursor: "pointer",
                                    border: currentEntity === be ? '5px solid cyan' : undefined
                                }} >
                                <Text>{be.name}</Text>
                            </Card>
                        ))}
                    </Flex>}
                    {businessEntities.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No business entities found!" >
                        There are no business entities (pools) for this solution yet. You can create one by filling the form on the left.
                    </Alert>}
                </Fieldset>
            </Grid.Col>
        </Grid>
    )
}
