export type ExamStatus = "upcoming" | "ongoing" | "ended"

export function parseExamTimestamp(value: string): number {
    return new Date(value.replace(" ", "T")).getTime()
}

export function getExamStatus(startDate: string, endDate: string): ExamStatus {
    const now = Date.now()
    const start = parseExamTimestamp(startDate)
    const end = parseExamTimestamp(endDate)
    if (now < start) return "upcoming"
    if (now > end) return "ended"
    return "ongoing"
}

export function examStatusColor(status: ExamStatus): string {
    switch (status) {
        case "upcoming": return "yellow"
        case "ongoing": return "green"
        case "ended": return "gray"
    }
}

export function examStatusLabel(status: ExamStatus): string {
    switch (status) {
        case "upcoming": return "Upcoming"
        case "ongoing": return "Ongoing"
        case "ended": return "Ended"
    }
}
