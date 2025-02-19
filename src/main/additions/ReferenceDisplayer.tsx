import React, { useEffect, useState } from "react";
import { Card, ListGroup, Badge, Button, Form, Alert, Row, Col, ButtonGroup } from "react-bootstrap";
import { ReferenceSolution, ReferenceClass, Weight, ReferenceAttribute, ReferenceEnumeration, ReferenceAssociation, EnumerationAssociation } from "../operations/UMLMatcherTypes";

function DividerLine() {
    return (
        <hr style={{ border: 0, borderTop: "1px solid blue", boxSizing: "content-box", height: "0", marginTop: "0.75em", marginBottom: "0.75em", overflow: "visible" }} />
    )
}

function ListEditor(props: { onSave: () => void, mode: string, list: string[], onListChange: (newList: string[]) => void }) {
    const [list, setList] = useState(props.list);

    useEffect(() => {
        setList(props.list);
    }, [props.list]);

    const handleEdit = (index: number, newValue: string) => {
        const newList = [...list];
        newList[index] = newValue;
        setList(newList);
        props.onListChange(newList);
    };

    const handleAdd = () => {
        const newList = [...list, ""];
        setList(newList);
        props.onListChange(newList);
    };

    const handleRemove = (index: number) => {
        if (props.mode === "attributeTypes" && list.length === 1) {
            return; // Prevent removing the last element if mode is "attributeTypes"
        }
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
        props.onListChange(newList);
    };

    return (
        <div>
            {props.mode === "forbiddenAttributes" && <h6>Forbidden Attributes</h6>}
            {props.mode === "synonyms" && <h6>Synonyms</h6>}
            {props.mode === "attributeTypes" && <h6>Attribute Types</h6>}
            {props.mode === "multiplicities" && <h6>Association Multiplicities</h6>}
            {list.map((item, index) => (
                <Row key={index} className="mb-2">
                    <Col xs="auto">
                        <Form.Control
                            type="text"
                            value={item}
                            onChange={(e) => handleEdit(index, e.target.value)}
                        />
                    </Col>
                    <Col xs="auto">
                        <Button className="red" onClick={() => handleRemove(index)} disabled={props.mode === "attributeTypes" && list.length === 1}>
                            <i className="bi bi-x-circle-fill"></i>
                        </Button>
                    </Col>
                </Row>
            ))}
            <Button className="green" onClick={handleAdd}><i className="bi bi-plus-circle-fill"></i></Button>
        </div>
    );
}

function AttributeDisplayer(props: any) {
    const [name, setName] = useState(props.attr.name)
    const [weight, setWeight] = useState(props.attr.weight)
    const [message, setMessage] = useState(props.attr.message)
    const [types, setTypes] = useState(props.attr.types)
    const [synonyms, setSynonyms] = useState(props.attr.synonyms)
    const [isEnum, setIsEnum] = useState(props.isEnum)
    const [editing, setEditing] = useState("")

    useEffect(() => {
        setName(props.attr.name)
        setWeight(props.attr.weight)
        setMessage(props.attr.message)
        setTypes(props.attr.types)
        setSynonyms(props.attr.synonyms)
        setIsEnum(props.isEnum)
    }, [props])

    const save = () => {
        if (props.isEnum) {
            const updatedEnums = props.reference.enumerations.map((enumeration: ReferenceEnumeration) => {
                if (enumeration.name === props.owner.name) {
                    let updatedLits = enumeration.literals.map((lit: ReferenceAttribute) => {
                        if (lit.name === props.attr.name) return { ...lit, name, weight, message, types, synonyms }
                        else return lit
                    }) as unknown as ReferenceAttribute[]
                    enumeration.literals = updatedLits
                    return enumeration
                } else {
                    return enumeration
                }
            })
            props.setReference({ ...props.reference, enumerations: updatedEnums })
            props.setCurrentAttribute(null)
        } else {
            const updatedClasses = props.reference.classes.map((cls: ReferenceClass) => {
                if (cls.name === props.owner.name) {
                    let updatedAttrs = cls.attributes.map((attr: ReferenceAttribute) => {
                        if (attr.name === props.attr.name) return { ...attr, name, weight, message, types, synonyms }
                        else return attr
                    })
                    cls.attributes = updatedAttrs
                    return cls
                } else {
                    return cls
                }
            })
            props.setReference({ ...props.reference, classes: updatedClasses })
            props.setCurrentAttribute(null)
        }
    }

    const deleteAttr = () => {
        if (isEnum) {
            const updatedEnums = props.reference.enumerations.map((enumeration: ReferenceEnumeration) => {
                if (enumeration.name === props.owner.name) {
                    let updatedLits = enumeration.literals.filter((lit: ReferenceAttribute) => lit.name !== props.attr.name)
                    enumeration.literals = updatedLits
                    return enumeration
                } else {
                    return enumeration
                }
            })
            props.setReference({ ...props.reference, enumerations: updatedEnums })
            props.setCurrentAttribute(null)
        } else {
            const updatedClasses = props.reference.classes.map((cls: ReferenceClass) => {
                if (cls.name === props.owner.name) {
                    let updatedAttrs = cls.attributes.filter((attr: ReferenceAttribute) => attr.name !== props.attr.name)
                    cls.attributes = updatedAttrs
                    return cls
                } else {
                    return cls
                }
            })
            props.setReference({ ...props.reference, classes: updatedClasses })
            props.setCurrentAttribute(null)
        }
    }

    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="orange">
                    <Card.Title>{name}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col xs={6}>
                                <Form.Label>Attribute Name</Form.Label>
                                <Form.Control type="text" value={name} onChange={(ev) => { setName(ev.target.value) }} />
                            </Col>
                            <Col xs={6}>
                                <Form.Label>Weight</Form.Label>
                                <Form.Control as="select" value={weight} onChange={(ev) => { setWeight(ev.target.value) }}>
                                    <option value="STRONG">Strong</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="WEAK">Weak</option>
                                </Form.Control>
                            </Col>
                        </Row>
                        <DividerLine />
                        <Row>
                            <Col>
                                <Form.Label>Custom Feedback Message</Form.Label>
                                <Form.Control as="textarea" value={message} onChange={(ev) => { setMessage(ev.target.value) }} />
                            </Col>
                        </Row>
                        <DividerLine />
                        {!isEnum && <> <Row className='mt-2 justify-content-center' style={{ textAlign: "center" }}>
                            <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                                <Button className="blue" onClick={() => { setEditing("attributeTypes") }}>Types</Button>
                                <Button className="green" onClick={() => { setEditing("synonyms") }}>Synonyms</Button>
                            </ButtonGroup>
                        </Row>
                            <DividerLine />
                            {editing === "attributeTypes" &&
                                <ListEditor mode={editing} list={types} onListChange={setTypes} onSave={() => { }} />}
                            {editing === "synonyms" &&
                                <ListEditor mode={editing} list={synonyms} onListChange={setSynonyms} onSave={() => { }} />}
                        </>
                        }
                    </Form>
                    {isEnum && <ListEditor mode={"synonyms"} list={synonyms} onListChange={setSynonyms} onSave={() => { }} />}
                </Card.Body>
                <Card.Footer>
                    <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                        <Button onClick={() => save()} className="green"><i className="bi bi-check-circle-fill" > Save changes</i></Button>
                        <Button onClick={() => deleteAttr()} className="red"><i className="bi bi-x-circle-fill"> Delete {!isEnum ? "attribute" : "literal"}</i></Button>
                    </ButtonGroup>
                </Card.Footer>
            </Card>
        </>
    )
}

function ClassDisplayer(props: any) {
    const [name, setName] = useState(props.cls.name)
    const [weight, setWeight] = useState(props.cls.weight)
    const [message, setMessage] = useState(props.cls.message)
    const [forbiddenAttributes, setForbiddenAttributes] = useState(props.cls.forbiddenAttributes)
    const [synonyms, setSynonyms] = useState(props.cls.synonyms)
    const [editing, setEditing] = useState("")

    useEffect(() => {
        setName(props.cls.name)
        setWeight(props.cls.weight)
        setMessage(props.cls.message)
        setForbiddenAttributes(props.cls.forbiddenAttributes)
        setSynonyms(props.cls.synonyms)
        setEditing("")
    }, [props])

    const save = () => {
        let updatedClasses = props.reference.classes.map((cls: ReferenceClass) =>
            cls.name === props.cls.name ? { ...cls, name, weight, message, forbiddenAttributes, synonyms } : cls
        )
        props.setReference({ ...props.reference, classes: updatedClasses })
        props.setMode("")
        props.setCurrentClass(null)
    }

    const deleteClass = () => {
        let updatedClasses = props.reference.classes.filter((cls: ReferenceClass) => cls.name !== props.cls.name)
        props.setReference({ ...props.reference, classes: updatedClasses })
        props.setMode("")
        props.setCurrentClass(null)
    }

    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="green">
                    <Card.Title>{name}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col xs={6}>
                                <Form.Label>Class Name</Form.Label>
                                <Form.Control type="text" value={name} onChange={(ev) => { setName(ev.target.value) }} />
                            </Col>
                            <Col xs={6}>
                                <Form.Label>Weight</Form.Label>
                                <Form.Control as="select" value={weight} onChange={(ev) => { setWeight(ev.target.value) }}>
                                    <option value="STRONG">Strong</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="WEAK">Weak</option>
                                </Form.Control>
                            </Col>
                        </Row>
                        <DividerLine />
                        <Row>
                            <Col>
                                <Form.Label>Custom Feedback Message</Form.Label>
                                <Form.Control as="textarea" value={message} onChange={(ev) => { setMessage(ev.target.value) }} />
                            </Col>
                        </Row>
                        <DividerLine />
                        <Row className='mt-2 justify-content-center' style={{ textAlign: "center" }}>
                            <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                                <Button className="red" onClick={() => { setEditing("forbiddenAttributes") }} >Forbidden Attributes</Button>
                                <Button className="green" onClick={() => { setEditing("synonyms") }}>Synonyms</Button>
                            </ButtonGroup>
                        </Row>
                    </Form>
                    <DividerLine />
                    {editing === "forbiddenAttributes" && <>
                        <ListEditor mode={editing} list={forbiddenAttributes} onListChange={setForbiddenAttributes} onSave={() => { }} />
                        <DividerLine />
                    </>}
                    {editing === "synonyms" && <>
                        <ListEditor mode={editing} list={synonyms} onListChange={setSynonyms} onSave={() => { }} />
                        <DividerLine />
                    </>}
                </Card.Body>
                <Card.Footer>
                    <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                        <Button className="green" onClick={() => save()}><i className="bi bi-check-circle-fill" > Save changes</i></Button>
                        <Button className="red" onClick={() => deleteClass()}><i className="bi bi-x-circle-fill"> Delete class</i></Button>
                    </ButtonGroup>
                </Card.Footer>
            </Card>
        </>
    )
}

function EnumDisplayer(props: any) {
    const [name, setName] = useState(props.enum.name)
    const [weight, setWeight] = useState(props.enum.weight)
    const [message, setMessage] = useState(props.enum.message)
    const [synonyms, setSynonyms] = useState(props.enum.synonyms)

    useEffect(() => {
        setName(props.enum.name)
        setWeight(props.enum.weight)
        setMessage(props.enum.message)
        setSynonyms(props.enum.synonyms)
    }, [props])

    const save = () => {
        const updatedEnumerations = props.reference.enumerations.map((enumeration: ReferenceEnumeration) =>
            enumeration.name === props.enum.name ? { ...enumeration, name, weight, message, synonyms } : enumeration
        );
        props.setReference({ ...props.reference, enumerations: updatedEnumerations });
        props.setMode("")
        props.setCurrentEnum(null)
    }

    const deleteEnum = () => {
        const updatedEnumerations = props.reference.enumerations.filter((enumeration: ReferenceEnumeration) => enumeration.name !== props.enum.name)
        props.setReference({ ...props.reference, enumerations: updatedEnumerations })
        props.setMode("")
        props.setCurrentEnum(null)
    }

    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="blue">
                    <Card.Title>{name}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col xs={6}>
                                <Form.Label>Enumeration Name</Form.Label>
                                <Form.Control type="text" value={name} onChange={(ev) => { setName(ev.target.value) }} />
                            </Col>
                            <Col xs={6}>
                                <Form.Label>Weight</Form.Label>
                                <Form.Control as="select" value={weight} onChange={(ev) => { setWeight(ev.target.value) }}>
                                    <option value="STRONG">Strong</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="WEAK">Weak</option>
                                </Form.Control>
                            </Col>
                        </Row>
                        <DividerLine />
                        <Row>
                            <Col>
                                <Form.Label>Custom Feedback Message</Form.Label>
                                <Form.Control as="textarea" value={message} onChange={(ev) => { setMessage(ev.target.value) }} />
                            </Col>
                        </Row>
                        <DividerLine />
                    </Form>
                    <ListEditor mode={"synonyms"} list={synonyms} onListChange={setSynonyms} onSave={() => { }} />
                </Card.Body>
                <Card.Footer>
                    <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                        <Button className="green" onClick={() => save()}><i className="bi bi-check-circle-fill"  > Save changes</i></Button>
                        <Button className="red" onClick={() => deleteEnum()}><i className="bi bi-x-circle-fill"> Delete enumeration</i></Button>
                    </ButtonGroup>
                </Card.Footer>
            </Card>
        </>
    )
}

function EnumAssociationDisplayer(props: any) {
    const [cls, setCls] = useState(props.enumAssoc.class)
    const [enumeration, setEnumeration] = useState(props.enumAssoc.enumeration)
    const [elementId, setElementId] = useState(props.enumAssoc.elementId)

    const save = () => {
        let updatedEnumAssocs = props.reference.enumerationAssociations.map((enumAssoc: EnumerationAssociation) =>
            enumAssoc.elementId === props.enumAssoc.elementId ? { ...enumAssoc, class: cls, enumeration, elementId } : enumAssoc
        )
        props.setReference({ ...props.reference, enumerationAssociations: updatedEnumAssocs });
        props.setMode("")
        props.setCurrentEnumAssociation(null)
    }

    const deleteEnumAssoc = () => {
        let updatedEnumAssocs = props.reference.enumerationAssociations.filter((enumAssoc: EnumerationAssociation) => enumAssoc.elementId !== props.enumAssoc.elementId)
        props.setReference({ ...props.reference, enumerationAssociations: updatedEnumAssocs });
        props.setMode("")
        props.setCurrentEnumAssociation(null)
    }

    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="cyan">
                    <Card.Title>{elementId.indexOf("assoc_") >= 0 ? elementId.split("assoc_")[1] : elementId}</Card.Title>
                </Card.Header>
                <Form>
                    <Row>
                        <Col xs={6}>
                            <Form.Label>Class</Form.Label>
                            <Form.Control as="select" value={cls.name} onChange={(ev) => {
                                let newCl = props.classes.find((cl: ReferenceClass) => cl.name === ev.target.value)
                                setCls(newCl)
                                setElementId("assoc_" + newCl.name + "_" + enumeration.name)
                            }} >
                                {props.classes.map((cl: ReferenceClass) => (
                                    <option value={cl.name}>{cl.name}</option>
                                ))}
                            </Form.Control>
                        </Col>
                        <Col xs={6}>
                            <Form.Label>Enumeration</Form.Label>
                            <Form.Control as="select" value={enumeration.name} onChange={(ev) => {
                                let newEnum = props.enumerations.find((en: ReferenceEnumeration) => en.name === ev.target.value)
                                setEnumeration(newEnum)
                                setElementId("assoc_" + cls.name + "_" + newEnum.name)
                            }} >
                                {props.enumerations.map((en: ReferenceEnumeration) => (
                                    <option value={en.name}>{en.name}</option>
                                ))}
                            </Form.Control>
                        </Col>
                    </Row>
                </Form>
                <DividerLine />
                <Card.Footer>
                    <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                        <Button className="green" onClick={() => save()} ><i className="bi bi-check-circle-fill"> Save changes</i> </Button>
                        <Button className="red" onClick={() => deleteEnumAssoc()} ><i className="bi bi-x-circle-fill"> Delete enumeration link</i> </Button>
                    </ButtonGroup>
                </Card.Footer>
            </Card>
        </>
    )
}

function ClassInAssociationDisplayer(props: any) {
    const [role, setRole] = useState(props.role)
    const [multiplicities, setMultiplicities] = useState(props.multiplicities)
    const [cls, setCls] = useState(props.referenceClass)

    useEffect(() => {
        setRole(props.role)
        setMultiplicities(props.multiplicities)
        setCls(props.referenceClass)
    }, [props])

    const save = () => {
        let updatedAssociations = props.isSource ? props.reference.associations.map((association: ReferenceAssociation) =>
            association.elementId === props.assoc.elementId ? { ...association, source: { ...association.source, role, multiplicities, referenceClass: cls } } : association
        ) : props.reference.associations.map((association: ReferenceAssociation) =>
            association.elementId === props.assoc.elementId ? { ...association, target: { ...association.target, role, multiplicities, referenceClass: cls } } : association
        )
        props.setReference({ ...props.reference, associations: updatedAssociations });
        props.setEditing("")
        let updated = props.reference.associations.find((assoc: ReferenceAssociation) => assoc.elementId === props.assoc.elementId)
        if (props.isSource) {
            updated.source = { ...updated.source, role, multiplicities, referenceClass: cls }
        } else {
            updated.target = { ...updated.target, role, multiplicities, referenceClass: cls }
        }
        props.setCurrentAssociation(updated)
    }

    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="green">
                    <Card.Title>{cls.name}</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col xs={6}>
                                <Form.Label>Role</Form.Label>
                                <Form.Control type="text" value={role} onChange={(ev) => { setRole(ev.target.value) }} />
                            </Col>
                            <Col xs={6}>
                                <Form.Label>Class</Form.Label>
                                <Form.Control as="select" value={cls.name} onChange={(ev) => { setCls(props.classes.find((cl: any) => cl.name === ev.target.value)) }}>
                                    {props.classes.map((cls: ReferenceClass) => (
                                        <option value={cls.name}>{cls.name}</option>
                                    ))}</Form.Control>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <ListEditor mode={"multiplicities"} list={multiplicities} onListChange={setMultiplicities} onSave={() => { }} />
                            </Col>
                        </Row>
                        <DividerLine />
                    </Form>
                </Card.Body>
                <Card.Footer>
                    <Button className="green" onClick={() => save()}><i className="bi bi-check-circle-fill" > Save changes</i></Button>
                </Card.Footer>
            </Card>
        </>
    )
}

function AssociationDisplayer(props: any) {
    const [name, setName] = useState(props.assoc.name)
    const [weight, setWeight] = useState(props.assoc.weight)
    const [message, setMessage] = useState(props.assoc.message)
    const [type, setType] = useState(props.assoc.type)
    const [synonyms, setSynonyms] = useState(props.assoc.synonyms)
    const [source, setSource] = useState(props.assoc.source)
    const [target, setTarget] = useState(props.assoc.target)
    const [editing, setEditing] = useState("")

    useEffect(() => {
        setName(props.assoc.name)
        setWeight(props.assoc.weight)
        setMessage(props.assoc.message)
        setType(props.assoc.type)
        setSynonyms(props.assoc.synonyms)
        setSource(props.assoc.source)
        setTarget(props.assoc.target)
        setEditing("")
    }, [props])

    const save = () => {
        let updatedAssociations = props.reference.associations.map((association: ReferenceAssociation) =>
            association.elementId === props.assoc.elementId ? { ...association, name, weight, message, type, synonyms, source, target } : association
        )
        props.setReference({ ...props.reference, associations: updatedAssociations });
        props.setCurrentAssociation(null)
        props.setMode("")
    }

    const deleteAssociation = () => {
        let updatedAssociations = props.reference.associations.filter((association: ReferenceAssociation) => association.elementId !== props.assoc.elementId)
        props.setReference({ ...props.reference, associations: updatedAssociations });
        props.setCurrentAssociation(null)
        props.setMode("")
    }

    return (
        <>
            <Row>
                <Col xs={editing === "synonyms" ? 12 : 6}>
                    <Card style={{ width: "fit-content" }}>
                        <Card.Header className="red">
                            <Card.Title>{props.assoc.elementId.indexOf("assoc_") >= 0 ? props.assoc.elementId.split("assoc_")[1] : props.assoc.elementId} </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Row>
                                    <Col xs={4}>
                                        <Form.Label>Association Name</Form.Label>
                                        <Form.Control type="text" value={name} onChange={(ev) => { setName(ev.target.value) }} />
                                    </Col>
                                    <Col xs={4}>
                                        <Form.Label>Weight</Form.Label>
                                        <Form.Control as="select" value={weight} onChange={(ev) => { setWeight(ev.target.value) }}>
                                            <option value="STRONG">Strong</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="WEAK">Weak</option>
                                        </Form.Control>
                                    </Col>
                                    <Col xs={4}>
                                        <Form.Label>Association Type</Form.Label>
                                        <Form.Control as="select" value={type} onChange={(ev) => { setType(ev.target.value) }}>
                                            <option value="Default">Default</option>
                                            <option value="Inheritance">Inheritance</option>
                                        </Form.Control>
                                    </Col>
                                </Row>
                                <DividerLine />
                                <Row>
                                    <Col>
                                        <Form.Label>Custom Feedback Message</Form.Label>
                                        <Form.Control as="textarea" value={message} onChange={(ev) => { setMessage(ev.target.value) }} />
                                    </Col>
                                </Row>
                                <DividerLine />
                                <Row className='mt-2 justify-content-center' style={{ textAlign: "center" }}>
                                    <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                                        <Button className="pink" onClick={() => setEditing("source")} >Source Class</Button>
                                        <Button className="pink" onClick={() => setEditing("target")}>Target Class</Button>
                                    </ButtonGroup>
                                </Row>
                            </Form>
                            <DividerLine />
                            <ListEditor mode={"synonyms"} list={synonyms} onListChange={setSynonyms} onSave={() => { }} />
                            <DividerLine />
                        </Card.Body>
                        <Card.Footer>
                            <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                                <Button onClick={() => save()} className="green"><i className="bi bi-check-circle-fill" > Save changes</i></Button>
                                <Button onClick={() => deleteAssociation()} className="red"><i className="bi bi-x-circle-fill"> Delete Association</i> </Button>
                            </ButtonGroup>
                        </Card.Footer>
                    </Card>
                </Col>
                <Col xs={6}>
                    {editing === "source" && <ClassInAssociationDisplayer {...source} classes={props.classes} setReference={props.setReference}
                        reference={props.reference} setEditing={setEditing} assoc={props.assoc} isSource={true} setCurrentAssociation={props.setCurrentAssociation} />}
                    {editing === "target" && <ClassInAssociationDisplayer {...target} classes={props.classes} setReference={props.setReference}
                        reference={props.reference} setEditing={setEditing} assoc={props.assoc} isSource={false} setCurrentAssociation={props.setCurrentAssociation} />}
                </Col>
            </Row>
        </>
    )
}

function ForbiddenClassDisplayer(props: any) {
    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="yellow">
                    <Card.Title>ForbiddenClasses</Card.Title>
                </Card.Header>
                <Card.Body>
                    <ListEditor mode={"forbiddenClasses"} list={props.forbiddenClasses} onListChange={(newList) => {
                        props.setReference({ ...props.reference, forbiddenClasses: newList })
                    }} onSave={() => props.setMode("")} />
                </Card.Body>
                <Card.Footer>
                    <Button className="green" onClick={() => {
                        props.setReference({ ...props.reference, forbiddenClasses: props.forbiddenClasses })
                        props.setMode("")
                    }}><i className="bi bi-check-circle-fill" > Save changes</i></Button>
                </Card.Footer>
            </Card>
        </>
    )
}

function ForbiddenAssociationDisplayer(props: { onSave: () => void, list: { source: string, target: string }[], classes: ReferenceClass[], onListChange: (newList: { source: string, target: string }[]) => void }) {
    const [list, setList] = useState(props.list);

    useEffect(() => {
        setList(props.list);
    }, [props.list]);

    const handleEdit = (index: number, field: "source" | "target", newValue: string) => {
        const newList = [...list];
        newList[index][field] = newValue;
        setList(newList);
        props.onListChange(newList);
    };

    const handleAdd = () => {
        const newList = [...list, { source: props.classes[0].name, target: props.classes[0].name }];
        setList(newList);
        props.onListChange(newList);
    };

    const handleRemove = (index: number) => {
        const newList = list.filter((_, i) => i !== index);
        setList(newList);
        props.onListChange(newList);
    };

    const save = () => {
        props.onListChange(list)
        props.onSave()
    }

    return (
        <>
            <Card style={{ width: "fit-content" }}>
                <Card.Header className="purple">
                    <Card.Title>Forbidden Associations</Card.Title>
                </Card.Header>
                <Card.Body>
                    {list.map((item, index) => (
                        <Row key={index} className="mb-2">
                            <Col xs={5}>
                                <Form.Control
                                    as="select"
                                    value={item.source}
                                    onChange={(e) => handleEdit(index, "source", e.target.value)}
                                >
                                    {props.classes.map((cls) => (
                                        <option key={cls.name} value={cls.name}>{cls.name}</option>
                                    ))}
                                </Form.Control>
                            </Col>
                            <Col xs={5}>
                                <Form.Control
                                    as="select"
                                    value={item.target}
                                    onChange={(e) => handleEdit(index, "target", e.target.value)}
                                >
                                    {props.classes.map((cls) => (
                                        <option key={cls.name} value={cls.name}>{cls.name}</option>
                                    ))}
                                </Form.Control>
                            </Col>
                            <Col xs={2}>
                                <Button className="red" onClick={() => handleRemove(index)}>
                                    <i className="bi bi-x-circle-fill"></i>
                                </Button>
                            </Col>
                        </Row>
                    ))}
                    <Button className="green" onClick={handleAdd}><i className="bi bi-plus-circle-fill"></i></Button>
                </Card.Body>
                <Card.Footer>
                    <Button className="green" onClick={() => save()}><i className="bi bi-check-circle-fill" > Save changes</i></Button>
                </Card.Footer>
            </Card>
        </>
    );
}


function ReferenceDisplayer(props: any) {
    const [reference, setReference] = useState<ReferenceSolution>(props.reference)
    const [currentClass, setCurrentClass] = useState<ReferenceClass | null>()
    const [currentAttribute, setCurrentAttribute] = useState<ReferenceAttribute | null>()
    const [currentEnum, setCurrentEnum] = useState<ReferenceEnumeration | null>()
    const [currentAssociation, setCurrentAssociation] = useState<ReferenceAssociation | null>()
    const [currentEnumAssociation, setCurrentEnumAssociation] = useState<EnumerationAssociation | null>()
    const [mode, setMode] = useState("")

    useEffect(() => {
        setReference(props.reference)
        console.log(props.reference)
    }, [props.reference])


    return (
        <>
            {props.reference && <>
                <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                    <Col xs={2}>
                        <ListGroup className="scrollable-list">
                            <ListGroup.Item style={{ fontWeight: mode === "classes" ? "bold" : "" }} className="green" action onClick={() => {
                                setCurrentEnum(null)
                                setMode("classes")
                                setCurrentAssociation(null)
                                setCurrentEnumAssociation(null)
                                setCurrentEnum(null)
                            }} >Classes</ListGroup.Item>
                            <ListGroup.Item style={{ fontWeight: mode === "associations" ? "bold" : "" }} className="red" action onClick={() => {
                                setCurrentClass(null)
                                setCurrentEnum(null)
                                setCurrentAttribute(null)
                                setCurrentEnumAssociation(null)
                                setMode("associations")
                            }}>Associations</ListGroup.Item>
                            <ListGroup.Item style={{ fontWeight: mode === "enumerations" ? "bold" : "" }} className="blue" action onClick={() => {
                                setCurrentAttribute(null)
                                setCurrentClass(null)
                                setCurrentAssociation(null)
                                setCurrentEnumAssociation(null)
                                setMode("enumerations")
                            }}>Enumerations</ListGroup.Item>
                            <ListGroup.Item style={{ fontWeight: mode === "enumAssociations" ? "bold" : "" }} className="cyan" action onClick={() => {
                                setCurrentAttribute(null)
                                setCurrentClass(null)
                                setCurrentAssociation(null)
                                setCurrentEnum(null)
                                setMode("enumAssociations")
                            }} >Enumeration Links</ListGroup.Item>
                            <ListGroup.Item style={{ fontWeight: mode === "forbiddenClasses" ? "bold" : "" }} className="yellow" action onClick={() => setMode("forbiddenClasses")}>Forbidden Classes</ListGroup.Item>
                            <ListGroup.Item style={{ fontWeight: mode === "forbiddenAssociations" ? "bold" : "" }} className="purple" action onClick={() => setMode("forbiddenAssociations")}>Forbidden Associations</ListGroup.Item>
                        </ListGroup>
                        <DividerLine />
                        {mode === "classes" && <>
                            <Button className="green" onClick={() => {
                                let newCls = new ReferenceClass()
                                reference.classes.push(newCls)
                                setReference(reference)
                                setCurrentClass(newCls)
                            }} ><i className="bi bi-plus-circle-fill"> Add new class</i></Button>
                            <DividerLine />
                            <ListGroup className="scrollable-list">
                                {reference.classes.map((refClass, index) => (
                                    <ListGroup.Item action active={currentClass?.name === refClass.name} onClick={() => {
                                        setCurrentAttribute(null)
                                        setCurrentClass(refClass)
                                    }}>{refClass.name}</ListGroup.Item>
                                ))}
                            </ListGroup>
                            <DividerLine />
                            {currentClass && <>
                                <Button className="green" onClick={() => {
                                    let newAttr = new ReferenceAttribute()
                                    currentClass.attributes.push(newAttr)
                                    setReference(reference)
                                    setCurrentAttribute(newAttr)
                                }} ><i className="bi bi-plus-circle-fill"> Add new attribute</i></Button>
                                <DividerLine />
                                <ListGroup className="scrollable-list">
                                    {currentClass.attributes.map((attr) => (
                                        <ListGroup.Item action active={currentAttribute?.name === attr.name} onClick={() => setCurrentAttribute(attr)} >{attr.name}</ListGroup.Item>
                                    ))}
                                </ListGroup> </>}
                        </>}
                        {mode === "associations" && <>
                            <Button className="green" onClick={() => {
                                let newAssoc = new ReferenceAssociation()
                                newAssoc.source = { role: "", multiplicities: ["0..1", "1"], referenceClass: reference.classes[0] }
                                newAssoc.target = { role: "", multiplicities: ["0..1", "1"], referenceClass: reference.classes[0] }
                                newAssoc.elementId = "newAssoc" + (reference.associations.length + 1)
                                reference.associations.push(newAssoc)
                                setReference(reference)
                                setCurrentAssociation(newAssoc)
                            }} ><i className="bi bi-plus-circle-fill"> Add new association</i></Button>
                            <DividerLine />
                            <ListGroup className="scrollable-list">
                                {reference.associations.map((refAssoc) => (
                                    <ListGroup.Item action active={currentAssociation?.elementId === refAssoc.elementId} onClick={() => {
                                        setCurrentAssociation(refAssoc)
                                    }} style={{ whiteSpace: "normal" }}>{refAssoc.elementId.indexOf("assoc_") >= 0 ? refAssoc.elementId.split("assoc_")[1] : refAssoc.elementId}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>}
                        {mode === "enumerations" && <>
                            <Button className="green" onClick={() => {
                                let newEnum = new ReferenceEnumeration()
                                reference.enumerations.push(newEnum)
                                setReference(reference)
                                setCurrentEnum(newEnum)
                            }}><i className="bi bi-plus-circle-fill" > Add new enumeration</i></Button>
                            <DividerLine />
                            <ListGroup className="scrollable-list">
                                {reference.enumerations.map((refEnum) => (
                                    <ListGroup.Item action active={currentEnum?.name === refEnum.name} onClick={() => {
                                        setCurrentEnum(refEnum)
                                        setCurrentAttribute(null)
                                    }}>{refEnum.name}</ListGroup.Item>
                                ))}
                            </ListGroup>
                            <DividerLine />
                            {currentEnum && <>
                                <Button className="green" onClick={() => {
                                    let newLit = new ReferenceAttribute()
                                    currentEnum.literals.push(newLit)
                                    setReference(reference)
                                    setCurrentAttribute(newLit)
                                }}><i className="bi bi-plus-circle-fill" > Add new literal</i></Button>
                                <DividerLine />
                                <ListGroup className="scrollable-list">
                                    {currentEnum.literals.map((attr) => (
                                        <ListGroup.Item action active={currentAttribute?.name === attr.name} onClick={() => setCurrentAttribute(attr)} >{attr.name}</ListGroup.Item>
                                    ))}
                                </ListGroup> </>}
                        </>}
                        {mode === "enumAssociations" && <>
                            <Button className="green" onClick={() => {
                                let newEnumAssoc = new EnumerationAssociation()
                                newEnumAssoc.class = reference.classes[0]
                                newEnumAssoc.enumeration = reference.enumerations[0]
                                newEnumAssoc.elementId = "assoc_" + reference.classes[0].name + "_" + reference.enumerations[0].name
                                reference.enumerationAssociations.push(newEnumAssoc)
                                setReference(reference)
                                setCurrentEnumAssociation(newEnumAssoc)
                            }}><i className="bi bi-plus-circle-fill"> Add new enumeration link</i> </Button>
                            <DividerLine />
                            <ListGroup className="scrollable-list">
                                {reference.enumerationAssociations.map((assoc) => (
                                    <ListGroup.Item action active={currentEnumAssociation?.elementId === assoc.elementId} onClick={() =>
                                        setCurrentEnumAssociation(assoc)} style={{ whiteSpace: "normal" }}>{assoc.elementId.indexOf("assoc_") >= 0 ? assoc.elementId.split("assoc_")[1] : assoc.elementId}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>}
                    </Col>
                    <Col xs={10}>
                        <Row>
                            {mode === "classes" && currentClass &&
                                <>
                                    <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                        <Col style={{ width: "auto" }} xs={6}>
                                            <ClassDisplayer cls={currentClass} reference={reference}
                                                setCurrentClass={setCurrentClass} setReference={setReference} setMode={setMode} />
                                        </Col>
                                        <Col xs={6} style={{ width: "auto" }}>
                                            {currentAttribute &&
                                                <AttributeDisplayer attr={currentAttribute} reference={reference} setReference={setReference}
                                                    setMode={setMode} setCurrentAttribute={setCurrentAttribute} isEnum={false} owner={currentClass} />}
                                        </Col>
                                    </Row>


                                </>}
                            {mode === "associations" && currentAssociation && <>
                                <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                    <Col style={{ width: "auto" }}>
                                        <AssociationDisplayer setCurrentAssociation={setCurrentAssociation} assoc={currentAssociation}
                                            classes={reference.classes} reference={reference} setReference={setReference} setMode={setMode} />
                                    </Col>
                                </Row>

                            </>}
                            {mode === "enumerations" && currentEnum && <>
                                <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                    <Col style={{ width: "auto" }} xs={6}>
                                        <EnumDisplayer enum={currentEnum} setReference={setReference} reference={reference} setMode={setMode} setCurrentEnum={setCurrentEnum} />
                                    </Col>
                                    <Col style={{ width: "auto" }} xs={6}>
                                        {currentAttribute &&
                                            <AttributeDisplayer attr={currentAttribute} reference={reference} setReference={setReference}
                                                setMode={setMode} setCurrentAttribute={setCurrentAttribute} isEnum={true} owner={currentEnum} />}
                                    </Col>
                                </Row>                            </>}
                            {mode === "enumAssociations" && currentEnumAssociation && <>
                                <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                    <Col style={{ width: "auto" }} xs={6}>
                                        <EnumAssociationDisplayer enumAssoc={currentEnumAssociation} classes={reference.classes} enumerations={reference.enumerations}
                                            setReference={setReference} reference={reference} setMode={setMode} setCurrentEnumAssociation={setCurrentEnumAssociation} />
                                    </Col>
                                </Row>
                            </>}
                            {mode === "forbiddenClasses" &&
                                <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                    <Col style={{ width: "auto" }} xs={6}>
                                        <ForbiddenClassDisplayer forbiddenClasses={reference.forbiddenClasses} setReference={setReference} reference={reference} setMode={setMode} />
                                    </Col>
                                </Row>}
                            {mode === "forbiddenAssociations" && <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                <Col style={{ width: "auto" }} xs={6}>
                                    <ForbiddenAssociationDisplayer list={reference.forbiddenAssociations} classes={reference.classes} onListChange={(newList) => {
                                        setReference({ ...reference, forbiddenAssociations: newList })
                                    }} onSave={() => setMode("")} />
                                </Col>
                            </Row>}
                        </Row>
                    </Col>
                </Row>
                <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                    <Col>
                        <Button className="green" style={{ width: "fit-content" }} onClick={() => props.updateReference(reference)} ><i className="bi bi-check-circle-fill"> Save changes</i></Button>
                    </Col>
                </Row>
            </>}
            {!props.reference && <Alert style={{ width: "fit-content", height: "fit-content" }} variant="danger">There is no structure for this reference solution yet.</Alert>}
        </>
    )
}

export { ReferenceDisplayer, DividerLine };