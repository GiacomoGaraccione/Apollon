import { Container, ListGroup, Row } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import React from "react"

function Homepage() {
    const navigate = useNavigate()

    return (
        <>
            <Container fluid  >
                <Row style={{ textAlign: "center" }}>
                    <span className="adminTitle">Home</span>
                </Row>
                <Row style={{ justifyContent: 'center', margin: 0, padding: 0, alignItems: "center", height: "100%" }}>
                    <ListGroup style={{ width: "auto" }} className="framed buttons">
                        <ListGroup.Item className="green" action onClick={() => navigate("/umlclass-create")}>Create Exercise</ListGroup.Item>
                        <ListGroup.Item className="red" action onClick={() => navigate("/umlclass-solution")}>Create Solution</ListGroup.Item>
                        <ListGroup.Item className="blue" action onClick={() => navigate("/umlclass-evaluation")}>Evaluate Exercise</ListGroup.Item>
                    </ListGroup>

                </Row>
            </Container>
        </>
    )
}

export default Homepage