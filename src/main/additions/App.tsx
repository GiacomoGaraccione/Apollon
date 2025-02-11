import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Container, Navbar } from 'react-bootstrap';
import { Route, Routes } from 'react-router-dom';
import Homepage from './Homepage';
import ExerciseCreator from './ExerciseCreator';
import React from 'react';
import UMLView from './UMLView';
import "./styles.css"
import SolutionCreator from './SolutionCreator';

function App() {
    return (
        <Container fluid>
            <Navbar bg="light" expand="lg">
                <Container>
                    <Navbar.Brand href="/">Apollon</Navbar.Brand>
                </Container>
            </Navbar>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/umlclass-create" element={<ExerciseCreator />} />
                <Route path="/umlclass-evaluation" element={<UMLView />} />
                <Route path="/umlclass-solution" element={<SolutionCreator />} />
            </Routes>
        </Container>
    )
}

export default App