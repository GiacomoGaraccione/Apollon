import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Center, Fieldset, Modal, NativeSelect, Tabs, Text } from "@mantine/core";
import { IconExclamationCircle, IconSquareRoundedPlusFilled, IconX, IconZoomCheckFilled } from "@tabler/icons-react";
import Modeler from "bpmn-js/lib/Modeler"
import lintModule from "bpmn-js-bpmnlint"
import resizeAllModule from "bpmn-js-nyan/lib/resize-all-rules"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css"
import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css'
import * as bpmnlintConfig from '../../../Common/bundled-config'
import { BPMNZoomControls } from "../../../Common/BPMNZoomControls"
import { BPMNDiagramReferenceSolution, BusinessEntity, Actor, ProcessPart, SubProcess } from "../../../../Utils/BPMN/MatcherTypes";
import { BPMNDiagramStructureBuilderFromReference } from "../../../../Utils/BPMN/StructureBuilder";
import { BusinessEntityForm } from "./BusinessEntityForm";
import { ActorForm } from "./ActorForm";
import { SubProcessForm } from "./SubProcessForm";
import { ProcessPartForm } from "./ProcessPartForm";
import { GroupElementsForm } from "./GroupElementsForm";
import { ForbiddenElementsForm } from "./ForbiddenElementsForm";

const HIGHLIGHT_SELF = "bpmn-part-highlight-self"
const HIGHLIGHT_FOLLOW = "bpmn-part-highlight-follow"

export function BPMNDiagramReferenceFormModal(props: {
    opened: boolean;
    onClose: () => void;
    currentReference: BPMNDiagramReferenceSolution;
    addBusinessEntity: (businessEntities: BusinessEntity[]) => void;
    addActor: (actors: Actor[]) => void;
    addSubProcess: (subProcesses: SubProcess[]) => void;
    addProcessPart: (processParts: ProcessPart[]) => void;
    addForbiddenEntities: (forbiddenEntities: string[]) => void;
    addForbiddenActors: (forbiddenActors: string[]) => void;
    onSaveReference: (reference: BPMNDiagramReferenceSolution, model: string, svg: string) => void;
}) {
    const [selectedPartName, setSelectedPartName] = useState<string | undefined>(undefined)
    const [preview, setPreview] = useState(false)
    const [elementIdsByPart, setElementIdsByPart] = useState<Map<string, string[]>>(new Map())
    const [highlightPart, setHighlightPart] = useState<string>("")
    const [previewReady, setPreviewReady] = useState(false)
    const [saving, setSaving] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)
    const modelerRef = useRef<any>(undefined)

    const selectedPart = props.currentReference.processParts.find((p) => p.name === selectedPartName)

    const handleUpdatePart = (updated: ProcessPart) => {
        let newList = props.currentReference.processParts.map((p) => p.name === updated.name ? updated : p)
        props.addProcessPart(newList)
    }

    // Ogni volta che il modal si riapre (nuova soluzione o modifica di una esistente) si riparte
    // dai tab di editing, non dall'ultima preview/selezione rimasta dalla sessione precedente.
    useEffect(() => {
        if (props.opened) {
            setPreview(false)
            setSelectedPartName(undefined)
            setHighlightPart("")
        }
    }, [props.opened])

    const handleSaveReference = async () => {
        const mod = modelerRef.current
        if (!mod) return
        setSaving(true)
        try {
            const xmlRes = await mod.saveXML({ format: true })
            const svgRes = await mod.saveSVG()
            props.onSaveReference(props.currentReference, xmlRes.xml, svgRes.svg)
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        if (preview && previewRef.current) {
            const { xml, elementIdsByPart: ids } = new BPMNDiagramStructureBuilderFromReference(props.currentReference).build()
            setElementIdsByPart(ids)
            setHighlightPart("")
            setPreviewReady(false)
            const mod = new Modeler({ container: previewRef.current, additionalModules: [lintModule, resizeAllModule] })
            modelerRef.current = mod
            mod.importXML(xml).then(() => {
                let linter: any = mod.get("linting")
                linter.setLinterConfig(bpmnlintConfig)
                linter.toggle(false)
                // solo qui il canvas ha davvero le shape registrate: l'effect di highlighting piu'
                // sotto dipende da elementIdsByPart, che viene impostato SOPRA in modo sincrono,
                // ben prima che questa importXML (asincrona) si risolva - farlo partire subito
                // faceva chiamare canvas.removeMarker su id non ancora esistenti nel canvas,
                // mandando in crash Canvas._updateMarker ("Cannot read properties of undefined
                // (reading 'markers')"), tanto piu' probabile quanto piu' grande e' la reference
                // (piu' tempo impiega l'import, piu' e' probabile che l'altro effect scatti prima).
                setPreviewReady(true)
            }).catch((err: any) => console.error("Error rendering BPMN preview:", err))
        }
        return () => {
            modelerRef.current?.destroy?.()
            modelerRef.current = undefined
            setPreviewReady(false)
        }
    }, [preview])

    useEffect(() => {
        const mod = modelerRef.current
        if (!mod || !previewReady) return
        const canvas = mod.get("canvas")
        const safeRemoveMarker = (id: string, marker: string) => {
            try { canvas.removeMarker(id, marker) } catch (err) { /* elemento non (piu') presente nel diagramma */ }
        }
        const safeAddMarker = (id: string, marker: string) => {
            try { canvas.addMarker(id, marker) } catch (err) { /* elemento non (piu') presente nel diagramma */ }
        }
        for (const ids of elementIdsByPart.values()) {
            for (const id of ids) {
                safeRemoveMarker(id, HIGHLIGHT_SELF)
                safeRemoveMarker(id, HIGHLIGHT_FOLLOW)
            }
        }
        if (!highlightPart) return
        for (const id of elementIdsByPart.get(highlightPart) || []) {
            safeAddMarker(id, HIGHLIGHT_SELF)
        }
        const followingParts = props.currentReference.processParts.filter((p) => p.previousParts.includes(highlightPart))
        for (const part of followingParts) {
            for (const id of elementIdsByPart.get(part.name) || []) {
                safeAddMarker(id, HIGHLIGHT_FOLLOW)
            }
        }
    }, [highlightPart, elementIdsByPart, previewReady])

    return (
        <Modal opened={props.opened} onClose={() => { props.onClose(); setPreview(false) }} closeOnEscape={false} fullScreen transitionProps={{ transition: 'fade', duration: 300 }}>
            <style>{`
                .${HIGHLIGHT_SELF} .djs-visual > :nth-child(1) { stroke: #2f9e44 !important; stroke-width: 3px !important; fill-opacity: 0.15 !important; }
                .${HIGHLIGHT_FOLLOW} .djs-visual > :nth-child(1) { stroke: #1c7ed6 !important; stroke-width: 3px !important; stroke-dasharray: 6,3 !important; }
            `}</style>
            <Fieldset legend="BPMN Solution Creator" style={{ width: "100%" }}>
                {!preview && <>
                    <Tabs defaultValue="businessEntities" color="cyan">
                        <Tabs.List>
                            <Tabs.Tab value="businessEntities">Business Entities</Tabs.Tab>
                            <Tabs.Tab value="actors">Actors</Tabs.Tab>
                            <Tabs.Tab value="subProcesses">Sub-Processes</Tabs.Tab>
                            <Tabs.Tab value="processParts">Process Parts</Tabs.Tab>
                            <Tabs.Tab value="forbidden">Forbidden Elements</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="businessEntities">
                            <BusinessEntityForm reference={props.currentReference} addBusinessEntity={props.addBusinessEntity} />
                        </Tabs.Panel>
                        <Tabs.Panel value="actors">
                            <ActorForm reference={props.currentReference} addActor={props.addActor} />
                        </Tabs.Panel>
                        <Tabs.Panel value="subProcesses">
                            <SubProcessForm reference={props.currentReference} addSubProcess={props.addSubProcess} />
                        </Tabs.Panel>
                        <Tabs.Panel value="processParts">
                            {!selectedPart && <ProcessPartForm reference={props.currentReference} addProcessPart={props.addProcessPart}
                                onEditElements={(part) => setSelectedPartName(part.name)} />}
                            {selectedPart && <GroupElementsForm part={selectedPart}
                                businessEntityNames={props.currentReference.businessEntities.map((be) => be.name)}
                                actorNames={props.currentReference.actors.map((a) => a.name)}
                                subProcessNames={props.currentReference.subProcesses.map((sp) => sp.name)}
                                processPartNames={props.currentReference.processParts.map((p) => p.name)}
                                onUpdatePart={handleUpdatePart}
                                onBack={() => setSelectedPartName(undefined)} />}
                        </Tabs.Panel>
                        <Tabs.Panel value="forbidden">
                            <ForbiddenElementsForm reference={props.currentReference}
                                addForbiddenEntities={props.addForbiddenEntities} addForbiddenActors={props.addForbiddenActors} />
                        </Tabs.Panel>
                    </Tabs>
                    <Center mt="md">
                        <Button variant="light" color="cyan" rightSection={<IconZoomCheckFilled size={16} stroke={1.5} />} onClick={() => setPreview(true)}>
                            Display reference preview
                        </Button>
                    </Center>
                </>}
                {preview && <>
                    <Text size="lg" w={500} mb="xs">Preview of the reference solution</Text>
                    <Alert variant="light" color="yellow" icon={<IconExclamationCircle size={16} />} mb="md">
                        This diagram is auto-generated and editable, but <b>only within each process part</b> the sequence flow
                        is drawn automatically. Elements belonging to different parts are placed in sequence but never connected -
                        you need to manually draw the connections between parts so the diagram reads correctly for someone who
                        didn't build the reference. Use the dropdown below to highlight a part (green) and the parts that should
                        follow it (blue, dashed) as a guide for where to connect.
                    </Alert>
                    <NativeSelect label="Highlight process part" data={["", ...props.currentReference.processParts.map((p) => p.name)]}
                        value={highlightPart} onChange={(ev) => setHighlightPart(ev.target.value)} mb="md" style={{ maxWidth: 400 }} />
                    <BPMNZoomControls getModeler={() => modelerRef.current} />
                    <div ref={previewRef} id="bpmn-preview" style={{ height: "65vh", border: "1px solid var(--mantine-color-gray-4)" }}></div>
                    <Center mt="md">
                        <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} onClick={handleSaveReference} loading={saving}>
                            Save reference
                        </Button>
                        <Button variant="light" color="gray" rightSection={<IconX size={16} stroke={1.5} />} ml="md" onClick={() => setPreview(false)}>
                            Cancel preview
                        </Button>
                    </Center>
                </>}
            </Fieldset>
        </Modal>
    )
}
