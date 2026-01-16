import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Tabs, Grid, TextInput, NativeSelect, Textarea, Group } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ReferenceAssociation, ReferenceClass, ReferenceClassInAssociation, ClassDiagramReferenceSolution, Weight } from "../../../../Utils/ClassDiagram/MatcherTypes";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";

export function AssociationForm(props: { reference: ClassDiagramReferenceSolution | undefined, addAssociation: (associations: ReferenceAssociation[]) => void }) {
    const [name, setName] = useState<string>("")
    const [weight, setWeight] = useState<string>("STRONG")
    const [type, setType] = useState<string>("Default")
    const [message, setMessage] = useState<string>("")
    const [synonyms, setSynonyms] = useState<string[]>([])
    const [classes, setClasses] = useState<ReferenceClass[]>([])
    const [associations, setAssociations] = useState<ReferenceAssociation[]>([])
    const [sourceClass, setSourceClass] = useState<string>("")
    const [targetClass, setTargetClass] = useState<string>("")
    const [sourceRole, setSourceRole] = useState<string>("")
    const [targetRole, setTargetRole] = useState<string>("")
    const [sourceMultiplicity, setSourceMultiplicity] = useState<string[]>([])
    const [targetMultiplicity, setTargetMultiplicity] = useState<string[]>([])
    const [currentAssociation, setCurrentAssociation] = useState<ReferenceAssociation | undefined>(undefined)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (props.reference) {
            setClasses(props.reference.classes)
            setAssociations(props.reference.associations)
        } else {
            setClasses([])
            setAssociations([])
        }
    }, [props.reference])

    useEffect(() => {
        if (classes.length > 0) {
            setSourceClass(classes[0].name)
            setTargetClass(classes[0].name)
        }
    }, [classes])

    useEffect(() => {
        if (currentAssociation) {
            setName(currentAssociation.name)
            setWeight(currentAssociation.weight)
            setType(currentAssociation.type)
            setMessage(currentAssociation.message)
            setSynonyms(currentAssociation.synonyms)
            setSourceClass(currentAssociation.source.referenceClass.name)
            setTargetClass(currentAssociation.target.referenceClass.name)
            setSourceRole(currentAssociation.source.role)
            setTargetRole(currentAssociation.target.role)
            setSourceMultiplicity(currentAssociation.source.multiplicities)
            setTargetMultiplicity(currentAssociation.target.multiplicities)
        }
    }, [currentAssociation])

    const resetForm = () => {
        setName("")
        setWeight("STRONG")
        setType("Default")
        setMessage("")
        setSynonyms([])
        setSourceClass("")
        setTargetClass("")
        setSourceRole("")
        setTargetRole("")
        setSourceMultiplicity([])
        setTargetMultiplicity([])
    }

    const handleSubmit = () => {
        setError(null)
        if (sourceClass.trim().length === 0 || targetClass.trim().length === 0) {
            setError("Please select a source and target class")
            return
        }
        if (sourceMultiplicity.length === 0 || targetMultiplicity.length === 0) {
            setError("Please enter at least one multiplicity value for both source and target classes")
            return
        }
        if (!currentAssociation) {
            let assoc = new ReferenceAssociation()
            assoc.name = name
            assoc.weight = weight as Weight
            assoc.type = type
            assoc.message = message
            assoc.synonyms = synonyms
            let src = new ReferenceClassInAssociation()
            src.referenceClass = classes.find((c) => c.name === sourceClass) as ReferenceClass
            src.role = sourceRole
            src.multiplicities = sourceMultiplicity
            assoc.source = src
            let tgt = new ReferenceClassInAssociation()
            tgt.referenceClass = classes.find((c) => c.name === targetClass) as ReferenceClass
            tgt.role = targetRole
            tgt.multiplicities = targetMultiplicity
            assoc.target = tgt
            resetForm()
            setCurrentAssociation(undefined)
            setAssociations([...associations, assoc])
            props.addAssociation([...associations, assoc])
        } else {
            let assoc = associations.find((a) => a === currentAssociation)
            if (assoc) {
                assoc.name = name
                assoc.weight = weight as Weight
                assoc.type = type
                assoc.message = message
                assoc.synonyms = synonyms
                let src = new ReferenceClassInAssociation()
                src.referenceClass = classes.find((c) => c.name === sourceClass) as ReferenceClass
                src.role = sourceRole
                src.multiplicities = sourceMultiplicity
                assoc.source = src
                let tgt = new ReferenceClassInAssociation()
                tgt.referenceClass = classes.find((c) => c.name === targetClass) as ReferenceClass
                tgt.role = targetRole
                tgt.multiplicities = targetMultiplicity
                resetForm()
                setCurrentAssociation(undefined)
                setAssociations([...associations.filter((a) => a !== currentAssociation), assoc])
                console.log(assoc)
                props.addAssociation([...associations.filter((a) => a !== currentAssociation), assoc])
            }
        }
    }

    const handleDelete = () => {
        if (currentAssociation) {
            setAssociations(associations.filter((a) => a !== currentAssociation));
            setCurrentAssociation(undefined);
            resetForm();
            props.addAssociation(associations.filter((a) => a !== currentAssociation));
        }
    }

    return (
        <Grid justify='center' align='center'>
            {classes.length > 0 && <> <Grid.Col span={4}>
                <Fieldset legend="Association" style={{ width: "100%" }}>
                    {classes.length > 0 && <>
                        <TextInput label="Association name" placeholder="Association name" value={name} onChange={(ev) => setName(ev.target.value)} error={error} />
                        <NativeSelect label="Weight" data={["STRONG", "MEDIUM", "WEAK", "NONE"]} value={weight} onChange={(ev) => setWeight(ev.target.value)} />
                        <NativeSelect label="Association type" data={["Default", "Inheritance", "Aggregation", "Composition"]} value={type} onChange={(ev) => setType(ev.target.value)} />
                        <Textarea label="Message" placeholder="Custom feedback message" value={message} onChange={(ev) => setMessage(ev.target.value)} />
                        <ListEditor mode="synonyms" list={synonyms} onListChange={(newList) => {
                            setSynonyms(newList)
                        }} onSave={() => { }} />
                        <Tabs defaultValue="source" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="source">Source</Tabs.Tab>
                                <Tabs.Tab value="target">Target</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="source">
                                <NativeSelect label="Source class" data={classes.map((c) => c.name)} value={sourceClass} onChange={(ev) => {
                                    setSourceClass(ev.target.value)
                                }} />
                                <ListEditor mode="multiplicities" list={sourceMultiplicity} onListChange={(newList) => { setSourceMultiplicity(newList) }} onSave={() => { }} />
                                <TextInput label="Source role" placeholder="Source role" value={sourceRole} onChange={(ev) => { setSourceRole(ev.target.value) }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="target">
                                <NativeSelect label="Target class" data={classes.map((c) => c.name)} value={targetClass} onChange={(ev) => { setTargetClass(ev.target.value) }} />
                                <ListEditor mode="multiplicities" list={targetMultiplicity} onListChange={(newList) => { setTargetMultiplicity(newList) }} onSave={() => { }} />
                                <TextInput label="Target role" placeholder="Target role" value={targetRole} onChange={(ev) => { setTargetRole(ev.target.value) }} />
                            </Tabs.Panel>
                        </Tabs>
                        <Group justify="center" p="md">
                            {currentAssociation && <Button variant="light" color="gray" onClick={() => {
                                setCurrentAssociation(undefined)
                                resetForm()
                            }} rightSection={<IconArrowBackUp size={16} stroke={1.5} />} mt="sm">
                                Cancel selection
                            </Button>}
                            <Button variant="light" color="green" onClick={handleSubmit} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                                Save association
                            </Button>
                            {currentAssociation && <Button variant="light" color="red" onClick={handleDelete} rightSection={<IconTrash size={16} stroke={1.5} />} mt="sm" ml="md">
                                Delete selected association
                            </Button>}
                        </Group>
                    </>}

                </Fieldset>
            </Grid.Col>
                <Grid.Col span={8}>
                    <Fieldset legend="Associations" style={{ width: "100%" }}>
                        {associations.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No associations found!" >
                            There are no associations for this solution yet. You can create one using the form on the left.
                        </Alert>}
                        {associations.length > 0 && <>
                            <Flex wrap="wrap" justify="center" gap="md">
                                {associations.map((a, index) => {
                                    return (
                                        <Card shadow="sm" padding="lg" radius="md" withBorder key={index} onClick={() => setCurrentAssociation(a)}
                                            style={{
                                                width: 'fit-content', margin: 'auto', cursor: "pointer",
                                                border: currentAssociation === a ? '5px solid cyan' : undefined
                                            }} >
                                            <Text>{a.source.referenceClass.name} - {a.target.referenceClass.name}</Text>
                                        </Card>
                                    )
                                })}
                            </Flex>
                        </>}
                    </Fieldset>

                </Grid.Col>
            </>}
            {classes.length === 0 && <Grid.Col span={12}>
                <Fieldset legend="Associations" style={{ width: "100%" }}>
                    <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                        There are no classes for this solution yet. You can create one on the <b>Classes</b> tab.
                    </Alert>
                </Fieldset>
            </Grid.Col>}
        </Grid>
    )
}