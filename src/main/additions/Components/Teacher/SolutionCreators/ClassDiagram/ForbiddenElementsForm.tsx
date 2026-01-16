import React, { useEffect, useState } from "react";
import { Alert, Button, Center, Text, Fieldset, Grid, NativeSelect, Group } from "@mantine/core";
import { IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrashFilled } from "@tabler/icons-react";
import { ReferenceClass, ClassDiagramReferenceSolution } from "../../../../Utils/ClassDiagram/MatcherTypes";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";

interface ClassSelectEditorProps {
    classes: { name: string }[];
    selectedList: string[];
    onListChange: (newList: string[]) => void;
    legend?: string;
}

function ClassSelectEditor(props: ClassSelectEditorProps) {
    const [list, setList] = useState<string[]>(props.selectedList);

    useEffect(() => {
        setList(props.selectedList);
    }, [props.selectedList]);

    const parseItem = (item: string): [string, string] => {
        const [source, target] = item.split(" - ");
        return [source || "", target || ""];
    };

    const handleEdit = (index: number, newSource: string, newTarget: string) => {
        const newList = [...list];
        newList[index] = `${newSource} - ${newTarget}`;
        setList(newList);
        props.onListChange(newList);
    };

    const handleAdd = () => {
        const defaultSource = props.classes.length > 0 ? props.classes[0].name : "";
        const defaultTarget = props.classes.length > 0 ? props.classes[0].name : "";
        const newList = [...list, `${defaultSource} - ${defaultTarget}`];
        setList(newList);
        props.onListChange(newList);
    };

    const handleRemove = (index: number) => {
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
        props.onListChange(newList);
    };

    return (
        <Fieldset legend={props.legend || "Seleziona elementi"} style={{ width: "100%" }}>
            {list.map((item, index) => {
                const [source, target] = parseItem(item);
                return (
                    <Group key={index} mb="xs" align="center">
                        <NativeSelect
                            data={props.classes.map((c) => c.name)}
                            value={source}
                            onChange={(e) => handleEdit(index, e.currentTarget.value, target)}
                            style={{ flex: 1 }}
                        />
                        <Text>→</Text>
                        <NativeSelect
                            data={props.classes.map((c) => c.name)}
                            value={target}
                            onChange={(e) => handleEdit(index, source, e.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <IconTrashFilled color="red" style={{ cursor: "pointer" }} onClick={() => handleRemove(index)} />
                    </Group>
                );
            })}
            <Center mt="md">
                <Button
                    variant="light"
                    color="green"
                    onClick={handleAdd}
                    rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}
                    mt="sm"
                    disabled={props.classes.length === 0}
                >
                    Add new forbidden pair of classes
                </Button>
            </Center>
        </Fieldset>
    );
}

export function ForbiddenElementsForm(props: {
    reference: ClassDiagramReferenceSolution | undefined,
    addForbiddenClasses: (forbiddenClasses: string[]) => void,
    addForbiddenAssociations: (forbiddenAssociations: { source: string, target: string }[]) => void
}) {
    const [forbiddenClasses, setForbiddenClasses] = useState<string[]>([])
    const [forbiddenAssociations, setForbiddenAssociations] = useState<{ source: string, target: string }[]>([])
    const [classes, setClasses] = useState<ReferenceClass[]>([])

    useEffect(() => {
        if (props.reference) {
            setForbiddenClasses(props.reference.forbiddenClasses)
            setForbiddenAssociations(props.reference.forbiddenAssociations)
            setClasses(props.reference.classes)
        } else {
            setForbiddenClasses([])
            setForbiddenAssociations([])
            setClasses([])
        }
    }, [props.reference])


    return (
        <Grid justify='center' align='center'>
            <Grid.Col span={6}>
                <ListEditor mode="forbiddenClasses" list={forbiddenClasses} onListChange={(newList) => {
                    setForbiddenClasses(newList)
                    props.addForbiddenClasses(newList)
                }} onSave={() => { }} />
            </Grid.Col>
            <Grid.Col span={6}>
                <Fieldset legend="Forbidden associations" style={{ width: "100%" }}>
                    {classes.length > 0 && <>
                        <ClassSelectEditor classes={classes.map((c) => { return { name: c.name } })} selectedList={forbiddenAssociations.map((a) => a.source + " - " + a.target)} onListChange={(newList) => {
                            const newForbiddenAssociations = newList.map((item) => {
                                const [source, target] = item.split(" - ");
                                return { source, target };
                            });
                            setForbiddenAssociations(newForbiddenAssociations);
                            props.addForbiddenAssociations(newForbiddenAssociations);
                        }} legend="Select forbidden associations" />
                    </>}
                    {classes.length === 0 && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No classes found!" >
                        There are no classes for this solution yet. You can create one on the <b>Classes</b> tab.
                    </Alert>}
                </Fieldset>
            </Grid.Col>
        </Grid>
    )
}