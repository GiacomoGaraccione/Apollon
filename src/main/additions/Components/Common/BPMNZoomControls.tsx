import React from "react";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconMaximize, IconZoomIn, IconZoomOut } from "@tabler/icons-react";

/**
 * Zoom in / zoom out / fit-to-viewport per un'istanza bpmn-js (Modeler o Viewer) - usa il servizio
 * "zoomScroll" gia' incluso di default in bpmn-js (diagram-js/lib/navigation/zoomscroll), stessa
 * API usata nel vecchio BIPMIN: stepZoom(-1)/stepZoom(1) per uno zoom "a scatti", reset() che
 * internamente chiama canvas.zoom('fit-viewport') per mostrare l'intero diagramma.
 *
 * `getModeler` e' una funzione (non il modeler diretto) cosi' funziona sia con modeler tenuto in
 * uno state React sia con uno tenuto in un ref (dove il valore piu' recente va letto al click,
 * non catturato al render).
 */
export function BPMNZoomControls(props: { getModeler: () => any }) {
    const zoomScroll = () => {
        const modeler = props.getModeler()
        return modeler?.get?.("zoomScroll")
    }

    return (
        <Group gap="xs" justify="center">
            <Tooltip label="Zoom out">
                <ActionIcon variant="light" color="cyan" size="lg" onClick={() => zoomScroll()?.stepZoom(-1)}>
                    <IconZoomOut size={18} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom in">
                <ActionIcon variant="light" color="cyan" size="lg" onClick={() => zoomScroll()?.stepZoom(1)}>
                    <IconZoomIn size={18} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Fit to screen">
                <ActionIcon variant="light" color="cyan" size="lg" onClick={() => zoomScroll()?.reset()}>
                    <IconMaximize size={18} stroke={1.5} />
                </ActionIcon>
            </Tooltip>
        </Group>
    )
}
