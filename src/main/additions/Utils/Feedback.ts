export const colorClassDiagram = (model: any, syntaxErrors: any[], semanticErrors: any[], results: any) => {
    syntaxErrors.filter((error: any) => error.type === "missingClassName").forEach((error: any) => {
        let element = model.elements[error.element.elementId]
        element.textColor = "var(--mantine-color-orange-7)"
        element.strokeColor = "var(--mantine-color-orange-7)"
    })
    syntaxErrors.filter((error: any) => error.type === "duplicateClassName" ||
        error.type === "unconnectedClass" ||
        error.type === "invalidIntermediateClassConnections").forEach((error: any) => {
            let element = model.elements[error.element.elementId]
            element.fillColor = "var(--mantine-color-orange-1)"
        })
    syntaxErrors.filter((error: any) => error.type === "missingAttributeName" ||
        error.type === "duplicateAttributeName" ||
        error.type === "missingAttributeType" ||
        error.type === "foreignKeyReference" ||
        error.type === "invalidAttributeType" ||
        error.type === "enumerationTypeWithAttributes" ||
        error.type === "classAsAttributeType" ||
        error.type === "unconnectedEnumeration").forEach((error: any) => {
            let element = model.elements[error.attribute.elementId]
            element.fillColor = "var(--mantine-color-orange-1)"
        })
    syntaxErrors.filter((error: any) => error.type === "missingAssociationName" ||
        error.type === "missingAssociationMultiplicity" ||
        error.type === "invalidAssociationMultiplicity" ||
        error.type === "missingRecursiveAssociationRole").forEach((error: any) => {
            let element = model.relationships[error.association.elementId]
            element.strokeColor = "var(--mantine-color-orange-7)"
            element.textColor = "var(--mantine-color-orange-7)"
        })
    semanticErrors.filter((error: any) => error.type === "associationName" ||
        error.type === "associationMultiplicity" ||
        error.type === "associationType" ||
        error.type === "forbiddenAssociation").forEach((error: any) => {
            let element = model.relationships[error.elementId]
            element.strokeColor = "var(--mantine-color-red-5)"
            element.textColor = "var(--mantine-color-red-5)"
        })
    semanticErrors.filter((error: any) => error.type === "attributeType").forEach((error: any) => {
        let element = model.elements[error.id]
        element.textColor = "var(--mantine-color-red-5)"
    })
    semanticErrors.filter((error: any) => error.type === "forbiddenClass").forEach((error: any) => {
        let element = model.elements[error.id]
        element.textColor = "var(--mantine-color-red-5)"
        element.strokeColor = "var(--mantine-color-red-5)"
    })
    semanticErrors.filter((error: any) => error.type === "classType").forEach((error: any) => {
        let element = model.elements[error.id]
        element.fillColor = "var(--mantine-color-red-5)"
    })
    semanticErrors.filter((error: any) => error.type === "forbiddenAttribute").forEach((error: any) => {
        let element = model.elements[error.id]
        element.textColor = "var(--mantine-color-red-5)"
        element.strokeColor = "var(--mantine-color-red-5)"
    })
    results.matchingClasses.forEach((match: any) => {
        let id = match.diagramClass.elementId
        let element = model.elements[id]
        element.strokeColor = "var(--mantine-color-green-5)";
        element.textColor = "var(--mantine-color-green-5)";
        match.matchingAttributes.forEach((attr: any) => {
            let attrId = attr.diagramAttribute.elementId
            let attrElement = model.elements[attrId]
            attrElement.fillColor = "var(--mantine-color-green-1)"
        })
    })
    results.matchingAssociations.forEach((match: any) => {
        let id = match.diagramAssociation.id
        let element = model.relationships[id]
        element.strokeColor = "var(--mantine-color-green-5)";
        element.textColor = "var(--mantine-color-green-5)";
    })
    return model
}

export const resetColorsClassDiagram = (model: any) => {
    Object.keys(model.elements).forEach((key) => {
        let element = model.elements[key]
        element.strokeColor = "#000000"
        element.textColor = "#000000"
        element.type === "UseCaseActor" ? element.fillColor = "undefined" : element.fillColor = "#FFFFFF"
    })
    Object.keys(model.relationships).forEach((key) => {
        let element = model.relationships[key]
        element.strokeColor = "#000000"
        element.textColor = "#000000"
    })
    return model
}