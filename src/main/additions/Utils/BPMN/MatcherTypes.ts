export class ElementVariant {
    bpmnType: string = "Task"
    eventDefinition: string | null = null      // "Message" | "Timer" | "Signal" | "Error" | "Conditional" | null
    interrupting: boolean | null = null        // true/false per un BoundaryEvent, null = non verificato
    gatewayType: string | null = null          // "split" | "merge" | null
}

export class ElementReference {
    type: string = "Part"                      // "Part" | "Pool" | "SubProcess"
    name: string = ""
}

export class GroupElement {
    elementId: string = ""                     // id locale al gruppo (es. "Task_1"), non globale
    parent: ElementReference | null = null      // {type:"Pool", name: <businessEntity>} oppure {type:"SubProcess", name: <subprocess>}
    names: string[] = []                        // sinonimi per il fuzzy match sul nome
    previousElements: string[] = []             // elementId locali dei predecessori attesi, dentro lo stesso gruppo
    actor: string | null = null                 // nome dell'Actor (lane) proprietario
    messageTo: ElementReference[] = []          // {type:"Part", name: <altra ProcessPart>}
    messageFrom: ElementReference[] = []
    attachedTo: ElementReference | null = null  // per boundary event
    attacher: ElementReference[] = []
    elementVariants: ElementVariant[] = []
    description: string = ""
}

export class PartGroup {
    groupId: string = ""
    elements: GroupElement[] = []
}

export class ProcessPart {
    name: string = ""
    possibleGroups: PartGroup[] = []
    previousParts: string[] = []
}

export class Actor {
    name: string = ""
    allowedNames: string[] = []
    businessEntity: string = ""                 // nome della BusinessEntity (pool) proprietaria
}

export class BusinessEntity {
    name: string = ""
    allowedNames: string[] = []
    isCollapsed: boolean = false
    isOptional: boolean = false
}

// Boundary event atteso su un SubProcess, verificato come condizione a parte (non come
// ProcessPart/GroupElement): basta che il subprocess matchato abbia nel diagramma un
// BoundaryEvent agganciato (attachedToRef) con nome/tipo/interrupting coerenti. Non modella "cosa
// succede dopo" (quello resta una ProcessPart indipendente, con previousParts vuoto, stessa
// convenzione gia' usata per le relazioni cross-pool via messageTo/messageFrom).
export class SubProcessBoundaryEvent {
    names: string[] = []                        // sinonimi per il fuzzy match sul nome, come GroupElement.names
    eventDefinition: string | null = null       // "Message" | "Timer" | "Signal" | "Error" | "Conditional" | null
    interrupting: boolean | null = null         // tri-stato, null = non verificato
    description: string = ""                    // messaggio di feedback mostrato allo studente se manca/è sbagliato
}

export class SubProcess {
    name: string = ""
    allowedNames: string[] = []
    isEvent: boolean = false                    // true = event subprocess (triggeredByEvent)
    isInterrupting: boolean | null = null        // significativo solo se isEvent; null = non verificato
    parent: ElementReference | null = null       // {type:"Pool", name: <businessEntity che lo contiene>}
    boundaryEvents: SubProcessBoundaryEvent[] = []
}

// Un BPMNDiagramReferenceSolution = una PossibleSolution di BIPMIN, appiattita di un livello:
// l'alternanza "prova piu' soluzioni, tieni la migliore" e' gia' gestita da piu' righe Solution
// per esercizio, quindi qui non serve annidare un array di possibili soluzioni.
export class BPMNDiagramReferenceSolution {
    processParts: ProcessPart[] = []
    businessEntities: BusinessEntity[] = []
    actors: Actor[] = []
    forbiddenEntities: string[] = []
    forbiddenActors: string[] = []
    subProcesses: SubProcess[] = []
}

export const TASK_TYPES = ["Task", "UserTask", "ServiceTask", "SendTask", "ReceiveTask", "ManualTask", "ScriptTask", "BusinessRuleTask"]
export const GATEWAY_TYPES = ["ExclusiveGateway", "ParallelGateway", "InclusiveGateway", "EventBasedGateway"]
export const EVENT_TYPES = ["StartEvent", "EndEvent", "IntermediateThrowEvent", "IntermediateCatchEvent", "BoundaryEvent"]
export const EVENT_DEFINITIONS = ["Message", "Timer", "Signal", "Error", "Conditional", "Terminate"]

function shortType(type: string): string {
    return type.startsWith("bpmn:") ? type.substring(5) : type
}

function eventDefinitionOf(el: any): string | null {
    const def = el.businessObject?.eventDefinitions?.[0]?.$type
    return def ? def.replace("bpmn:", "").replace("EventDefinition", "") : null
}

function gatewayTypeOf(el: any): string | null {
    const outgoing = (el.outgoing || []).length
    const incoming = (el.incoming || []).length
    if (outgoing > 1) return "split"
    if (incoming > 1) return "merge"
    return null
}

/**
 * Costruisce un BPMNDiagramReferenceSolution a partire da un diagramma disegnato a mano
 * con un'istanza live di bpmn-js Modeler (workflow "crea con il modeler" in SolutionCreator).
 *
 * A differenza di ClassDiagram/UseCaseDiagram, qui NON si puo' derivare automaticamente il
 * raggruppamento in ProcessPart/possibleGroups: quale insieme di elementi soddisfa insieme
 * un requisito e' un giudizio pedagogico dell'insegnante, non deducibile dal grafo. buildReference()
 * produce quindi un'ipotesi ragionevole - una ProcessPart con un solo possibleGroup per ogni
 * elemento disegnato, in ordine topologico - che l'insegnante potra' poi raggruppare manualmente
 * (il form per farlo e' rimandato a un passo successivo).
 */
export class BPMNDiagramReferenceBuilder {
    elements: any[]

    constructor(modeler: any) {
        this.elements = modeler.get('elementRegistry').getAll().filter((el: any) => el.type !== 'label')
    }

    private poolOf(el: any): string | undefined {
        let p = el
        while (p && p.type !== 'bpmn:Participant') p = p.parent
        return p?.id
    }

    private laneOf(el: any): string | undefined {
        const lane = this.elements.find((l: any) => l.type === 'bpmn:Lane' &&
            (l.businessObject.flowNodeRef || []).some((ref: any) => ref.id === el.id))
        return lane?.id
    }

    private variantOf(el: any): ElementVariant {
        const v = new ElementVariant()
        v.bpmnType = shortType(el.type)
        v.eventDefinition = eventDefinitionOf(el)
        v.gatewayType = GATEWAY_TYPES.includes(v.bpmnType) ? gatewayTypeOf(el) : null
        return v
    }

    private flowNodeBase(el: any): GroupElement {
        const ge = new GroupElement()
        ge.elementId = el.id
        ge.names = el.businessObject.name ? [el.businessObject.name] : []
        ge.previousElements = (el.incoming || []).map((c: any) => c.source.id)
        ge.actor = this.laneOf(el) ?? null
        ge.elementVariants = [this.variantOf(el)]
        return ge
    }

    buildReference(): BPMNDiagramReferenceSolution {
        const ref = new BPMNDiagramReferenceSolution()

        for (const el of this.elements) {
            if (el.type === 'bpmn:Participant') {
                const be = new BusinessEntity()
                be.name = el.businessObject.name || el.id
                be.allowedNames = el.businessObject.name ? [el.businessObject.name] : []
                be.isOptional = !el.businessObject.processRef
                ref.businessEntities.push(be)
            } else if (el.type === 'bpmn:Lane') {
                const actor = new Actor()
                actor.name = el.businessObject.name || el.id
                actor.allowedNames = el.businessObject.name ? [el.businessObject.name] : []
                const pool = this.poolOf(el)
                const parentBe = ref.businessEntities.find(be => be.name === (this.elements.find((p: any) => p.id === pool)?.businessObject?.name))
                actor.businessEntity = parentBe?.name || ""
                ref.actors.push(actor)
            }
        }

        // un ProcessPart per elemento di flusso disegnato, ordinato topologicamente per lettura piu' naturale
        const flowNodes = this.elements.filter((el: any) =>
            TASK_TYPES.includes(shortType(el.type)) || GATEWAY_TYPES.includes(shortType(el.type)) || EVENT_TYPES.includes(shortType(el.type)))
        const ordered = topologicalOrder(flowNodes)

        for (const el of ordered) {
            const groupElement = this.flowNodeBase(el)
            const parentPool = this.poolOf(el)
            if (parentPool) {
                const poolEl = this.elements.find((p: any) => p.id === parentPool)
                groupElement.parent = { type: "Pool", name: poolEl?.businessObject?.name || parentPool }
            }
            const part = new ProcessPart()
            part.name = groupElement.names[0] || el.id
            part.previousParts = []   // l'insegnante li imposta a mano nel form quando raggruppera' le parti
            const group = new PartGroup()
            group.groupId = "Group_1"
            group.elements = [groupElement]
            part.possibleGroups = [group]
            ref.processParts.push(part)
        }

        return ref
    }

    // Re-innesta i metadati inseriti a mano dall'insegnante (names extra, forbidden*) per elementId
    // locale, quando disponibile - matching per id come UseCaseDiagramReferenceBuilder, non per nome.
    updateReference(old: BPMNDiagramReferenceSolution): BPMNDiagramReferenceSolution {
        const fresh = this.buildReference()
        const oldElementsById = new Map<string, GroupElement>()
        for (const part of old.processParts) {
            for (const group of part.possibleGroups) {
                for (const el of group.elements) {
                    oldElementsById.set(el.elementId, el)
                }
            }
        }
        for (const part of fresh.processParts) {
            for (const group of part.possibleGroups) {
                for (const el of group.elements) {
                    const match = oldElementsById.get(el.elementId)
                    if (match) {
                        el.names = match.names
                        el.description = match.description
                    }
                }
            }
        }
        fresh.forbiddenEntities = old.forbiddenEntities
        fresh.forbiddenActors = old.forbiddenActors
        return fresh
    }
}

function topologicalOrder(flowNodes: any[]): any[] {
    const ids = new Set(flowNodes.map((n: any) => n.id))
    const visited = new Set<string>()
    const result: any[] = []
    const visit = (node: any) => {
        if (visited.has(node.id)) return
        visited.add(node.id)
        for (const conn of (node.incoming || [])) {
            if (ids.has(conn.source.id)) visit(conn.source)
        }
        result.push(node)
    }
    flowNodes.forEach(visit)
    return result
}
