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
import EvaluationView from './Components/Teacher/EvaluationView';
import ErrorTutorial from './Components/Student/ErrorTutorial';
import { Sandbox } from './Components/Common/Sandbox';
import UserSettings from './Components/Login/UserSettings';
import { ExamCallCreator, ExamCallEditor } from './Components/Teacher/ExamCallCreator';
import ExamCallPage from './Components/Teacher/ExamCallPage';
import { ExamExerciseCreator, ExamExerciseEditor } from './Components/Teacher/ExamExerciseCreator';
import ExamSubmissionsView from './Components/Teacher/ExamSubmissionsView';
import StudentExams from './Components/Student/StudentExams';
import StudentExamCallPage from './Components/Student/StudentExamCallPage';
import StudentExamExercisePage from './Components/Student/StudentExamExercisePage';
import { getExamStatus } from './Utils/ExamUtils';


function App() {
    const [user, setUser] = useState<User | undefined>(undefined)
    const [loggedIn, setLoggedIn] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)
    const [examActive, setExamActive] = useState(false)
    const navigate = useNavigate()
    const isMobile = useMediaQuery('(max-width: 62em)')
    const [open, setOpen] = useState(true)

    useEffect(() => {
        setOpen(!isMobile)
    }, [isMobile])

    const toggleOpen = () => setOpen((prev) => !prev)

    const checkActiveExams = async (u: User): Promise<boolean> => {
        if (u.role !== Roles.STUDENT || !Array.isArray(u.courses) || u.courses.length === 0) {
            setExamActive(false)
            return false
        }
        try {
            const results = await Promise.all(u.courses.map((course: string) => API.getStudentExamCalls(course, u.username)))
            const hasOngoing = results.flat().some((exam: any) => getExamStatus(exam.startDate, exam.endDate) === "ongoing")
            setExamActive(hasOngoing)
            return hasOngoing
        } catch {
            setExamActive(false)
            return false
        }
    }

    useEffect(() => {
        API.getUserInfo().then(async (user) => {
            setUser(user)
            setLoggedIn(true)
            await checkActiveExams(user)
            setLoaded(true)
        }).catch((err) => {
            setUser(undefined)
            setLoggedIn(false)
            setLoaded(true)
        })
    }, [])

    const doLogin = (username: string, password: string) => {
        API.login(username, password).then(async (user) => {
            setUser(user)
            setLoggedIn(true)
            const hasExam = await checkActiveExams(user)
            navigate(hasExam ? "/student/exams" : "/")
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
                    <Navbar logout={doLogout} open={open} toggleOpen={toggleOpen} isMobile={!!isMobile} examActive={examActive} />
                </AppShell.Navbar>}
                <AppShell.Main className="app-main" style={{ paddingTop: loggedIn ? undefined : "2vh" }}>
                    <Routes>
                        <Route path="/"
                            element={!loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to={examActive ? "/student/exams" : "/student/courses"} /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)} />
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
                        <Route path="/student/exams" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <StudentExams /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/student/exams/:courseId/:examId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <StudentExamCallPage /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
                        } />
                        <Route path="/student/exams/:courseId/:examId/exercises/:exerciseId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <StudentExamExercisePage /> : <Navigate to="/teacher/users" />) : <Navigate to="/login" />)
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
                        <Route path="/teacher/courses/:courseId/exercises/:exerciseId/evaluations" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <EvaluationView />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exams/new" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExamCallCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exams/:examId" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExamCallPage />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exams/:examId/edit" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExamCallEditor />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exams/:examId/exercises/new" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExamExerciseCreator />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exams/:examId/exercises/:exerciseId/edit" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExamExerciseEditor />) : <Navigate to="/login" />)
                        } />
                        <Route path="/teacher/courses/:courseId/exams/:examId/exercises/:exerciseId/submissions" element={
                            !loaded ? <Loading /> : (loggedIn ? (user?.role === Roles.STUDENT ? <Navigate to="/student/courses" /> : <ExamSubmissionsView />) : <Navigate to="/login" />)
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
