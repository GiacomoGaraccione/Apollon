import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Tabs, Grid, TextInput, NativeSelect, Textarea, Group } from "@mantine/core";
import { UMLClassifier } from "../../../../../typings"
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceClass, ClassDiagramReferenceSolution, Weight } from "../../../../Utils/ClassDiagram/MatcherTypes";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";

export function ClassForm(props: { reference: ClassDiagramReferenceSolution | undefined, addClass: (classes: ReferenceClass[]) => void }) {
    const [currentClass, setCurrentClass] = useState<ReferenceClass | undefined>(undefined)
    const [classes, setClasses] = useState<ReferenceClass[]>([])
    const [forbiddenAttributes, setForbiddenAttributes] = useState<string[]>([])
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [name, setName] = useState<string>("")
    const [weight, setWeight] = useState<string>("STRONG")
    const [message, setMessage] = useState<string>("")
    const [nameError, setNameError] = useState<string | null>(null)
    const [type, setType] = useState<UMLClassifier["type"]>("Class")

    useEffect(() => {
        if (props.reference) {
            setClasses(props.reference.classes)
        } else {
            setClasses([])
        }
    }, [props.reference])

    useEffect(() => {
        if (currentClass) {
            setName(currentClass.name)
            setWeight(currentClass.weight)
            setMessage(currentClass.message)
            setForbiddenAttributes(currentClass.forbiddenAttributes)
            setSynonyms(currentClass.synonyms)
            setType(currentClass.type as UMLClassifier["type"])
        } else {
            setName("")
            setWeight("STRONG")
            setMessage("")
            setForbiddenAttributes([])
            setSynonyms([])
            setType("Class")
        }
    }, [currentClass])

    const resetForm = () => {
        setName("")
        setWeight("STRONG")
        setMessage("")
        setForbiddenAttributes([])
        setSynonyms([])
        setType("Class")
    }

    const handleSubmit = () => {
        setNameError(null)
        if (!currentClass) {
            if (name.trim().length === 0) {
                setNameError("Class name cannot be empty")
                return
            }
            if (classes.find((c) => c.name === name)) {
                setNameError("Class name already exists")
                return
            }
            let cl: ReferenceClass = new ReferenceClass()
            cl.name = name
            cl.weight = weight as Weight
            cl.message = message
            cl.forbiddenAttributes = forbiddenAttributes
            cl.synonyms = synonyms
            cl.type = type
            setClasses([...classes, cl])
            resetForm()
            setCurrentClass(undefined)
            props.addClass([...classes, cl])
        } else {
            if (name.trim().length === 0) {
                setNameError("Class name cannot be empty")
                return
            }
            let cl = classes.find((c) => c.name === currentClass?.name)
            if (cl) {
                cl.name = name
                cl.weight = weight as Weight
                cl.message = message
                cl.forbiddenAttributes = forbiddenAttributes
                cl.synonyms = synonyms
                cl.type = type
                setClasses([...classes.filter((c) => c.name !== currentClass?.name), cl])
                resetForm()
                setCurrentClass(undefined)
                props.addClass([...classes.filter((c) => c.name !== currentClass?.name), cl])
            }
        }
    }

    const handleDelete = () => {
        if (currentClass) {
            setClasses(classes.filter((c) => c.name !== currentClass?.name))
            setCurrentClass(undefined)
            resetForm()
            props.addClass(classes.filter((c) => c.name !== currentClass?.name))
        }
    }

    return (
        <>
            <Grid justify='center' align='center'>
                <Grid.Col span={4}>
                    <Fieldset legend="Current class" style={{ width: "100%" }}>
                        <TextInput label="Class name" placeholder="Class name" value={name} onChange={(ev) => setName(ev.target.value)} error={nameError} />
                        <NativeSelect label="Weight" data={["STRONG", "MEDIUM", "WEAK", "NONE"]} value={weight} onChange={(ev) => setWeight(ev.target.value)} />
                        <NativeSelect label="Type" data={["Class", "AbstractClass", "Interface", "Enumeration", "IntermediateClass"]} value={type} onChange={(ev) => setType(ev.target.value as UMLClassifier["type"])} />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                        <Tabs defaultValue="forbiddenAttributes" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="forbiddenAttributes">Forbidden Attributes</Tabs.Tab>
                                <Tabs.Tab value="synonyms">Synonyms</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="forbiddenAttributes">
                                <ListEditor mode="forbiddenAttributes" list={forbiddenAttributes} onListChange={(newList) => {
                                    setForbiddenAttributes(newList)
                                }} onSave={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="synonyms">
                                <ListEditor mode="synonyms" list={synonyms} onListChange={(newList) => {
                                    setSynonyms(newList)
                                }} onSave={() => { }} />
                            </Tabs.Panel>
                        </Tabs>
                        <Group justify="center" p="md">
                            {currentClass && <Button variant="light" color="gray" onClick={() => setCurrentClass(undefined)} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                Save class
                            </Button>
                            {currentClass && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                Delete selected class
                            </Button>}
                        </Group>
                    </Fieldset>
                </Grid.Col>
                <Grid.Col span={8}>
                    <Fieldset legend="Classes" style={{ width: "100%" }}>
                        {classes.length > 0 && <Flex wrap="wrap" justify="center" gap="md">
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
                        </Flex>}
                        {classes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                            There are no classes for this solution yet. You can create one by filling the form on the left.
                        </Alert>}
                    </Fieldset>
                </Grid.Col>
            </Grid>
        </>
    )
}