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

    constructor(courseId: string, courseName: string, students: User[], exercises: Exercise[], settings: any, gameOptions: any | null = null) {
        this.settings = settings
        this.courseId = courseId
        this.courseName = courseName
        this.students = students
        this.exercises = exercises
        this.gameOptions = gameOptions
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

export { Course, Exercise, Boss, Solution, SandboxDiagram }