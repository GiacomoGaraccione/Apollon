import React, { useState } from "react";
import { Button, Center, Fieldset, Text, Textarea } from "@mantine/core";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";

/**
 * Aggiunta in blocco per liste di frasi (sinonimi, nomi accettati, ecc.): incolla piu' frasi
 * separate da ";" invece di doverle inserire una alla volta col ListEditor - pensato per i casi
 * in cui le voci sono frasi lunghe/articolate (es. sinonimi BPMN) e non singole parole come nel
 * ClassDiagram. Va usato ACCANTO al ListEditor esistente, non al suo posto: qui si aggiunge in
 * blocco, la lista risultante resta visibile/modificabile voce per voce nel ListEditor.
 */
export function BulkListEditor(props: { list: string[], onAdd: (newList: string[]) => void, legend?: string }) {
    const [text, setText] = useState("")
    const [feedback, setFeedback] = useState<string | null>(null)

    const handleAdd = () => {
        const phrases = text.split(";").map((p) => p.trim()).filter((p) => p.length > 0)
        const existing = new Set(props.list)
        const uniqueNew: string[] = []
        for (const phrase of phrases) {
            if (!existing.has(phrase)) {
                existing.add(phrase)
                uniqueNew.push(phrase)
            }
        }
        const duplicates = phrases.length - uniqueNew.length
        if (uniqueNew.length > 0) {
            props.onAdd([...props.list, ...uniqueNew])
        }
        setFeedback(`Added ${uniqueNew.length} new phrase${uniqueNew.length === 1 ? "" : "s"}${duplicates > 0 ? ` (${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped)` : ""}.`)
        setText("")
    }

    return (
        <Fieldset legend={props.legend || "Bulk add"} style={{ width: "100%" }}>
            <Text size="xs" color="dimmed" mb="xs">
                Separate phrases with a semicolon (;). Phrases already in the list are skipped automatically.
            </Text>
            <Textarea value={text} onChange={(ev) => setText(ev.currentTarget.value)}
                placeholder="First phrase; Second phrase; Third phrase" autosize minRows={2} />
            <Center mt="sm">
                <Button variant="light" color="green" onClick={handleAdd} disabled={text.trim().length === 0}
                    rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />}>
                    Add phrases
                </Button>
            </Center>
            {feedback && <Text size="xs" color="dimmed" mt="xs" ta="center">{feedback}</Text>}
        </Fieldset>
    )
}
