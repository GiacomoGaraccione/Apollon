import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Center, Text, Modal, Fieldset, Tabs, Grid, Notification, Stack, TextInput, Group, Avatar, RingProgress, Drawer, List, ThemeIcon, Highlight, Divider, Progress, Skeleton, Popover } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconCircleDashedCheck, IconCloudUpload, IconDownload, IconExclamationCircle, IconFileDescriptionFilled, IconMedal, IconMenu4, IconReload, IconSquareXFilled, IconTrophyFilled, IconUpload, IconUserUp, IconX } from "@tabler/icons-react";
import { Exercise } from "../../Utils/Models";
import { useNavigate, useParams } from "react-router-dom";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts } from "@dicebear/collection";
import { ApollonMode, UMLDiagramType } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { ClassDiagramEvaluationResults } from "../../Utils/ClassDiagram/EvaluationTypes";
import "csshake/dist/csshake.css"
import { Shake, ShakeCrazy } from "reshake"
import { Dropzone } from "@mantine/dropzone";
import 'svg2pdf.js'
import jsPDF from "jspdf";
import { Canvg } from "canvg";
import Leaderboard from "./Leaderboard";
import { ClassDiagramMatchingElementsList, ClassDiagramSemanticErrorsList, ClassDiagramSyntaxErrorsList } from "../Common/FeedbackLists";
import { colorClassDiagram, colorUseCaseDiagram, resetColorsClassDiagram } from "../../Utils/Feedback";
import { MatchingElement, MatchingRelationship, UseCaseDiagramEvaluationResults } from "../../Utils/UseCaseDiagram/EvaluationTypes";
import { ProgressBlock } from "../Common/ProgressBlock";
import { AvatarBlock } from "../Common/AvatarBlock";
import { FeedbackBlock } from "../Common/FeedbackBlock";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false,
    enablePopups: true
}

function ExercisePage() {
    const user = useContext(UserContext)
    const { courseId, exerciseId } = useParams()
    const [gamified, setGamified] = useState(false)
    const [studentInfo, setStudentInfo] = useState<any>(null)
    const [bossSettings, setBossSettings] = useState<any>(null)
    const [bossString, setBossString] = useState("")
    const [courseInfo, setCourseInfo] = useState<any | null>(null)
    const [avatarOptions, setAvatarOptions] = useState<any>(null)
    const [avatarString, setAvatarString] = useState<string>("")
    const [editor, setEditor] = useState<ApollonEditor>()
    const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false)
    const [resultsOpened, { open: openResults, close: closeResults }] = useDisclosure(false)
    const [exitOpened, { open: openExit, close: closeExit }] = useDisclosure(false)
    const [clearOpened, { open: openClear, close: closeClear }] = useDisclosure(false)
    const [resetOpened, { open: openReset, close: closeReset }] = useDisclosure(false)
    const [completeOpened, { open: openComplete, close: closeComplete }] = useDisclosure(false)
    const [exercise, setExercise] = useState<Exercise | null>(null)
    const [checking, setChecking] = useState<boolean>(false)
    const [results, setResults] = useState<ClassDiagramEvaluationResults>(new ClassDiagramEvaluationResults())
    const [useCaseResults, setUseCaseResults] = useState<UseCaseDiagramEvaluationResults>(new UseCaseDiagramEvaluationResults())
    const [mood, setMood] = useState<string>("Neutral")
    const [shaker, setShaker] = useState<string>("")
    const [shakeProps, setShakeProps] = useState<any>({})
    const [bossShake, setBossShake] = useState<boolean>(false)
    const [bossDefeated, setBossDefeated] = useState<boolean>(false)
    const [filename, setFilename] = useState<string>("")
    const openRef = useRef<() => void>(null)
    const [uploaded, setUploaded] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [completed, setCompleted] = useState<boolean>(false)
    const [completeResults, setCompleteResults] = useState<any>(null)
    const [completionRecord, setCompletionRecord] = useState<any>(null)
    const [load, setLoad] = useState<boolean>(true)
    const [dialogue, setDialogue] = useState<string>("")
    const navigate = useNavigate()

    useEffect(() => {
        if (user && courseId && exerciseId) {
            API.getCourseInfo(courseId).then((course) => {
                setCourseInfo(course)
                let ex = course.exercises.find((ex) => ex.exerciseId === exerciseId)
                if (ex) {
                    setExercise(ex)
                    setGamified(ex.gamified)
                    let opts = JSON.parse(ex.boss?.bossOptions)
                    setBossSettings(opts)
                    setDialogue(ex.boss?.introDialogue || "")
                    let bossStr = createAvatar(bottts, opts).toString()
                    setBossString(`data:image/svg+xml;utf8,${encodeURIComponent(bossStr)}`)
                    API.getStudentCourseInfo(courseId, user.username).then(async (studentCourse) => {
                        setStudentInfo(studentCourse.info)
                        let avatarOpts = JSON.parse(studentCourse.info.avatar)
                        setAvatarOptions(avatarOpts)
                        let svg = createAvatar(avataaars, { ...avatarOpts, style: ["default"], mouth: ["serious"], eyes: ["side"] }).toString()
                        setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
                        try {
                            let cont = document.getElementById("apollon");
                            if (cont) {
                                let ed = new ApollonEditor(cont, { ...options, type: ex.exType as UMLDiagramType, });
                                setEditor(ed)
                            }
                        } catch (error) {
                            console.error("Error creating Apollon editor:", error);
                        }
                        API.getStudentExerciseRecord(courseId, exerciseId, user.username).then((res) => {
                            handleFeedback(res, false, ex.exType as UMLDiagramType)
                            API.getStudentExerciseCompletion(courseId, exerciseId, user.username).then((comp) => {
                                setCompletionRecord(comp.log)
                                if (comp.log) {
                                    setBossShake(true)
                                    setDialogue(ex.boss?.victoryDialogue || "")
                                    setTimeout(() => {
                                        setDialogue("")
                                        setBossDefeated(true)
                                        setBossShake(false)
                                    }, 10000)
                                } else {
                                    setDialogue(ex.boss?.introDialogue || "")
                                    setTimeout(() => {
                                        setDialogue("")
                                        setBossDefeated(false)
                                    }, 10000)
                                }
                            }).catch((err) => {
                                setDialogue(ex.boss?.introDialogue || "")
                                setTimeout(() => {
                                    setDialogue("")
                                    setBossDefeated(false)
                                }, 10000)
                                setCompletionRecord(null)
                            })
                        }).catch((err) => {
                            setResults({ ...results, oldXP: ex.experience, newXP: ex.experience, oldProgress: 0, newProgress: 0 });
                        })
                        setLoad(false)
                    })
                }
            })
        }
    }, [])

    const handleFeedback = (res: any, afterCheck: boolean, exType: UMLDiagramType) => {
        try {
            let r = undefined
            if (exType === UMLDiagramType.ClassDiagram) {
                r = new ClassDiagramEvaluationResults()
            } else {
                r = new UseCaseDiagramEvaluationResults()
            }
            if (r) {
                let data = afterCheck ? res : res.data
                console.log(data)
                if (afterCheck) {
                    r.oldXP = results.newXP
                    r.newXP = data.experience
                    r.oldProgress = results.newProgress
                    r.newProgress = data.correctness
                    r.oldSyntaxErrors = results.newSyntaxErrors
                    r.newSyntaxErrors = JSON.parse(data.syntax_errors || "[]")
                    r.oldSemanticErrors = results.newSemanticErrors
                    r.newSemanticErrors = JSON.parse(data.semantic_errors || "[]")
                    r.results = JSON.parse(data.results || "{}")
                    handleMoodChange(r)
                    setCompleted(data.correctness >= 75)
                } else {
                    r.oldXP = data.experience
                    r.newXP = data.experience
                    r.oldProgress = data.correctness
                    r.newProgress = data.correctness
                    r.oldSyntaxErrors = JSON.parse(data.syntax_errors || "[]")
                    r.newSyntaxErrors = JSON.parse(data.syntax_errors || "[]")
                    r.oldSemanticErrors = JSON.parse(data.semantic_errors || "[]")
                    r.newSemanticErrors = JSON.parse(data.semantic_errors || "[]")
                    r.results = JSON.parse(data.results || "{}")
                }
                if (exType === UMLDiagramType.ClassDiagram) {
                    setResults(r as ClassDiagramEvaluationResults)
                } else if (exType === UMLDiagramType.UseCaseDiagram) {
                    if (Object.keys(r.results).length === 0) {
                        r.results = {
                            matchingElements: [] as MatchingElement[],
                            matchingRelationships: [] as MatchingRelationship[]
                        }
                    }
                    setUseCaseResults(r as UseCaseDiagramEvaluationResults)
                }
                let model = JSON.parse(data.model)
                model = resetColorsClassDiagram(model)
                switch (exType) {
                    case UMLDiagramType.UseCaseDiagram:
                        model = colorUseCaseDiagram(model, r.newSyntaxErrors, r.newSemanticErrors, r.results)
                        break;
                    case UMLDiagramType.DeploymentDiagram:
                        console.log("Deployment Diagram coloring not implemented yet");
                        break;
                    case UMLDiagramType.ClassDiagram:
                        model = colorClassDiagram(model, r.newSyntaxErrors, r.newSemanticErrors, r)
                        break;
                    default:
                        break;
                }
                let cont = document.getElementById("apollon");
                if (cont) {
                    let ed = new ApollonEditor(cont, { ...options, type: exercise ? exercise.exType as UMLDiagramType : res.exerciseType, model: model });
                    setEditor(ed);
                }
            }
        } catch (error) {
            console.error("Error handling feedback:", error);
        }
    }

    const handleMoodChange = (res: ClassDiagramEvaluationResults) => {
        if (exercise) {
            let progDiff = res.newProgress - res.oldProgress
            let xpDiff = res.newXP - res.oldXP
            let fixedErrors = res.oldSyntaxErrors.filter(
                (oldErr: any) => !res.newSyntaxErrors.some(
                    (newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length +
                res.oldSemanticErrors.filter(
                    (oldErr: any) => !res.newSemanticErrors.some(
                        (newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length
            let newErrors = res.newSyntaxErrors.filter(
                (newErr: any) => !res.oldSyntaxErrors.some(
                    (oldErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length +
                res.newSemanticErrors.filter(
                    (newErr: any) => !res.oldSemanticErrors.some(
                        (oldErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length
            let xpMood =
                xpDiff >= 0.5 * exercise.experience ? "Ecstatic" :
                    xpDiff >= 0.25 * exercise.experience ? "Happy" :
                        xpDiff > 0 ? "Content" :
                            xpDiff === 0 ? "Neutral" :
                                xpDiff >= -0.25 * exercise.experience ? "Worried" :
                                    xpDiff >= -0.5 * exercise.experience ? "Upset" :
                                        xpDiff < -0.5 * exercise.experience ? "Defeated" :
                                            "Neutral";

            let progressMood =
                progDiff >= 50 ? "Ecstatic" :
                    progDiff >= 25 ? "Happy" :
                        progDiff > 0 ? "Content" :
                            progDiff === 0 ? "Neutral" :
                                progDiff >= -25 ? "Worried" :
                                    progDiff >= -50 ? "Upset" :
                                        progDiff < -50 ? "Defeated" :
                                            "Neutral";

            let errorMood =
                (newErrors === 0 && fixedErrors >= 10) ? "Ecstatic" :
                    (newErrors <= 10 && fixedErrors >= 5) ? "Happy" :
                        (newErrors > 0 && newErrors <= 5 && fixedErrors >= 2) ? "Content" :
                            (newErrors > 5 && newErrors <= 10 && fixedErrors <= 2) ? "Worried" :
                                (newErrors > 10 && newErrors <= 15 && fixedErrors === 0) ? "Upset" :
                                    (newErrors > 15 && fixedErrors === 0) ? "Defeated" :
                                        "Neutral"


            const moodOrder = ["Ecstatic", "Happy", "Content", "Neutral", "Worried", "Upset", "Defeated"]
            let moods = [xpMood, progressMood, errorMood]
            const avgMoodIndex = Math.round(
                moods.reduce((sum, mood) => sum + moodOrder.indexOf(mood), 0) / moods.length
            )
            let newMood = moodOrder[avgMoodIndex] || "Neutral"
            let newMouth = newMood === "Ecstatic" ? ["tongue"] :
                newMood === "Happy" ? ["smile"] :
                    newMood === "Content" ? ["twinkle"] :
                        newMood === "Neutral" ? ["serious"] :
                            newMood === "Worried" ? ["concerned"] :
                                newMood === "Upset" ? ["screamOpen"] :
                                    ["vomit"]
            let newEyes = newMood === "Ecstatic" ? ["hearts"] :
                newMood === "Happy" ? ["winkWacky"] :
                    newMood === "Content" ? ["happy"] :
                        newMood === "Neutral" ? ["side"] :
                            newMood === "Worried" ? ["surprised"] :
                                newMood === "Upset" ? ["cry"] :
                                    ["xDizzy"]
            let svg = createAvatar(avataaars, { ...avatarOptions, style: ["default"], mouth: newMouth, eyes: newEyes }).toString()
            setAvatarString(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
            setMood(newMood || "Neutral")
            let shakeOptions = {
                h: newMood === "Worried" ? 2 : newMood === "Upset" ? 8 : 14,
                v: newMood === "Worried" ? 1 : newMood === "Upset" ? 6 : 10,
                r: newMood === "Worried" ? 0 : newMood === "Upset" ? 6 : 12,
                dur: newMood === "Worried" ? 100 : newMood === "Upset" ? 100 : 80,
                int: newMood === "Worried" ? 10 : newMood === "Upset" ? 20 : 10,
                fixed: true,
                active: newMood === "Worried" || newMood === "Upset" || newMood === "Defeated"
            }
            setShakeProps(shakeOptions)
            setShaker(newMood === "Worried" ? "shake-little shake-constant" : newMood === "Upset" ? "shake-hard shake-constant" : newMood === "Defeated" ? "shake-crazy shake-constant" : "")
            setTimeout(() => {
                setShaker("")
                setShakeProps({})
            }, 3000)
        }
    }

    const evaluate = () => {
        try {
            setChecking(true)
            if (courseId && exerciseId && user && editor) {
                API.saveExerciseRecord(courseId, exerciseId, user.username, editor.model, true).then((res: any) => {
                    console.log(res)
                    setChecking(false)
                    handleFeedback(res.record, true, exercise!.exType as UMLDiagramType)
                    openResults()
                }).catch((err) => {
                    console.error(err)
                })
            }
        } catch (error) {
            console.error("Error evaluating exercise:", error);
        }
    }

    const checkCompleted = () => {
        try {
            if (!completed) return
            if (courseId && exerciseId && user && exercise) {
                API.getStudentExerciseCompletion(courseId, exerciseId, user.username).then((res: any) => {
                    if (!res.completed) {
                        API.getStudentExerciseRecord(courseId, exerciseId, user.username).then((record: any) => {
                            let checkMult = 1
                            let progressMult = 1
                            let levelDiffMult = 1
                            let diff = exercise.level - studentInfo.level > 0 ? exercise.level - studentInfo.level : 0
                            if (courseInfo && courseInfo.gameOptions) {
                                let found = courseInfo.gameOptions.checks.settings.find(
                                    (setting: any) => Array.isArray(setting.range) && setting.range.length === 2 && record.checks >= setting.range[0] && record.checks <= setting.range[1]
                                )
                                if (found && typeof found.multiplier !== "undefined") {
                                    checkMult = found.multiplier
                                }
                                found = courseInfo.gameOptions.progress.settings.find(
                                    (setting: any) => Array.isArray(setting.range) && setting.range.length === 2 && results.newProgress >= setting.range[0] && results.newProgress <= setting.range[1]
                                )
                                if (found && typeof found.multiplier !== "undefined") {
                                    progressMult = found.multiplier
                                }
                                if (results.newProgress === 75) progressMult = 1
                                found = courseInfo.gameOptions.difference.settings.find(
                                    (setting: any) => Array.isArray(setting.range) && setting.range.length === 2 && diff >= setting.range[0] && diff <= setting.range[1]
                                )
                                if (found && typeof found.multiplier !== "undefined") {
                                    levelDiffMult = found.multiplier
                                }
                                if (diff === 0) levelDiffMult = 1
                            }
                            let reward = Math.round(results.newXP * checkMult * progressMult * levelDiffMult)
                            if (reward < 0) reward = results.newXP
                            let rescaled = false
                            if (reward > exercise.experience * 3) {
                                rescaled = true
                                reward = exercise.experience * 3
                            }
                            let userXp = studentInfo.experience + reward
                            let found = courseInfo.gameOptions.levels.find(
                                (level: any) => level.min <= userXp && userXp <= level.max
                            )
                            let completeRes = {
                                checkMult: checkMult,
                                checks: record.checks,
                                progressMult: progressMult,
                                progress: results.newProgress,
                                levelDiffMult: levelDiffMult,
                                difference: diff,
                                reward: reward,
                                newLevel: studentInfo.level,
                                newXp: userXp,
                                levelUp: false,
                                levelInfo: null as any,
                                maxLevel: false,
                                unlockedKeys: {} as any,
                                rescaled: rescaled
                            }
                            if (found) {
                                completeRes.newLevel = found.level
                                completeRes.levelInfo = found
                                if (found.level > studentInfo.level) completeRes.levelUp = true
                            } else {
                                completeRes.levelUp = false
                                completeRes.newLevel = studentInfo.level
                                completeRes.levelInfo = {
                                    min: courseInfo.gameOptions!.levels[courseInfo.gameOptions!.levels.length - 1].max,
                                    max: userXp,
                                    level: courseInfo.gameOptions!.levels[courseInfo.gameOptions!.levels.length - 1].level
                                }
                                completeRes.maxLevel = true
                            }
                            if (found) {
                                if (found.level > studentInfo.level) {
                                    let newLevels: number[] = []
                                    for (let lvl = studentInfo.level + 1; lvl <= found.level; lvl++) {
                                        const levelInfo = courseInfo.gameOptions.levels.find((l: any) => l.level === lvl);
                                        if (levelInfo) {
                                            newLevels.push(levelInfo.level)
                                        }
                                    }
                                    Object.entries(courseInfo.settings).forEach(([key, arr]) => {
                                        if (Array.isArray(arr)) {
                                            arr.forEach((item: any) => {
                                                if (
                                                    item.unlockConditions &&
                                                    Array.isArray(item.unlockConditions) &&
                                                    item.unlockConditions[0] &&
                                                    newLevels.includes(item.unlockConditions[0].minLevel)
                                                ) {
                                                    if (!completeRes.unlockedKeys) completeRes.unlockedKeys = {};
                                                    if (!completeRes.unlockedKeys[key]) completeRes.unlockedKeys[key] = [];
                                                    completeRes.unlockedKeys[key].push(item.key);
                                                }
                                            });
                                        }
                                    });
                                }
                            }

                            setCompleteResults(completeRes)
                            API.completeStudentExercise(courseId, exerciseId, user.username, reward).then((res: any) => {
                                setCompletionRecord(res.log)
                                API.updateStudentCourseInfo(courseId, user.username, completeRes.newLevel, userXp, JSON.parse(studentInfo.avatar))
                            })
                            openComplete()
                        })
                    }
                })
            }
        } catch (error) {
            console.error("Error checking completion:", error);
        }
    }

    const exportJSON = () => {
        if (editor && exercise) {
            let model = { ...editor.model }
            Object.keys(model.elements).forEach((key) => {
                let element = model.elements[key]
                element.strokeColor = "#000000"
                element.textColor = "#000000"
                element.fillColor = "#FFFFFF"
            })
            Object.keys(model.relationships).forEach((key) => {
                let element = model.relationships[key]
                element.strokeColor = "#000000"
                element.textColor = "#000000"
            })
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(model, null, 2));
            const link = document.createElement('a');
            link.href = dataStr
            let fn = filename || `${exercise.title}-${new Date().toLocaleString()}`
            link.download = `${fn}.json`;
            link.click();
            link.remove()
        }
    }

    const exportSVG = () => {
        if (editor && exercise) {
            const download = async () => {
                let model = { ...editor.model }
                Object.keys(model.elements).forEach((key) => {
                    let element = model.elements[key]
                    element.strokeColor = "#000000"
                    element.textColor = "#000000"
                    element.fillColor = "#FFFFFF"
                })
                Object.keys(model.relationships).forEach((key) => {
                    let element = model.relationships[key]
                    element.strokeColor = "#000000"
                    element.textColor = "#000000"
                })
                let newDiv = document.createElement("div");
                let ed = new ApollonEditor(newDiv, { ...options, type: exercise ? exercise.exType as UMLDiagramType : "ClassDiagram", model: model })
                await ed.nextRender
                const { svg } = await ed.exportAsSVG({ keepOriginalSize: true, margin: 20 });
                const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                const svgBlobURL = URL.createObjectURL(svgBlob);

                const link = document.createElement('a');
                link.href = svgBlobURL
                let fn = filename || `${exercise.title}-${new Date().toLocaleString()}`
                link.download = `${fn}.svg`;
                link.click();
                link.remove()
                newDiv.remove()
                ed.destroy()
            }
            download()
        }
    }

    const exportPDF = () => {
        if (editor && exercise) {
            const download = async () => {
                let model = { ...editor.model }
                Object.keys(model.elements).forEach((key) => {
                    let element = model.elements[key]
                    element.strokeColor = "#000000"
                    element.textColor = "#000000"
                    element.fillColor = "#FFFFFF"
                })
                Object.keys(model.relationships).forEach((key) => {
                    let element = model.relationships[key]
                    element.strokeColor = "#000000"
                    element.textColor = "#000000"
                })
                let newDiv = document.createElement("div");
                let ed = new ApollonEditor(newDiv, { ...options, type: exercise ? exercise.exType as UMLDiagramType : "ClassDiagram", model: model })
                await ed.nextRender
                const { svg } = await ed.exportAsSVG({ keepOriginalSize: true, margin: 20 });
                const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
                const url = URL.createObjectURL(blob);
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0)
                    const pndDataUrl = canvas.toDataURL('image/png')
                    const doc = new jsPDF({
                        orientation: img.width > img.height ? 'landscape' : 'portrait',
                        unit: 'pt',
                        format: [img.width, img.height],
                    })
                    doc.addImage(pndDataUrl, 'PNG', 0, 0, img.width, img.height);
                    let fn = filename || `${exercise.title}-${new Date().toLocaleString()}`;
                    doc.save(`${fn}.pdf`);

                    URL.revokeObjectURL(url)
                    newDiv.remove()
                    ed.destroy()
                    canvas.remove()
                }
                img.onerror = (err) => {
                    console.error("Error loading SVG image:", err)
                    URL.revokeObjectURL(url)
                    newDiv.remove()
                    ed.destroy()
                }
                img.src = url
            }
            download()
        }
    }

    const handleDrop = (files: File[]) => {
        if (files.length !== 1) {
            return
        } else {
            const fileReader = new FileReader()
            fileReader.onload = (e) => {
                try {
                    let cont = document.getElementById("apollon");
                    if (cont) {
                        let ed = new ApollonEditor(cont, { ...options, type: exercise ? exercise.exType as UMLDiagramType : "ClassDiagram", model: JSON.parse(e.target?.result as string) });
                        setEditor(ed)
                        setUploaded(true)
                        setTimeout(() => {
                            setUploaded(false)
                        }, 3000)
                    }
                } catch (error) {
                    console.error("Error reading file:", error)
                }
            }
            fileReader.readAsText(files[0])
        }
    }

    return (
        <>
            <Stack align="center" justify="center" >
                {gamified && <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                    <>
                        <Grid.Col span={4}>
                            <AvatarBlock load={load} gamified={gamified} bossDefeated={bossDefeated} avatarUrl={avatarString} mood={mood} bossUrl={bossString} dialogue={dialogue} />
                        </Grid.Col>
                        <Grid.Col span={4}>
                            {exercise && exercise.exType === UMLDiagramType.ClassDiagram && <ProgressBlock load={load} results={results} completionRecord={completionRecord} exercise={exercise!} />}
                            {exercise && exercise.exType === UMLDiagramType.UseCaseDiagram && <ProgressBlock load={load} results={useCaseResults} completionRecord={completionRecord} exercise={exercise!} />}
                        </Grid.Col>
                        <Grid.Col span={4}>
                            {exercise && <FeedbackBlock load={load} results={exercise.exType === UMLDiagramType.ClassDiagram ? results : useCaseResults} exerciseType={exercise.exType} />}
                        </Grid.Col>

                    </>
                </Grid>}
                <div id="apollon" className="canv" style={{ height: "80vh", width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
                <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                    <Grid.Col span={4}>
                        <Center>
                            <Button variant="light" color="indigo" onClick={openMenu} leftSection={<IconMenu4 size={14} />} >Menu</Button>
                        </Center>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Center>
                            <Button variant="light" color="cyan" leftSection={<IconUpload size={14} />} onClick={() => {
                                setSaving(true)
                                if (courseId && exerciseId && user && editor) {
                                    API.saveExerciseRecord(courseId, exerciseId, user?.username, editor?.model, false).then((res) => {
                                        setSaving(false)
                                    })
                                }
                            }} >Save</Button>
                            <Button variant="light" color="green" onClick={evaluate} leftSection={<IconCircleDashedCheck size={14} />} >Check</Button>
                            <Button variant="light" color="red" onClick={openExit} leftSection={<IconSquareXFilled size={14} />}>Exit</Button>
                        </Center>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Center>
                            <Button variant="light" color="yellow" onClick={openReset} leftSection={<IconReload size={14} />}>Restore last</Button>
                            <Button variant="light" color="red" onClick={openClear} leftSection={<IconSquareXFilled size={14} />} >Erase all</Button>
                        </Center>
                    </Grid.Col>
                </Grid>
            </Stack>


            <Drawer opened={menuOpened} onClose={closeMenu} size={"lg"} offset={10} radius={"md"} position="right" >
                {exercise && (
                    <Tabs defaultValue={"Description"}>
                        <Tabs.List >
                            <Tabs.Tab value="Description" leftSection={<IconFileDescriptionFilled size={15} />} >Description</Tabs.Tab>
                            <Tabs.Tab value="Leaderboard" leftSection={<IconMedal size={15} />}  >Leaderboard</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel value="Description" pt="xs">
                            <Text fw={700} fs="italic" td="underline" >{exercise.title}</Text>
                            <Divider my="xs" />
                            <Fieldset legend="Exercise Description">
                                <Text style={{ maxHeight: "70vh", overflowY: "auto" }}>{exercise.description}</Text>
                            </Fieldset>
                            <Divider my="xs" />
                            <Fieldset legend="Download">
                                <TextInput placeholder="Filename" value={filename} onChange={(e) => setFilename(e.currentTarget.value)} />
                                <Stack align="center" justify="center">
                                    <Button variant="light" color="yellow" onClick={exportJSON} leftSection={<IconDownload size={14} />} >Download JSON source file</Button>
                                    <Button variant="light" color="cyan" onClick={exportSVG} leftSection={<IconDownload size={14} />}>Download diagram as SVG image</Button>
                                    <Button variant="light" color="pink" onClick={exportPDF} leftSection={<IconDownload size={14} />}>Download diagram as PDF file</Button>
                                </Stack>
                            </Fieldset>

                            <Divider my="xs" />
                            <Dropzone onDrop={(files) => handleDrop(files)} accept={["application/json"]} className="dropzone" radius="md" maxSize={30 * 1024 ** 2}>
                                <div style={{ pointerEvents: "none" }}>
                                    <Fieldset legend="Import JSON file" style={{ pointerEvents: "none" }}>
                                        <Group justify='center' align='center'>
                                            <Dropzone.Accept>
                                                <IconDownload size={50} color="blue" stroke={1.5} />
                                            </Dropzone.Accept>
                                            <Dropzone.Reject>
                                                <IconX size={50} color="red" stroke={1.5} />
                                            </Dropzone.Reject>
                                            <Dropzone.Idle>
                                                <IconCloudUpload size={50} color="gray" stroke={1.5} />
                                            </Dropzone.Idle>
                                        </Group>
                                        <Text ta="center" fw={700} fz="lg" mt="xl">
                                            <Dropzone.Accept>File accepted</Dropzone.Accept>
                                            <Dropzone.Reject>File not valid</Dropzone.Reject>
                                            <Dropzone.Idle>Upload source file</Dropzone.Idle>
                                        </Text>
                                        <Text ta="center" fz="sm" mt="xs" c="dimmed">
                                            Drag&apos;n&apos;drop a JSON file here to load a diagram into the editor.
                                        </Text>
                                    </Fieldset>
                                </div>
                            </Dropzone>
                        </Tabs.Panel>
                        <Tabs.Panel value="Leaderboard" pt="xs">
                            <Fieldset legend="Ranking by Exercise Completeness">
                                <Leaderboard ranking={"exercise"} />

                            </Fieldset>
                        </Tabs.Panel>
                    </Tabs>
                )}
            </Drawer>

            <Modal opened={resultsOpened} onClose={() => {
                closeResults()
                checkCompleted()
            }} size={"lg"} radius={"md"} title="Exercise Results">
                <List spacing={"md"} size="lg" center>
                    <List.Item icon={<ThemeIcon size="lg" color="green">
                        <IconCircleDashedCheck size={24} />
                    </ThemeIcon>}>
                        <Highlight highlight={["changed", "increased", "reduced", results.newProgress.toString(), results.oldProgress.toString()]} highlightStyles={{
                            backgroundColor: results.newProgress < results.oldProgress ? "var(--mantine-color-red-5)" : "var(--mantine-color-green-5)",
                            fontWeight: 700,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}  >
                            {results.newProgress !== results.oldProgress ?
                                `Exercise correctness ${results.newProgress > results.oldProgress ? "increased" : "reduced"} from ${results.oldProgress.toString()} to ${results.newProgress.toString()}`
                                : "There are no changes in the correctness of your diagram since the last evaluation."}
                        </Highlight>
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="blue">
                        <IconUserUp size={24} />
                    </ThemeIcon>} >
                        <Highlight highlight={["changed", "increased", "reduced", results.newXP.toString(), results.oldXP.toString()]} highlightStyles={{
                            backgroundColor: results.newXP < results.oldXP ? "var(--mantine-color-red-5)" : "var(--mantine-color-green-5)",
                            fontWeight: 700,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }} >
                            {results.newXP !== results.oldXP ?
                                `Available experience ${results.newXP > results.oldXP ? "increased" : "reduced"} from ${results.oldXP.toString()} to ${results.newXP.toString()}`
                                : "There are no changes in the available experience since the last evaluation."}
                        </Highlight>
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="red">
                        <IconExclamationCircle size={24} />
                    </ThemeIcon>}>
                        {results.newSyntaxErrors.filter(
                            (newErr: any) =>
                                !results.oldSyntaxErrors.some(
                                    (oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr)
                                )
                        ).length > 0 ? <Highlight highlight={[results.newSyntaxErrors.filter((newErr: any) => !results.oldSyntaxErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length.toString()]} highlightStyles={{
                            backgroundColor: "var(--mantine-color-red-5)",

                            fontWeight: 700,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {`There are ${results.newSyntaxErrors.filter((newErr: any) => !results.oldSyntaxErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length} new syntax errors compared to the previous evaluation.`}
                        </Highlight> : <Text>There are no new syntax errors compared to the previous evaluation.</Text>}
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="red">
                        <IconExclamationCircle size={24} />
                    </ThemeIcon>}>
                        {results.newSemanticErrors.filter((newErr: any) => !results.oldSemanticErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length > 0 ?
                            <Highlight highlight={[results.newSemanticErrors.filter((newErr: any) => !results.oldSemanticErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length.toString()]} highlightStyles={{
                                backgroundColor: "var(--mantine-color-red-5)",

                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {`There are ${results.newSemanticErrors.filter((newErr: any) => !results.oldSemanticErrors.some((oldErr: any) => JSON.stringify(oldErr) === JSON.stringify(newErr))).length} new semantic errors compared to the previous evaluation.`}
                            </Highlight> : <Text>There are no new semantic errors compared to the previous evaluation.</Text>}
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="lime">
                        <IconCheck size={24} />
                    </ThemeIcon>}>
                        {results.oldSyntaxErrors.filter((oldErr: any) => !results.newSyntaxErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length > 0 ?
                            <Highlight highlight={[results.oldSyntaxErrors.filter((oldErr: any) => !results.newSyntaxErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length.toString()]} highlightStyles={{
                                backgroundColor: "var(--mantine-color-green-5)",
                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {`You fixed ${results.oldSyntaxErrors.filter((oldErr: any) => !results.newSyntaxErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length} syntax error(s) that were found in the previous evaluation.`}
                            </Highlight> : <Text>You did not fix any syntax error that was found in the previous evaluation.</Text>}
                    </List.Item>
                    <List.Item icon={<ThemeIcon size="lg" color="lime">
                        <IconCheck size={24} />
                    </ThemeIcon>}>
                        {results.oldSemanticErrors.filter((oldErr: any) => !results.newSemanticErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length > 0 ?
                            <Highlight highlight={[results.oldSemanticErrors.filter((oldErr: any) => !results.newSemanticErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length.toString()]} highlightStyles={{
                                backgroundColor: "var(--mantine-color-orange-5)",
                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {`You fixed ${results.oldSemanticErrors.filter((oldErr: any) => !results.newSemanticErrors.some((newErr: any) => JSON.stringify(newErr) === JSON.stringify(oldErr))).length} semantic error(s) that were found in the previous evaluation.`}
                            </Highlight> : <Text>You did not fix any semantic error that was found in the previous evaluation.</Text>}
                    </List.Item>
                </List>
                <Divider my="md" />
                {mood === "Neutral" && <Highlight highlight={["neutral"]}
                    highlightStyles={{
                        backgroundColor: "var(--mantine-color-cyan-5)",
                        fontWeight: 700,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                    {`There have been no significant changes since the last evaluation, your mood is Neutral.`}
                </Highlight>}
                {(mood === "Happy" || mood === "Ecstatic" || mood === "Content") && <Highlight highlight={[mood]}
                    highlightStyles={{
                        backgroundColor: "var(--mantine-color-green-5)",
                        fontWeight: 700,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                    {`The changes you made since the last evaluation ${mood === "Content" ? "slightly" : mood === "Ecstatic" ? "vastly" : ""} improved the quality of your diagram, your mood is now ${mood}.`}
                </Highlight>}
                {(mood === "Worried" || mood === "Upset" || mood === "Defeated") && <Highlight highlight={[mood]}
                    highlightStyles={{
                        backgroundColor: "var(--mantine-color-red-5)",
                        fontWeight: 700,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                    {`The changes you made since the last evaluation ${mood === "Worried" ? "slightly" : mood === "Defeated" ? "vastly" : ""} lowered the quality of your diagram, your mood is now ${mood}.`}
                </Highlight>}
            </Modal>

            <Modal opened={exitOpened} onClose={closeExit} size="md" radius="md" title="Exit Exercise">
                <Text>Are you sure you want to exit the exercise and return to the course page?</Text>
                <Text>Unsaved changes will be lost!</Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="light" color="cyan" onClick={closeExit}>Continue</Button>
                    <Button variant="light" color="red" leftSection={<IconSquareXFilled size={14} />} onClick={() => navigate("/student/courses/" + courseId)} >Exit</Button>
                </Group>
            </Modal>

            <Modal opened={resetOpened} onClose={closeReset} size="md" radius="md" title="Reset Diagram">
                <Text>Are you sure you want to restore the last saved version of your diagram?</Text>
                <Text>All changes made since that version will be lost!</Text>
                <Text>Errors and found elements will be reset to what they were for that version.</Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="light" color="cyan" onClick={closeReset}>Continue</Button>
                    <Button variant="light" color="yellow" leftSection={<IconReload size={14} />} onClick={() => {
                        if (courseId && exerciseId && user) {
                            API.getStudentExerciseRecord(courseId, exerciseId, user.username).then((res) => {
                                handleFeedback(res, false, exercise!.exType as UMLDiagramType)
                                closeReset()
                            })
                        }
                    }} >Restore last version</Button>
                </Group>
            </Modal>

            <Modal opened={clearOpened} onClose={closeClear} size="md" radius="md" title="Clear Diagram">
                <Text>Are you sure you want to clear the current diagram?</Text>
                <Text>All changes will be lost!</Text>
                <Text>The saved diagram will not be affected by this action and errors will be reset</Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="light" color="cyan" onClick={closeClear}>Continue</Button>
                    <Button variant="light" color="red" leftSection={<IconSquareXFilled size={14} />} onClick={() => {
                        if (editor && exercise) {
                            let model = { ...editor.model }
                            model.elements = {}
                            model.relationships = {}
                            editor.model = model
                            let r = { ...results }
                            r.oldProgress = r.newProgress
                            r.oldXP = r.newXP
                            r.oldSyntaxErrors = r.newSyntaxErrors
                            r.oldSemanticErrors = r.newSemanticErrors
                            r.newProgress = 0
                            r.newXP = exercise.experience
                            r.newSyntaxErrors = []
                            r.newSemanticErrors = []
                            r.results = { matchingClasses: [] }
                            setResults(r)
                            closeClear()
                        }
                    }} >Clear</Button>
                </Group>
            </Modal>

            {completeResults && <Modal opened={completeOpened} onClose={() => {
                closeComplete()
                setBossShake(true)
                setDialogue(exercise!.boss?.victoryDialogue || "")
                setTimeout(() => {
                    setDialogue("")
                    setBossDefeated(true)
                    setBossShake(false)
                }, 10000)
            }} size="auto" radius="md" centered withCloseButton={false} >
                <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                    <Grid.Col span={6}>
                        <Text>Congratulations! You successfully completed this exercise!</Text>
                        <Divider my="sm" variant="dashed" />
                        <List spacing="md" size="md" center icon={<IconTrophyFilled color="gold" size={24} radius="xl" />} >
                            <List.Item>
                                <Highlight highlight={[completeResults.progress.toString(), completeResults.progressMult.toString(), "%"]}
                                    highlightStyles={{
                                        backgroundColor: "var(--mantine-color-green-5)",
                                        fontWeight: 700,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}>{`Your completeness score was: ${completeResults.progress.toString()}% - XP multiplier bonus: ${completeResults.progressMult.toString()}`}</Highlight>
                            </List.Item>
                            <List.Item>
                                <Highlight highlight={[completeResults.checks.toString(), completeResults.checkMult.toString()]}
                                    highlightStyles={{
                                        backgroundColor: "var(--mantine-color-green-5)",
                                        fontWeight: 700,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >{`You made ${completeResults.checks.toString()} checks before completing the exercise - XP multiplier bonus: ${completeResults.checkMult.toString()}`}</Highlight>
                            </List.Item>
                            <List.Item>
                                <Highlight highlight={[completeResults.difference.toString(), completeResults.levelDiffMult.toString()]}
                                    highlightStyles={{
                                        backgroundColor: "var(--mantine-color-green-5)",
                                        fontWeight: 700,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >{`The difference between the exercise level and your level was: ${completeResults.difference.toString()} - XP multiplier bonus: ${completeResults.levelDiffMult.toString()}`}</Highlight>
                            </List.Item>
                        </List>
                        <Divider my="sm" variant="dashed" />
                        <Highlight highlight={[`${completeResults.reward.toString()} XP`]}
                            highlightStyles={{
                                backgroundColor: "var(--mantine-color-green-5)",
                                fontWeight: 700,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >{`Your total XP gained for this exercise is: ${completeResults.reward.toString()} XP!`}</Highlight>
                        {completeResults.rescaled && <Text color="orange" >*Note: Your reward has been rescaled to a maximum of {exercise!.experience * 3} XP</Text>}
                        <Divider my="sm" variant="dashed" />
                        {completeResults.levelUp && <>
                            <Highlight highlight={[completeResults.newLevel.toString()]}
                                highlightStyles={{
                                    backgroundColor: "var(--mantine-color-green-5)",
                                    fontWeight: 700,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >{`You leveled up! Your new level is: ${completeResults.newLevel.toString()}`}</Highlight>
                            <Divider my="sm" variant="dashed" />
                        </>}
                        {completeResults.levelInfo && <>
                            {!completeResults.maxLevel && <Text size="sm" color="dimmed" mb={4}>XP needed to reach the next level:</Text>}
                            {completeResults.maxLevel && <Text size="sm" color="dimmed" mb={4}>You have reached the maximum level!</Text>}
                            <Group justify="space-between" mb={4}>
                                <Text size="xs" color="dimmed">
                                    {completeResults.levelInfo.min} XP
                                </Text>
                                <Text size="xs" color="dimmed">
                                    {completeResults.levelInfo.max} XP
                                </Text>
                            </Group>
                            <Progress.Root size="xl">
                                <Progress.Section value={((completeResults.newXp - completeResults.levelInfo.min) / (completeResults.levelInfo.max - completeResults.levelInfo.min)) * 100} color="green" striped animated>
                                    <Progress.Label>
                                        {completeResults.newXp} XP
                                    </Progress.Label>
                                </Progress.Section>
                            </Progress.Root>
                            <Divider my="sm" variant="dashed" />
                        </>}
                        {!completeResults.levelInfo && <Text size="sm" color="dimmed" mb={4}>You are at the maximum level, no more XP can be gained.</Text>}
                    </Grid.Col>
                    <Grid.Col span={3} >
                        <Center >
                            <Stack align="center">
                                <Avatar
                                    src={`data:image/svg+xml;utf8,${encodeURIComponent(
                                        createAvatar(avataaars, {
                                            ...avatarOptions,
                                            style: ["default"],
                                            mouth: ["tongue"],
                                            eyes: ["hearts"],
                                            radius: 50,
                                        }).toString()
                                    )}`}
                                    size={250}
                                    radius="md"
                                />
                            </Stack>
                        </Center>
                    </Grid.Col>
                    <Grid.Col span={3}>
                        <Text>You unlocked the following avatar pieces:</Text>
                        <Divider my="sm" variant="dashed" />
                        <List spacing="md" size="md" center style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "8px", }} icon={<IconTrophyFilled color="gold" size={24} radius="xl" />}>
                            {Object.entries(completeResults.unlockedKeys).map(
                                ([key, value], idx) => (
                                    <>
                                        <List.Item key={key}>
                                            <>
                                                <Highlight highlight={[key]}
                                                    highlightStyles={{
                                                        backgroundColor: "var(--mantine-color-green-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                    }}>{key}</Highlight>
                                                <List spacing="md" size="md">
                                                    {(Array.isArray(value) ? value : []).map((item: any, index: number) => (
                                                        <List.Item key={index} icon={<IconCheck size={16} color="green" />}>
                                                            <Text size="sm">{item}</Text>
                                                        </List.Item>
                                                    ))}
                                                </List>
                                            </>
                                        </List.Item>
                                        <Divider my="sm" variant="dashed" />
                                    </>
                                )
                            )}
                        </List>
                    </Grid.Col>
                </Grid>
            </Modal>}


            {checking && <Notification color="yellow" mt="md" className='notif' loading={true} >
                <Alert variant="light" color="yellow" icon={<IconExclamationCircle size={16} />} title="Warning!" >
                    Exercise evaluation is in progress. Please wait...
                </Alert>
            </Notification>}

            {saving && <Notification color="blue" mt="md" className='notif' loading={true} >
                <Alert variant="light" color="blue" icon={<IconCircleDashedCheck size={16} />} title="Saving..." >
                    Your diagram is being saved. Please wait...
                </Alert>
            </Notification>}

            {uploaded && <Notification color="green" mt="md" className='notif' >
                <Alert variant="light" color="green" icon={<IconCheck size={16} />} title="Success!" >
                    Diagram updated successfully.
                </Alert>
            </Notification>}
        </>
    )
}


/**<Skeleton visible={load}>
                                <Grid my="md" grow justify="center" align="center">
                                    <Grid.Col span={4}>
                                        <SyntaxErrorsSemanticErrorsList syntaxErrors={results.newSyntaxErrors} />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <ClassDiagramSemanticErrorsList semanticErrors={results.newSemanticErrors} />
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <ClassDiagramMatchingElementsList results={results.results} />
                                    </Grid.Col>
                                </Grid>
                            </Skeleton> */
export default ExercisePage