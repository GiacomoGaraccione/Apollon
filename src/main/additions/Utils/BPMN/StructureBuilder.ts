import { BPMNDiagramReferenceSolution, GroupElement, ProcessPart, SubProcess } from "./MatcherTypes"

// Dimensioni standard bpmn-js per i vari tipi di shape (stessi valori di default usati
// dal renderer, cosi' il preview coincide visivamente con cio' che l'utente vedrebbe
// disegnando a mano gli stessi elementi).
const TASK_SIZE = { width: 100, height: 80 }
const GATEWAY_SIZE = { width: 50, height: 50 }
const EVENT_SIZE = { width: 36, height: 36 }
const POOL_LABEL_WIDTH = 30
const LANE_HEIGHT = 220
const ELEMENT_GAP = 60
const START_X = 160
const MARGIN_X = 120
const SUBPROCESS_PADDING = 30
const BELOW_GATEWAY_GAP = 25

function sanitizeId(input: string, prefix: string): string {
    // Un id BPMN (XML NCName) non puo' iniziare con un numero ne' contenere spazi/simboli.
    let cleaned = input.replace(/[^a-zA-Z0-9_]/g, "_")
    if (!/^[a-zA-Z_]/.test(cleaned)) cleaned = "_" + cleaned
    return `${prefix}_${cleaned}`
}

function bpmnTag(bpmnType: string): string {
    // "UserTask" -> "userTask", "StartEvent" -> "startEvent", ecc. - stessa convenzione
    // usata da bpmn-js per i nomi dei tag XML.
    return bpmnType.charAt(0).toLowerCase() + bpmnType.slice(1)
}

function eventDefinitionTag(eventDefinition: string): string {
    // Il campo puo' arrivare sia nella forma corta usata dal form ("Timer") sia gia' con il
    // suffisso "EventDefinition" (come i $type di bpmn-moddle, usati da alcune reference importate):
    // normalizziamo per non produrre tag invalidi tipo "timerEventDefinitionEventDefinition".
    const base = eventDefinition.endsWith("EventDefinition") ? eventDefinition.slice(0, -"EventDefinition".length) : eventDefinition
    return `bpmn:${bpmnTag(base)}EventDefinition`
}

const COLLAPSED_POOL_HEIGHT = 60

type PlacedElement = {
    id: string
    tag: string
    name: string
    part: ProcessPart
    groupElement: GroupElement
    poolId: string | null
    laneId: string | null
    subProcessId: string | null
    x: number
    y: number
    width: number
    height: number
    attachedToId: string | null
}

type Pool = {
    id: string
    name: string
    processId: string
    lanes: { id: string, name: string, y: number }[]
    contentWidth: number
    isCollapsed: boolean
    height: number
    y: number
}

// Riquadro di un subprocess annidato (un solo livello: un subprocess dentro un subprocess non e'
// supportato, vedi nota nella classe principale). Le sue lane interne non sono supportate - tutti
// i suoi figli condividono semplicemente la prima lane del pool contenitore.
type SubProcessBox = {
    id: string
    name: string
    isEvent: boolean
    poolId: string | null
    laneId: string | null
    x: number
    y: number
    width: number
    height: number
}

// Boundary event dichiarato su SubProcess.boundaryEvents (condizione a parte, non un GroupElement -
// vedi MatcherTypes.ts): a differenza di un boundary event su un task, non appartiene a nessuna
// ProcessPart, quindi non puo' stare nell'array PlacedElement (che assume sempre un part/groupElement
// proprietario). E' comunque un flowNode del process del pool, come il subprocess stesso - BPMN non
// lo annida DENTRO il subprocess anche quando e' agganciato al suo bordo.
type SubProcessBoundaryBox = {
    id: string
    name: string
    eventDefinition: string | null
    interrupting: boolean | null
    attachedToId: string
    poolId: string | null
    x: number
    y: number
    width: number
    height: number
}

// Estremo di un message flow: puo' essere un GroupElement disegnato oppure, quando il
// riferimento e' {type:"Pool", ...}, il pool esterno stesso (i message flow possono collegarsi
// direttamente al bordo di un pool "black box", che e' esattamente il caso d'uso previsto).
type MsgNode = { id: string, x: number, y: number, width: number, height: number }

function toMsgNode(source: PlacedElement | Pool): MsgNode {
    if ("lanes" in source) return { id: source.id, x: 0, y: source.y, width: source.contentWidth, height: source.height }
    return source
}

function msgNodeCenterX(n: MsgNode): number { return n.x + n.width / 2 }
function msgNodeCenterY(n: MsgNode): number { return n.y + n.height / 2 }

// Ancora il waypoint sul bordo superiore/inferiore dello shape a seconda di dove si trova
// l'altro estremo del flow (i pool sono impilati verticalmente in questo layout, quindi la
// direzione rilevante e' quasi sempre quella verticale).
function msgAnchor(n: MsgNode, otherCenterY: number): { x: number, y: number } {
    const cx = msgNodeCenterX(n)
    if (otherCenterY > msgNodeCenterY(n)) return { x: cx, y: n.y + n.height }
    if (otherCenterY < msgNodeCenterY(n)) return { x: cx, y: n.y }
    return { x: n.x + n.width, y: msgNodeCenterY(n) }
}

/**
 * Costruisce un diagramma BPMN 2.0 (XML) "plausibile" a partire da un BPMNDiagramReferenceSolution,
 * per il solo scopo di anteprima (sola lettura) nel Solution Creator - analogo a
 * ClassDiagramStructureBuilderFromReference, ma qui il "model" e' direttamente testo XML anziche'
 * un oggetto Apollon, perche' e' cosi' che le soluzioni BPMN vengono salvate.
 *
 * Limitazioni note (preview, non diagramma "ufficiale"):
 * - per ogni GroupElement viene disegnata solo la PRIMA elementVariant (le altre, se presenti,
 *   sono alternative equivalenti per il matching, non rappresentabili in un unico diagramma concreto)
 * - previousParts influenza solo la POSIZIONE (le parti compaiono comunque da sinistra a destra
 *   nell'ordine di processParts) ma non genera sequence flow tra elementi di parti diverse -
 *   collegare l'ultimo elemento di una parte al primo della successiva produceva archi senza senso
 *   (es. da un end event) ogni volta che quell'elemento non era pensato per proseguire il flusso
 * - messageTo/messageFrom producono i message flow (vedi buildMessageFlows) risolvendo la
 *   coppia mittente/destinatario dalle annotazioni reciproche sui due elementi coinvolti,
 *   ma restano comunque linee dirette senza un vero algoritmo di routing ortogonale
 * - attachedTo risolve l'host (elementId locale allo stesso gruppo) e genera un vero attachedToRef
 *   posizionando il boundary event sovrapposto al suo angolo in basso a destra - obbligatorio per
 *   bpmn-js, che altrimenti scarta l'elemento all'import ("missing ...#attachedToRef") e a cascata
 *   ogni sequenceFlow che lo referenzia; se attachedTo non e' risolvibile l'elemento viene escluso
 *   dal preview (con un console.warn) invece di produrre un XML che fallirebbe comunque all'import
 * - un GroupElement con parent {type:"SubProcess", name} viene disegnato DENTRO un riquadro
 *   <bpmn:subProcess> annidato nel pool dichiarato dal SubProcess corrispondente (un solo livello:
 *   un subprocess dentro un subprocess non viene espanso); il subprocess stesso non ha una propria
 *   sequence flow in ingresso/uscita nel preview, ne' lane interne - stesse semplificazioni gia'
 *   documentate sopra per le part connections tra parti diverse
 */
export class BPMNDiagramStructureBuilderFromReference {
    reference: BPMNDiagramReferenceSolution

    constructor(reference: BPMNDiagramReferenceSolution) {
        this.reference = reference
    }

    private buildPools(): Map<string, Pool> {
        const pools = new Map<string, Pool>()
        for (const be of this.reference.businessEntities) {
            const poolId = sanitizeId(be.name, "Pool")
            pools.set(be.name, {
                id: poolId,
                name: be.name,
                processId: sanitizeId(be.name, "Process"),
                lanes: [],
                contentWidth: START_X + MARGIN_X,
                isCollapsed: be.isCollapsed,
                height: 0,
                y: 0,
            })
        }
        for (const actor of this.reference.actors) {
            const pool = pools.get(actor.businessEntity)
            if (!pool) continue
            pool.lanes.push({ id: sanitizeId(actor.name, "Lane"), name: actor.name, y: 0 })
        }
        // se un pool non ha nessun actor, gli si assegna comunque una lane implicita
        // (altrimenti non avrebbe altezza/spazio per contenere elementi); un pool collassato
        // invece non deve mostrare ne' lane ne' contenuto interno, quindi resta senza lane e
        // con un'altezza fissa, a prescindere da eventuali actor che lo referenziano; poi si
        // assegna a ogni pool la sua fascia verticale ASSOLUTA nel diagramma (impilati uno
        // sotto l'altro), cosi' placeElements() puo' calcolare direttamente coordinate assolute.
        let cumulativeY = 0
        for (const pool of pools.values()) {
            if (!pool.isCollapsed && pool.lanes.length === 0) pool.lanes.push({ id: sanitizeId(pool.name, "Lane_default"), name: "", y: 0 })
            pool.lanes.forEach((lane, i) => { lane.y = i * LANE_HEIGHT })
            pool.height = pool.isCollapsed ? COLLAPSED_POOL_HEIGHT : pool.lanes.length * LANE_HEIGHT
            pool.y = cumulativeY
            cumulativeY += pool.height
        }
        return pools
    }

    private placeElements(pools: Map<string, Pool>): { placed: PlacedElement[], subProcessBoxes: SubProcessBox[], subProcessBoundaryBoxes: SubProcessBoundaryBox[] } {
        const placed: PlacedElement[] = []
        const subProcessBoxes: SubProcessBox[] = []
        const subProcessBoxByName = new Map<string, SubProcessBox>()
        // Cursore orizzontale "prossima x libera", per pool (chiave = pool.id) e per subprocess
        // (chiave = box.id): sostituisce il vecchio schema a indice*passo-fisso, che non reggeva
        // un riquadro largo quanto un intero subprocess accanto a elementi piccoli.
        const cursorXByPool = new Map<string, number>()
        const cursorXBySubProcess = new Map<string, number>()

        // Quanti GroupElement dichiarano ciascun subprocess come parent, per dimensionarne il
        // riquadro PRIMA di posizionarne i figli (li scorriamo tutti una volta in anticipo).
        const subProcessChildCount = new Map<string, number>()
        for (const part of this.reference.processParts) {
            const group = part.possibleGroups[0]
            if (!group) continue
            for (const ge of group.elements) {
                if (ge.parent?.type === "SubProcess") {
                    subProcessChildCount.set(ge.parent.name, (subProcessChildCount.get(ge.parent.name) ?? 0) + 1)
                }
            }
        }

        const nextX = (cursorMap: Map<string, number>, key: string, width: number, defaultStart: number): number => {
            const x = cursorMap.get(key) ?? defaultStart
            cursorMap.set(key, x + width + ELEMENT_GAP)
            return x
        }

        const placeUnresolved = (part: ProcessPart, ge: GroupElement, tag: string, size: { width: number, height: number }) => {
            // Il parent (Pool o SubProcess) dichiarato non corrisponde a nulla di risolvibile:
            // poolId/subProcessId restano null, verra' scartato piu' avanti in build() con un
            // avviso invece di produrre una BPMNShape orfana.
            placed.push({
                id: sanitizeId(`${part.name}_${ge.elementId}`, "El"), tag, name: ge.names[0] || "",
                part, groupElement: ge, poolId: null, laneId: null, subProcessId: null,
                x: 0, y: 0, width: size.width, height: size.height, attachedToId: null,
            })
        }

        const placeInSubProcess = (part: ProcessPart, ge: GroupElement, tag: string, size: { width: number, height: number }, spName: string) => {
            const spDef = this.reference.subProcesses.find((s) => s.name === spName)
            let box = subProcessBoxByName.get(spName)
            if (!box) {
                if (!spDef) { placeUnresolved(part, ge, tag, size); return }
                const poolName = spDef.parent?.type === "Pool" ? spDef.parent.name : undefined
                const pool = poolName ? pools.get(poolName) : undefined
                const lane = pool && !pool.isCollapsed ? pool.lanes[0] : undefined
                const childCount = Math.max(subProcessChildCount.get(spName) ?? 1, 1)
                const boxWidth = SUBPROCESS_PADDING * 2 + childCount * (TASK_SIZE.width + ELEMENT_GAP) - ELEMENT_GAP
                const boxHeight = LANE_HEIGHT - SUBPROCESS_PADDING * 2
                const laneY = pool ? pool.y + (lane ? lane.y : 0) : 0
                const boxX = pool ? nextX(cursorXByPool, pool.id, boxWidth, POOL_LABEL_WIDTH + START_X) : POOL_LABEL_WIDTH + START_X
                const boxY = laneY + (LANE_HEIGHT - boxHeight) / 2
                box = {
                    id: sanitizeId(spName, "SubProcess"), name: spName, isEvent: spDef.isEvent,
                    poolId: pool?.id ?? null, laneId: lane?.id ?? null,
                    x: boxX, y: boxY, width: boxWidth, height: boxHeight,
                }
                subProcessBoxByName.set(spName, box)
                subProcessBoxes.push(box)
                if (pool) pool.contentWidth = Math.max(pool.contentWidth, boxX + boxWidth + MARGIN_X)
                cursorXBySubProcess.set(box.id, box.x + SUBPROCESS_PADDING)
            }
            if (!box.poolId) { placeUnresolved(part, ge, tag, size); return }
            const x = nextX(cursorXBySubProcess, box.id, size.width, box.x + SUBPROCESS_PADDING)
            const y = box.y + box.height / 2 - size.height / 2
            placed.push({
                id: sanitizeId(`${part.name}_${ge.elementId}`, "El"), tag, name: ge.names[0] || "",
                part, groupElement: ge, poolId: box.poolId, laneId: box.laneId, subProcessId: box.id,
                x, y, width: size.width, height: size.height, attachedToId: null,
            })
        }

        const placeInFlow = (part: ProcessPart, ge: GroupElement, tag: string, size: { width: number, height: number }) => {
            if (ge.parent?.type === "SubProcess") { placeInSubProcess(part, ge, tag, size, ge.parent.name); return }

            const poolName = ge.parent?.type === "Pool" ? ge.parent.name : undefined
            const pool = poolName ? pools.get(poolName) : undefined
            const lane = pool && !pool.isCollapsed ? (pool.lanes.find((l) => l.name === ge.actor) ?? pool.lanes[0]) : undefined

            const x = pool ? nextX(cursorXByPool, pool.id, size.width, POOL_LABEL_WIDTH + START_X) : POOL_LABEL_WIDTH + START_X
            const laneY = pool ? pool.y + (lane ? lane.y : 0) : 0
            const rowHeight = pool ? (pool.isCollapsed ? pool.height : LANE_HEIGHT) : LANE_HEIGHT
            const y = laneY + rowHeight / 2 - size.height / 2

            if (pool) pool.contentWidth = Math.max(pool.contentWidth, x + size.width + MARGIN_X)

            placed.push({
                id: sanitizeId(`${part.name}_${ge.elementId}`, "El"),
                tag, name: ge.names[0] || "", part, groupElement: ge,
                poolId: pool?.id ?? null, laneId: lane?.id ?? null, subProcessId: null,
                x, y, width: size.width, height: size.height,
                attachedToId: null,
            })
        }

        // Un gateway seguito immediatamente da un end event (previousElements con un solo
        // predecessore, che e' un ExclusiveGateway) viene piazzato SOTTO quel gateway invece che
        // nella prossima colonna del flusso: altrimenti un ramo "di servizio" che termina subito
        // (es. "Partecipante assente") occupa comunque un'intera colonna, allontanando visivamente
        // gli elementi che proseguono il flusso principale.
        const belowCounts = new Map<string, number>()
        const placeBelowGateway = (part: ProcessPart, ge: GroupElement, anchor: PlacedElement) => {
            const idx = belowCounts.get(anchor.id) ?? 0
            belowCounts.set(anchor.id, idx + 1)
            const x = anchor.x + anchor.width / 2 - EVENT_SIZE.width / 2 + idx * (EVENT_SIZE.width + 20)
            const y = anchor.y + anchor.height + BELOW_GATEWAY_GAP
            placed.push({
                id: sanitizeId(`${part.name}_${ge.elementId}`, "El"), tag: "bpmn:endEvent", name: ge.names[0] || "",
                part, groupElement: ge, poolId: anchor.poolId, laneId: anchor.laneId, subProcessId: anchor.subProcessId,
                x, y, width: EVENT_SIZE.width, height: EVENT_SIZE.height, attachedToId: null,
            })
        }

        // Prima passata: tutto TRANNE i boundary event e gli end event, cosi' quando li
        // posizioniamo (sotto) un eventuale gateway predecessore e' gia' stato piazzato.
        for (const part of this.reference.processParts) {
            const group = part.possibleGroups[0]
            if (!group) continue
            for (const ge of group.elements) {
                const variant = ge.elementVariants[0]
                if (!variant || variant.bpmnType === "BoundaryEvent" || variant.bpmnType === "EndEvent") continue
                const isGateway = variant.bpmnType.endsWith("Gateway")
                const isEvent = variant.bpmnType.endsWith("Event")
                const size = isGateway ? GATEWAY_SIZE : isEvent ? EVENT_SIZE : TASK_SIZE
                placeInFlow(part, ge, `bpmn:${bpmnTag(variant.bpmnType)}`, size)
            }
        }

        // Seconda passata: gli end event.
        for (const part of this.reference.processParts) {
            const group = part.possibleGroups[0]
            if (!group) continue
            for (const ge of group.elements) {
                const variant = ge.elementVariants[0]
                if (!variant || variant.bpmnType !== "EndEvent") continue
                const singlePredecessorId = ge.previousElements.length === 1 ? ge.previousElements[0] : undefined
                const predecessorGe = singlePredecessorId ? group.elements.find((e) => e.elementId === singlePredecessorId) : undefined
                const predecessorIsExclusiveGateway = predecessorGe?.elementVariants[0]?.bpmnType === "ExclusiveGateway"
                const anchor = predecessorIsExclusiveGateway
                    ? placed.find((p) => p.part === part && p.groupElement.elementId === singlePredecessorId)
                    : undefined
                if (anchor) {
                    placeBelowGateway(part, ge, anchor)
                } else {
                    placeInFlow(part, ge, "bpmn:endEvent", EVENT_SIZE)
                }
            }
        }

        // Terza passata: i boundary event. attachedToRef e' OBBLIGATORIO nello schema BPMN per
        // <bpmn:boundaryEvent> - senza, bpmn-js scarta l'elemento all'import ("missing
        // ...#attachedToRef"), il che a cascata fa fallire anche ogni sequenceFlow che lo referenzia
        // come source/target ("not yet drawn") e i lint rule che lo ispezionano. Lo agganciamo
        // quindi all'host risolto da GroupElement.attachedTo (id locale allo stesso gruppo) e lo
        // posizioniamo sovrapposto al suo angolo in basso a destra (convenzione BPMN standard),
        // ereditandone pool/lane/subprocess: un boundary event non puo' vivere in un process diverso
        // dal suo host, a prescindere da cosa sia stato dichiarato separatamente in parent/actor.
        for (const part of this.reference.processParts) {
            const group = part.possibleGroups[0]
            if (!group) continue
            for (const ge of group.elements) {
                const variant = ge.elementVariants[0]
                if (!variant || variant.bpmnType !== "BoundaryEvent") continue
                const hostLocalId = ge.attachedTo?.name
                const host = hostLocalId ? placed.find((p) => p.part === part && p.groupElement.elementId === hostLocalId) : undefined
                if (!host) {
                    console.warn(`BPMN reference preview: il boundary event "${ge.elementId}" della parte "${part.name}" ha un attachedTo non risolvibile (nessun elemento "${hostLocalId ?? "(nessuno)"}" nello stesso gruppo) - bpmn-js richiede sempre un host per un boundary event, quindi verra' escluso dal preview invece di produrre un XML che fallirebbe all'import.`)
                    continue
                }
                placed.push({
                    id: sanitizeId(`${part.name}_${ge.elementId}`, "El"),
                    tag: "bpmn:boundaryEvent",
                    name: ge.names[0] || "",
                    part, groupElement: ge,
                    poolId: host.poolId, laneId: host.laneId, subProcessId: host.subProcessId,
                    x: host.x + host.width - EVENT_SIZE.width / 2,
                    y: host.y + host.height - EVENT_SIZE.height / 2,
                    width: EVENT_SIZE.width, height: EVENT_SIZE.height,
                    attachedToId: host.id,
                })
            }
        }

        // Quarta passata: i boundary event dichiarati direttamente su SubProcess.boundaryEvents
        // (condizione a parte sul subprocess, non un GroupElement - vedi get_subprocess_boundary_event_issues
        // lato server). Vanno dopo le passate precedenti perche' il riquadro del subprocess deve
        // gia' esistere in subProcessBoxByName. Se un subprocess ne ha piu' di uno, li affianchiamo
        // lungo il bordo inferiore partendo dall'angolo in basso a destra, stessa convenzione
        // dell'aggancio su un task.
        const subProcessBoundaryBoxes: SubProcessBoundaryBox[] = []
        for (const sp of this.reference.subProcesses) {
            const box = subProcessBoxByName.get(sp.name)
            if (!box || !box.poolId || !sp.boundaryEvents?.length) continue
            sp.boundaryEvents.forEach((be, idx) => {
                subProcessBoundaryBoxes.push({
                    id: sanitizeId(`${sp.name}_Boundary_${idx + 1}`, "SPBoundary"),
                    name: be.names[0] || "",
                    eventDefinition: be.eventDefinition,
                    interrupting: be.interrupting,
                    attachedToId: box.id,
                    poolId: box.poolId,
                    x: box.x + box.width - EVENT_SIZE.width / 2 - idx * (EVENT_SIZE.width + 10),
                    y: box.y + box.height - EVENT_SIZE.height / 2,
                    width: EVENT_SIZE.width, height: EVENT_SIZE.height,
                })
            })
        }
        return { placed, subProcessBoxes, subProcessBoundaryBoxes }
    }

    private buildSequenceFlows(placed: PlacedElement[]): { id: string, sourceId: string, targetId: string }[] {
        const flows: { id: string, sourceId: string, targetId: string }[] = []
        const byPartAndLocalId = new Map<string, PlacedElement>()
        for (const el of placed) {
            byPartAndLocalId.set(`${el.part.name}::${el.groupElement.elementId}`, el)
        }

        // solo ordine DENTRO il gruppo (previousElements). previousParts resta un vincolo di
        // valutazione/posizionamento (le parti appaiono comunque in sequenza nel diagramma, da
        // sinistra a destra secondo l'ordine di processParts) ma non genera archi tra parti
        // diverse: collegare l'ultimo elemento di una parte al primo della successiva produceva
        // frecce senza senso ogni volta che quell'elemento era, per esempio, un end event.
        for (const el of placed) {
            for (const prevLocalId of el.groupElement.previousElements) {
                const prev = byPartAndLocalId.get(`${el.part.name}::${prevLocalId}`)
                if (prev) flows.push({ id: sanitizeId(`${prev.id}_${el.id}`, "Flow"), sourceId: prev.id, targetId: el.id })
            }
        }
        return flows
    }

    /**
     * A differenza delle sequence flow, messageTo/messageFrom indicano esplicitamente
     * mittente e destinatario, quindi possiamo risolvere una coppia concreta di estremi per
     * ogni relazione invece di limitarci a un vincolo di posizionamento:
     * - riferimento a un Pool ({type:"Pool"}) -> l'altro estremo e' il pool stesso (tipicamente
     *   un partecipante esterno collassato, non modellato in dettaglio)
     * - riferimento a una Part ({type:"Part"}) -> cerchiamo, tra gli elementi di quella parte,
     *   quello che dichiara a sua volta un riferimento reciproco (messageFrom/messageTo verso
     *   la parte dell'elemento di partenza); se nessuno lo fa esplicitamente usiamo il primo
     *   elemento della parte come approssimazione, cosi' la freccia compare comunque nel preview
     *   invece di sparire silenziosamente per una reference annotata solo da un lato
     */
    private buildMessageFlows(placed: PlacedElement[], pools: Map<string, Pool>): { id: string, source: MsgNode, target: MsgNode }[] {
        const byPartName = new Map<string, PlacedElement[]>()
        for (const el of placed) {
            if (!byPartName.has(el.part.name)) byPartName.set(el.part.name, [])
            byPartName.get(el.part.name)!.push(el)
        }

        const links: { source: MsgNode, target: MsgNode }[] = []
        const seenPairs = new Set<string>()
        const addLink = (source: MsgNode, target: MsgNode) => {
            const key = `${source.id}->${target.id}`
            if (seenPairs.has(key)) return
            seenPairs.add(key)
            links.push({ source, target })
        }
        const resolvePartTarget = (fromPartName: string, targetPartName: string): PlacedElement | undefined => {
            const candidates = byPartName.get(targetPartName) || []
            return candidates.find((c) => c.groupElement.messageFrom.some((mf) => mf.type === "Part" && mf.name === fromPartName))
                ?? candidates[0]
        }

        for (const el of placed) {
            for (const ref of el.groupElement.messageTo) {
                if (ref.type === "Pool") {
                    const pool = pools.get(ref.name)
                    if (pool) addLink(toMsgNode(el), toMsgNode(pool))
                } else {
                    const target = resolvePartTarget(el.part.name, ref.name)
                    if (target) addLink(toMsgNode(el), toMsgNode(target))
                }
            }
        }
        // messageFrom con riferimento a una Part e' gia' coperto sopra tramite resolvePartTarget
        // (che cerca esattamente questa reciprocita'): lo gestiamo di nuovo qui solo per il caso
        // "da un Pool esterno", che altrimenti non verrebbe mai generato (un Pool non ha elementi
        // propri con un messageTo da cui partire).
        for (const el of placed) {
            for (const ref of el.groupElement.messageFrom) {
                if (ref.type !== "Pool") continue
                const pool = pools.get(ref.name)
                if (pool) addLink(toMsgNode(pool), toMsgNode(el))
            }
        }

        return links.map((link, i) => ({ id: sanitizeId(`${link.source.id}_${link.target.id}_${i}`, "MessageFlow"), source: link.source, target: link.target }))
    }

    /**
     * @returns l'XML del diagramma e, per ogni ProcessPart, gli id (globali, nel diagramma)
     * dei suoi elementi - usato dal preview per l'highlighting per-parte.
     */
    build(): { xml: string, elementIdsByPart: Map<string, string[]> } {
        const pools = this.buildPools()
        const hasPools = pools.size > 0
        const { placed: placedRaw, subProcessBoxes: subProcessBoxesRaw, subProcessBoundaryBoxes: subProcessBoundaryBoxesRaw } = this.placeElements(pools)
        const placed = placedRaw.filter((el) => {
            // Un pool collassato non ha un processRef (vedi sotto): eventuali elementi assegnati per
            // errore al suo interno non avrebbero un process semantico da cui bpmn-js possa importarli,
            // quindi li scartiamo qui invece di lasciare nel diagramma una BPMNShape "orfana".
            const pool = el.poolId ? Array.from(pools.values()).find((p) => p.id === el.poolId) : undefined
            if (pool?.isCollapsed) return false
            // Se la reference dichiara almeno un pool "vero" (hasPools), solo i process legati a un
            // pool vengono effettivamente emessi piu' sotto (vedi if(hasPools) ... else ...): un
            // elemento il cui parent Pool/SubProcess non corrisponde a nulla di risolvibile (nome
            // diverso, typo, o refactor di una reference che non ha aggiornato tutti i riferimenti)
            // finiva comunque nel process "di default" mai scritto, ottenendo una BPMNShape senza
            // alcun elemento semantico corrispondente nell'XML - un XML tecnicamente invalido che
            // bpmn-js puo' rifiutare del tutto, o importare lasciando l'elemento "orfano" dentro
            // l'elementRegistry, mandando poi in crash canvas.removeMarker/addMarker
            // sull'evidenziazione per-parte (Canvas._updateMarker: "Cannot read properties of
            // undefined (reading 'markers')"). Lo scartiamo qui, con un avviso in console per farlo
            // notare a chi sta costruendo la reference, invece di produrre un XML invalido.
            if (hasPools && !el.poolId) {
                console.warn(`BPMN reference preview: elemento "${el.groupElement.elementId}" della parte "${el.part.name}" ha un parent Pool/SubProcess che non corrisponde a nulla di dichiarato nella reference - escluso dal preview.`)
                return false
            }
            return true
        })
        const subProcessBoxes = subProcessBoxesRaw.filter((box) => {
            if (!box.poolId) {
                console.warn(`BPMN reference preview: il subprocess "${box.name}" ha un parent Pool che non corrisponde a nessuna BusinessEntity dichiarata - escluso dal preview.`)
                return false
            }
            const pool = Array.from(pools.values()).find((p) => p.id === box.poolId)
            return !pool?.isCollapsed
        })
        const subProcessIds = new Set(subProcessBoxes.map((box) => box.id))
        // Un boundary event su un subprocess scartato (pool non risolvibile o collassato) va
        // scartato a sua volta, stesso motivo (BPMNShape orfana altrimenti).
        const subProcessBoundaryBoxes = subProcessBoundaryBoxesRaw.filter((b) => subProcessIds.has(b.attachedToId))
        const flows = this.buildSequenceFlows(placed)

        const elementIdsByPart = new Map<string, string[]>()
        for (const el of placed) {
            if (!elementIdsByPart.has(el.part.name)) elementIdsByPart.set(el.part.name, [])
            elementIdsByPart.get(el.part.name)!.push(el.id)
        }

        const incomingByEl = new Map<string, string[]>()
        const outgoingByEl = new Map<string, string[]>()
        for (const f of flows) {
            if (!outgoingByEl.has(f.sourceId)) outgoingByEl.set(f.sourceId, [])
            outgoingByEl.get(f.sourceId)!.push(f.id)
            if (!incomingByEl.has(f.targetId)) incomingByEl.set(f.targetId, [])
            incomingByEl.get(f.targetId)!.push(f.id)
        }

        const shapesXml: string[] = []
        const edgesXml: string[] = []
        const processesXml: string[] = []
        const participantsXml: string[] = []

        const elementsXmlByProcess = new Map<string, string[]>()
        const addToProcess = (processId: string, xml: string) => {
            if (!elementsXmlByProcess.has(processId)) elementsXmlByProcess.set(processId, [])
            elementsXmlByProcess.get(processId)!.push(xml)
        }
        const elementsXmlBySubProcess = new Map<string, string[]>()
        const addToSubProcess = (subProcessId: string, xml: string) => {
            if (!elementsXmlBySubProcess.has(subProcessId)) elementsXmlBySubProcess.set(subProcessId, [])
            elementsXmlBySubProcess.get(subProcessId)!.push(xml)
        }

        const defaultProcessId = "Process_default"
        for (const el of placed) {
            const processId = el.poolId ? Array.from(pools.values()).find((p) => p.id === el.poolId)!.processId : defaultProcessId
            const incoming = (incomingByEl.get(el.id) || []).map((id) => `<bpmn:incoming>${id}</bpmn:incoming>`).join("")
            const outgoing = (outgoingByEl.get(el.id) || []).map((id) => `<bpmn:outgoing>${id}</bpmn:outgoing>`).join("")
            const variant = el.groupElement.elementVariants[0]
            const eventDef = variant.eventDefinition ? `<${eventDefinitionTag(variant.eventDefinition)}/>` : ""
            // attachedToRef e' obbligatorio per <bpmn:boundaryEvent> (vedi placeElements): senza,
            // bpmn-js scarta l'elemento all'import. cancelActivity va scritto esplicitamente solo
            // quando false, dato che il default BPMN (assente) e' true (interrompente).
            const attachedToAttr = el.attachedToId ? ` attachedToRef="${el.attachedToId}"` : ""
            const cancelActivityAttr = el.tag === "bpmn:boundaryEvent" && variant.interrupting === false ? ' cancelActivity="false"' : ""
            const tagXml = `<${el.tag} id="${el.id}" name="${escapeXml(el.name)}"${attachedToAttr}${cancelActivityAttr}>${incoming}${outgoing}${eventDef}</${el.tag}>`
            if (el.subProcessId) {
                addToSubProcess(el.subProcessId, tagXml)
            } else {
                addToProcess(processId, tagXml)
            }
            // isMarkerVisible di default e' false nella spec BPMN DI: senza impostarlo esplicitamente
            // a true i gateway (X/O/+ ecc.) vengono renderizzati vuoti, senza l'icona del tipo.
            const isGateway = variant.bpmnType.endsWith("Gateway")
            const markerAttr = isGateway ? ' isMarkerVisible="true"' : ""
            shapesXml.push(`<bpmndi:BPMNShape id="${el.id}_di" bpmnElement="${el.id}"${markerAttr}><dc:Bounds x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"/></bpmndi:BPMNShape>`)
        }

        for (const f of flows) {
            const source = placed.find((p) => p.id === f.sourceId)!
            const target = placed.find((p) => p.id === f.targetId)!
            const flowXml = `<bpmn:sequenceFlow id="${f.id}" sourceRef="${f.sourceId}" targetRef="${f.targetId}"/>`
            if (source.subProcessId) {
                addToSubProcess(source.subProcessId, flowXml)
            } else {
                const processId = source.poolId ? Array.from(pools.values()).find((p) => p.id === source.poolId)!.processId : defaultProcessId
                addToProcess(processId, flowXml)
            }
            const x1 = source.x + source.width, y1 = source.y + source.height / 2
            const x2 = target.x, y2 = target.y + target.height / 2
            edgesXml.push(`<bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}"><di:waypoint x="${x1}" y="${y1}"/><di:waypoint x="${x2}" y="${y2}"/></bpmndi:BPMNEdge>`)
        }

        // Il subprocess stesso diventa un flowNode del process del suo pool, contenente a sua
        // volta i tag XML dei suoi figli raccolti sopra - un solo livello di nesting, coerente con
        // la scelta di non supportare subprocess annidati in altri subprocess.
        for (const box of subProcessBoxes) {
            const innerXml = (elementsXmlBySubProcess.get(box.id) || []).join("")
            const triggeredAttr = box.isEvent ? ' triggeredByEvent="true"' : ""
            const subProcessXml = `<bpmn:subProcess id="${box.id}" name="${escapeXml(box.name)}"${triggeredAttr}>${innerXml}</bpmn:subProcess>`
            const pool = Array.from(pools.values()).find((p) => p.id === box.poolId)
            if (pool) addToProcess(pool.processId, subProcessXml)
            // isExpanded="true" mostra i figli inline nello stesso plane invece che richiedere il
            // "drill down" di bpmn-js per i subprocess collassati - coerente con le coordinate
            // assolute (non relative al box) usate per posizionare i suoi figli.
            shapesXml.push(`<bpmndi:BPMNShape id="${box.id}_di" bpmnElement="${box.id}" isExpanded="true"><dc:Bounds x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/></bpmndi:BPMNShape>`)
        }

        // Boundary event dichiarati su SubProcess.boundaryEvents: come il subprocess stesso, sono
        // flowNode del process del pool contenitore, MAI annidati dentro il subprocess anche se
        // visivamente agganciati al suo bordo - attachedToRef e' quello che li lega, non la
        // posizione nell'albero XML.
        for (const b of subProcessBoundaryBoxes) {
            const eventDef = b.eventDefinition ? `<${eventDefinitionTag(b.eventDefinition)}/>` : ""
            const cancelActivityAttr = b.interrupting === false ? ' cancelActivity="false"' : ""
            const boundaryXml = `<bpmn:boundaryEvent id="${b.id}" name="${escapeXml(b.name)}" attachedToRef="${b.attachedToId}"${cancelActivityAttr}>${eventDef}</bpmn:boundaryEvent>`
            const pool = Array.from(pools.values()).find((p) => p.id === b.poolId)
            if (pool) addToProcess(pool.processId, boundaryXml)
            shapesXml.push(`<bpmndi:BPMNShape id="${b.id}_di" bpmnElement="${b.id}"><dc:Bounds x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/></bpmndi:BPMNShape>`)
        }

        if (hasPools) {
            for (const pool of pools.values()) {
                // Un pool collassato (BusinessEntity.isCollapsed) rappresenta un'entita' esterna
                // non modellata in dettaglio ("black box"). bpmn-js decide se un Participant e'
                // espanso o collassato SOLO in base alla presenza di processRef (vedi
                // bpmn-js/lib/util/DiUtil.js:isExpanded) - l'attributo DI "isExpanded" viene
                // ignorato per i pool, quindi l'unico modo per ottenerlo davvero e' NON emettere
                // ne' processRef ne' un <bpmn:process> per quel pool (niente laneSet/lane/elementi).
                if (pool.isCollapsed) {
                    participantsXml.push(`<bpmn:participant id="${pool.id}" name="${escapeXml(pool.name)}"/>`)
                    shapesXml.push(`<bpmndi:BPMNShape id="${pool.id}_di" bpmnElement="${pool.id}" isHorizontal="true"><dc:Bounds x="0" y="${pool.y}" width="${pool.contentWidth}" height="${pool.height}"/></bpmndi:BPMNShape>`)
                    continue
                }
                const processElements = (elementsXmlByProcess.get(pool.processId) || []).join("")
                const laneSetXml = `<bpmn:laneSet id="${pool.id}_laneSet">${pool.lanes.map((lane) => {
                    // Gli elementi annidati in un subprocess NON vanno referenziati qui: il
                    // laneSet del pool partiziona solo il suo flusso diretto, il subprocess stesso
                    // (non i suoi figli) e' gia' incluso tramite il filtro "!el.subProcessId".
                    const flowNodeRefs = [
                        ...placed.filter((el) => el.laneId === lane.id && !el.subProcessId).map((el) => el.id),
                        ...subProcessBoxes.filter((box) => box.laneId === lane.id).map((box) => box.id),
                    ].map((id) => `<bpmn:flowNodeRef>${id}</bpmn:flowNodeRef>`).join("")
                    return `<bpmn:lane id="${lane.id}" name="${escapeXml(lane.name)}">${flowNodeRefs}</bpmn:lane>`
                }).join("")}</bpmn:laneSet>`
                processesXml.push(`<bpmn:process id="${pool.processId}" isExecutable="false">${laneSetXml}${processElements}</bpmn:process>`)
                participantsXml.push(`<bpmn:participant id="${pool.id}" name="${escapeXml(pool.name)}" processRef="${pool.processId}"/>`)
                shapesXml.push(`<bpmndi:BPMNShape id="${pool.id}_di" bpmnElement="${pool.id}" isHorizontal="true"><dc:Bounds x="0" y="${pool.y}" width="${pool.contentWidth}" height="${pool.height}"/></bpmndi:BPMNShape>`)
                pool.lanes.forEach((lane) => {
                    shapesXml.push(`<bpmndi:BPMNShape id="${lane.id}_di" bpmnElement="${lane.id}" isHorizontal="true"><dc:Bounds x="${POOL_LABEL_WIDTH}" y="${pool.y + lane.y}" width="${pool.contentWidth - POOL_LABEL_WIDTH}" height="${LANE_HEIGHT}"/></bpmndi:BPMNShape>`)
                })
            }
        } else {
            const processElements = (elementsXmlByProcess.get(defaultProcessId) || []).join("")
            processesXml.push(`<bpmn:process id="${defaultProcessId}" isExecutable="false">${processElements}</bpmn:process>`)
        }

        // I message flow vivono nella collaboration (non in un singolo process) e servono
        // solo quando c'e' piu' di un partecipante da collegare.
        const messageFlowsXml: string[] = []
        if (hasPools) {
            for (const mf of this.buildMessageFlows(placed, pools)) {
                messageFlowsXml.push(`<bpmn:messageFlow id="${mf.id}" sourceRef="${mf.source.id}" targetRef="${mf.target.id}"/>`)
                const s = msgAnchor(mf.source, msgNodeCenterY(mf.target))
                const t = msgAnchor(mf.target, msgNodeCenterY(mf.source))
                edgesXml.push(`<bpmndi:BPMNEdge id="${mf.id}_di" bpmnElement="${mf.id}"><di:waypoint x="${s.x}" y="${s.y}"/><di:waypoint x="${t.x}" y="${t.y}"/></bpmndi:BPMNEdge>`)
            }
        }

        const collaborationXml = hasPools
            ? `<bpmn:collaboration id="Collaboration_1">${participantsXml.join("")}${messageFlowsXml.join("")}</bpmn:collaboration>`
            : ""

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_preview" targetNamespace="http://bpmn.io/schema/bpmn">
${collaborationXml}
${processesXml.join("\n")}
<bpmndi:BPMNDiagram id="BPMNDiagram_1">
<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${hasPools ? "Collaboration_1" : defaultProcessId}">
${shapesXml.join("\n")}
${edgesXml.join("\n")}
</bpmndi:BPMNPlane>
</bpmndi:BPMNDiagram>
</bpmn:definitions>`

        return { xml, elementIdsByPart }
    }
}

function escapeXml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
