import { User } from "../Components/Login/UserContext"

class Course {
    courseId: string
    courseName: string
    students: User[]
    exercises: Exercise[]

    constructor(courseId: string, courseName: string, students: User[], exercises: Exercise[]) {
        this.courseId = courseId
        this.courseName = courseName
        this.students = students
        this.exercises = exercises
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
    boss: Boss | null

    constructor(exerciseId: string, title: string, description: string, level: number, experience: number, visible: boolean, gamified: boolean, boss: Boss | null = null) {
        this.boss = boss
        this.exerciseId = exerciseId
        this.title = title
        this.description = description
        this.level = level
        this.experience = experience
        this.visible = visible
        this.gamified = gamified
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

export { Course, Exercise, Boss }