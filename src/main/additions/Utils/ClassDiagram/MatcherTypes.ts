export type Weight = "STRONG" | "MEDIUM" | "WEAK" | "NONE"
export type AssociationType = "Default" | "Inheritance"
import { UMLModel } from "../../.."
import { UMLCustomAssociation, UMLCustomClass } from "./StructureBuilder"
import { ClassElementType } from "../../../packages/uml-class-diagram"

export class ReferenceClass {
    name: string = ""
    synonyms: string[] = []
    weight: Weight = "STRONG"
    message: string = ""
    forbiddenAttributes: string[] = []
    attributes: ReferenceAttribute[] = []
    elementId!: string
    type: string = ClassElementType.Class
}

export class ReferenceAttribute {
    name: string = ""
    synonyms: string[] = []
    types: string[] = []
    weight: Weight = "STRONG"
    message: string = ""
    elementId!: string
    allowsForeignKeyName: boolean = false
}

export class ReferenceAssociation {
    source!: ReferenceClassInAssociation
    target!: ReferenceClassInAssociation
    message: string = ""
    name: string = ""
    synonyms: string[] = []
    weight: Weight = "STRONG"
    type: string = ""
    elementId!: string
}

export class ReferenceClassInAssociation {
    referenceClass!: ReferenceClass
    role: string = ""
    multiplicities: string[] = []
}


export class ClassDiagramReferenceSolution {
    classes: ReferenceClass[] = []
    associations: ReferenceAssociation[] = []
    forbiddenClasses: string[] = []
    forbiddenAssociations: { source: string, target: string }[] = []
}

export class ClassDiagramReferenceBuilder {
    referenceSolution: ClassDiagramReferenceSolution
    model: UMLModel

    constructor(model: UMLModel) {
        this.model = model
        this.referenceSolution = new ClassDiagramReferenceSolution()
    }

    createReferenceClass(element: UMLCustomClass): ReferenceClass {
        let refCl = new ReferenceClass()
        refCl.name = element.name
        refCl.type = element.type
        Object.keys(this.model.elements).forEach((elementId) => {
            let element2 = this.model.elements[elementId]
            if (element2.type === "ClassAttribute" && element2.owner === element.id) {
                let refAttr = new ReferenceAttribute()
                refAttr.name = element2.name.split(":")[0].trim()
                if (element2.name.includes(":")) {
                    refAttr.types.push(element2.name.split(":")[1].trim())
                }
                refCl.attributes.push(refAttr)
            }
        })
        refCl.elementId = element.id
        return refCl
    }

    createReferenceAssociation(rel: UMLCustomAssociation): ReferenceAssociation | null {
        let source = Object.keys(this.model.elements).find((elementId) => this.model.elements[elementId].id === rel.source.element)
        let target = Object.keys(this.model.elements).find((elementId) => this.model.elements[elementId].id === rel.target.element)
        if (source && target) {
            let refSource = new ReferenceClassInAssociation()
            let refTarget = new ReferenceClassInAssociation()
            let refSourceClass = this.referenceSolution.classes.find((cl) => cl.name === this.model.elements[source].name)
            if (!refSourceClass) return null
            refSource.referenceClass = refSourceClass
            let refTargetClass = this.referenceSolution.classes.find((cl) => cl.name === this.model.elements[target].name)
            if (!refTargetClass) return null
            refTarget.referenceClass = refTargetClass
            refSource.role = rel.source.role
            refTarget.role = rel.target.role
            refSource.multiplicities = [rel.source.multiplicity]
            refTarget.multiplicities = [rel.target.multiplicity]
            let refAssoc = new ReferenceAssociation()
            refAssoc.source = refSource
            refAssoc.target = refTarget
            refAssoc.type = rel.type //=== "ClassInheritance" ? "Inheritance" : rel.type === "ClassAggregation" ? "Aggregation" : rel.type === "ClassComposition" ? "Composition" : "Default"
            refAssoc.elementId = rel.id
            return refAssoc
        }
        return null
    }


    buildReference(): ClassDiagramReferenceSolution {
        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId]
            if (element.type === "Class" ||
                element.type === "AbstractClass" ||
                element.type === "Interface" ||
                element.type === "Enumeration" ||
                element.type === "IntermediateClass"
            ) {
                this.referenceSolution.classes.push(this.createReferenceClass(element as UMLCustomClass))
            }
        })
        Object.keys(this.model.relationships).forEach((relId) => {
            let rel = this.model.relationships[relId] as UMLCustomAssociation
            let refAssoc = this.createReferenceAssociation(rel)
            if (refAssoc) { this.referenceSolution.associations.push(refAssoc) }

        })
        return this.referenceSolution
    }

    updateReference(oldReference: ClassDiagramReferenceSolution): ClassDiagramReferenceSolution {
        this.referenceSolution.classes.forEach((refClass) => {
            let oldClass = oldReference.classes.find((cl) => cl.name === refClass.name)
            if (oldClass) {
                refClass.synonyms = oldClass.synonyms
                refClass.forbiddenAttributes = oldClass.forbiddenAttributes
                refClass.weight = oldClass.weight
                refClass.message = oldClass.message
                refClass.attributes.forEach((attr) => {
                    let oldAttr = oldClass.attributes.find((a) => a.name === attr.name)
                    if (oldAttr) {
                        attr.synonyms = oldAttr.synonyms
                        attr.types = oldAttr.types
                        attr.weight = oldAttr.weight
                        attr.message = oldAttr.message
                        attr.allowsForeignKeyName = oldAttr.allowsForeignKeyName
                    }
                })
            }
        })
        this.referenceSolution.associations.forEach((refAssoc) => {
            let oldAssoc = oldReference.associations.find((assoc) => assoc.source.referenceClass.name === refAssoc.source.referenceClass.name &&
                assoc.target.referenceClass.name === refAssoc.target.referenceClass.name)
            if (oldAssoc) {
                refAssoc.synonyms = oldAssoc.synonyms
                refAssoc.weight = oldAssoc.weight
                refAssoc.message = oldAssoc.message
                refAssoc.type = oldAssoc.type
            }
        })
        return this.referenceSolution
    }
}