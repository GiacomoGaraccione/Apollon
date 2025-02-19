import React, { useEffect, useState, useRef } from "react";
import { Form, Col, Container, Row, ListGroup, Alert, Modal } from "react-bootstrap";
import API from "./API"
import ReactMarkdown from "react-markdown";
import { Puff } from "@agney/react-loading"
import { ApollonMode } from "../typings";
import { ApollonEditor } from "../apollon-editor";
import { UMLStructureBuilder } from "../operations/UMLStructureBuilder";
import { ReferenceBuilder, ReferenceSolution } from "../operations/UMLMatcherTypes";
import { ReferenceDisplayer, DividerLine } from "./ReferenceDisplayer";

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
            console.log(JSON.parse(selectedExercise.solutions))
            setSolutions(JSON.parse(selectedExercise.solutions))
            setMode("")
        }
    }, [selectedExercise])

    useEffect(() => {
        try {
            if (draw) {
                if (result) {
                    let builder = new UMLStructureBuilder(result)
                    let model = builder.createUMLStructure()
                    let cont = document.getElementById("apollon")!
                    setEditor(new ApollonEditor(cont, { ...options, model: model }))
                } else if (selectedExercise && currentSolution) {
                    let cont = document.getElementById("apollon")!
                    console.log(currentSolution)
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
                console.log(ref)
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
            if (editor) {
                updatedSolutions[position] = { ...updatedSolutions[position], model: editor?.model, reference: updatedReference }
                API.updateUMLReference(selectedExercise.title, JSON.stringify(updatedSolutions)).then((res) => {
                    setSolutions(updatedSolutions)
                    setPosition(-1)
                    setMode("")
                    setReference(false)
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
                                <ListGroup.Item className="green" action onClick={() => {
                                    setCurrentSolution(null)
                                    setMode("add")
                                    setDraw(false)
                                    setPosition(-1)
                                }}>Add new solution</ListGroup.Item>
                                {solutions.map((solution, index) => (
                                    <ListGroup.Item style={{ fontWeight: currentSolution === solution ? "bold" : "" }} action key={index} className="orange" onClick={() => {
                                        setCurrentSolution(solution)
                                        setMode("edit")
                                        setDraw(false)
                                        setResult("")
                                        setPosition(index)
                                    }}>Edit solution {index + 1}</ListGroup.Item>
                                ))}
                            </ListGroup>
                            <DividerLine />
                            {mode && mode !== "edit" && <ListGroup className="scrollable-list">
                                <ListGroup.Item className="pink" action onClick={() => submitText()}>Start from description</ListGroup.Item>
                                <ListGroup.Item className="green" action onClick={() => setDraw(true)}>Draw diagram</ListGroup.Item>
                            </ListGroup>}
                            {mode && mode !== "add" && <ListGroup className="framed buttons scrollable-list">
                                <ListGroup.Item className="pink" action onClick={() => {
                                    setReference(false)
                                    setDraw(true)
                                }}>Edit diagram</ListGroup.Item>
                                <ListGroup.Item className="blue" action onClick={() => {
                                    setDraw(false)
                                    setReference(true)
                                }} >Edit reference</ListGroup.Item>
                            </ListGroup>}
                            <DividerLine />
                            {draw && <ListGroup className="scrollable-list">
                                {mode === "add" && <ListGroup.Item className="green" action onClick={() => saveDiagram()}>Save solution</ListGroup.Item>}
                                {mode === "edit" && <>
                                    <ListGroup.Item className="green" action onClick={() => {
                                        updateReference()
                                    }} >Update solution</ListGroup.Item>
                                    <ListGroup.Item className="red" action onClick={() => deleteReference()} >Delete solution</ListGroup.Item>
                                </>}
                            </ListGroup>}
                        </>}
                    </Col>
                    <Col xs={10}>
                        <Row className="flex-grow-1" style={{ height: "80vh" }}>
                            <Row className="control flex-grow-1 overflow-auto framed buttons" style={{ borderStyle: "solid", borderColor: "#003249", borderRadius: "10px", paddingTop: "5px", marginBottom: "5px", width: "99%", justifyContent: "center", alignItems: "center" }}>
                                {selectedExercise && draw && <div id="apollon" />}
                                {selectedExercise && reference && <ReferenceDisplayer
                                    updateReference={saveStructure} reference={currentSolution?.reference} />}
                                {/*selectedExercise && answer && <ReactMarkdown>{answer}</ReactMarkdown>*/}
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