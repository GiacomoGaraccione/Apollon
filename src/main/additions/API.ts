import { UMLModel } from "../typings"
import { User } from "./Components/Login/UserContext"
import { AvatarUnlockOptions } from "./Utils/AvatarUtils"
import { ClassDiagramErrorExample } from "./Utils/ClassDiagram/EvaluationTypes"
import { Course, Exercise, Boss, Solution, SandboxDiagram, ExamCall, ExamExercise, ExamSubmission, TeacherEvaluation } from "./Utils/Models"
import { ClassDiagramReferenceSolution } from "./Utils/ClassDiagram/MatcherTypes"
import { UseCaseDiagramReferenceSolution } from "./Utils/UseCaseDiagram/MatcherTypes"

let baseURL = "http://localhost:5000"

if (process.env.NODE_ENV === "production") {
    baseURL = "/uml-modeler-server"
}

// ----------------- Auth APIs -----------------

async function login(username: string, password: string) {
    let response = await fetch(baseURL + "/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    if (response.ok) {
        let user = await response.json()
        let u = new User(user.userId, user.username, user.name, user.surname, user.role)
        u.courses = user.courses
        localStorage.setItem("csrf-token", user.csrf_token || "")
        return u
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getUserInfo() {
    let response = await fetch(baseURL + "/auth/current", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    })
    if (response.ok) {
        let user = await response.json()
        let u = new User(user.userId, user.username, user.name, user.surname, user.role)
        u.courses = user.courses
        return u
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function logout() {
    let response = await fetch(baseURL + "/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        localStorage.removeItem("csrf-token")
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function restorePassword(username: string) {
    let response = await fetch(baseURL + "/auth/restore-password", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ username })
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function changePassword(oldPassword: string, newPassword: string) {
    let response = await fetch(baseURL + "/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ oldPassword, newPassword })
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- User APIs -----------------

async function getAllUsers() {
    let response = await fetch(baseURL + "/users/", { credentials: "include" })
    if (response.ok) {
        const ret = await response.json()
        let usersList = ret.users.map((user: any) => {
            return new User(user.userId, user.username, user.name, user.surname, user.role)
        })
        return usersList
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function createUser(userId: string, name: string, surname: string, role: string) {
    let response = await fetch(baseURL + "/users/", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ userId, name, surname, role })
    })
    if (response.ok) {
        let user = await response.json()
        return user
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteUser(username: string) {
    let response = await fetch(baseURL + "/users/" + username, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateStudentId(username: string, newId: string) {
    let response = await fetch(baseURL + "/users/" + username, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ userId: newId })
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Course APIs -----------------

async function getAllCourses() {
    let response = await fetch(baseURL + "/courses/", { credentials: "include" })
    if (response.ok) {
        const ret = await response.json()
        let coursesList: Course[] = ret.courses.map((course: any) => {
            let studentsList: User[] = course.students.map((student: any) => {
                return new User(student.userId, student.username, student.name, student.surname, student.role)
            })
            let exercisesList: Exercise[] = course.exercises.map((exercise: any) => {
                let boss = exercise.boss ? new Boss(exercise.boss.introDialogue, exercise.boss.victoryDialogue, exercise.boss.props) : null
                let solutionsList: Solution[] = exercise.solutions.map((solution: any) => {
                    let sol = JSON.parse(solution.content)
                    return new Solution(sol.reference, sol.model, sol.image, solution.solutionId)
                })
                return new Exercise(exercise.exerciseId, exercise.title, exercise.description, exercise.level, exercise.experience, exercise.visible, exercise.gamified, exercise.exType, boss, solutionsList)
            })
            let settings
            try {
                settings = JSON.parse(course.settings) as AvatarUnlockOptions
            } catch (error) {
                settings = null
                console.error("Error parsing settings:", error)
            }
            return new Course(course.courseId, course.name, studentsList, exercisesList, settings, course.gameOptions, course.gamified)
        })
        return coursesList
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getCourse(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId, { credentials: "include" })
    if (response.ok) {
        const ret = await response.json()
        let studentsList: User[] = ret.students.map((student: any) => {
            return new User(student.userId, student.username, student.name, student.surname, student.role)
        })
        let exercisesList: Exercise[] = ret.exercises.map((exercise: any) => {
            let boss = exercise.boss ? new Boss(exercise.boss.introDialogue, exercise.boss.victoryDialogue, exercise.boss.props) : null
            let solutionsList: Solution[] = exercise.solutions.map((solution: any) => {
                let sol = JSON.parse(solution.content)
                return new Solution(sol.reference, sol.model, sol.image, solution.solutionId)
            })
            return new Exercise(exercise.exerciseId, exercise.title, exercise.description, exercise.level, exercise.experience, exercise.visible, exercise.gamified, exercise.exType, boss, solutionsList)
        })
        let settings
        try {
            settings = JSON.parse(ret.settings) as AvatarUnlockOptions
        } catch (error) {
            settings = null
            console.error("Error parsing settings:", error)
        }
        return new Course(ret.courseId, ret.name, studentsList, exercisesList, settings, ret.gameOptions, ret.gamified)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function createCourse(courseId: string, courseName: string, gamified: boolean = true) {
    let response = await fetch(baseURL + "/courses/", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ courseId, courseName, gamified })
    })
    if (response.ok) {
        let course = await response.json()
        return course
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateCourseGamified(courseId: string, gamified: boolean) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/gamified", {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ gamified })
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateCourseSettings(courseId: string, settings: AvatarUnlockOptions) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/settings", {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify(settings)
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateCourseGameOptions(courseId: string, gameOptions: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/game-settings", {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify(gameOptions)
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteCourse(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getNonEnrolledStudents(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/non-enrolled-students", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        const ret = await response.json()
        let usersList = ret.students.map((user: any) => {
            return new User(user.userId, user.username, user.name, user.surname, user.role)
        })
        return usersList
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function enrollStudents(courseId: string, userIds: string[]) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/students", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ userIds })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function unenrollStudent(courseId: string, userId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/students/" + userId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getCourseInfo(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/info", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        let exercisesList: Exercise[] = res.exercises.map((exercise: any) => {
            let boss = exercise.boss ? new Boss(exercise.boss.introDialogue, exercise.boss.victoryDialogue, exercise.boss.props) : null
            let solutionsList: Solution[] = exercise.solutions.map((solution: any) => {
                let sol = JSON.parse(solution.content)
                return new Solution(sol.reference, sol.model, sol.image, solution.solutionId)
            })
            return new Exercise(exercise.exerciseId, exercise.title, exercise.description, exercise.level, exercise.experience, exercise.visible, exercise.gamified, exercise.exType, boss, solutionsList)
        })
        let settings
        try {
            settings = JSON.parse(res.settings) as AvatarUnlockOptions
        } catch (error) {
            settings = null
            console.error("Error parsing settings:", error)
        }
        return new Course(res.courseId, res.courseName, [], exercisesList, settings, JSON.parse(res.gameOptions), res.gamified)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getStudentCourseInfo(courseId: string, userId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/students/" + userId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateStudentCourseInfo(courseId: string, userId: string, level: number, experience: number, avatar: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/students/" + userId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ level, experience, avatar })
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getStudentCompletedExercises(courseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/students/" + studentId + "/completed", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res.completed_exercises
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Exercise APIs -----------------

async function addExercise(courseId: string, title: string, description: string, level: number, experience: number, visible: boolean, gamified: boolean, exType: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ title, description, level, experience, visible, gamified, exType })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteExercise(courseId: string, exerciseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateExercise(courseId: string, exerciseId: string, title: string, description: string, level: number, experience: number, visible: boolean, gamified: boolean, exType: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ title, description, level, experience, visible, gamified, exType })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function createBoss(courseId: string, exerciseId: string, introDialogue: string, victoryDialogue: string, bossOptions: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/boss", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ introDialogue, victoryDialogue, bossOptions })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function addSolution(courseId: string, exerciseId: string, reference: ClassDiagramReferenceSolution | UseCaseDiagramReferenceSolution, model: UMLModel, image: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/solutions", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ content: { reference, model, image } })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateSolution(courseId: string, exerciseId: string, solutionId: string, reference: ClassDiagramReferenceSolution | UseCaseDiagramReferenceSolution, model: UMLModel, image: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/solutions/" + solutionId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ content: { reference, model, image } })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteSolution(courseId: string, exerciseId: string, solutionId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/solutions/" + solutionId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getStudentExerciseRecord(courseId: string, exerciseId: string, userId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/students/" + userId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    }
    else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function saveExerciseRecord(courseId: string, exerciseId: string, userId: string, model: any, evaluation: boolean) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/students/" + userId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }, body: JSON.stringify({ model, evaluation })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getStudentExerciseCompletion(courseId: string, exerciseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/students/" + studentId + "/complete", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function completeStudentExercise(courseId: string, exerciseId: string, studentId: string, newXp: number) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/students/" + studentId + "/complete", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ newXp })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getStudentDiagrams(courseId: string, exerciseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/diagrams", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Ranking APIs -----------------

async function getRankingByExerciseCompleteness(courseId: string, exerciseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/rankings/exercises/" + exerciseId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getRankingByLevel(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/rankings/level", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getRankingByCompletedExercises(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/rankings/bosses", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Error APIs -----------------

async function getExampleErrors() {
    let response = await fetch(baseURL + "/errors/", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        let examples: ClassDiagramErrorExample[] = res.map((error: any) => {
            return new ClassDiagramErrorExample(error.id, error.description, error.type, error.key, JSON.parse(error.model))
        })
        return examples
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Sandbox APIs -----------------

async function getSandboxDiagrams(userId: string) {
    let response = await fetch(baseURL + "/sandbox/" + userId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        let diagrams = res.map((diagram: any) => {
            return new SandboxDiagram(JSON.parse(diagram.model) as UMLModel, userId, diagram.diagramId, diagram.lastUpdated, diagram.exerciseType, diagram.filename)
        })
        return diagrams
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function saveSandboxDiagram(model: any, exerciseType: string, filename: string, userId: string) {
    let response = await fetch(baseURL + "/sandbox/" + userId, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ model, exerciseType, filename })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateSandboxDiagram(userId: string, diagramId: string, model: any, exerciseType: string, filename: string) {
    let response = await fetch(baseURL + "/sandbox/" + userId + "/" + diagramId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ model, exerciseType, filename })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    }
    else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteSandboxDiagram(userId: string, diagramId: string) {
    let response = await fetch(baseURL + "/sandbox/" + userId + "/" + diagramId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    }
    else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Exam APIs -----------------

function buildExamCall(ret: any): ExamCall {
    let exercisesList: ExamExercise[] = (ret.exercises || []).map((exercise: any) => {
        return new ExamExercise(exercise.exerciseId, exercise.title, exercise.description, exercise.exType, exercise.examId)
    })
    let studentsList: User[] = (ret.students || []).map((student: any) => {
        return new User(student.userId, student.username, student.name, student.surname, student.role)
    })
    return new ExamCall(ret.examId, ret.title, ret.description, ret.startDate, ret.endDate, ret.courseId, exercisesList, studentsList)
}

async function getExamCalls(courseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res.exams.map((exam: any) => buildExamCall(exam)) as ExamCall[]
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getExamCall(courseId: string, examId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return buildExamCall(res)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function createExamCall(courseId: string, title: string, description: string, startDate: string, endDate: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ title, description, startDate, endDate })
    })
    if (response.ok) {
        let res = await response.json()
        return buildExamCall(res)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateExamCall(courseId: string, examId: string, title: string, description: string, startDate: string, endDate: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ title, description, startDate, endDate })
    })
    if (response.ok) {
        let res = await response.json()
        return buildExamCall(res)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteExamCall(courseId: string, examId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function addExamExercise(courseId: string, examId: string, title: string, description: string, exType: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/exercises", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ title, description, exType })
    })
    if (response.ok) {
        let res = await response.json()
        return new ExamExercise(res.exerciseId, res.title, res.description, res.exType, res.examId)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function updateExamExercise(courseId: string, examId: string, exerciseId: string, title: string, description: string, exType: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/exercises/" + exerciseId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ title, description, exType })
    })
    if (response.ok) {
        let res = await response.json()
        return new ExamExercise(res.exerciseId, res.title, res.description, res.exType, res.examId)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteExamExercise(courseId: string, examId: string, exerciseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/exercises/" + exerciseId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getExamNonEnrolledStudents(courseId: string, examId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/non-enrolled-students", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res.students.map((student: any) => new User(student.userId, student.username, student.name, student.surname, student.role)) as User[]
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function enrollExamStudents(courseId: string, examId: string, userIds: string[]) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/students", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ userIds })
    })
    if (response.ok) {
        let res = await response.json()
        return res
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function unenrollExamStudent(courseId: string, examId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/students/" + studentId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getStudentExamCalls(courseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/students/" + studentId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res.exams.map((exam: any) => buildExamCall(exam)) as ExamCall[]
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getExamSubmission(courseId: string, examId: string, exerciseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/exercises/" + exerciseId + "/students/" + studentId, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        let submission = res.submission ? new ExamSubmission(res.submission.username, res.submission.exerciseId, res.submission.examId, JSON.parse(res.submission.model), res.submission.lastUpdated) : null
        return {
            submission,
            exam: buildExamCall(res.exam),
            exercise: new ExamExercise(res.exercise.exerciseId, res.exercise.title, res.exercise.description, res.exercise.exType, res.exercise.examId),
            active: res.active as boolean,
            ended: res.ended as boolean
        }
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function saveExamSubmission(courseId: string, examId: string, exerciseId: string, studentId: string, model: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/exercises/" + exerciseId + "/students/" + studentId, {
        method: "PUT",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ model })
    })
    if (response.ok) {
        let res = await response.json()
        return new ExamSubmission(res.username, res.exerciseId, res.examId, JSON.parse(res.model), res.lastUpdated)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function getExamSubmissions(courseId: string, examId: string, exerciseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exams/" + examId + "/exercises/" + exerciseId + "/submissions", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res.map((submission: any) => new ExamSubmission(submission.username, submission.exerciseId, submission.examId, submission.model, submission.lastUpdated)) as ExamSubmission[]
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

// ----------------- Teacher Evaluation APIs -----------------

async function getTeacherEvaluations(courseId: string, exerciseId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/evaluations", {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return res.map((e: any) => new TeacherEvaluation(e.exerciseId, e.studentId, e.originalModel, e.staticResult, e.staticModel, e.staticTime, e.llmResult, e.llmModel, e.llmTime, e.llmTokens, e.timestamp)) as TeacherEvaluation[]
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function uploadStudentSolution(courseId: string, exerciseId: string, studentId: string, model: any) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/evaluations", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ studentId, model })
    })
    if (response.ok) {
        let res = await response.json()
        return new TeacherEvaluation(res.exerciseId, res.studentId, res.originalModel, res.staticResult, res.staticModel, res.staticTime, res.llmResult, res.llmModel, res.llmTime, res.llmTokens, res.timestamp)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function deleteTeacherEvaluation(courseId: string, exerciseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/evaluations/" + studentId, {
        method: "DELETE",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        return
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function runStaticEvaluation(courseId: string, exerciseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/evaluations/" + studentId + "/static", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return new TeacherEvaluation(res.exerciseId, res.studentId, res.originalModel, res.staticResult, res.staticModel, res.staticTime, res.llmResult, res.llmModel, res.llmTime, res.llmTokens, res.timestamp)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function runLlmEvaluation(courseId: string, exerciseId: string, studentId: string) {
    let response = await fetch(baseURL + "/courses/" + courseId + "/exercises/" + exerciseId + "/evaluations/" + studentId + "/llm", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        }
    })
    if (response.ok) {
        let res = await response.json()
        return new TeacherEvaluation(res.exerciseId, res.studentId, res.originalModel, res.staticResult, res.staticModel, res.staticTime, res.llmResult, res.llmModel, res.llmTime, res.llmTokens, res.timestamp)
    } else {
        let errDetail = await response.json()
        if (errDetail.llmRawResult) {
            let err = new Error(errDetail.message) as any
            err.llmRawResult = errDetail.llmRawResult
            err.llmTime = errDetail.llmTime
            err.llmTokens = errDetail.llmTokens
            throw err
        }
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

const API = {
    login, getUserInfo, logout, restorePassword, changePassword,
    getAllUsers, createUser, deleteUser, updateStudentId,
    getAllCourses, getCourse, createCourse, updateCourseGamified, updateCourseSettings, updateCourseGameOptions, deleteCourse, getNonEnrolledStudents, enrollStudents, unenrollStudent, getCourseInfo, getStudentCourseInfo, updateStudentCourseInfo, getStudentCompletedExercises,
    addExercise, deleteExercise, updateExercise, createBoss, addSolution, updateSolution, deleteSolution, getStudentExerciseRecord, saveExerciseRecord, getStudentExerciseCompletion, completeStudentExercise, getStudentDiagrams,
    getExamCalls, getExamCall, createExamCall, updateExamCall, deleteExamCall,
    addExamExercise, updateExamExercise, deleteExamExercise,
    getExamNonEnrolledStudents, enrollExamStudents, unenrollExamStudent,
    getStudentExamCalls, getExamSubmission, saveExamSubmission, getExamSubmissions,
    getRankingByExerciseCompleteness, getRankingByLevel, getRankingByCompletedExercises,
    getExampleErrors,
    getSandboxDiagrams, saveSandboxDiagram, updateSandboxDiagram, deleteSandboxDiagram,
    getTeacherEvaluations, uploadStudentSolution, deleteTeacherEvaluation, runStaticEvaluation, runLlmEvaluation
}
export default API