import React, { useEffect, useState } from "react";
import { Button, Center, Fieldset, ScrollArea, TextInput } from "@mantine/core";
import { IconSquareRoundedPlusFilled, IconTrashFilled } from "@tabler/icons-react";

export function ListEditor(props: { onSave: () => void, mode: string, list: string[], onListChange: (newList: string[]) => void }) {
    const [list, setList] = useState(props.list)
    const [legend, setLegend] = useState("")

    useEffect(() => {
        setList(props.list);
    }, [props.list]);

    useEffect(() => {
        switch (props.mode) {
            case "forbiddenAttributes":
                setLegend("Forbidden Attributes")
                break;
            case "synonyms":
                setLegend("Synonyms")
                break;
            case "allowedNames":
                setLegend("Allowed Names")
                break;
            case "types":
                setLegend("Attribute Types")
                break;
            case "multiplicities":
                setLegend("Association Multiplicities")
                break;
            case "forbiddenClasses":
                setLegend("Forbidden Classes")
                break;
            case "forbiddenActors":
                setLegend("Forbidden Actors")
                break;
            case "forbiddenEntities":
                setLegend("Forbidden Business Entities")
                break;
            case "forbiddenUseCases":
                setLegend("Forbidden Use Cases")
                break;
            case "forbiddenSystems":
                setLegend("Forbidden Systems")
                break;
            default:
                setLegend("Attributes")
                break;
        }
    }, [props.mode])

    const handleEdit = (index: number, newValue: string) => {
        const newList = [...list];
        newList[index] = newValue;
        setList(newList);
        props.onListChange(newList);
    };

    const handleAdd = () => {
        const newList = [...list, ""];
        setList(newList);
        props.onListChange(newList);
    };

    const handleRemove = (index: number) => {
        if (props.mode === "attributeTypes" && list.length === 1) {
            return; // Prevent removing the last element if mode is "attributeTypes"
        }
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
        props.onListChange(newList);
    };
    return (
        <>
            <Fieldset legend={legend} style={{ width: "100%" }}>
                <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
                    {list.map((item, index) => (
                        <TextInput value={item} onChange={(e) => handleEdit(index, e.currentTarget.value)}
                            key={index} placeholder={`Item ${index + 1}`} style={{ marginBottom: "10px", width: "100%" }}
                            rightSection={<IconTrashFilled color="red" onClick={() => handleRemove(index)} />} />
                    ))}
                </ScrollArea.Autosize>
                <Center mt="md">
                    <Button variant="light" color="green" onClick={handleAdd} rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm">
                        Add new item
                    </Button>
                </Center>
            </Fieldset>
        </>
    )
}