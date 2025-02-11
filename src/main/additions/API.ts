const URL = "http://localhost:5000/"

async function getAllExercises() {
    const response = await fetch(URL + "exercises")
    return response.json()
}

async function createExercise(title: string, description: string) {
    const response = await fetch(URL + "exercises", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, description })
    })
    return response.json()
}

async function updateExercise(originalTitle: string, title: string, description: string) {
    const response = await fetch(URL + "exercises/" + originalTitle, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, description })
    })
    return response.json()
}

async function saveExercise(title: string, solution: string) {
    const response = await fetch(URL + "exercises", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, solution })
    })
    return response.json()
}

async function uploadStudentDiagram(title: string, name: string, model: string) {
    const response = await fetch(URL + "exercises/" + title + "/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, model })
    })
    return response.json()
}

async function getExercise(title: string) {
    const response = await fetch(URL + "exercises/" + title)
    return response.json()
}

async function saveDiagram(title: string, name: string, content: string) {
    const response = await fetch(URL + "exercises/" + title, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, content })
    })
    return response.json()
}

async function getExerciseDiagrams(title: string) {
    const response = await fetch(URL + "exercises/" + title + "/diagrams")
    return response.json()
}

async function evaluateSimilarity(referenceSolution: any, studentModel: any) {
    const response = await fetch(URL + "compute-similarity", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ studentModel: studentModel, referenceSolution: referenceSolution })
    })
    return response.json()
}

async function submitText(title: string, text: string) {
    const response = await fetch(URL + "exercises/" + title + "/text", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    })
    return response.json()
}

async function saveUMLReference(title: string, model: string) {
    const response = await fetch(URL + "exercises/" + title + "/reference", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ solution: model })
    })
    return response.json()
}


const API = {
    getAllExercises,
    createExercise,
    updateExercise,
    uploadStudentDiagram,
    saveExercise,
    getExercise,
    saveDiagram,
    getExerciseDiagrams,
    evaluateSimilarity,
    submitText,
    saveUMLReference
}
export default API