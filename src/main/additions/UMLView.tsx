import { useEffect, useState, useRef } from "react"
import { Dropdown, Col, Container, Row, Button, ProgressBar, Offcanvas, OverlayTrigger, Popover, Spinner, Toast, ToastContainer, PopoverBody, ListGroup } from 'react-bootstrap'
import API from "./API"
import ReactMarkdown from 'react-markdown'
import { useNavigate } from "react-router-dom"
import React from "react"
import { Editor } from "../components/canvas/editor"
import { Canvas } from "../components/canvas/canvas"
import { Sidebar } from "../components/sidebar/sidebar-component"
import { ApollonEditor } from "../apollon-editor"
import { ApollonMode } from "../typings"

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false
}

function UMLView() {
    const [exercises, setExercises] = useState<any[]>([])
    const [selectedExercise, setSelectedExercise] = useState<any>()
    const [diagrams, setDiagrams] = useState<any[]>([])
    const [selectedDiagram, setSelectedDiagram] = useState<any>()
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        API.getAllExercises().then((exercises) => {
            setExercises(exercises)
        }).catch((error) => {
            console.error(error)
        })
    }, [])

    useEffect(() => {
        if (selectedExercise) {
            API.getExerciseDiagrams(selectedExercise.title).then((diagrams) => {
                setDiagrams(diagrams)
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [selectedExercise])

    useEffect(() => {
        if (selectedDiagram && selectedDiagram.json) {
            let model = typeof selectedDiagram.json === "string" ? JSON.parse(selectedDiagram.json) : selectedDiagram.json
            let cont = document.getElementById("apollon")!
            new ApollonEditor(cont, { ...options, model })
        }
    }, [selectedDiagram])

    return (
        <>
            <Container fluid className="d-flex flex-column vh-80">
                <Row style={{ paddingBottom: "5px", paddingTop: "5px", width: "auto", justifyContent: "center", textAlign: "center" }}>
                    <Col xs={3}>
                        <ListGroup className="scrollable-list">
                            {exercises.map((exercise) => (
                                <ListGroup.Item key={exercise.title} action active={selectedExercise?.title === exercise.title} onClick={() => setSelectedExercise(exercise)}>{exercise.title}</ListGroup.Item>
                            ))}
                        </ListGroup>
                        {selectedExercise && diagrams.length > 0 && (
                            <ListGroup className="scrollable-list">
                                {diagrams.map((diagram) => (
                                    <ListGroup.Item key={diagram.name} action active={selectedDiagram?.name === diagram.name} onClick={() => setSelectedDiagram(diagram)}>{diagram.name}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Col>
                    <Col xs={9}>
                        {selectedDiagram && <Row className="flex-grow-1" style={{ height: "80vh" }}>
                            <Col xs={12} sm={12} md={12} lg={12} xl={12} className="d-flex flex-column vh-80">
                                <div id="apollon" style={{ borderStyle: "solid", borderColor: "#003249", borderRadius: "10px", width: "99%", }}>
                                </div>
                            </Col>
                        </Row>}
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default UMLView