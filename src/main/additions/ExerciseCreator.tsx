import { Alert, Container, Dropdown, Form, Modal, Offcanvas, Row, Spinner, Col, ListGroup, ListGroupItem, Button, ButtonGroup, InputGroup, Toast, ToastContainer } from 'react-bootstrap';
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
// import { UMLClass, UMLAttribute, UMLAssociation, UMLClassAssociationReference, UMLInheritance, UMLSolution } from "../types"
import ReactMarkdown from "react-markdown"
import API from "./API"
import JSZip from "jszip"
import React from 'react';

function ExerciseCreator() {
    const [showUpload, setShowUpload] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [dirty, setDirty] = useState<boolean>(true)
    const [exercises, setExercises] = useState<any[]>([])
    const [selectedEx, setSelectedEx] = useState<any>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [exerciseUpload, setExerciseUpload] = useState<any>()

    useEffect(() => {
        const load = async () => {
            try {
                setError("")
                const exercises = await API.getAllExercises()
                setExercises(exercises)
                setIsLoading(false)
            } catch (error: any) {
                setError(typeof error === 'string' ? error : error.message)
                setIsLoading(false)
            }
        }
        load()
    }, [dirty])

    const uploadFile = async (ev: any) => {
        if (ev?.target.files.length === 1 &&
            (ev.target.files[0].type === "application/zip" || ev.target.files[0].type === "application/x-zip-compressed") &&
            exerciseUpload) {
            try {
                setError('')
                console.log(ev.target.files[0])
                const zip = new JSZip()
                await zip.loadAsync(ev.target.files[0])
                zip.forEach(async (relativePath, zipEntry) => {
                    zipEntry.async("text").then(async (content) => {
                        let name = relativePath.split("/")[1].split(".")[0]
                        await API.uploadStudentDiagram(exerciseUpload.title, name, content)
                    })
                })
                setShowUpload(false)
                setDirty(true)
                setExerciseUpload(undefined)
            } catch (error: any) {
                setError(typeof error === "string" ? error : error.message)
            }
        } else {
            setError('Please upload a single zip file.')
        }
    }

    return (
        <>
            <Container fluid>
                {isLoading ? <Row style={{ justifyContent: "center" }}><Spinner className="mt-3" animation="border" variant="warning" /></Row> : (
                    error ? <Alert className="mt-3" variant="danger">{error}</Alert> :
                        <>
                            <Row>
                                <Col className="mt-2" style={{ textAlign: "center" }}>
                                    <span className="title" style={{ color: "grey" }}>Exercises</span>
                                    <ListGroup className="framed buttons">
                                        {exercises.map((e) => <>
                                            <ListGroupItem>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className={selectedEx && selectedEx.title === e.title ? "exDescrList sel fw-bold" : "exDescrList fw-bold"} >{e.title}</div>
                                                    <Row style={{ justifyContent: 'center', margin: 0, padding: 0, alignItems: "center", height: "100%" }}>
                                                        <ButtonGroup className="btnGroup">
                                                            <Button className="orange" onClick={() => setSelectedEx(e)}>Edit</Button>
                                                            <Button className="cyan" onClick={() => {
                                                                setExerciseUpload(e)
                                                                setShowUpload(true)
                                                            }}>Upload</Button>
                                                        </ButtonGroup>
                                                    </Row>
                                                </div>
                                            </ListGroupItem>
                                        </>)}
                                    </ListGroup>
                                </Col>

                                {
                                    !selectedEx ? null :
                                        <Col className="mt-2" style={{ "textAlign": "center" }}>
                                            <span className="title" style={{ color: "grey" }}>Modify the "{selectedEx.title}" exercise</span>
                                            <ExForm setDirty={setDirty} ex={selectedEx} setSelectedEx={setSelectedEx}></ExForm>
                                        </Col>
                                }
                            </Row>
                            <hr style={{ marginTop: "10px", color: "black" }}></hr>
                            <Row>
                                <Col className="mt-2" style={{ "textAlign": "center" }} sm={12}>
                                    <span className="title" style={{ color: "grey" }}>Add a new exercise</span>
                                    <ExForm setDirty={setDirty} setSelectedEx={setSelectedEx}></ExForm>
                                </Col>
                            </Row>
                        </>
                )}
            </Container>

            <Modal show={showUpload} onHide={() => setShowUpload(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload a zip archive of student exercises</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="zip" className='mb-3'>
                        <Form.Control onChange={(ev: any) => uploadFile(ev)} type="file" accept=".zip" />
                    </Form.Group>
                </Modal.Body>
            </Modal>
        </>
    )
}

function ExForm(props: any) {
    const [title, setTitle] = useState("")
    const [originalTitle, setOriginalTitle] = useState("")
    const [description, setDescription] = useState("")
    const [show, setShow] = useState(false)
    const [error, setError] = useState("")
    const [deleteShow, setDeleteShow] = useState(false)

    useEffect(() => {
        if (props.ex) {
            setOriginalTitle(props.ex.title)
            setTitle(props.ex.title)
            setDescription(props.ex.description)
        }
    }, [props.ex])


    const updateExercise = async () => {
        try {
            setError("")
            if (title.trim().length <= 0 ||
                description.trim().length <= 0) {
                setError("Error! At least one parameter is missing.")
            } else {
                //await API.updateExercise(id, title, description, parseInt(lv), parseInt(xp), introDialogue, victoryDialogue, bossXML, visible, locked)
                props.setDirty(true)
                setShow(true)
                setTimeout(() => {
                    setShow(false)
                    props.setSelectedEx(undefined)
                }, 1000);
            }
        } catch (err: any) {
            setError(err)
            setShow(true)
            setTimeout(() => {
                setShow(false)
            }, 3000);
        }
    }

    const addExercise = async () => {
        try {
            setError("")
            if (title.trim().length <= 0 ||
                description.trim().length <= 0) {
                setError("Error! At least one parameter is missing.")
            } else {
                await API.createExercise(title, description)
                props.setDirty(true)
                setShow(true)
                setTimeout(() => {
                    setShow(false)
                    props.setSelectedEx(undefined)
                    setTitle("")
                    setDescription("")
                }, 1000)
            }
        } catch (err: any) {
            setError(err)
            setShow(true)
            setTimeout(() => {
                setShow(false)
            }, 3000);
        }
    }

    const deleteExercise = async (id: number) => {
        try {
            setError("")
            //await API.deleteExercise(id)
            props.setDirty(true)
            props.setSelectedEx(undefined)
            setTitle("")
            setDescription("")
        } catch (err: any) {
            setError(err)
            setShow(true)
            setTimeout(() => {
                setShow(false)
            }, 3000);
        }
    }

    return (
        <>
            <Row>
                <Form>
                    <Row className="framed buttons">
                        <Col xs={5}>
                            <Form.Control type="text" placeholder="Title" onChange={ev => setTitle(ev.target.value)} value={title} />
                        </Col>
                        <Col xs={12}>
                            <Form.Control as="textarea" placeholder="Description (you can use markdown syntax)" rows={props.ex ? 13 : 9} onChange={ev => setDescription(ev.target.value)} value={description} />
                        </Col>
                    </Row>
                </Form>
            </Row>

            {props.ex ?
                <Row className='mt-2 justify-content-center'>
                    <Col style={{ textAlign: "center" }}>
                        <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                            <Button className="black" onClick={() => props.setSelectedEx(undefined)}>Cancel</Button>
                            <Button className="green" onClick={() => updateExercise()}>Modify Exercise</Button>
                            <Button className="red" onClick={() => setDeleteShow(true)}>Delete Exercise</Button>
                        </ButtonGroup>
                    </Col>
                </Row> :
                <Row className='mt-2 justify-content-center' style={{ width: "auto" }}>
                    <Col style={{ textAlign: "center", width: "auto" }}>
                        <div className="btnGroup" style={{ width: "auto" }}>
                            <Button className="green" onClick={() => addExercise()}>Add Exercise</Button>
                        </div>
                    </Col>
                </Row>}

            {
                show ?
                    <ToastContainer position="top-center">
                        {error ?
                            <Toast className={"toast notSaved"}>
                                <Toast.Body>
                                    <i className="bi bi-check-circle-fill darkRed"></i> {error}
                                </Toast.Body>
                            </Toast>
                            : <Toast className={"toast saved"}>
                                <Toast.Body>
                                    <i className="bi bi-check-circle-fill darkGreen"></i> Exercise Saved!
                                </Toast.Body>
                            </Toast>
                        }
                    </ToastContainer> : null
            }


            <Modal show={deleteShow} onHide={() => setDeleteShow(false)}>
                <Modal.Header >
                    <Modal.Title>Attention!</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete the exercise?</Modal.Body>
                <Modal.Footer>
                    <ButtonGroup className="btnGroup" style={{ width: "auto" }}>
                        <Button className="black" onClick={() => setDeleteShow(false)}>Cancel</Button>
                        <Button className="red" onClick={() => deleteExercise(props.ex.exerciseId)}>Delete</Button>
                    </ButtonGroup>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default ExerciseCreator