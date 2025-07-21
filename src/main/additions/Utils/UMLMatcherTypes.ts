export type Weight = "STRONG" | "MEDIUM" | "WEAK" | "NONE"
export type AssociationType = "Default" | "Inheritance"
import { UMLModel } from "../.."
import { UMLCustomAssociation, UMLCustomClass } from "./UMLStructureBuilder"
import { ClassElementType } from "../../packages/uml-class-diagram"

export class ReferenceClass {
    name: string = ""
    synonyms: string[] = []
    weight: Weight = "STRONG"
    message: string = ""
    forbiddenAttributes: string[] = []
    attributes: ReferenceAttribute[] = []
    elementId: string
    type: string = ClassElementType.Class
}

export class ReferenceAttribute {
    name: string = ""
    synonyms: string[] = []
    types: string[] = []
    weight: Weight = "STRONG"
    message: string = ""
    elementId: string
    allowsForeignKeyName: boolean = false
}

export class ReferenceAssociation {
    source: ReferenceClassInAssociation
    target: ReferenceClassInAssociation
    message: string = ""
    name: string = ""
    synonyms: string[] = []
    weight: Weight = "STRONG"
    type: string = ""
    elementId: string
}

export class ReferenceClassInAssociation {
    referenceClass: ReferenceClass
    role: string = ""
    multiplicities: string[] = []
}

export class ReferenceEnumeration {
    name: string = ""
    synonyms: string[] = []
    weight: Weight = "STRONG"
    message: string = ""
    literals: ReferenceAttribute[] = []
    elementId: string
}

export class EnumerationAssociation {
    enumeration: ReferenceEnumeration
    class: ReferenceClass
    elementId: string
}

export class ReferenceSolution {
    classes: ReferenceClass[] = []
    associations: ReferenceAssociation[] = []
    enumerations: ReferenceEnumeration[] = []
    enumerationAssociations: EnumerationAssociation[] = []
    forbiddenClasses: string[] = []
    forbiddenAssociations: { source: string, target: string }[] = []
}

export class ReferenceBuilder {
    referenceSolution: ReferenceSolution
    model: UMLModel

    constructor(model: UMLModel) {
        this.model = model
        this.referenceSolution = new ReferenceSolution()
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
            refAssoc.type = rel.type === "ClassInheritance" ? "Inheritance" : "Default"
            refAssoc.elementId = rel.id
            return refAssoc
        }
        return null
    }

    createEnumerationAssociation(rel: UMLCustomAssociation): EnumerationAssociation | null {
        let source = Object.keys(this.model.elements).find((elementId) => this.model.elements[elementId].id === rel.source.element)
        let target = Object.keys(this.model.elements).find((elementId) => this.model.elements[elementId].id === rel.target.element)
        if (source && target) {
            let refEnum = this.referenceSolution.enumerations.find((en) => en.name === this.model.elements[source].name)
            if (!refEnum) refEnum = this.referenceSolution.enumerations.find((en) => en.name === this.model.elements[target].name)
            if (!refEnum) return null
            let refClass = this.referenceSolution.classes.find((cl) => cl.name === this.model.elements[source].name)
            if (!refClass) refClass = this.referenceSolution.classes.find((cl) => cl.name === this.model.elements[target].name)
            if (!refClass) return null
            let enumAssoc = new EnumerationAssociation()
            enumAssoc.class = refClass
            enumAssoc.enumeration = refEnum
            enumAssoc.elementId = rel.id
            return enumAssoc
        }
        return null
    }

    createReferenceEnumeration(element: UMLCustomClass): ReferenceEnumeration {
        let refEnum = new ReferenceEnumeration()
        refEnum.name = element.name
        Object.keys(this.model.elements).forEach((elementId) => {
            let element2 = this.model.elements[elementId]
            if (element2.type === "ClassAttribute" && element2.owner === element.id) {
                let refLit = new ReferenceAttribute()
                refLit.name = element2.name
                refEnum.literals.push(refLit)
            }
        })
        refEnum.elementId = element.id
        return refEnum
    }

    buildReference(): ReferenceSolution {
        console.log(typeof this.model)
        Object.keys(this.model.elements).forEach((elementId) => {
            let element = this.model.elements[elementId]
            if (element.type === "Class" ||
                element.type === "AbstractClass" ||
                element.type === "Interface" ||
                element.type === "Enumeration" ||
                element.type === "IntermediateClass"
            ) {
                this.referenceSolution.classes.push(this.createReferenceClass(element as UMLCustomClass))
            } /*else if (element.type === "Enumeration") {
                this.referenceSolution.enumerations.push(this.createReferenceEnumeration(element as UMLCustomClass))
            }*/
        })
        Object.keys(this.model.relationships).forEach((relId) => {
            let rel = this.model.relationships[relId] as UMLCustomAssociation
            let refAssoc = this.createReferenceAssociation(rel)
            if (refAssoc) { this.referenceSolution.associations.push(refAssoc) }
            else {
                let refEnumAssoc = this.createEnumerationAssociation(rel)
                if (refEnumAssoc) this.referenceSolution.enumerationAssociations.push(refEnumAssoc)
            }
        })
        return this.referenceSolution
    }
}