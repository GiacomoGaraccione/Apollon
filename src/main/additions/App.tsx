import React, { useState, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppShell, Burger, Group, Loader, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks';
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
import CourseHome from './Components/Student/CourseHome';
import ExercisePage from './Components/Student/ExercisePage';
import DiagramView from './Components/Teacher/DiagramView';
import ErrorTutorial from './Components/Student/ErrorTutorial';
import { Sandbox } from './Components/Common/Sandbox';
import UserSettings from './Components/Login/UserSettings';


function App() {
    const [user, setUser] = useState<User | undefined>(undefined)
    const [loggedIn, setLoggedIn] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 62em)')
    const [open, setOpen] = useState(true)

    useEffect(() => {
        setOpen(!isMobile)
    }, [isMobile])

    const toggleOpen = () => setOpen((prev) => !prev)

    useEffect(() => {
        API.getUserInfo().then((user) => {
            setUser(user)
            setLoggedIn(true)
            setLoaded(true)
        }).catch((err) => {
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
        }).catch((err) => {
            setFailed(true)
            setTimeout(() => setFailed(false), 5000)
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
        <AppShell
            disabled={!loggedIn}
            navbar={{ width: 220, breakpoint: "md", collapsed: { desktop: !open, mobile: !open } }}
            header={loggedIn ? { height: 56, collapsed: !isMobile } : undefined}
        >
            <UserContext.Provider value={user}>

                {loggedIn &&
                    <AppShell.Header withBorder>
                        <Group h="100%" px="md" justify="space-between">
                            <Group>
                                <Burger opened={open} onClick={toggleOpen} hiddenFrom="md" size="sm" />
                                <Text fw={600}>Apollon</Text>
                            </Group>
                            <Text size="sm" c="dimmed">{user?.username}</Text>
                        </Group>
                    </AppShell.Header>}

                {loggedIn && <AppShell.Navbar >
                    <Navbar logout={doLogout} open={open} toggleOpen={toggleOpen} isMobile={!!isMobile} />
                </AppShell.Navbar>}
                <AppShell.Main className="app-main" style={{ paddingTop: loggedIn ? undefined : "2vh" }}>
                    <Routes>
                        <Route path="/"
                            element={!loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)} />
                        <Route path="/login" element={
                            !loaded ? <Loading /> : (loggedIn ? <Navigate to="/" /> : <Login failed={failed} setFailed={setFailed} doLogin={doLogin} />)
                        } />
                        <Route path="/sandbox" element={
                            !loaded ? <Loading /> : (loggedIn ? <Sandbox /> : <Navigate to="/login" />)
                        } />
                        <Route path="/settings"
                            element={
                                !loaded ? <Loading /> : (loggedIn ? <UserSettings /> : <Navigate to="/login" />)
                            } />
                        <Route path="/student/examples" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <ErrorTutorial /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/student/courses" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <StudentCourses /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/student/courses/:courseId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <CourseHome /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/student/courses/:courseId/exercises/:exerciseId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <ExercisePage /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/users" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <UsersView />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <CourseView />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <CoursePage />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/settings" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <CourseSettings />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/new" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExerciseCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/edit" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExerciseEditor />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/boss" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <BossCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/solutions" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <SolutionCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/diagrams" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <DiagramView />) : <Navigate to="/login" />)
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
