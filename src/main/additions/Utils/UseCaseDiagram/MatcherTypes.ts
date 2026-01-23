import { UMLModel } from "../../.."
import { UseCaseElementType } from "../../../packages/uml-use-case-diagram"
import { UMLUseCaseSystem } from "../../../packages/uml-use-case-diagram/uml-use-case-system/uml-use-case-system"
import { UMLUseCase } from "../../../packages/uml-use-case-diagram/uml-use-case/uml-use-case"

export class ReferenceActor {
    name: string = ""
    synonyms: string[] = []
    elementId!: string
    message: string = ""
}

export class ReferenceUseCase {
    name: string = ""
    synonyms: string[] = []
    elementId!: string
    message: string = ""
    owner!: string
}

export class ReferenceSystem {
    name: string = ""
    synonyms: string[] = []
    elementId!: string
    message: string = ""
    isExternal: boolean = false
}

export class ElementPair {
    sourceId!: string
    targetId!: string
}

export class ReferenceActorUseCaseAssociation extends ElementPair {
    message: string = ""
    isSupportingActor: boolean = false
}

export class ReferenceActorAssociation extends ElementPair {
    message: string = ""
}

export class ReferenceUseCaseAssociation extends ElementPair {
    message: string = ""
    isExtend: boolean = false
}

export class UseCaseDiagramReferenceSolution {
    actors: ReferenceActor[] = []
    useCases: ReferenceUseCase[] = []
    systems: ReferenceSystem[] = []
    actorUseCaseAssociations: ReferenceActorUseCaseAssociation[] = []
    actorAssociations: ReferenceActorAssociation[] = []
    useCaseAssociations: ReferenceUseCaseAssociation[] = []
    forbiddenActors: string[] = []
    forbiddenUseCases: string[] = []
    forbiddenSystems: string[] = []
    forbiddenActorUseCaseAssociations: ReferenceActorUseCaseAssociation[] = []
    forbiddenActorAssociations: ReferenceActorAssociation[] = []
    forbiddenUseCaseAssociations: ReferenceUseCaseAssociation[] = []
}

export class UseCaseDiagramReferenceBuilder {
    referenceSolution: UseCaseDiagramReferenceSolution
    model: UMLModel

    constructor(model: UMLModel) {
        this.model = model
        this.referenceSolution = new UseCaseDiagramReferenceSolution()
    }

    createReferenceActor(element: UMLUseCase): ReferenceActor {
        let refAct = new ReferenceActor()
        refAct.name = element.name
        refAct.elementId = element.id
        return refAct
    }

    createReferenceUseCase(element: UMLUseCase): ReferenceUseCase {
        let refUC = new ReferenceUseCase()
        refUC.name = element.name
        refUC.elementId = element.id
        refUC.owner = element.owner ?? ""
        return refUC
    }

    createReferenceSystem(element: UMLUseCaseSystem, isExternal: boolean): ReferenceSystem {
        let refSys = new ReferenceSystem()
        refSys.name = element.name
        refSys.elementId = element.id
        refSys.isExternal = isExternal
        return refSys
    }

    createReferenceActorUseCaseAssociation(sourceId: string, targetId: string, isSupportingActor: boolean): ReferenceActorUseCaseAssociation {
        let refAUC = new ReferenceActorUseCaseAssociation()
        refAUC.sourceId = sourceId
        refAUC.targetId = targetId
        refAUC.isSupportingActor = isSupportingActor
        return refAUC
    }

    createReferenceActorAssociation(sourceId: string, targetId: string): ReferenceActorAssociation {
        let refAA = new ReferenceActorAssociation()
        refAA.sourceId = sourceId
        refAA.targetId = targetId
        return refAA
    }

    createReferenceUseCaseAssociation(sourceId: string, targetId: string, isExtend: boolean): ReferenceUseCaseAssociation {
        let refUCA = new ReferenceUseCaseAssociation()
        refUCA.sourceId = sourceId
        refUCA.targetId = targetId
        refUCA.isExtend = isExtend
        return refUCA
    }

    buildReference(): UseCaseDiagramReferenceSolution {
        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId]
            if (element.type === UseCaseElementType.UseCaseActor) {
                this.referenceSolution.actors.push(this.createReferenceActor(element as UMLUseCase))
            }
            if (element.type === UseCaseElementType.UseCase) {
                this.referenceSolution.useCases.push(this.createReferenceUseCase(element as UMLUseCase))
            }
            if (element.type === UseCaseElementType.UseCaseSystem) {
                this.referenceSolution.systems.push(this.createReferenceSystem(element as UMLUseCaseSystem, false))
            }
            if (element.type === UseCaseElementType.UseCaseExternalSystem) {
                this.referenceSolution.systems.push(this.createReferenceSystem(element as UMLUseCaseSystem, true))
            }
        })
        Object.keys(this.model.relationships).forEach((relationshipId) => {
            let rel = this.model.relationships[relationshipId]
            if (rel.type === "UseCaseAssociation") {
                let source = this.model.elements[rel.source.element]
                let target = this.model.elements[rel.target.element]
                if (source && target) {
                    if (target.type === UseCaseElementType.UseCase) {
                        this.referenceSolution.actorUseCaseAssociations.push(this.createReferenceActorUseCaseAssociation(source.id, target.id, false))
                    } else {
                        this.referenceSolution.actorUseCaseAssociations.push(this.createReferenceActorUseCaseAssociation(target.id, source.id, false))
                    }
                }
            }
            if (rel.type === "UseCaseGeneralization") {
                this.referenceSolution.actorAssociations.push(this.createReferenceActorAssociation(rel.source.element, rel.target.element))
            }
            if (rel.type === "UseCaseExtend") {
                this.referenceSolution.useCaseAssociations.push(this.createReferenceUseCaseAssociation(rel.source.element, rel.target.element, true))
            }
            if (rel.type === "UseCaseInclude") {
                this.referenceSolution.useCaseAssociations.push(this.createReferenceUseCaseAssociation(rel.source.element, rel.target.element, false))
            }
            if (rel.type === "UseCaseSupport") {
                let source = this.model.elements[rel.source.element]
                let target = this.model.elements[rel.target.element]
                if (source && target) {
                    if (target.type === UseCaseElementType.UseCase) {
                        this.referenceSolution.actorUseCaseAssociations.push(this.createReferenceActorUseCaseAssociation(source.id, target.id, true))
                    } else {
                        this.referenceSolution.actorUseCaseAssociations.push(this.createReferenceActorUseCaseAssociation(target.id, source.id, true))
                    }
                }
            }
        })
        return this.referenceSolution
    }

    updateReference(oldReference: UseCaseDiagramReferenceSolution): UseCaseDiagramReferenceSolution {
        // copy forbidden lists if present
        this.referenceSolution.forbiddenActors = oldReference.forbiddenActors || []
        this.referenceSolution.forbiddenUseCases = oldReference.forbiddenUseCases || []
        this.referenceSolution.forbiddenSystems = oldReference.forbiddenSystems || []
        this.referenceSolution.forbiddenActorUseCaseAssociations = oldReference.forbiddenActorUseCaseAssociations || []
        this.referenceSolution.forbiddenActorAssociations = oldReference.forbiddenActorAssociations || []
        this.referenceSolution.forbiddenUseCaseAssociations = oldReference.forbiddenUseCaseAssociations || []

        // restore actor-level metadata
        this.referenceSolution.actors.forEach((refAct) => {
            const oldAct = (oldReference.actors || []).find((a) => a.name === refAct.name)
            if (oldAct) {
                refAct.synonyms = oldAct.synonyms || []
                refAct.message = oldAct.message || ""
                // keep elementId from newly built reference (do not override), but if missing take old
                refAct.elementId = refAct.elementId || oldAct.elementId
            }
        })

        // restore use case-level metadata
        this.referenceSolution.useCases.forEach((refUC) => {
            const oldUC = (oldReference.useCases || []).find((u) => u.name === refUC.name)
            if (oldUC) {
                refUC.synonyms = oldUC.synonyms || []
                refUC.message = oldUC.message || ""
                refUC.owner = refUC.owner || oldUC.owner || ""
                refUC.elementId = refUC.elementId || oldUC.elementId
            }
        })

        // restore system-level metadata
        this.referenceSolution.systems.forEach((refSys) => {
            const oldSys = (oldReference.systems || []).find((s) => s.name === refSys.name)
            if (oldSys) {
                refSys.synonyms = oldSys.synonyms || []
                refSys.message = oldSys.message || ""
                // preserve isExternal as determined by model, but fallback to old if missing
                refSys.isExternal = typeof refSys.isExternal === 'boolean' ? refSys.isExternal : !!oldSys.isExternal
                refSys.elementId = refSys.elementId || oldSys.elementId
            }
        })

        // restore associations metadata
        this.referenceSolution.actorUseCaseAssociations.forEach((refAuc) => {
            const oldAuc = (oldReference.actorUseCaseAssociations || []).find((a) => a.sourceId === refAuc.sourceId && a.targetId === refAuc.targetId)
            if (oldAuc) {
                refAuc.message = oldAuc.message || ""
                refAuc.isSupportingActor = !!oldAuc.isSupportingActor
            }
        })

        this.referenceSolution.actorAssociations.forEach((refAa) => {
            const oldAa = (oldReference.actorAssociations || []).find((a) => a.sourceId === refAa.sourceId && a.targetId === refAa.targetId)
            if (oldAa) {
                refAa.message = oldAa.message || ""
            }
        })

        this.referenceSolution.useCaseAssociations.forEach((refUca) => {
            const oldUca = (oldReference.useCaseAssociations || []).find((a) => a.sourceId === refUca.sourceId && a.targetId === refUca.targetId)
            if (oldUca) {
                refUca.message = oldUca.message || ""
                refUca.isExtend = !!oldUca.isExtend
            }
        })

        return this.referenceSolution
    }
}