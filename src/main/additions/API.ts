import { UMLModel } from "../typings"
import { User } from "./Components/Login/UserContext"
import { AvatarUnlockOptions } from "./Utils/AvatarUtils"
import { ClassDiagramErrorExample } from "./Utils/ClassDiagram/EvaluationTypes"
import { Course, Exercise, Boss, Solution, SandboxDiagram } from "./Utils/Models"
import { ClassDiagramReferenceSolution } from "./Utils/ClassDiagram/MatcherTypes"
import { UseCaseDiagramReferenceSolution } from "./Utils/UseCaseDiagram/MatcherTypes"

let baseURL = "http://localhost:5000"

if (process.env.NODE_ENV === "production") {
    baseURL = "/umlegend/api"
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
            return new Course(course.courseId, course.name, studentsList, exercisesList, settings, course.gameOptions)
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
        return new Course(ret.courseId, ret.name, studentsList, exercisesList, settings, ret.gameOptions)
    } else {
        let errDetail = await response.json()
        if (errDetail.error) throw new Error(errDetail.error)
        if (errDetail.message) throw new Error(errDetail.message)
        throw new Error("Unknown error")
    }
}

async function createCourse(courseId: string, courseName: string) {
    let response = await fetch(baseURL + "/courses/", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": localStorage.getItem("csrf-token") || ""
        },
        body: JSON.stringify({ courseId, courseName })
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
        return new Course(res.courseId, res.courseName, [], exercisesList, settings, JSON.parse(res.gameOptions))
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

const API = {
    login, getUserInfo, logout,
    getAllUsers, createUser, deleteUser, updateStudentId,
    getAllCourses, getCourse, createCourse, updateCourseSettings, updateCourseGameOptions, deleteCourse, getNonEnrolledStudents, enrollStudents, unenrollStudent, getCourseInfo, getStudentCourseInfo, updateStudentCourseInfo, getStudentCompletedExercises,
    addExercise, deleteExercise, updateExercise, createBoss, addSolution, updateSolution, deleteSolution, getStudentExerciseRecord, saveExerciseRecord, getStudentExerciseCompletion, completeStudentExercise, getStudentDiagrams,
    getRankingByExerciseCompleteness, getRankingByLevel, getRankingByCompletedExercises,
    getExampleErrors,
    getSandboxDiagrams, saveSandboxDiagram, updateSandboxDiagram, deleteSandboxDiagram
}
export default API