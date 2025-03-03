import React, { useEffect, useState, useRef } from "react";
import { Form, Col, Container, Row, ListGroup, Alert, Modal, Button } from "react-bootstrap";
import API from "./API"
import ReactMarkdown from "react-markdown";
import { Puff } from "@agney/react-loading"
import { ApollonMode } from "../typings";
import { ApollonEditor } from "../apollon-editor";
import { UMLStructureBuilderFromLLM, UMLStructureBuilderFromReference } from "../operations/UMLStructureBuilder";
import { ReferenceBuilder, ReferenceSolution } from "../operations/UMLMatcherTypes";
import { ReferenceDisplayer, DividerLine } from "./ReferenceDisplayer";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false
}

function SolutionCreator() {
    const [exercises, setExercises] = useState<any[]>([])
    const [selectedExercise, setSelectedExercise] = useState<any>()
    const [solutions, setSolutions] = useState<any[]>([])
    const [mode, setMode] = useState("")
    const [currentSolution, setCurrentSolution] = useState<any | null>(null)
    const [draw, setDraw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editor, setEditor] = useState<any>()
    const [result, setResult] = useState("")
    const [position, setPosition] = useState(-1)
    const [reference, setReference] = useState(false)

    useEffect(() => {
        API.getAllExercises().then((exs) => {
            setExercises(exs)
        }).catch((error) => {
            console.error(error)
        })
    }, [])

    useEffect(() => {
        if (selectedExercise) {
            setSolutions(JSON.parse(selectedExercise.solutions))
            setMode("")
        }
    }, [selectedExercise])

    useEffect(() => {
        try {
            if (draw) {
                if (result) {
                    let builder = new UMLStructureBuilderFromLLM(result)
                    let model = builder.createUMLStructure()
                    let cont = document.getElementById("apollon")!
                    setEditor(new ApollonEditor(cont, { ...options, model: model }))
                } else if (selectedExercise && currentSolution) {
                    let cont = document.getElementById("apollon")!
                    setEditor(new ApollonEditor(cont, { ...options, model: currentSolution.model }))
                } else {
                    let cont = document.getElementById("apollon")!
                    setEditor(new ApollonEditor(cont, { ...options }))
                }
            }
        } catch (error) {
            console.error(error)
        }
    }, [draw])

    const submitText = () => {
        if (selectedExercise) {
            setLoading(true)
            setDraw(false)
            API.submitText(selectedExercise.title, selectedExercise.description).then((res) => {
                setDraw(true)
                setResult(res.uml)
                setLoading(false)
            }).catch((error) => {
                console.error(error)
                setLoading(false)
            })
        }
    }

    const saveDiagram = () => {
        try {
            if (selectedExercise && editor) {
                let builder = new ReferenceBuilder(editor.model)
                let ref = builder.buildReference()
                API.saveUMLReference(selectedExercise.title, JSON.stringify({ model: editor.model, reference: ref })).then((res) => {
                    setSolutions(res.solution)
                    setDraw(false)
                    setMode("")
                    setCurrentSolution(null)
                }).catch((error) => {
                    console.error(error)
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const deleteReference = () => {
        try {
            let updatedSolutions = [...solutions]
            updatedSolutions.splice(position, 1)
            API.updateUMLReference(selectedExercise.title, JSON.stringify(updatedSolutions)).then((res) => {
                setSolutions(updatedSolutions)
                setPosition(-1)
                setMode("")
                setDraw(false)
            }).catch((err) => {
                console.error(err)
            })
        } catch (error) {
            console.error(error)
        }
    }

    const updateReference = () => {
        try {
            if (editor) {
                let builder = new ReferenceBuilder(editor.model)
                let ref = builder.buildReference()
                let updatedSolutions = [...solutions];
                updatedSolutions[position] = { ...updatedSolutions[position], model: editor.model, reference: ref };
                API.updateUMLReference(selectedExercise.title, JSON.stringify(updatedSolutions)).then((res) => {
                    setSolutions(updatedSolutions);
                    setPosition(-1);
                    setMode("");
                    setDraw(false);
                }).catch((err) => {
                    console.error(err);
                });
            }
        } catch (error) {
            console.error(error)
        }
    }

    const saveStructure = (updatedReference: ReferenceSolution) => {
        try {
            let updatedSolutions = [...solutions]
            let builder = new UMLStructureBuilderFromReference(updatedReference)
            let model = builder.createUMLStructure()
            console.log(position)
            if (position >= 0) {
                updatedSolutions[position] = { ...updatedSolutions[position], model: model, reference: updatedReference }
            } else {
                updatedSolutions.push({ model: model, reference: updatedReference })
            }
            API.updateUMLReference(selectedExercise.title, JSON.stringify(updatedSolutions)).then((res) => {
                setSolutions(updatedSolutions)
                setPosition(-1)
                setMode("")
                setReference(false)
            })
        } catch (error) {
            console.error(error)
        }
    }

    const downloadSources = () => {
        try {
            if (currentSolution && selectedExercise) {
                let zip = new JSZip()
                let folder = zip.folder(selectedExercise.title)
                folder?.file("model.json", JSON.stringify(currentSolution.model))
                folder?.file("reference.json", JSON.stringify(currentSolution.reference))
                zip.generateAsync({ type: "blob" })
                    .then((content) => saveAs(content, selectedExercise.title + " - sources.zip"))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const getSynonyms = () => {
        try {
            if (currentSolution && selectedExercise) {
                console.log(currentSolution.reference)
                setLoading(true)
                API.getUMLReferenceSynonyms(selectedExercise.title, selectedExercise.description, currentSolution.reference).then((res) => {
                    console.log(res)
                    setCurrentSolution({ model: currentSolution.model, reference: res.synonyms })
                    setReference(true)
                    setLoading(false)
                }).catch((err) => {
                    console.error(err)
                    setLoading(false)
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <Container fluid className="d-flex flex-column vh-80">
                <Row style={{ paddingBottom: "5px", paddingTop: "5px", width: "auto", justifyContent: "center", textAlign: "center", alignItems: "center" }}>
                    <Col xs={2}>
                        <ListGroup className="scrollable-list">
                            {exercises.map((exercise) => (
                                <ListGroup.Item key={exercise.title} action active={selectedExercise?.title === exercise.title} onClick={() => setSelectedExercise(exercise)}>{exercise.title}</ListGroup.Item>
                            ))}
                        </ListGroup>
                        <DividerLine />
                        {selectedExercise && <>
                            <ListGroup className="scrollable-list">
                                <ListGroup.Item style={{ fontWeight: mode === "add" ? "bold" : "" }} className="green" action onClick={() => {
                                    setCurrentSolution(null)
                                    setMode("add")
                                    setDraw(false)
                                    setPosition(-1)
                                }}><i className="bi bi-plus-circle-fill"> Add new solution</i></ListGroup.Item>
                                {solutions.map((solution, index) => (
                                    <ListGroup.Item style={{ fontWeight: currentSolution === solution ? "bold" : "" }} action key={index} className="orange" onClick={() => {
                                        setCurrentSolution(solution)
                                        setMode("edit")
                                        setDraw(false)
                                        setResult("")
                                        setPosition(index)
                                    }}><i className="bi bi-pencil-fill"> Edit solution {index + 1}</i></ListGroup.Item>
                                ))}
                            </ListGroup>
                            <DividerLine />
                            {mode && mode !== "edit" && <ListGroup className="scrollable-list">
                                <ListGroup.Item className="pink" action onClick={() => submitText()}> <i className="bi bi-robot"> Create diagram from description</i></ListGroup.Item>
                                <ListGroup.Item className="green" action onClick={() => setDraw(true)}><i className="bi bi-diagram-3"> Create blank diagram</i> </ListGroup.Item>
                                <ListGroup.Item className="cyan" action onClick={() => { }}><i className="bi bi-robot"> Create reference from description</i> </ListGroup.Item>
                                <ListGroup.Item className="orange" action onClick={() => {
                                    let newReference = new ReferenceSolution()
                                    setReference(true)
                                    setCurrentSolution({ model: {}, reference: newReference })
                                    setEditor({ ...editor, model: {} })
                                }}><i className="bi bi-file-earmark-text-fill"> Create empty reference</i> </ListGroup.Item>
                            </ListGroup>}
                            {mode && mode !== "add" && <ListGroup className="framed buttons scrollable-list">
                                <ListGroup.Item className="pink" action onClick={() => {
                                    setReference(false)
                                    setDraw(true)
                                }}><i className="bi bi-pencil-fill"> Edit diagram</i></ListGroup.Item>
                                <ListGroup.Item className="blue" action onClick={() => {
                                    setDraw(false)
                                    setReference(true)
                                }} ><i className="bi bi-pencil-fill"> Edit reference</i></ListGroup.Item>
                                <ListGroup.Item className="cyan" action onClick={() => getSynonyms()} ><i className="bi bi-robot"> Enhance Synonyms</i> </ListGroup.Item>
                                <ListGroup.Item className="green" action onClick={() => downloadSources()}><i className="bi bi-download" > Download sources</i> </ListGroup.Item>
                                <ListGroup.Item className="red" action onClick={() => deleteReference()} ><i className="bi bi-trash3-fill"> Delete solution</i> </ListGroup.Item>
                            </ListGroup>}
                            <DividerLine />
                        </>}
                    </Col>
                    <Col xs={10}>
                        <Row className="flex-grow-1" style={{ height: "80vh" }}>
                            <Row className="control flex-grow-1 overflow-auto framed buttons" style={{ borderStyle: "solid", borderColor: "#003249", borderRadius: "10px", paddingTop: "5px", marginBottom: "5px", width: "99%", justifyContent: "center", alignItems: "center" }}>
                                {selectedExercise && draw && <>

                                    {draw && <ListGroup className="scrollable-list">

                                    </ListGroup>}
                                    <div id="apollon" />
                                    <Row style={{ justifyContent: "center", alignItems: "center", justifyItems: "center" }}>
                                        <Col>
                                            <Button className="green" style={{ width: "fit-content" }} onClick={() => mode === "add" ? saveDiagram() : updateReference()} ><i className="bi bi-check-circle-fill"> Save diagram</i> </Button>

                                        </Col>
                                    </Row></>}
                                {selectedExercise && reference && <ReferenceDisplayer
                                    updateReference={saveStructure} reference={currentSolution?.reference} />}
                                {selectedExercise && loading && <>
                                    <div style={{ width: "600px", flexDirection: 'row', color: "#007EA7" }}>
                                        <Puff />
                                    </div>
                                    <div style={{
                                        display: "flex", justifyContent: "center", alignContent: "center",
                                        fontFamily: "Pokemon GB", fontSize: "1em",
                                        background: "none", border: "none", padding: "0 0 0 1em",
                                    }}>Generating solution, please wait... </div>
                                </>}
                            </Row>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default SolutionCreator;