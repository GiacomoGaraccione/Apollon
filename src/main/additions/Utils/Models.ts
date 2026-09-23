import { UMLModel } from "../.."
import { User } from "../Components/Login/UserContext"
import { AvatarUnlockOptions } from "./AvatarUtils"
import { ClassDiagramReferenceSolution } from "./ClassDiagram/MatcherTypes"

class Course {
    courseId: string
    courseName: string
    students: User[]
    exercises: Exercise[]
    settings: AvatarUnlockOptions | null
    gameOptions: any | null
    gamified: boolean

    constructor(courseId: string, courseName: string, students: User[], exercises: Exercise[], settings: any, gameOptions: any | null = null, gamified: boolean = true) {
        this.settings = settings
        this.courseId = courseId
        this.courseName = courseName
        this.students = students
        this.exercises = exercises
        this.gameOptions = gameOptions
        this.gamified = gamified
    }
}

class Exercise {
    exerciseId: string
    title: string
    description: string
    level: number
    experience: number
    visible: boolean
    gamified: boolean
    exType: string
    boss: Boss | null
    solutions: Solution[] = []

    constructor(exerciseId: string, title: string, description: string, level: number, experience: number, visible: boolean, gamified: boolean, exType: string, boss: Boss | null = null, solutions: any[]) {
        this.boss = boss
        this.exerciseId = exerciseId
        this.title = title
        this.description = description
        this.level = level
        this.experience = experience
        this.visible = visible
        this.gamified = gamified
        this.exType = exType
        this.solutions = solutions
    }
}

class Boss {
    introDialogue: string
    victoryDialogue: string
    bossOptions: any

    constructor(introDialogue: string, victoryDialogue: string, bossOptions: any) {
        this.introDialogue = introDialogue
        this.victoryDialogue = victoryDialogue
        this.bossOptions = bossOptions
    }
}

class Solution {
    reference: ClassDiagramReferenceSolution
    model: UMLModel
    image: any
    solutionId: string

    constructor(reference: ClassDiagramReferenceSolution, model: UMLModel, image: any, solutionId: string) {
        this.image = image
        this.reference = reference
        this.model = model
        this.solutionId = solutionId
    }
}

class SandboxDiagram {
    model: UMLModel | string
    userId: string
    diagramId: string
    lastUpdated: string
    exerciseType: string
    filename: string

    constructor(model: UMLModel, userId: string, diagramId: string, lastUpdated: string, exerciseType: string, filename: string) {
        this.model = model
        this.userId = userId
        this.diagramId = diagramId
        this.lastUpdated = lastUpdated
        this.exerciseType = exerciseType
        this.filename = filename
    }
}

class ExamCall {
    examId: string
    title: string
    description: string
    startDate: string
    endDate: string
    courseId: string
    exercises: ExamExercise[]
    students: User[]

    constructor(examId: string, title: string, description: string, startDate: string, endDate: string, courseId: string, exercises: ExamExercise[] = [], students: User[] = []) {
        this.examId = examId
        this.title = title
        this.description = description
        this.startDate = startDate
        this.endDate = endDate
        this.courseId = courseId
        this.exercises = exercises
        this.students = students
    }
}

class ExamExercise {
    exerciseId: string
    title: string
    description: string
    exType: string
    examId: string

    constructor(exerciseId: string, title: string, description: string, exType: string, examId: string) {
        this.exerciseId = exerciseId
        this.title = title
        this.description = description
        this.exType = exType
        this.examId = examId
    }
}

class ExamSubmission {
    username: string
    exerciseId: string
    examId: string
    model: UMLModel | string | null
    lastUpdated: string | null

    constructor(username: string, exerciseId: string, examId: string, model: UMLModel | string | null, lastUpdated: string | null) {
        this.username = username
        this.exerciseId = exerciseId
        this.examId = examId
        this.model = model
        this.lastUpdated = lastUpdated
    }
}

class TeacherEvaluation {
    exerciseId: string
    studentId: string
    originalModel: string | null
    staticResult: string | null
    staticModel: string | null
    staticTime: number | null
    llmResult: string | null
    llmModel: string | null
    llmTime: number | null
    llmTokens: number | null
    timestamp: string

    constructor(exerciseId: string, studentId: string, originalModel: string | null, staticResult: string | null, staticModel: string | null, staticTime: number | null, llmResult: string | null, llmModel: string | null, llmTime: number | null, llmTokens: number | null, timestamp: string) {
        this.exerciseId = exerciseId
        this.studentId = studentId
        this.originalModel = originalModel
        this.staticResult = staticResult
        this.staticModel = staticModel
        this.staticTime = staticTime
        this.llmResult = llmResult
        this.llmModel = llmModel
        this.llmTime = llmTime
        this.llmTokens = llmTokens
        this.timestamp = timestamp
    }
}

export { Course, Exercise, Boss, Solution, SandboxDiagram, ExamCall, ExamExercise, ExamSubmission, TeacherEvaluation }