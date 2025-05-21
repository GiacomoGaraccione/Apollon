import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppShell, Burger, Group, Loader, Text, useMantineTheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';
import Login from './Components/Login/Login'
import { User, UserContext, Roles } from "./Components/Login/UserContext"
import API from './API'
import Navbar from './Components/Navbar/Navbar';
import UsersView from './Components/Teacher/UsersView';
import CourseView from './Components/Teacher/CourseView';
import CoursePage from './Components/Teacher/CoursePage';
import { ExerciseCreator, ExerciseEditor } from './Components/Teacher/ExerciseCreator';
import BossCreator from './Components/Teacher/BossCreator';
import SolutionCreator from './Components/Teacher/SolutionCreator';
import StudentCourses from './Components/Student/StudentCourses';
import CourseSettings from './Components/Teacher/CourseSettings';


function App() {
    const theme = useMantineTheme()
    const [user, setUser] = useState<User | undefined>(undefined)
    const [loggedIn, setLoggedIn] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const navigate = useNavigate()
    const [open, { toggle: toggleOpen }] = useDisclosure(true)

    useEffect(() => {
        API.getUserInfo().then((user) => {
            setUser(user)
            setLoggedIn(true)
            setLoaded(true)
        }).catch((err) => {
            console.log(err)
            setUser(undefined)
            setLoggedIn(false)
            setLoaded(true)
        })
    }, [])

    const doLogin = (username: string, password: string) => {
        API.login(username, password).then((user) => {
            setUser(user)
            setLoggedIn(true)
            navigate("/")
        })
    }

    const doLogout = () => {
        API.logout().then(() => {
            setUser(undefined)
            setLoggedIn(false)
            navigate("/login")
        })
    }

    return (
        <AppShell disabled={!loggedIn} header={{ height: "5%" }} padding={"md"} navbar={{ width: 200, breakpoint: "sm", collapsed: { desktop: !open } }} >
            <UserContext.Provider value={user}>
                {loggedIn && <AppShell.Header>
                    <Group h="100%" px="md">
                        <Burger opened={open} onClick={toggleOpen} size="md" />
                        <Text size="xl" color={"blue"}>App</Text>
                    </Group>
                </AppShell.Header>}
                {loggedIn && <AppShell.Navbar p="md">
                    <Navbar logout={doLogout} />
                </AppShell.Navbar>}
                <AppShell.Main>
                    <Routes>
                        <Route path="/"
                            element={!loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <Navigate to="/teacher" />) : <Navigate to="/login" />)} />
                        <Route path="/login" element={
                            !loaded ? <Loading /> : (loggedIn ? <Navigate to="/" /> : <Login doLogin={doLogin} />)
                        } />
                        <Route path="/student" element={<Text>Student</Text>} />
                        <Route path="/student/courses" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <StudentCourses /> : <Navigate to="/teacher" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher" element={<Text>Teacher</Text>} />
                        <Route path="/teacher/users" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <UsersView />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <CourseView />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <CoursePage />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/new" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <ExerciseCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/edit" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <ExerciseEditor />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/boss" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <BossCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/solutions" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <SolutionCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/settings" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student" /> : <CourseSettings />) : <Navigate to="/login" />)
                        } />
                    </Routes>
                </AppShell.Main>

            </UserContext.Provider>
        </AppShell>
    );
}

//Container style={{ display: 'flex', width: "100%", height: "100%" }} size="xl" className='container'

function Loading() {
    return <Loader color="blue" size="xl" type="dots" />
}

function All() {
    return <></>
}

export default App;
