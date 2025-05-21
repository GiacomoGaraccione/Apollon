import React from "react"

const UserContext = React.createContext<User | undefined>(undefined)

class User {
    userId: string
    username: string
    name: string
    surname: string
    role: Roles
    courses: string[]

    constructor(userId: string, username: string, name: string, surname: string, role: string, courses: string[] = []) {
        this.userId = userId
        this.username = username
        this.name = name
        this.surname = surname
        this.role = role as Roles
    }
}

enum Roles {
    STUDENT = "Student",
    TEACHER = "Teacher",
}

export { UserContext, User, Roles }