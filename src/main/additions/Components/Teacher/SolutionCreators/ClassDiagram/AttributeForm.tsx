import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Tabs, Grid, Stack, TextInput, NativeSelect, Textarea, Group, Chip } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceAttribute, ReferenceClass, ClassDiagramReferenceSolution, Weight } from "../../../../Utils/ClassDiagram/MatcherTypes";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";

export function AttributeForm(props: { reference: ClassDiagramReferenceSolution | undefined, addClass: (classes: ReferenceClass[]) => void }) {
    const [name, setName] = useState<string>("")
    const [types, setTypes] = useState<string[]>([""])
    const [weight, setWeight] = useState("")
    const [message, setMessage] = useState("")
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [classes, setClasses] = useState<ReferenceClass[]>([])
    const [allowsForeignKeyName, setAllowsForeignKeyName] = useState<boolean>(false)
    const [currentClass, setCurrentClass] = useState<ReferenceClass | undefined>(undefined)
    const [currentAttribute, setCurrentAttribute] = useState<ReferenceAttribute | undefined>(undefined)
    const [nameError, setNameError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setClasses(props.reference.classes)
        } else {
            setClasses([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentAttribute) {
            setName(currentAttribute.name)
            setTypes(currentAttribute.types)
            setWeight(currentAttribute.weight)
            setMessage(currentAttribute.message)
            setSynonyms(currentAttribute.synonyms)
            setAllowsForeignKeyName(currentAttribute.allowsForeignKeyName || false)
        }
    }, [currentAttribute])

    const resetForm = () => {
        setName("")
        setTypes([""])
        setWeight("STRONG")
        setMessage("")
        setSynonyms([])
    }

    const handleSubmit = () => {
        setNameError(null)
        if (name.trim().length === 0) {
            setNameError("Attribute name cannot be empty")
            return
        }
        if (types.length === 0 && currentClass?.type !== "Enumeration") {
            setNameError("Attribute must have at least one type")
            return
        }
        if (types.some((type) => type.trim() === "")) {
            setNameError("Attribute types cannot be empty")
            return
        }
        if (!currentClass) {
            setNameError("Please select a class to add the attribute to")
            return
        }
        if (!currentAttribute) {
            if (currentClass.attributes.find((a) => a.name === name)) {
                setNameError("Attribute name already exists")
                return
            }
            let attr = new ReferenceAttribute()
            attr.name = name
            attr.types = types
            attr.weight = weight as Weight
            attr.message = message
            attr.synonyms = synonyms
            attr.allowsForeignKeyName = allowsForeignKeyName
            let cl = currentClass
            cl.attributes.push(attr)
            resetForm()
            setCurrentAttribute(undefined)
            setCurrentClass(cl)
            props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
        } else {
            let attr = currentClass?.attributes.find((a) => a.name === currentAttribute?.name)
            if (attr) {
                attr.name = name
                attr.types = types
                attr.weight = weight as Weight
                attr.message = message
                attr.synonyms = synonyms
                attr.allowsForeignKeyName = allowsForeignKeyName
                let cl = currentClass
                setCurrentClass(cl)
                resetForm()
                setCurrentAttribute(undefined)
                props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
            }
        }
    }

    const handleDelete = () => {
        if (currentClass && currentAttribute) {
            let cl = currentClass
            cl.attributes = cl.attributes.filter((a) => a.name !== currentAttribute?.name)
            setCurrentClass(cl)
            setCurrentAttribute(undefined)
            resetForm()
            props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
        }
    }

    return (
        <>
            <Grid justify='center' align='center'>
                <Grid.Col span={4}>
                    <Fieldset legend="Attribute" style={{ width: "100%" }}>
                        {currentClass && <> <TextInput label="Attribute name" placeholder="Attribute name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} />
                            <NativeSelect label="Weight" data={["STRONG", "MEDIUM", "WEAK", "NONE"]} value={weight} onChange={(ev) => setWeight(ev.target.value)} />
                            <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                            <Chip checked={allowsForeignKeyName} onChange={(checked) => setAllowsForeignKeyName(checked)} mt="sm">
                                Allows foreign key name
                            </Chip>
                            <Tabs defaultValue="types" color="cyan">
                                <Tabs.List>
                                    <Tabs.Tab value="types">Types</Tabs.Tab>
                                    <Tabs.Tab value="synonyms">Synonyms</Tabs.Tab>
                                </Tabs.List>
                                <Tabs.Panel value="types">
                                    {currentClass.type !== "Enumeration" && <ListEditor mode="types" list={types} onListChange={(newList) => {
                                        setTypes(newList)
                                    }} onSave={() => { }} />}
                                    {currentClass.type === "Enumeration" && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="Enumeration Class!" >
                                        Enumeration classes cannot have types. You can only add synonyms.
                                    </Alert>}
                                </Tabs.Panel>
                                <Tabs.Panel value="synonyms">
                                    <ListEditor mode="synonyms" list={synonyms} onListChange={(newList) => {
                                        setSynonyms(newList)
                                    }} onSave={() => { }} />
                                </Tabs.Panel>
                            </Tabs>
                            <Group justify="center" p="md">
                                {currentClass && <Button variant="light" color="gray" onClick={() => {
                                    setCurrentAttribute(undefined)
                                    setCurrentClass(undefined)
                                    resetForm()
                                }} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selected class
                                </Button>}
                                {currentAttribute && <Button variant="light" color="gray" onClick={() => {
                                    resetForm()
                                    setCurrentAttribute(undefined)
                                }} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                    Cancel selected attribute
                                </Button>}
                                <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                    Save attribute
                                </Button>
                                {currentAttribute && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                    Delete selected attribute
                                </Button>}
                            </Group>
                        </>}
                        {!currentClass && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No attribute selected!" >
                            Please select a class from the list on the right to edit its attributes.
                        </Alert>}
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={8}>
                    <Stack>
                        <Fieldset legend="Classes" style={{ width: "100%" }}>
                            {classes.length > 0 && <> <Flex wrap="wrap" justify="center" gap="md">
                                {classes.map((c, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentClass(c)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentClass === c ? '5px solid cyan' : undefined
                                            }} >
                                            <Text>{c.name}</Text>
                                        </Card>
                                    )
                                })}
                            </Flex>
                            </>}
                            {classes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                                There are no classes for this solution yet. You can create one on the <b>Classes</b> tab.
                            </Alert>}
                        </Fieldset>
                        {currentClass && <Fieldset legend={"Attributes of " + currentClass.name} style={{ width: "100%" }}>
                            {currentClass.attributes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No attributes found!" >
                                There are no attributes for this class yet. You can create one by filling the form on the left.
                            </Alert>}
                            {currentClass.attributes.length > 0 && <>
                                <Flex wrap="wrap" justify="center" gap="md">
                                    {currentClass.attributes.map((a, index) => {
                                        return (
                                            <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentAttribute(a)} style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentAttribute === a ? '5px solid cyan' : undefined
                                            }} >
                                                <Text>{a.name}</Text>
                                            </Card>
                                        )
                                    })}
                                </Flex>

                            </>}

                        </Fieldset>}
                    </Stack>

                </Grid.Col>
            </Grid>

        </>
    )
}