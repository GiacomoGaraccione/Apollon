import React from "react"
import { createRoot } from "react-dom/client"
import { MantineProvider, ThemeIcon, Tooltip, Stack, Text } from "@mantine/core"
import { IconCheck, IconQuestionMark, IconAlertTriangle, IconArrowsShuffle } from "@tabler/icons-react"
import { isLabel } from "diagram-js/lib/util/ModelUtil"

// modeling.setColor() su un elemento "label" (l'etichetta esterna di gateway/eventi, o quella dei
// sequence flow con nome) richiede che la relativa <bpmndi:BPMNLabel> esista nell'XML importato
// (SetColorHandler legge elementDi.label e lo passa a updateModdleProperties, che lancia se e'
// undefined). Diagrammi disegnati a mano nel modeler ce l'hanno sempre; XML generati/importati da
// fuori (es. da un tool esterno, o un file di test) spesso no - quindi le label vanno sempre
// escluse prima di chiamare setColor, altrimenti un singolo elemento senza BPMNLabel esplicita
// manda in errore l'intera colorazione (e con essa la visualizzazione dei risultati).
function excludeLabels(elements: any[]): any[] {
    return elements.filter((el) => el && !isLabel(el))
}

// Overlay badges vivono nel layer SVG/DOM di bpmn-js, fuori dall'albero React dell'app: ogni badge
// e' quindi montato come una root React indipendente (deve portarsi dietro il proprio MantineProvider,
// il contesto di tema non attraversa i confini tra root React anche se il DOM e' nello stesso documento).
function mountBadge(node: React.ReactNode): HTMLElement {
    const container = document.createElement("div")
    const root = createRoot(container)
    root.render(<MantineProvider defaultColorScheme="auto">{node}</MantineProvider>)
    return container
}

function FeedbackBadge(props: { icon: React.ReactNode, color: string, tooltip: React.ReactNode }) {
    return (
        <Tooltip label={props.tooltip} multiline w={280} withArrow position="top" events={{ hover: true, focus: true, touch: true }}>
            <ThemeIcon radius="xl" size={22} color={props.color} style={{ cursor: "pointer" }}>
                {props.icon}
            </ThemeIcon>
        </Tooltip>
    )
}

function safeGet(elementRegistry: any, id: string | undefined | null): any {
    if (!id) return null
    try {
        return elementRegistry.get(id) || null
    } catch {
        return null
    }
}

function addBadge(overlays: any, elementRegistry: any, id: string | undefined | null, position: any, node: React.ReactNode) {
    const el = safeGet(elementRegistry, id)
    if (!el) return
    overlays.add(el, { position, html: mountBadge(node) })
}

export function resetBpmnFeedback(modeler: any) {
    if (!modeler) return
    const elementRegistry = modeler.get("elementRegistry")
    const modeling = modeler.get("modeling")
    const overlays = modeler.get("overlays")
    const elements = elementRegistry.getAll()
    elements.forEach((el: any) => {
        try { overlays.remove({ element: el.id }) } catch { /* no overlay for this element */ }
    })
    const colorable = excludeLabels(elements)
    if (colorable.length > 0) {
        try {
            modeling.setColor(colorable, { fill: undefined, stroke: undefined })
        } catch (err) {
            console.error("Error resetting BPMN diagram colors:", err)
        }
    }
}

/**
 * Applica al canvas bpmn-js tutto il feedback visivo derivato dai risultati del BPMNEvaluator:
 * colorazione (modeling.setColor) per syntax error ed elementsToColor, overlay a badge (Mantine +
 * tabler-icons, non piu' html puro come in BIPMIN) per found/close parts, close elements, elementi
 * fuori ordine e parti fuori ordine. Stessa mappatura categoria->colore di SolutionChecking/
 * DiagramStudent in BIPMIN.
 */
export function colorBpmnDiagram(modeler: any, syntaxErrors: any[], semanticErrors: any[], results: any) {
    if (!modeler) return
    resetBpmnFeedback(modeler)
    const elementRegistry = modeler.get("elementRegistry")
    const modeling = modeler.get("modeling")
    const overlays = modeler.get("overlays")
    const r = results || {}

    // 1. Syntax errors -> riempimento blu tenue (il blu pieno #0000ff originale era troppo
    // aggressivo sul canvas, specialmente su elementi piccoli come gateway/eventi)
    const syntaxIds = new Set(((syntaxErrors || []).map((e: any) => e.elementId)).filter(Boolean))
    const syntaxEls = excludeLabels([...syntaxIds].map((id) => safeGet(elementRegistry, id as string)).filter(Boolean))
    if (syntaxEls.length > 0) {
        try {
            modeling.setColor(syntaxEls, { fill: "#a9c6e8" })
        } catch (err) {
            console.error("Error coloring syntax error elements:", err)
        }
    }

    // 2. Found parts (correctlyModeledParts) -> badge verde di spunta, in basso a sinistra
    for (const part of r.correctlyModeledParts || []) {
        for (const f of part.elements || []) {
            addBadge(overlays, elementRegistry, f.diagram?.elementId, { bottom: 0, left: 0 }, (
                <FeedbackBadge icon={<IconCheck size={13} />} color="green" tooltip={
                    <Stack gap={2}>
                        <Text size="xs" fw={700}>Process part: {part.name}</Text>
                        <Text size="xs">This element correctly models part of the required process.</Text>
                    </Stack>
                } />
            ))
        }
    }

    // 3. Close parts -> badge "?" ambra, in basso a sinistra, solo sugli elementi TROVATI della parte
    for (const part of r.closeParts || []) {
        for (const f of part.found || []) {
            addBadge(overlays, elementRegistry, f.diagram?.elementId, { bottom: 0, left: 0 }, (
                <FeedbackBadge icon={<IconQuestionMark size={13} />} color="yellow" tooltip={
                    <Stack gap={2}>
                        <Text size="xs" fw={700}>Process part: {part.name}</Text>
                        <Text size="xs">This part is close to being correctly modeled, but is not complete yet.</Text>
                    </Stack>
                } />
            ))
        }
    }

    // 4. Close elements -> badge "!" viola, in basso a sinistra, sull'elemento del diagramma stesso
    for (const ce of r.closeElements || []) {
        const causeText = ce.cause === "Both" ? "it belongs to the wrong pool and is also of the wrong type" :
            ce.cause === "Type" ? "it is of the wrong type" : "it belongs to the wrong pool"
        addBadge(overlays, elementRegistry, ce.diagramElementId, { bottom: 0, left: 0 }, (
            <FeedbackBadge icon={<IconAlertTriangle size={13} />} color="grape" tooltip={
                <Stack gap={2}>
                    <Text size="xs" fw={700}>Process part: {ce.partName}</Text>
                    <Text size="xs">This element looks like it could represent "{ce.description || ce.name}", but {causeText}.</Text>
                </Stack>
            } />
        ))
    }

    // 5. Unordered elements (ordine dentro un gruppo) -> badge shuffle viola, in alto a destra
    for (const ue of r.unorderedElements || []) {
        addBadge(overlays, elementRegistry, ue.element?.diagram?.elementId, { top: 0, right: 0 }, (
            <FeedbackBadge icon={<IconArrowsShuffle size={13} />} color="violet" tooltip={
                <Stack gap={2}>
                    <Text size="xs" fw={700}>Process part: {ue.partName}</Text>
                    <Text size="xs">This element should be preceded by "{ue.reference || "another element of this part"}".</Text>
                </Stack>
            } />
        ))
    }

    // 6. Out-of-order parts (ordine tra parti) -> badge shuffle viola, in basso a destra, su ogni elemento della parte
    for (const part of r.outOfOrderParts || []) {
        for (const f of part.elements || []) {
            addBadge(overlays, elementRegistry, f.diagram?.elementId, { bottom: 0, right: 0 }, (
                <FeedbackBadge icon={<IconArrowsShuffle size={13} />} color="violet" tooltip={
                    <Stack gap={2}>
                        <Text size="xs" fw={700}>Process part: {part.name}</Text>
                        <Text size="xs">This part is not connected after the part that should precede it in the process.</Text>
                    </Stack>
                } />
            ))
        }
    }

    // 7. elementsToColor: contorno colorato per le varie categorie "wrong *", stesso colore per
    // ciascuna categoria dell'elementsToColor originale di BIPMIN
    const strokeColor = (elements: any[], color: string) => {
        const els = excludeLabels(elements.map((el: any) => safeGet(elementRegistry, el)).filter(Boolean))
        if (els.length > 0) {
            try {
                modeling.setColor(els, { stroke: color })
            } catch (err) {
                console.error("Error applying stroke color to BPMN elements:", err)
            }
        }
    }
    strokeColor((r.forbiddenBusinessEntities || []).map((e: any) => e.elementId), "#ff0000")
    strokeColor((r.forbiddenActors || []).map((e: any) => e.elementId), "#ff0000")
    strokeColor((r.wrongLaneParts || []).flatMap((p: any) => (p.elements || []).map((f: any) => f.diagram?.elementId)), "#ff940a")
    strokeColor((r.wrongCollapsedPools || []).map((vbe: any) => vbe.element?.elementId), "#7c3c00")
    strokeColor((r.wrongMessageParts || []).map((w: any) => w.element?.diagram?.elementId), "#f27d63")
    strokeColor((r.wrongMessageReceivingParts || []).map((w: any) => w.element?.diagram?.elementId), "#f27d63")
    strokeColor((r.wrongBoundaryEventParts || []).map((w: any) => w.element?.diagram?.elementId), "#80ad05")
    strokeColor((r.wrongBoundaryEventInterruptingParts || []).map((w: any) => w.element?.diagram?.elementId), "#b5179e")
    strokeColor((r.wrongSubProcessInterrupting || []).map((vsp: any) => vsp.element?.elementId), "#b5179e")
    strokeColor((r.wrongSubProcessBoundaryEvents || []).map((w: any) => w.diagramElement?.elementId), "#b5179e")
}
