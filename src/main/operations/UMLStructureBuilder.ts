import { UMLClassAttribute } from "../packages/uml-class-diagram/uml-class-attribute/uml-class-attribute"
import { UMLClass } from "../packages/uml-class-diagram/uml-class/uml-class"
import { UMLElements } from "../packages/uml-elements"
import { UMLDiagram } from "../services/uml-diagram/uml-diagram"
import { Direction } from "../services/uml-element/uml-element-port"
import { Assessment, UMLAssociation, UMLClassifier, UMLDiagramType, UMLElement, UMLElementType, UMLModel, UMLRelationship, UMLRelationshipType } from "../typings"
import { IBoundary } from "../utils/geometry/boundary"
import { IPath } from "../utils/geometry/path"
import { ReferenceAssociation, ReferenceAttribute, ReferenceClass, ReferenceEnumeration, ReferenceSolution } from "./UMLMatcherTypes"

export class UMLCustomClass implements UMLClassifier {
    id: string
    name: string
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
        this.type = type
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
    name: string
    owner: string | null
    bounds: IBoundary
    highlight?: string | undefined
    fillColor?: string | undefined
    strokeColor?: string | undefined
    textColor?: string | undefined
    assessmentNote?: string | undefined
    path: IPath
    source: { element: string; direction: Direction } & { multiplicity: string; role: string }
    target: { element: string; direction: Direction } & { multiplicity: string; role: string }
    isManuallyLayouted?: boolean | undefined
    id: string
    type: UMLRelationshipType
}

type Point = { x: number, y: number }
type Place = { row: number, column: number }
type Verse = "N" | "S" | "E" | "W" | "Extra"
type AssociationInfo = {
    class: string
    count: number
    connectedClasses: string[]
}

interface Region {
    position: Place
    cl?: AssociationInfo
    connections: { direction: Verse, target: string }[]
}

function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

class UMLRegionMap {
    private regions: Map<string, Region>
    private directions: { direction: Verse, offset: Place }[]

    constructor() {
        this.regions = new Map()
        this.directions = [
            { direction: "N", offset: { row: -1, column: 0 } },
            { direction: "S", offset: { row: 1, column: 0 } },
            { direction: "E", offset: { row: 0, column: 1 } },
            { direction: "W", offset: { row: 0, column: -1 } },
        ]
    }

    private getKey(place: Place): string {
        return place.row + "_" + place.column
    }

    private isRegionOccupied(place: Place): boolean {
        return this.regions.has(this.getKey(place))
    }

    addClassToRegion(cl: AssociationInfo, place: Place): void {
        let key = this.getKey(place)
        if (this.isRegionOccupied(place)) return
        this.regions.set(key, { position: place, cl: cl, connections: [] })
    }

    connectRegions(from: Place, to: Place, direction: Verse): void {
        let fromKey = this.getKey(from)
        let toKey = this.getKey(to)
        if (!this.regions.has(fromKey) || !this.regions.has(toKey)) return
        this.regions.get(fromKey)!.connections[direction] = toKey
    }

    findNearestFreePosition(place: Place): Place | null {
        let queue: Place[] = [place]
        let visited = new Set<string>()
        visited.add(this.getKey(place))
        while (queue.length > 0) {
            let current = queue.shift()!
            for (const dir of this.directions) {
                let newPlace = { row: current.row + dir.offset.row, column: current.column + dir.offset.column }
                let newKey = this.getKey(newPlace)
                if (!this.isRegionOccupied(newPlace)) {
                    return newPlace
                }
                if (!visited.has(newKey)) {
                    queue.push(newPlace)
                    visited.add(newKey)
                }
            }
        }
        return null
    }

    placeClasses(classes: AssociationInfo[]): void {
        this.addClassToRegion(classes[0], { row: 0, column: 0 })
        let placedClasses = new Map<string, Place>()
        placedClasses.set(classes[0].class, { row: 0, column: 0 })

        for (let i = 1; i < classes.length; i++) {
            let cl = classes[i]
            for (let conn of cl.connectedClasses) {
                if (placedClasses.has(conn)) {
                    let place = placedClasses.get(conn)!
                    let freePlace = this.findNearestFreePosition(place)
                    this.addClassToRegion(cl, freePlace!)
                    placedClasses.set(cl.class, freePlace!)
                    break
                }
            }
            if (!placedClasses.has(cl.class)) {
                let freePlace = this.findNearestFreePosition({ row: 0, column: 0 })
                this.addClassToRegion(cl, freePlace!)
                placedClasses.set(cl.class, freePlace!)
            }
        }
    }

    getMapState(): Map<string, Region> {
        return this.regions
    }
}

class UMLStructureBuilderFromLLM {
    plantUMLText: string
    associationInfo: AssociationInfo[]
    model: UMLModel
    positions: Map<string, Region> | null
    regionWidth: number
    totalHeight: number

    constructor(plantUMLText: string) {
        this.plantUMLText = plantUMLText
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
        this.regionWidth = 0
        this.totalHeight = 0
    }

    calculateClosestMidpoint(cl1: UMLCustomClass, cl2: UMLCustomClass) {
        let cl1Points = {
            AB: { x: cl1.bounds.x + cl1.bounds.width / 2, y: cl1.bounds.y },
            BC: { x: cl1.bounds.x + cl1.bounds.width, y: cl1.bounds.y + cl1.bounds.height / 2 },
            CD: { x: cl1.bounds.x + cl1.bounds.width / 2, y: cl1.bounds.y + cl1.bounds.height },
            AD: { x: cl1.bounds.x, y: cl1.bounds.y + cl1.bounds.height / 2 }
        }
        let cl2Points = {
            AB: { x: cl2.bounds.x + cl2.bounds.width / 2, y: cl2.bounds.y },
            BC: { x: cl2.bounds.x + cl2.bounds.width, y: cl2.bounds.y + cl2.bounds.height / 2 },
            CD: { x: cl2.bounds.x + cl2.bounds.width / 2, y: cl2.bounds.y + cl2.bounds.height },
            AD: { x: cl2.bounds.x, y: cl2.bounds.y + cl2.bounds.height / 2 }
        }
        let minDist = Number.MAX_VALUE
        let closestPair: { p1: Point, p2: Point } = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } }
        for (let key1 in cl1Points) {
            for (let key2 in cl2Points) {
                let dist = distance(cl1Points[key1], cl2Points[key2])
                if (dist < minDist) {
                    minDist = dist
                    closestPair = { p1: cl1Points[key1], p2: cl2Points[key2] }
                }
            }
        }
        return closestPair
    }

    createPositions() {
        let map = new UMLRegionMap()
        map.placeClasses(this.associationInfo)
        let positions = map.getMapState()
        positions.forEach((region, key) => {
            let x = parseInt(key.split("_")[0])
            let y = parseInt(key.split("_")[1])
            let element = Object.values(this.model.elements).find((el) => el.name === region.cl!.class) as UMLCustomClass
            element.bounds.x = x * Math.max(this.regionWidth, this.totalHeight)
            element.bounds.y = y * Math.max(this.regionWidth, this.totalHeight)
        })
        this.positions = positions
    }

    addUMLClass(cl: any) {
        let newClass = new UMLClass()
        let type
        switch (cl.type.toLowerCase()) {
            case "class":
                type = "Class"
                break
            case "abstract":
                type = "AbstractClass"
                break
            case "interface":
                type = "Interface"
                break
            case "enumeration":
            case "enum":
                type = "Enumeration"
                break
            default:
                type = "Class"
        }
        let custom = new UMLCustomClass(
            newClass.id,
            cl.name,
            type,
            newClass.owner,
            newClass.bounds
        )
        cl.attributes.forEach((attr: any) => {
            let newAttr = new UMLClassAttribute()
            let name = attr.name
            if (type === "Class") name += ": " + attr.type
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
        }
    }

    setRegionSize() {
        let hSpace = 0
        let vSpace = 0

        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId]
            if (element.type !== "ClassAttribute") {
                if (element.bounds.width > hSpace) {
                    hSpace = element.bounds.width
                }
                if (element.bounds.height > vSpace) {
                    vSpace = element.bounds.height
                }
            }
        })
        this.regionWidth = (hSpace * 1.5)
        this.totalHeight = 2 * vSpace
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

    addUMLAssociations(class1: string, class2: string, name: string, cardinality1: string, cardinality2: string) {
        let newAssoc = new UMLCustomAssociation()
        newAssoc.id = "assoc_" + class1 + "_" + class2
        newAssoc.name = name
        newAssoc.owner = null
        newAssoc.type = "ClassBidirectional"
        newAssoc.isManuallyLayouted = false
        let cl1 = Object.values(this.model.elements).find((el) => el.name === class1) as UMLCustomClass
        let cl2 = Object.values(this.model.elements).find((el) => el.name === class2) as UMLCustomClass
        let midpoints = this.calculateClosestMidpoint(cl1, cl2)
        newAssoc.bounds = { x: midpoints.p1.x, y: midpoints.p1.y, width: midpoints.p2.x - midpoints.p1.x, height: 10 }
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
        newAssoc.source = { element: cl1.id, direction: sourceDirection, multiplicity: cardinality1, role: "" }
        newAssoc.target = { element: cl2.id, direction: targetDirection, multiplicity: cardinality2, role: "" }
        this.model.relationships[newAssoc.id] = newAssoc
    }

    enumerateOperations(op: string) {
        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId] as UMLCustomClass
            if (element.type === "Class") {
                for (let attrId of element.attributes) {
                    let attr = this.model.elements[attrId] as UMLClassAttribute
                    let type = attr.name.split(": ")[1]
                    Object.keys(this.model.elements).forEach((elementId2) => {
                        let element2 = this.model.elements[elementId2] as UMLCustomClass
                        if (element2.type === "Enumeration" && type === element2.name) {
                            if (op === "associationInfo") this.addAssociationInfo(element.name, element2.name)
                            else if (op === "umlAssociations") this.addUMLAssociations(element.name, element2.name, "", "", "")
                        }
                    })
                }
            }
        })
    }

    findSingleClasses(associations: any[]) {
        Object.keys(this.model.elements).forEach((elementId) => {
            let cl = this.model.elements[elementId] as UMLCustomClass
            let found = associations.find((assoc) => assoc.class1 === cl.name || assoc.class2 === cl.name)
            if (!found) {
                this.associationInfo.push({ class: cl.name, count: 0, connectedClasses: [] })
            }
        })
    }

    createUMLStructure() {
        try {
            let content = JSON.parse(this.plantUMLText.substring(this.plantUMLText.indexOf("{"), this.plantUMLText.lastIndexOf("}") + 1))
            content.classes.forEach((cl: any) => {
                this.addUMLClass(cl)
            })
            Object.keys(this.model.elements).forEach((elementId) => {
                this.calculateElementSize(elementId)
            })
            this.setRegionSize()
            content.associations.forEach((assoc: any) => {
                this.addAssociationInfo(assoc.class1, assoc.class2)
            })

            this.enumerateOperations("associationInfo")
            this.findSingleClasses(content.associations)
            this.associationInfo.sort((a, b) => b.count - a.count)
            this.createPositions()
            content.associations.forEach((assoc: any) => {
                this.addUMLAssociations(assoc.class1, assoc.class2, assoc.name, assoc.cardinality1, assoc.cardinality2)
            })
            this.enumerateOperations("umlAssociations")
        } catch (error) {
            console.error(error)
        }


        return this.model
    }
}

class UMLStructureBuilderFromReference {
    reference: ReferenceSolution
    associationInfo: AssociationInfo[]
    model: UMLModel
    positions: Map<string, Region> | null
    regionWidth: number
    totalHeight: number

    constructor(reference: ReferenceSolution) {
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
        this.regionWidth = 0
        this.totalHeight = 0
    }

    addUMLClass(cl: ReferenceClass) {
        let newClass = new UMLClass()
        let custom = new UMLCustomClass(
            newClass.id,
            cl.name,
            "Class",
            newClass.owner,
            newClass.bounds
        )
        cl.attributes.forEach((attr: ReferenceAttribute) => {
            let newAttr = new UMLClassAttribute()
            let name = attr.name + ": " + attr.types[0]
            newAttr.name = name
            newAttr.owner = custom.id
            custom.addAttribute(newAttr.id)
            this.model.elements[newAttr.id] = newAttr
        })
        this.model.elements[custom.id] = custom
    }

    addUMLEnumeration(en: ReferenceEnumeration) {
        let newEnum = new UMLClass()
        let custom = new UMLCustomClass(
            newEnum.id,
            en.name,
            "Enumeration",
            newEnum.owner,
            newEnum.bounds
        )
        en.literals.forEach((lit: ReferenceAttribute) => {
            let newLit = new UMLClassAttribute()
            newLit.name = lit.name
            newLit.owner = custom.id
            custom.addAttribute(newLit.id)
            this.model.elements[newLit.id] = newLit
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
        }
    }

    setRegionSize() {
        let hSpace = 0
        let vSpace = 0

        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId]
            if (element.type !== "ClassAttribute") {
                if (element.bounds.width > hSpace) {
                    hSpace = element.bounds.width
                }
                if (element.bounds.height > vSpace) {
                    vSpace = element.bounds.height
                }
            }
        })
        this.regionWidth = (hSpace * 1.5)
        this.totalHeight = 2 * vSpace
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

    enumerateOperations(op: string) {
        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId] as UMLCustomClass
            if (element.type === "Class") {
                for (let attrId of element.attributes) {
                    let attr = this.model.elements[attrId] as UMLClassAttribute
                    let type = attr.name.split(": ")[1]
                    Object.keys(this.model.elements).forEach((elementId2) => {
                        let element2 = this.model.elements[elementId2] as UMLCustomClass
                        if (element2.type === "Enumeration" && type === element2.name) {
                            if (op === "associationInfo") this.addAssociationInfo(element.name, element2.name)
                            else if (op === "umlAssociations") this.addUMLAssociations(element.name, element2.name, "", "", "")
                        }
                    })
                }
            }
        })
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
        let cl1Points = {
            AB: { x: cl1.bounds.x + cl1.bounds.width / 2, y: cl1.bounds.y },
            BC: { x: cl1.bounds.x + cl1.bounds.width, y: cl1.bounds.y + cl1.bounds.height / 2 },
            CD: { x: cl1.bounds.x + cl1.bounds.width / 2, y: cl1.bounds.y + cl1.bounds.height },
            AD: { x: cl1.bounds.x, y: cl1.bounds.y + cl1.bounds.height / 2 }
        }
        let cl2Points = {
            AB: { x: cl2.bounds.x + cl2.bounds.width / 2, y: cl2.bounds.y },
            BC: { x: cl2.bounds.x + cl2.bounds.width, y: cl2.bounds.y + cl2.bounds.height / 2 },
            CD: { x: cl2.bounds.x + cl2.bounds.width / 2, y: cl2.bounds.y + cl2.bounds.height },
            AD: { x: cl2.bounds.x, y: cl2.bounds.y + cl2.bounds.height / 2 }
        }
        let minDist = Number.MAX_VALUE
        let closestPair: { p1: Point, p2: Point } = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } }
        for (let key1 in cl1Points) {
            for (let key2 in cl2Points) {
                let dist = distance(cl1Points[key1], cl2Points[key2])
                if (dist < minDist) {
                    minDist = dist
                    closestPair = { p1: cl1Points[key1], p2: cl2Points[key2] }
                }
            }
        }
        return closestPair
    }

    addUMLAssociations(class1: string, class2: string, name: string, cardinality1: string, cardinality2: string) {
        let newAssoc = new UMLCustomAssociation()
        newAssoc.id = "assoc_" + class1 + "_" + class2
        newAssoc.name = name
        newAssoc.owner = null
        newAssoc.type = "ClassBidirectional"
        newAssoc.isManuallyLayouted = false
        let cl1 = Object.values(this.model.elements).find((el) => el.name === class1) as UMLCustomClass
        let cl2 = Object.values(this.model.elements).find((el) => el.name === class2) as UMLCustomClass
        let midpoints = this.calculateClosestMidpoint(cl1, cl2)
        newAssoc.bounds = { x: midpoints.p1.x, y: midpoints.p1.y, width: midpoints.p2.x - midpoints.p1.x, height: 10 }
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
        newAssoc.source = { element: cl1.id, direction: sourceDirection, multiplicity: cardinality1, role: "" }
        newAssoc.target = { element: cl2.id, direction: targetDirection, multiplicity: cardinality2, role: "" }
        this.model.relationships[newAssoc.id] = newAssoc
    }

    createPositions() {
        let map = new UMLRegionMap()
        map.placeClasses(this.associationInfo)
        let positions = map.getMapState()
        positions.forEach((region, key) => {
            let x = parseInt(key.split("_")[0])
            let y = parseInt(key.split("_")[1])
            let element = Object.values(this.model.elements).find((el) => el.name === region.cl!.class) as UMLCustomClass
            element.bounds.x = x * Math.max(this.regionWidth, this.totalHeight)
            element.bounds.y = y * Math.max(this.regionWidth, this.totalHeight)
        })
        this.positions = positions
    }

    createUMLStructure() {
        try {
            this.reference.classes.forEach((cl: ReferenceClass) => {
                this.addUMLClass(cl)
            })
            this.reference.enumerations.forEach((en: ReferenceEnumeration) => {
                this.addUMLEnumeration(en)
            })
            Object.keys(this.model.elements).forEach((elementId) => {
                this.calculateElementSize(elementId)
            })
            this.setRegionSize()
            this.reference.associations.forEach((assoc: ReferenceAssociation) => {
                this.addAssociationInfo(assoc.source.referenceClass.name, assoc.target.referenceClass.name)
            })
            this.enumerateOperations("associationInfo")
            this.findSingleClasses(this.reference.associations)
            this.associationInfo.sort((a, b) => b.count - a.count)
            this.createPositions()
            this.reference.associations.forEach((assoc: ReferenceAssociation) => {
                this.addUMLAssociations(assoc.source.referenceClass.name, assoc.target.referenceClass.name, assoc.name, assoc.source.multiplicities[0], assoc.target.multiplicities[0])
            })
            this.enumerateOperations("umlAssociations")
        } catch (error) {
            console.error(error)
        }
        return this.model
    }
}

export { UMLStructureBuilderFromLLM, UMLStructureBuilderFromReference }