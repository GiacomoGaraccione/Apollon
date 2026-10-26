import { UMLClassAttribute } from "../../../packages/uml-class-diagram/uml-class-attribute/uml-class-attribute"
import { UMLClass } from "../../../packages/uml-class-diagram/uml-class/uml-class"
import { Direction } from "../../../services/uml-element/uml-element-port"
import { Assessment, UMLAssociation, UMLClassifier, UMLDiagramType, UMLElement, UMLElementType, UMLModel, UMLRelationship, UMLRelationshipType } from "../../../typings"
import { IBoundary } from "../../../utils/geometry/boundary"
import { IPath } from "../../../utils/geometry/path"
import { ReferenceAssociation, ReferenceAttribute, ReferenceClass, ClassDiagramReferenceSolution } from "./MatcherTypes"

export class UMLCustomClass implements UMLClassifier {
    id: string
    name!: string
    type: "Package" | "Class" | "AbstractClass" | "Interface" | "Enumeration" | "ClassAttribute" | "ClassMethod" | "IntermediateClass" | "ObjectName" | "ObjectAttribute" | "ObjectMethod" | "Activity" | "ActivityActionNode" | "ActivityFinalNode" | "ActivityForkNode" | "ActivityForkNodeHorizontal" | "ActivityInitialNode" | "ActivityMergeNode" | "ActivityObjectNode" | "UseCase" | "UseCaseActor" | "UseCaseSystem" | "CommunicationLinkMessage" | "Component" | "Subsystem" | "ComponentInterface" | "DeploymentNode" | "DeploymentComponent" | "DeploymentArtifact" | "DeploymentInterface" | "PetriNetPlace" | "PetriNetTransition" | "ReachabilityGraphMarking" | "SyntaxTreeTerminal" | "SyntaxTreeNonterminal" | "FlowchartTerminal" | "FlowchartProcess" | "FlowchartDecision" | "FlowchartInputOutput" | "FlowchartFunctionCall" | "ColorLegend" | "BPMNTask" | "BPMNSubprocess" | "BPMNTransaction" | "BPMNCallActivity" | "BPMNAnnotation" | "BPMNStartEvent" | "BPMNIntermediateEvent" | "BPMNEndEvent" | "BPMNGateway" | "BPMNDataObject" | "BPMNDataStore" | "BPMNPool" | "BPMNSwimlane" | "BPMNGroup"
    owner: string | null
    bounds: IBoundary
    highlight?: string | undefined
    fillColor?: string | undefined
    strokeColor?: string | undefined
    textColor?: string | undefined
    assessmentNote?: string | undefined
    attributes: string[]
    methods: string[]

    constructor(id: string, name: string, type: UMLClassifier["type"], owner: string | null, bounds: IBoundary) {
        this.id = id
        this.name = name
        this.type = type as UMLCustomClass["type"]
        this.owner = owner
        this.bounds = bounds
        this.attributes = []
        this.methods = []
    }

    addAttribute(attribute: string) {
        this.attributes.push(attribute)
    }

    addMethod(method: string) {
        this.methods.push(method)
    }
}

export class UMLCustomAssociation implements UMLAssociation, UMLRelationship {
    name!: string
    owner!: string | null
    bounds!: IBoundary
    highlight?: string | undefined
    fillColor?: string | undefined
    strokeColor?: string | undefined
    textColor?: string | undefined
    assessmentNote?: string | undefined
    path!: IPath
    source!: { element: string; direction: Direction } & { multiplicity: string; role: string }
    target!: { element: string; direction: Direction } & { multiplicity: string; role: string }
    isManuallyLayouted?: boolean | undefined
    id!: string
    type!: UMLRelationshipType
}

type Point = { x: number, y: number }
type Place = { row: number, column: number }
type AssociationInfo = {
    class: string
    count: number
    connectedClasses: string[]
}

interface Region {
    position: Place
    cl?: AssociationInfo
}

function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// Apollon assegna un punto FISSO per ogni Direction (vedi getPortsForElement in uml-element.ts: Up/Right/Down/Left
// sono il centro del lato, le varianti Topleft/Topright/Bottomleft/Bottomright/Upleft/Upright/Downleft/Downright
// sono i punti a 1/4 e 3/4 dello stesso lato) - quando una classe ha piu' di un'associazione che
// vorrebbe uscire dallo stesso lato (sia verso la stessa classe, sia verso classi diverse che finiscono
// nella stessa direzione base), usare sempre il punto centrale di quel lato le farebbe sovrapporre tutte
// sullo stesso pixel. PORT_PRIORITY elenca, per ciascuna direzione "base", tutti e 12 i punti disponibili
// in ordine di preferenza: prima le 3 varianti dello stesso lato, poi i centri dei due lati adiacenti, poi
// i rispettivi quarti, infine il lato opposto come ultima risorsa - cosi' anche un nodo con molte
// connessioni (es. un hub come "Volo" con 4+ associazioni) si distribuisce sull'intero perimetro invece
// di ricollidere dopo le prime 3.
const PORT_PRIORITY: Record<Direction, Direction[]> = {
    [Direction.Right]: [Direction.Right, Direction.Upright, Direction.Downright, Direction.Up, Direction.Down, Direction.Topright, Direction.Bottomright, Direction.Upleft, Direction.Downleft, Direction.Topleft, Direction.Bottomleft, Direction.Left],
    [Direction.Left]: [Direction.Left, Direction.Upleft, Direction.Downleft, Direction.Up, Direction.Down, Direction.Topleft, Direction.Bottomleft, Direction.Upright, Direction.Downright, Direction.Topright, Direction.Bottomright, Direction.Right],
    [Direction.Up]: [Direction.Up, Direction.Topleft, Direction.Topright, Direction.Left, Direction.Right, Direction.Upleft, Direction.Upright, Direction.Bottomleft, Direction.Bottomright, Direction.Downleft, Direction.Downright, Direction.Down],
    [Direction.Down]: [Direction.Down, Direction.Bottomleft, Direction.Bottomright, Direction.Left, Direction.Right, Direction.Downleft, Direction.Downright, Direction.Topleft, Direction.Topright, Direction.Upleft, Direction.Upright, Direction.Up],
    // Le direzioni diagonali non sono mai scelte come "base" da addUMLAssociations (solo Up/Down/Left/Right
    // lo sono), ma il tipo Record<Direction,...> le richiede comunque: ciascuna ripiega sulla propria lista
    // cardinale piu' vicina, non dovrebbero mai essere consultate.
    [Direction.Upright]: [Direction.Upright, Direction.Right, Direction.Up, Direction.Downright, Direction.Topright, Direction.Upleft, Direction.Down, Direction.Left, Direction.Bottomright, Direction.Topleft, Direction.Downleft, Direction.Bottomleft],
    [Direction.Downright]: [Direction.Downright, Direction.Right, Direction.Down, Direction.Upright, Direction.Bottomright, Direction.Downleft, Direction.Up, Direction.Left, Direction.Topright, Direction.Bottomleft, Direction.Upleft, Direction.Topleft],
    [Direction.Upleft]: [Direction.Upleft, Direction.Left, Direction.Up, Direction.Downleft, Direction.Topleft, Direction.Upright, Direction.Down, Direction.Right, Direction.Bottomleft, Direction.Topright, Direction.Downright, Direction.Bottomright],
    [Direction.Downleft]: [Direction.Downleft, Direction.Left, Direction.Down, Direction.Upleft, Direction.Bottomleft, Direction.Downright, Direction.Up, Direction.Right, Direction.Topleft, Direction.Bottomright, Direction.Upright, Direction.Topright],
    [Direction.Topleft]: [Direction.Topleft, Direction.Up, Direction.Left, Direction.Topright, Direction.Upleft, Direction.Bottomleft, Direction.Right, Direction.Down, Direction.Upright, Direction.Bottomright, Direction.Downleft, Direction.Downright],
    [Direction.Topright]: [Direction.Topright, Direction.Up, Direction.Right, Direction.Topleft, Direction.Upright, Direction.Bottomright, Direction.Left, Direction.Down, Direction.Upleft, Direction.Bottomleft, Direction.Downright, Direction.Downleft],
    [Direction.Bottomleft]: [Direction.Bottomleft, Direction.Down, Direction.Left, Direction.Bottomright, Direction.Downleft, Direction.Topleft, Direction.Right, Direction.Up, Direction.Downright, Direction.Topright, Direction.Upleft, Direction.Upright],
    [Direction.Bottomright]: [Direction.Bottomright, Direction.Down, Direction.Right, Direction.Bottomleft, Direction.Downright, Direction.Topright, Direction.Left, Direction.Up, Direction.Downleft, Direction.Topleft, Direction.Upright, Direction.Upleft],
}

// Layout radiale per grado, al posto sia della vecchia griglia "prima cella libera adiacente" sia
// del layout a strati provato in precedenza (BFS left-to-right): quello a strati garantiva che due
// classi connesse finissero in colonne adiacenti, ma NON che fossero vicine anche in verticale - una
// classe con piu' vicini tutti nella colonna successiva (es. "Volo" nello screenshot) li vedeva
// sparsi su righe lontane tra loro, costringendo le sue connessioni ad attraversare mezzo diagramma
// in verticale. Qui invece si piazza prima la classe con PIU' associazioni al centro (0,0), poi si
// processano le altre classi in ordine di grado decrescente: ciascuna viene piazzata nella cella
// LIBERA PIU' VICINA AL CENTRO tra quelle adiacenti (N/S/E/W) a un suo vicino gia' posizionato -
// quindi la seconda classe piu' connessa finisce vicina al centro, la terza vicina a una delle prime
// due, ecc. Il grafo cresce quindi a "macchia d'olio" attorno all'hub principale invece che a strati,
// e le classi collegate restano fisicamente vicine (associazioni = salti brevi, non attraversamenti
// lunghi). Place.row/column sono ora coordinate 2D libere (anche negative, e' solo una griglia logica
// prima della conversione in pixel) - la convenzione riga=asse X/colonna=asse Y usata da
// addUMLAssociations per scegliere Left/Right/Up/Down resta valida, dato che qui i vicini diretti
// differiscono SEMPRE di 1 in una sola delle due coordinate (adiacenza ortogonale pura).
function computeRadialPositions(associationInfo: AssociationInfo[]): Map<string, Region> {
    const byClass = new Map(associationInfo.map((info) => [info.class, info]))
    const key = (p: Place) => p.row + "_" + p.column
    const neighborCells = (p: Place): Place[] => [
        { row: p.row - 1, column: p.column },
        { row: p.row + 1, column: p.column },
        { row: p.row, column: p.column + 1 },
        { row: p.row, column: p.column - 1 },
    ]

    const placed = new Map<string, Place>()
    const occupied = new Set<string>()
    const isFree = (p: Place) => !occupied.has(key(p))

    // BFS a spirale dal punto dato, per trovare la cella libera piu' vicina (usata sia per ancorare
    // una classe isolata vicino al centro, sia come ripiego quando tutte le celle adiacenti a un
    // vicino gia' piazzato sono occupate).
    function nearestFree(start: Place): Place {
        if (isFree(start)) return start
        const visited = new Set<string>([key(start)])
        let queue = [start]
        while (queue.length > 0) {
            const next: Place[] = []
            for (const current of queue) {
                for (const n of neighborCells(current)) {
                    const k = key(n)
                    if (visited.has(k)) continue
                    visited.add(k)
                    if (isFree(n)) return n
                    next.push(n)
                }
            }
            queue = next
        }
        throw new Error("unreachable: infinite grid")
    }

    const place = (cls: string, position: Place) => {
        placed.set(cls, position)
        occupied.add(key(position))
    }

    const sorted = [...associationInfo].sort((a, b) => b.count - a.count)
    for (const info of sorted) {
        if (placed.has(info.class)) continue
        if (placed.size === 0) {
            place(info.class, { row: 0, column: 0 })
            continue
        }
        const placedNeighbors = info.connectedClasses.map((n) => placed.get(n)).filter((p): p is Place => p !== undefined)
        if (placedNeighbors.length === 0) {
            place(info.class, nearestFree({ row: 0, column: 0 }))
            continue
        }
        // tra le celle libere adiacenti a QUALUNQUE vicino gia' piazzato, scegli quella piu' vicina
        // al centro (distanza di Manhattan dall'origine) - cosi' il grafo resta compatto attorno
        // all'hub invece di espandersi a caso in una direzione
        const candidates = placedNeighbors.flatMap((anchor) => neighborCells(anchor).filter(isFree))
        if (candidates.length > 0) {
            candidates.sort((a, b) => (Math.abs(a.row) + Math.abs(a.column)) - (Math.abs(b.row) + Math.abs(b.column)))
            place(info.class, candidates[0])
        } else {
            place(info.class, nearestFree(placedNeighbors[0]))
        }
    }

    const regions = new Map<string, Region>()
    placed.forEach((position, cls) => {
        regions.set(key(position), { position, cl: byClass.get(cls) })
    })
    return regions
}

class ClassDiagramStructureBuilderFromReference {
    reference: ClassDiagramReferenceSolution
    associationInfo: AssociationInfo[]
    model: UMLModel
    positions: Map<string, Region> | null = null
    associationPairCounts: Map<string, number> = new Map()
    occupiedPorts: Map<string, Set<Direction>> = new Map()

    constructor(reference: ClassDiagramReferenceSolution) {
        this.reference = reference
        this.associationInfo = []
        this.model = {
            version: `3.0.0`,
            type: UMLDiagramType.ClassDiagram,
            size: { width: 0, height: 0 },
            elements: {} as { [id: string]: UMLClassifier },
            relationships: {} as { [id: string]: UMLRelationship },
            assessments: {} as { [id: string]: Assessment },
            interactive: { elements: {} as { [id: string]: UMLElement }, relationships: {} as { [id: string]: UMLRelationship } } as unknown as Selection
        } as unknown as UMLModel
    }

    addUMLClass(cl: ReferenceClass) {
        let newClass = new UMLClass()
        let custom = new UMLCustomClass(
            newClass.id,
            cl.name,
            cl.type as UMLClassifier["type"],
            newClass.owner,
            newClass.bounds
        )
        cl.attributes.forEach((attr: ReferenceAttribute, index: number) => {
            let newAttr = new UMLClassAttribute()
            let name = attr.name
            if (cl.type !== "Enumeration") name += ": " + attr.types[0]
            newAttr.name = name
            newAttr.owner = custom.id

            custom.addAttribute(newAttr.id)
            this.model.elements[newAttr.id] = newAttr
        })
        this.model.elements[custom.id] = custom
    }

    calculateElementSize(elementId: string) {
        if (this.model.elements[elementId].type === "Class") {
            let custom = this.model.elements[elementId] as UMLCustomClass
            let maxAttrLength = Math.max(...custom.attributes.map((attr) => this.model.elements[attr].name.length))
            let width = Math.max(maxAttrLength, custom.name.length) * 10
            let height = 40 + custom.attributes.length * 20
            custom.bounds.width = width
            custom.bounds.height = height
            this.model.elements[elementId] = custom
        } else if (this.model.elements[elementId].type === "ClassAttribute") {
            const attr = this.model.elements[elementId] as UMLClassAttribute;
            const owner = this.model.elements[attr.owner as string] as UMLCustomClass;
            if (owner && owner.type === "Class") {
                const index = owner.attributes.indexOf(attr.id)
                attr.bounds = {
                    ...attr.bounds,
                    x: owner.bounds.x,
                    y: owner.bounds.y + 40 + (20 * index),
                    width: owner.bounds.width,
                    height: 20
                }
                this.model.elements[elementId] = attr
            }
        }
    }

    addAssociationInfo(class1: string, class2: string) {
        let class1Info = this.associationInfo.find(info => info.class === class1)
        let class2Info = this.associationInfo.find(info => info.class === class2)
        if (!class1Info) {
            class1Info = { class: class1, count: 0, connectedClasses: [] }
            this.associationInfo.push(class1Info)
        }
        if (!class2Info) {
            class2Info = { class: class2, count: 0, connectedClasses: [] }
            this.associationInfo.push(class2Info)
        }

        class1Info.count++
        class2Info.count++

        if (!class1Info.connectedClasses.includes(class2)) {
            class1Info.connectedClasses.push(class2)
        }
        if (!class2Info.connectedClasses.includes(class1)) {
            class2Info.connectedClasses.push(class1)
        }
    }

    findSingleClasses(associations: ReferenceAssociation[]) {
        Object.keys(this.model.elements).forEach((elementId) => {
            let cl = this.model.elements[elementId] as UMLCustomClass
            let found = associations.find((assoc) => assoc.source.referenceClass.name === cl.name || assoc.target.referenceClass.name === cl.name)
            if (!found) {
                this.associationInfo.push({ class: cl.name, count: 0, connectedClasses: [] })
            }
        })
    }

    calculateClosestMidpoint(cl1: UMLCustomClass, cl2: UMLCustomClass) {
        type CornerKey = "AB" | "BC" | "CD" | "AD";
        const keys: CornerKey[] = ["AB", "BC", "CD", "AD"];
        let cl1Points: Record<CornerKey, Point> = {
            AB: { x: cl1.bounds.x + cl1.bounds.width / 2, y: cl1.bounds.y },
            BC: { x: cl1.bounds.x + cl1.bounds.width, y: cl1.bounds.y + cl1.bounds.height / 2 },
            CD: { x: cl1.bounds.x + cl1.bounds.width / 2, y: cl1.bounds.y + cl1.bounds.height },
            AD: { x: cl1.bounds.x, y: cl1.bounds.y + cl1.bounds.height / 2 }
        };
        let cl2Points: Record<CornerKey, Point> = {
            AB: { x: cl2.bounds.x + cl2.bounds.width / 2, y: cl2.bounds.y },
            BC: { x: cl2.bounds.x + cl2.bounds.width, y: cl2.bounds.y + cl2.bounds.height / 2 },
            CD: { x: cl2.bounds.x + cl2.bounds.width / 2, y: cl2.bounds.y + cl2.bounds.height },
            AD: { x: cl2.bounds.x, y: cl2.bounds.y + cl2.bounds.height / 2 }
        };
        let minDist = Number.MAX_VALUE;
        let closestPair: { p1: Point, p2: Point } = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } };
        for (let key1 of keys) {
            for (let key2 of keys) {
                let dist = distance(cl1Points[key1], cl2Points[key2]);
                if (dist < minDist) {
                    minDist = dist;
                    closestPair = { p1: cl1Points[key1], p2: cl2Points[key2] };
                }
            }
        }
        return closestPair;
    }

    nextPortDirection(classId: string, baseDirection: Direction): Direction {
        let used = this.occupiedPorts.get(classId)
        if (!used) {
            used = new Set<Direction>()
            this.occupiedPorts.set(classId, used)
        }
        const candidate = PORT_PRIORITY[baseDirection].find((dir) => !used!.has(dir))
        const chosen = candidate ?? baseDirection // tutti e 12 i punti gia' occupati (12+ connessioni sullo stesso nodo): accetta la ripetizione
        used.add(chosen)
        return chosen
    }

    addUMLAssociations(class1: string, class2: string, name: string, cardinality1: string, cardinality2: string, type: string) {
        // class1/class2 sono nell'ordine source/target di QUESTA associazione: due associazioni
        // distinte tra la stessa coppia di classi con lo stesso verso (stesso source/target) produrrebbero
        // altrimenti lo stesso id, e la seconda sovrascriverebbe silenziosamente la prima nel dizionario
        // `model.relationships` (bug reale, trovato scrivendo un test con due associazioni Pilota->CompagniaAerea).
        // La chiave va invece calcolata in modo non ordinato (sort), cosi' conta correttamente le associazioni
        // tra la stessa coppia indipendentemente dal verso source/target di ciascuna.
        const pairKey = [class1, class2].sort().join("|")
        const pairIndex = this.associationPairCounts.get(pairKey) ?? 0
        this.associationPairCounts.set(pairKey, pairIndex + 1)

        let newAssoc = new UMLCustomAssociation()
        newAssoc.id = "assoc_" + class1 + "_" + class2 + "_" + pairIndex
        newAssoc.name = name
        newAssoc.owner = null
        let newType = type === "Inheritance" ? "ClassInheritance" : type === "Aggregation" ? "ClassAggregation" : type === "Composition" ? "ClassComposition" : "ClassBidirectional"
        newAssoc.type = newType as UMLRelationshipType
        newAssoc.isManuallyLayouted = false
        let cl1 = Object.values(this.model.elements).find((el) => el.name === class1) as UMLCustomClass
        let cl2 = Object.values(this.model.elements).find((el) => el.name === class2) as UMLCustomClass
        let midpoints = this.calculateClosestMidpoint(cl1, cl2)
        newAssoc.bounds = { x: midpoints.p1.x, y: midpoints.p1.y, width: Math.abs(midpoints.p2.x - midpoints.p1.x), height: 10 }
        newAssoc.path = [
            { x: midpoints.p1.x, y: midpoints.p1.y },
            { x: midpoints.p2.x, y: midpoints.p2.y }
        ]
        let sourceRegion = Array.from(this.positions!.values()).find(region => region.cl?.class === class1)?.position
        let targetRegion = Array.from(this.positions!.values()).find(region => region.cl?.class === class2)?.position
        let sourceDirection = Direction.Right, targetDirection = Direction.Left
        if (sourceRegion && targetRegion) {
            if (sourceRegion.row !== targetRegion.row) {
                if (sourceRegion?.row > targetRegion?.row) {
                    sourceDirection = Direction.Left
                    targetDirection = Direction.Right
                } else if (sourceRegion?.row < targetRegion?.row) {
                    sourceDirection = Direction.Right
                    targetDirection = Direction.Left
                }
            } else {
                if (sourceRegion.column > targetRegion.column) {
                    sourceDirection = Direction.Up
                    targetDirection = Direction.Down
                } else if (sourceRegion.column < targetRegion.column) {
                    sourceDirection = Direction.Down
                    targetDirection = Direction.Up
                }
            }
        }
        // Spargere le varianti di porta per COPPIA (pairIndex) risolve solo il caso di piu' associazioni
        // tra le stesse due classi: un hub con molti vicini DIVERSI che finiscono tutti sullo stesso lato
        // (normale in un layout a strati: tutto cio' che e' "a valle" di un nodo esce dal suo lato destro)
        // otterrebbe comunque sempre la stessa direzione base per ognuno di quei vicini, quindi la stessa
        // porta esatta - esattamente il problema segnalato ("Volo riceve le sue associazioni sullo stesso
        // lato e si perdono"). Si conta quindi per (classe, direzione base), non per coppia: ogni volta che
        // lo STESSO lato della STESSA classe viene riusato, la prossima associazione passa alla variante
        // successiva di quel lato - indipendentemente da quale altra classe raggiunge.
        sourceDirection = this.nextPortDirection(cl1.id, sourceDirection)
        targetDirection = this.nextPortDirection(cl2.id, targetDirection)
        newAssoc.source = { element: cl1.id, direction: sourceDirection, multiplicity: cardinality1, role: "" }
        newAssoc.target = { element: cl2.id, direction: targetDirection, multiplicity: cardinality2, role: "" }
        this.model.relationships[newAssoc.id] = newAssoc
    }

    createPositions() {
        const regions = computeRadialPositions(this.associationInfo)

        // Dimensione di colonna (per livello, asse X) e di riga (per posizione verticale, asse Y)
        // VARIABILI, basate sulla classe piu' grande che occupa quella colonna/riga - la vecchia
        // versione usava un'unica dimensione di cella uniforme (il massimo globale su tutto il
        // diagramma), sprecando spazio attorno alle classi piccole e rischiando di essere troppo
        // stretta per quelle con molti attributi.
        const columnWidths = new Map<number, number>()
        const rowHeights = new Map<number, number>()
        regions.forEach((region) => {
            const element = Object.values(this.model.elements).find((el) => el.name === region.cl!.class) as UMLCustomClass
            columnWidths.set(region.position.row, Math.max(columnWidths.get(region.position.row) ?? 0, element.bounds.width))
            rowHeights.set(region.position.column, Math.max(rowHeights.get(region.position.column) ?? 0, element.bounds.height))
        })

        const GAP_X = 120
        const GAP_Y = 100
        const columnX = new Map<number, number>()
        let cumX = 0
        for (const col of Array.from(columnWidths.keys()).sort((a, b) => a - b)) {
            columnX.set(col, cumX)
            cumX += columnWidths.get(col)! + GAP_X
        }
        const rowY = new Map<number, number>()
        let cumY = 0
        for (const row of Array.from(rowHeights.keys()).sort((a, b) => a - b)) {
            rowY.set(row, cumY)
            cumY += rowHeights.get(row)! + GAP_Y
        }

        regions.forEach((region) => {
            let element = Object.values(this.model.elements).find((el) => el.name === region.cl!.class) as UMLCustomClass
            element.bounds.x = columnX.get(region.position.row)!
            element.bounds.y = rowY.get(region.position.column)!
        })
        this.positions = regions
    }

    createUMLStructure() {
        try {
            this.reference.classes.forEach((cl: ReferenceClass) => {
                this.addUMLClass(cl)
            })
            Object.keys(this.model.elements).forEach((elementId) => {
                this.calculateElementSize(elementId)
            })
            this.reference.associations.forEach((assoc: ReferenceAssociation) => {
                this.addAssociationInfo(assoc.source.referenceClass.name, assoc.target.referenceClass.name)
            })
            this.findSingleClasses(this.reference.associations)
            this.associationInfo.sort((a, b) => b.count - a.count)
            this.createPositions()
            this.reference.associations.forEach((assoc: ReferenceAssociation) => {
                this.addUMLAssociations(assoc.source.referenceClass.name, assoc.target.referenceClass.name, assoc.name, assoc.source.multiplicities[0], assoc.target.multiplicities[0], assoc.type)
            })
        } catch (error) {
            console.error(error)
        }
        return this.model
    }
}

export { ClassDiagramStructureBuilderFromReference }