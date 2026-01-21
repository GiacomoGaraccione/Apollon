import { UMLUseCase } from "../../../packages/uml-use-case-diagram/uml-use-case/uml-use-case"
import { UMLUseCaseActor } from "../../../packages/uml-use-case-diagram/uml-use-case-actor/uml-use-case-actor"
import { UMLUseCaseSystem } from "../../../packages/uml-use-case-diagram/uml-use-case-system/uml-use-case-system"
import { Direction } from "../../../services/uml-element/uml-element-port"
import { Assessment, UMLDiagramType, UMLElement, UMLModel, UMLRelationship, UMLRelationshipType } from "../../../typings"
import { IBoundary } from "../../../utils/geometry/boundary"
import { IPath } from "../../../utils/geometry/path"
import { UseCaseDiagramReferenceSolution, ReferenceActor, ReferenceUseCase, ReferenceSystem } from "./MatcherTypes"
import { UseCaseElementType, UseCaseRelationshipType } from "../../../packages/uml-use-case-diagram"

class UMLCustomRelationship implements UMLRelationship {
    id!: string
    name!: string
    owner!: string | null
    bounds!: IBoundary
    highlight?: string | undefined
    fillColor?: string | undefined
    strokeColor?: string | undefined
    textColor?: string | undefined
    assessmentNote?: string | undefined
    path!: IPath
    source!: { element: string; direction: Direction }
    target!: { element: string; direction: Direction }
    isManuallyLayouted?: boolean | undefined
    type!: UMLRelationshipType
}

type Point = { x: number, y: number }

export class UseCaseDiagramStructureBuilderFromReference {
    reference: UseCaseDiagramReferenceSolution
    model: UMLModel
    idMap: { [refId: string]: string }

    constructor(reference: UseCaseDiagramReferenceSolution) {
        this.reference = reference
        this.idMap = {}
        this.model = {
            version: `3.0.0`,
            type: UMLDiagramType.UseCaseDiagram,
            size: { width: 0, height: 0 },
            elements: {} as { [id: string]: UMLElement },
            relationships: {} as { [id: string]: UMLRelationship },
            assessments: {} as { [id: string]: Assessment },
            interactive: { elements: {} as { [id: string]: boolean }, relationships: {} as { [id: string]: boolean } } as any
        } as UMLModel
    }

    addActor(act: ReferenceActor, x: number, y: number) {
        const actor = new UMLUseCaseActor({ name: act.name, id: act.elementId })
        actor.bounds = { ...actor.bounds, x, y }
        this.model.elements[actor.id] = actor.serialize() as UMLElement
        this.idMap[act.elementId] = actor.id
    }

    addSystem(sys: ReferenceSystem, x: number, y: number, width: number, height: number) {
        const system = new UMLUseCaseSystem({ name: sys.name, id: sys.elementId })
        system.bounds = { ...system.bounds, x, y, width, height }
        const serialized = system.serialize() as UMLElement
        // Represent external systems with the external system element type
        if ((sys as any).isExternal) {
            serialized.type = UseCaseElementType.UseCaseExternalSystem
        }
        this.model.elements[system.id] = serialized
        this.idMap[sys.elementId] = system.id
    }

    addUseCase(uc: ReferenceUseCase, x: number, y: number, width: number, height: number) {
        // Map owner reference id (owner is a reference system elementId) to created system id
        const ownerRef = this.reference.systems.find(s => s.elementId === uc.owner)?.elementId ?? ""
        const ownerMapped = this.idMap[ownerRef] ?? null
        const usecase = new UMLUseCase({ name: uc.name, owner: ownerMapped, id: uc.elementId })
        usecase.bounds = { ...usecase.bounds, x, y, width, height }
        this.model.elements[usecase.id] = usecase.serialize() as UMLElement
        this.idMap[uc.elementId] = usecase.id
    }

    centerOf(elementId: string): Point {
        const el = this.model.elements[elementId]
        return { x: el.bounds.x + (el.bounds.width / 2), y: el.bounds.y + (el.bounds.height / 2) }
    }

    addAssociationBetween(aId: string, bId: string, type: string, idx: number) {
        const rel = new UMLCustomRelationship()
        rel.id = `rel_${idx}_${aId}_${bId}`
        rel.name = ''
        rel.owner = null
        rel.type = type as UMLRelationshipType
        const aCenter = this.centerOf(aId)
        const bCenter = this.centerOf(bId)
        rel.path = [{ x: aCenter.x, y: aCenter.y }, { x: bCenter.x, y: bCenter.y }]
        rel.source = { element: aId, direction: aCenter.x <= bCenter.x ? Direction.Right : Direction.Left }
        rel.target = { element: bId, direction: aCenter.x <= bCenter.x ? Direction.Left : Direction.Right }
        rel.bounds = { x: Math.min(aCenter.x, bCenter.x), y: Math.min(aCenter.y, bCenter.y), width: Math.abs(bCenter.x - aCenter.x), height: Math.abs(bCenter.y - aCenter.y) }
        this.model.relationships[rel.id] = rel
    }

    createPositionsAndAddElements() {
        // Layout parameters
        const leftMargin = 10
        const rightMargin = 10
        const topMargin = 10
        const colGap = 120
        const rowGap = 30
        const systemPadding = 24
        const useCaseW = 180
        const useCaseH = 80
        const actorW = 90
        const actorH = 140
        const minSystemW = 260
        const minSystemH = 160

        // Group use cases by owner (system elementId). owner may be "" or undefined => global group
        const useCasesByOwner: { [owner: string]: ReferenceUseCase[] } = {}
        this.reference.useCases.forEach(uc => {
            const owner = uc.owner ?? ""
            if (!useCasesByOwner[owner]) useCasesByOwner[owner] = []
            useCasesByOwner[owner].push(uc)
        })

        // Determine systems to render: those present in reference.systems plus a synthetic "" owner if any use cases global
        const systemsToRender: ReferenceSystem[] = [...this.reference.systems]
        const hasGlobalUseCases = !!useCasesByOwner[""]
        if (hasGlobalUseCases) {
            // create a placeholder system object for global use cases (no visual container, will place in center)
            // We'll not add to idMap for owner ""
        }

        // Compute layout: arrange systems horizontally (including placeholders for global group)
        const systemCount = systemsToRender.length + (hasGlobalUseCases ? 1 : 0)
        const totalAvailableWidth = Math.max(900, systemCount * minSystemW + (systemCount - 1) * colGap + leftMargin + rightMargin)
        // compute each system width based on its number of use cases
        const systemLayouts: { ownerId: string, width: number, height: number, useCases: ReferenceUseCase[] }[] = []

        // For systems in reference, find their owned use cases
        systemsToRender.forEach(sys => {
            const ownerId = sys.elementId
            const ucs = useCasesByOwner[ownerId] ?? []
            // choose cols/rows to space use cases
            const n = Math.max(ucs.length, 1)
            const cols = Math.ceil(Math.sqrt(n))
            const rows = Math.ceil(n / cols)
            const cellW = useCaseW
            const cellH = useCaseH
            const width = Math.max(minSystemW, cols * cellW + (cols + 1) * systemPadding)
            const height = Math.max(minSystemH, rows * cellH + (rows + 1) * systemPadding)
            systemLayouts.push({ ownerId, width, height, useCases: ucs })
        })
        console.log(systemLayouts)

        // Add placeholder for global use cases if any
        if (hasGlobalUseCases) {
            const ucs = useCasesByOwner[""]
            const n = Math.max(ucs.length, 1)
            const cols = Math.ceil(Math.sqrt(n))
            const rows = Math.ceil(n / cols)
            const width = Math.max(minSystemW, cols * useCaseW + (cols + 1) * systemPadding)
            const height = Math.max(minSystemH, rows * useCaseH + (rows + 1) * systemPadding)
            systemLayouts.push({ ownerId: "", width, height, useCases: ucs })
        }

        // total width needed
        const totalSystemsWidth = systemLayouts.reduce((s, l) => s + l.width, 0) + (systemLayouts.length - 1) * colGap
        // start X so everything centered-ish
        let startX = leftMargin + Math.floor((totalAvailableWidth - leftMargin - rightMargin - totalSystemsWidth) / 2)
        if (startX < leftMargin) startX = leftMargin

        // Place systems and their contained use cases
        const systemPositions: { ownerId: string, x: number, y: number, width: number, height: number }[] = []
        let curX = startX
        const systemsY = topMargin
        for (const layout of systemLayouts) {
            const sx = curX
            const sy = systemsY
            systemPositions.push({ ownerId: layout.ownerId, x: sx, y: sy, width: layout.width, height: layout.height })
            // If it's a real system (ownerId !== ""), add system element
            if (layout.ownerId !== "") {
                const sysRef = this.reference.systems.find(s => s.elementId === layout.ownerId)
                if (sysRef) {
                    this.addSystem(sysRef, sx, sy, layout.width, layout.height)
                }
            }
            // place use cases inside system bounds (or in central area if ownerId === "")
            const padding = systemPadding
            const innerX = sx + padding
            const innerY = sy + padding
            const availableW = layout.width - 2 * padding
            const cols = Math.max(1, Math.floor(availableW / (useCaseW + padding)))
            const actualCols = Math.max(1, Math.min(cols, Math.ceil(layout.useCases.length === 0 ? 1 : Math.sqrt(layout.useCases.length))))
            const cellW = Math.min(useCaseW, Math.floor((availableW - (actualCols - 1) * padding) / actualCols))
            const rows = Math.ceil(layout.useCases.length / actualCols)
            const cellH = useCaseH
            for (let i = 0; i < layout.useCases.length; i++) {
                const col = i % actualCols
                const row = Math.floor(i / actualCols)
                const ux = innerX + col * (cellW + padding)
                const uy = innerY + row * (cellH + padding)
                this.addUseCase(layout.useCases[i], ux, uy, cellW, cellH)
            }
            // If this layout corresponds to a real system, ensure system bounds are large enough to contain placed use cases
            if (layout.ownerId !== "") {
                const sysId = this.idMap[layout.ownerId]
                if (sysId && this.model.elements[sysId]) {
                    const sysEl = this.model.elements[sysId]
                    // find use cases that have owner = sysId
                    const owned = Object.values(this.model.elements).filter(e => e.owner === sysId && e.type === UseCaseElementType.UseCase)
                    if (owned.length > 0) {
                        const minX = Math.min(...owned.map(e => e.bounds.x))
                        const minY = Math.min(...owned.map(e => e.bounds.y))
                        const maxX = Math.max(...owned.map(e => e.bounds.x + e.bounds.width))
                        const maxY = Math.max(...owned.map(e => e.bounds.y + e.bounds.height))
                        const extra = padding
                        const desiredWidth = Math.max(layout.width, (maxX - sysEl.bounds.x) + extra)
                        const desiredHeight = Math.max(layout.height, (maxY - sysEl.bounds.y) + extra)
                        sysEl.bounds.width = desiredWidth
                        sysEl.bounds.height = desiredHeight
                        this.model.elements[sysId] = sysEl
                    }
                }
            }
            curX += layout.width + colGap
        }

        // Place use cases that have no owner and we already placed them in placeholder if hasGlobalUseCases.
        // Now, place actors relative to systems: for each actor, find the use cases they are connected to and compute side preference
        // First, build quick maps of relationships from reference
        const actorToAssociations: { [actorId: string]: { targetUseCaseId: string, supporting: boolean }[] } = {}
        this.reference.actorUseCaseAssociations.forEach(a => {
            if (!actorToAssociations[a.sourceId]) actorToAssociations[a.sourceId] = []
            // determine which is actor id and which is usecase id in pair: MatcherTypes stores sourceId/targetId as element ids; we don't know order
            // assume associations were created with actor as sourceId when building reference; if not, try both
            const supportingFlag = (a as any).isSupportingActor ?? (a as any).isSupporting ?? false
            actorToAssociations[a.sourceId].push({ targetUseCaseId: a.targetId, supporting: supportingFlag })
        })
        // also check inverse associations where actor was target
        this.reference.actorUseCaseAssociations.forEach(a => {
            if (!actorToAssociations[a.targetId]) actorToAssociations[a.targetId] = []
            // if actor is actually target, add reversed mapping (we cannot be sure which is actor; attempt both)
            const supportingFlag = (a as any).isSupportingActor ?? (a as any).isSupporting ?? false
            actorToAssociations[a.targetId].push({ targetUseCaseId: a.sourceId, supporting: supportingFlag })
        })

        // For each actor determine preferred system(s) and side
        const actorPositionsPlanned: { actorRef: ReferenceActor, side: "left" | "right" | "leftmost", y: number, systems: string[] }[] = []
        this.reference.actors.forEach(actorRef => {
            const associations = actorToAssociations[actorRef.elementId] ?? []
            if (associations.length === 0) {
                // place leftmost later
                actorPositionsPlanned.push({
                    actorRef, side: "leftmost", y: topMargin, systems: []
                })
            } else {
                // compute per-system votes
                const votesBySystem: { [ownerId: string]: { supporting: number, nonSupporting: number, ys: number[] } } = {}
                associations.forEach(a => {
                    const ucRef = this.reference.useCases.find(u => u.elementId === a.targetUseCaseId)
                    const owner = ucRef?.owner ?? ""
                    if (!votesBySystem[owner]) votesBySystem[owner] = { supporting: 0, nonSupporting: 0, ys: [] }
                    if (a.supporting) {
                        votesBySystem[owner].supporting++
                    } else {
                        votesBySystem[owner].nonSupporting++
                    }
                    // try to get y position if use case already placed
                    const placedId = this.idMap[a.targetUseCaseId]
                    if (placedId) votesBySystem[owner].ys.push(this.centerOf(placedId).y)
                })
                // choose system with most interactions
                let bestOwner = Object.keys(votesBySystem)[0]
                let bestCount = -1
                for (const ownerId of Object.keys(votesBySystem)) {
                    const count = votesBySystem[ownerId].supporting + votesBySystem[ownerId].nonSupporting
                    if (count > bestCount) { bestOwner = ownerId; bestCount = count }
                }
                const sysVotes = votesBySystem[bestOwner]
                const side = (sysVotes.supporting > sysVotes.nonSupporting) ? "right" : "left"
                // preferred y average of related usecases if available
                const avgY = sysVotes.ys.length > 0 ? Math.round(sysVotes.ys.reduce((s, v) => s + v, 0) / sysVotes.ys.length) : topMargin
                actorPositionsPlanned.push({
                    actorRef, side: side, y: avgY, systems: [bestOwner]
                })
            }
        })

        // For actors with side leftmost or side left/right we will place them in vertical stacks per system side
        // Build columns per system side (keyed by system index)
        const leftColumns: { x: number, entries: { actorRef: ReferenceActor, yPref: number }[] }[] = []
        const rightColumns: { x: number, entries: { actorRef: ReferenceActor, yPref: number }[] }[] = []

        // Determine x positions for columns near each system
        systemPositions.forEach((sysPos, idx) => {
            // left column x just left of system
            const leftX = Math.max(leftMargin, sysPos.x - actorW - 30)
            const rightX = sysPos.x + sysPos.width + 30
            leftColumns.push({ x: leftX, entries: [] })
            rightColumns.push({ x: rightX, entries: [] })
        })

        // If there are actors with side leftmost (no associations), create a leftmost column
        const globalLeftmostX = Math.max(20, leftMargin - actorW - 20)
        const leftmostColumn = { x: globalLeftmostX, entries: [] as { actorRef: ReferenceActor, yPref: number }[] }

        // Assign actors to closest system column or leftmost
        actorPositionsPlanned.forEach(plan => {
            if (plan.side === "leftmost") {
                leftmostColumn.entries.push({ actorRef: plan.actorRef, yPref: plan.y })
            } else {
                // try to attach to first preferred system if exists in systemPositions
                const owner = plan.systems[0] ?? ""
                const sysIndex = systemPositions.findIndex(s => s.ownerId === owner)
                if (sysIndex >= 0) {
                    if (plan.side === "left") leftColumns[sysIndex].entries.push({ actorRef: plan.actorRef, yPref: plan.y })
                    else rightColumns[sysIndex].entries.push({ actorRef: plan.actorRef, yPref: plan.y })
                } else {
                    // fallback to leftmost
                    leftmostColumn.entries.push({ actorRef: plan.actorRef, yPref: plan.y })
                }
            }
        })

        // Place leftmost actors (stacked)
        leftmostColumn.entries.sort((a, b) => a.yPref - b.yPref)
        leftmostColumn.entries.forEach((entry, i) => {
            const x = leftmostColumn.x
            const y = topMargin + i * (actorH + rowGap)
            this.addActor(entry.actorRef, x, y)
        })

        // Place per-system left/right actors, stacking and aligning near preferred y
        leftColumns.forEach((col, idx) => {
            col.entries.sort((a, b) => a.yPref - b.yPref)
            col.entries.forEach((entry, i) => {
                const x = col.x
                // align vertically near the system: compute a base from system center
                const sys = systemPositions[idx]
                const baseY = sys ? sys.y + sys.height / 2 : topMargin + i * (actorH + rowGap)
                const y = Math.max(topMargin, Math.round(baseY - (col.entries.length * (actorH + rowGap)) / 2 + i * (actorH + rowGap)))
                this.addActor(entry.actorRef, x, y)
            })
        })
        rightColumns.forEach((col, idx) => {
            col.entries.sort((a, b) => a.yPref - b.yPref)
            col.entries.forEach((entry, i) => {
                const x = col.x
                const sys = systemPositions[idx]
                const baseY = sys ? sys.y + sys.height / 2 : topMargin + i * (actorH + rowGap)
                const y = Math.max(topMargin, Math.round(baseY - (col.entries.length * (actorH + rowGap)) / 2 + i * (actorH + rowGap)))
                this.addActor(entry.actorRef, x, y)
            })
        })

        // For any use cases that belong to no system and were not placed (should be placed in placeholder), ensure they exist
        // (they were already added when ownerId === "" placeholder present)

        // Finally compute model size
        const elementsArr = Object.values(this.model.elements)
        if (elementsArr.length > 0) {
            const rightMost = Math.max(...elementsArr.map(e => e.bounds.x + e.bounds.width))
            const bottomMost = Math.max(...elementsArr.map(e => e.bounds.y + e.bounds.height))
            this.model.size.width = Math.max(totalAvailableWidth, rightMost + rightMargin)
            this.model.size.height = bottomMost + topMargin
        } else {
            this.model.size.width = totalAvailableWidth
            this.model.size.height = 600
        }
    }

    createUMLStructure() {
        try {
            // add elements and compute positions according to ownership rules
            this.createPositionsAndAddElements()

            // add relationships: actor-usecase associations
            this.reference.actorUseCaseAssociations.forEach((assoc, idx) => {
                // assoc.sourceId / targetId may be actor or usecase depending on creation; try to map both ways
                const aMapped = this.idMap[assoc.sourceId]
                const bMapped = this.idMap[assoc.targetId]
                if (aMapped && bMapped) {
                    const aType = this.model.elements[aMapped].type
                    const bType = this.model.elements[bMapped].type
                    if ((aType === UseCaseElementType.UseCaseActor || aType === UseCaseElementType.UseCaseExternalSystem) && bType === UseCaseElementType.UseCase) {
                        const isSupport = (assoc as any).isSupportingActor ?? (assoc as any).isSupporting ?? false
                        const type = isSupport ? UseCaseRelationshipType.UseCaseSupport : UseCaseRelationshipType.UseCaseAssociation
                        this.addAssociationBetween(aMapped, bMapped, type, idx)
                    } else if (aType === UseCaseElementType.UseCase && (bType === UseCaseElementType.UseCaseActor || bType === UseCaseElementType.UseCaseExternalSystem)) {
                        const isSupport = (assoc as any).isSupportingActor ?? (assoc as any).isSupporting ?? false
                        const type = isSupport ? UseCaseRelationshipType.UseCaseSupport : UseCaseRelationshipType.UseCaseAssociation
                        this.addAssociationBetween(bMapped, aMapped, type, idx)
                    } else {
                        // fallback: connect whatever they map to
                        this.addAssociationBetween(aMapped, bMapped, UseCaseRelationshipType.UseCaseAssociation, idx)
                    }
                } else if (aMapped && !bMapped) {
                    // try reverse mapping
                    const tryId = this.idMap[assoc.targetId] || this.idMap[assoc.sourceId]
                    if (tryId) this.addAssociationBetween(aMapped, tryId, UseCaseRelationshipType.UseCaseAssociation, idx)
                }
            })

            // actor generalizations
            this.reference.actorAssociations.forEach((assoc, idx) => {
                const aId = this.idMap[assoc.sourceId]
                const bId = this.idMap[assoc.targetId]
                if (aId && bId) {
                    this.addAssociationBetween(aId, bId, UseCaseRelationshipType.UseCaseGeneralization, 1000 + idx)
                }
            })

            // use case include/extend
            this.reference.useCaseAssociations.forEach((assoc, idx) => {
                const aId = this.idMap[assoc.sourceId]
                const bId = this.idMap[assoc.targetId]
                if (aId && bId) {
                    const type = (assoc as any).isExtend ? UseCaseRelationshipType.UseCaseExtend : UseCaseRelationshipType.UseCaseInclude
                    this.addAssociationBetween(aId, bId, type, 2000 + idx)
                }
            })
        } catch (error) {
            console.error(error)
        }
        return this.model
    }
}

export default UseCaseDiagramStructureBuilderFromReference