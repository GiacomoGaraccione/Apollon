import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Notification, Stack, TextInput, NativeSelect, Textarea, Group, Loader, Avatar, RingProgress, Popover, UnstyledButton, Drawer, List, ThemeIcon, Mark, Highlight, Divider, Progress, Skeleton } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconCircleDashedCheck, IconCloudUpload, IconDownload, IconExclamationCircle, IconExclamationCircleFilled, IconFileDescriptionFilled, IconHelp, IconJson, IconMedal, IconMenu4, IconPdf, IconReload, IconSquareXFilled, IconSvg, IconTrophyFilled, IconUpload, IconUserUp, IconX } from "@tabler/icons-react";
import { Course, Exercise } from "../../Utils/Models";
import { AvatarUnlockOptions } from "../../Utils/AvatarUtils";
import { useNavigate, useParams } from "react-router-dom";
import { createAvatar } from "@dicebear/core";
import { avataaars, bottts } from "@dicebear/collection";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { EvaluationResults } from "../../Utils/EvaluationTypes";
import "csshake/dist/csshake.css"
import { Dropzone } from "@mantine/dropzone";
import 'svg2pdf.js'
import jsPDF from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import { Canvg } from "canvg";
import Leaderboard from "./Leaderboard";

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
    const [results, setResults] = useState<EvaluationResults>(new EvaluationResults())
    const [mood, setMood] = useState<string>("Neutral")
    const [shaker, setShaker] = useState<string>("")
    const [filename, setFilename] = useState<string>("")
    const openRef = useRef<() => void>(null)
    const [uploaded, setUploaded] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [completed, setCompleted] = useState<boolean>(false)
    const [completeResults, setCompleteResults] = useState<any>(null)
    const [completionRecord, setCompletionRecord] = useState<any>(null)
    const [load, setLoad] = useState<boolean>(true)
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
                                let ed = new ApollonEditor(cont, { ...options, type: "ClassDiagram", });
                                setEditor(ed)
                            }
                        } catch (error) {
                            console.error("Error creating Apollon editor:", error);
                        }
                        API.getStudentExerciseRecord(courseId, exerciseId, user.username).then((res) => {
                            handleFeedback(res, false)
                            API.getStudentExerciseCompletion(courseId, exerciseId, user.username).then((comp) => {
                                setCompletionRecord(comp.log)
                            }).catch((err) => {
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

    const handleFeedback = (res: any, afterCheck: boolean) => {
        try {
            let r = new EvaluationResults()
            if (afterCheck) {
                r.oldXP = results.newXP
                r.newXP = res.experience
                r.oldProgress = results.newProgress
                r.newProgress = res.correctness
                r.oldSyntaxErrors = results.newSyntaxErrors
                r.newSyntaxErrors = JSON.parse(res.syntax_errors || "[]")
                r.oldSemanticErrors = results.newSemanticErrors
                r.newSemanticErrors = JSON.parse(res.semantic_errors || "[]")
                r.results = JSON.parse(res.results || "{}")
                handleMoodChange(r)
                setCompleted(res.correctness >= 75)
            } else {
                r.oldXP = res.experience
                r.newXP = res.experience
                r.oldProgress = res.correctness
                r.newProgress = res.correctness
                r.oldSyntaxErrors = JSON.parse(res.syntax_errors || "[]")
                r.newSyntaxErrors = JSON.parse(res.syntax_errors || "[]")
                r.oldSemanticErrors = JSON.parse(res.semantic_errors || "[]")
                r.newSemanticErrors = JSON.parse(res.semantic_errors || "[]")
                r.results = JSON.parse(res.results || "{}")
            }
            setResults(r)
            let model = JSON.parse(res.model)
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
            r.newSyntaxErrors.filter((error: any) => error.type === "missingClassName").forEach((error: any) => {
                let element = model.elements[error.element.elementId]
                element.textColor = "var(--mantine-color-orange-7)"
                element.strokeColor = "var(--mantine-color-orange-7)"
            })
            r.newSyntaxErrors.filter((error: any) => error.type === "duplicateClassName" || error.type === "unconnectedClass").forEach((error: any) => {
                let element = model.elements[error.element.elementId]
                element.fillColor = "var(--mantine-color-orange-1)"
            })
            r.newSyntaxErrors.filter((error: any) => error.type === "missingAttributeName" ||
                error.type === "duplicateAttributeName" ||
                error.type === "missingAttributeType" ||
                error.type === "foreignKeyReference" ||
                error.type === "invalidAttributeType").forEach((error: any) => {
                    let element = model.elements[error.attribute.elementId]
                    element.fillColor = "var(--mantine-color-orange-1)"
                })
            r.newSyntaxErrors.filter((error: any) => error.type === "missingAssociationName" ||
                error.type === "missingAssociationMultiplicity" ||
                error.type === "invalidAssociationMultiplicity" ||
                error.type === "missingRecursiveAssociationRole").forEach((error: any) => {
                    let element = model.relationships[error.association.elementId]
                    element.strokeColor = "var(--mantine-color-orange-7)"
                    element.textColor = "var(--mantine-color-orange-7)"
                })
            r.newSemanticErrors.filter((error: any) => error.type === "attributeType").forEach((error: any) => {
                let element = model.elements[error.id]
                element.textColor = "var(--mantine-color-red-5)"
            })
            r.newSemanticErrors.filter((error: any) => error.type === "forbiddenClass").forEach((error: any) => {
                let element = model.elements[error.id]
                element.textColor = "var(--mantine-color-red-5)"
                element.strokeColor = "var(--mantine-color-red-5)"
            })
            r.newSemanticErrors.filter((error: any) => error.type === "forbiddenAttribute").forEach((error: any) => {
                let element = model.elements[error.id]
                element.textColor = "var(--mantine-color-red-5)"
                element.strokeColor = "var(--mantine-color-red-5)"
            })
            r.results.matchingClasses.forEach((match: any) => {
                let id = match.diagramClass.elementId
                let element = model.elements[id]
                element.strokeColor = "var(--mantine-color-green-5)";
                element.textColor = "var(--mantine-color-green-5)";
                match.matchingAttributes.forEach((attr: any) => {
                    let attrId = attr.diagramAttribute.elementId
                    let attrElement = model.elements[attrId]
                    attrElement.fillColor = "var(--mantine-color-green-1)"
                })
            })
            r.results.matchingAssociations.forEach((match: any) => {
                let id = match.diagramAssociation.id
                let element = model.relationships[id]
                element.strokeColor = "var(--mantine-color-green-5)";
                element.textColor = "var(--mantine-color-green-5)";
            })
            let cont = document.getElementById("apollon");
            if (cont) {
                let ed = new ApollonEditor(cont, { ...options, type: "ClassDiagram", model: model });
                setEditor(ed);
            }
        } catch (error) {
            console.error("Error handling feedback:", error);
        }
    }

    const handleMoodChange = (res: EvaluationResults) => {
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
            setShaker(newMood === "Worried" ? "shake-little shake-constant" : newMood === "Upset" ? "shake-hard shake-constant" : newMood === "Defeated" ? "shake-crazy shake-constant" : "")
            setTimeout(() => {
                setShaker("")
            }, 3000)
        }
    }

    const evaluate = () => {
        try {
            setChecking(true)
            if (courseId && exerciseId && user && editor) {
                API.saveExerciseRecord(courseId, exerciseId, user.username, editor.model, true).then((res: any) => {
                    setChecking(false)
                    handleFeedback(res.record, true)
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
                                levelInfo: null
                            }
                            if (found) {
                                completeRes.newLevel = found.level
                                completeRes.levelInfo = found
                                if (found.level > studentInfo.level) completeRes.levelUp = true
                            }
                            setCompleteResults(completeRes)
                            API.completeStudentExercise(courseId, exerciseId, user.username, reward).then((res: any) => {
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
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(model));
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
                let ed = new ApollonEditor(newDiv, { ...options, type: "ClassDiagram", model: model })
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
                let ed = new ApollonEditor(newDiv, { ...options, type: "ClassDiagram", model: model })
                await ed.nextRender
                const { svg } = await ed.exportAsSVG({ keepOriginalSize: true, margin: 20 });
                let canvas = document.createElement('canvas')
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = svg;
                const svgElement = tempDiv.querySelector('svg');
                if (!svgElement) {
                    newDiv.remove();
                    ed.destroy();
                    return;
                }
                canvas.width = parseFloat(svgElement?.getAttribute("width") ?? "800")
                canvas.height = parseFloat(svgElement?.getAttribute("height") ?? "600")
                let ctx = canvas.getContext('2d')
                if (!ctx) {
                    newDiv.remove();
                    ed.destroy();
                    return;
                }
                let v = await Canvg.fromString(ctx, svg)
                await v.render()
                let pngDataUrl = canvas.toDataURL('image/png')
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: [canvas.width, canvas.height],
                })
                doc.addImage(pngDataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
                let fn = filename || `${exercise.title}-${new Date().toLocaleString()}`;
                doc.save(`${fn}.pdf`);

                newDiv.remove()
                ed.destroy()
                canvas.remove()
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
                        let ed = new ApollonEditor(cont, { ...options, type: "ClassDiagram", model: JSON.parse(e.target?.result as string) });
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
                            <Skeleton visible={load} >
                                <Grid my="md" grow justify="center" align="center">
                                    <Grid.Col span={6}>
                                        <Center>
                                            <Stack align="center">
                                                <Avatar src={avatarString} size={100} radius="md" className={shaker} />
                                                <Highlight
                                                    highlight={[mood]}
                                                    highlightStyles={{
                                                        backgroundColor: (mood === "Happy" || mood === "Ecstatic" || mood === "Content") ? "var(--mantine-color-green-5)" : (mood === "Worried" || mood === "Upset" || mood === "Defeated") ? "var(--mantine-color-red-5)" : "var(--mantine-color-cyan-5)",
                                                        fontWeight: 700,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent'
                                                    }}>
                                                    {`Current mood: ${mood}`}
                                                </Highlight>
                                            </Stack>
                                        </Center>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Center>
                                            <Avatar src={bossString} size={100} radius="md" />
                                        </Center>
                                    </Grid.Col>
                                </Grid>
                            </Skeleton>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Skeleton visible={load} >
                                <Grid my="md" grow justify="center" align="center">
                                    <Grid.Col span={6}>
                                        <Center>
                                            <Stack align="center">
                                                <RingProgress sections={[{ value: results.newProgress, color: "green" }]} label={<Text color="green" ta="center" size="xl">{results.newProgress} %</Text>} />
                                                <Text size="md" color="green">Exercise Completeness</Text>
                                            </Stack>
                                        </Center>
                                    </Grid.Col>
                                    <Grid.Col span={6}>
                                        <Center>
                                            <Stack align="center">
                                                {!completionRecord && <>
                                                    <RingProgress sections={[{ value: results.newXP, color: "blue" }]} label={<Text color="blue" ta="center" size="xl">{results.newXP} XP</Text>} />
                                                    <Text size="md" color="blue">Available Experience</Text>
                                                </>}
                                                {completionRecord && <> <Text size="md" color="#FFD700">You already completed this exercise!</Text>
                                                    <Text size="md" color="#FFD700">You cannot earn any more experience but you can still make changes.</Text>
                                                    <Text size="md" color="#FFD700">Try to reach 100% completeness!</Text>
                                                </>}
                                            </Stack>
                                        </Center>
                                    </Grid.Col>
                                </Grid>
                            </Skeleton>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Skeleton visible={load}>
                                <Grid my="md" grow justify="center" align="center">
                                    <Grid.Col span={4}>
                                        <Center>
                                            <Popover width={500} position="left" withArrow shadow="md">
                                                <Popover.Target>
                                                    <Button variant={results.newSyntaxErrors.length > 0 ? "light" : "default"} color="orange" leftSection={results.newSyntaxErrors.length > 0 && <IconExclamationCircleFilled size={14} />} >Syntax Errors</Button>
                                                </Popover.Target>
                                                <Popover.Dropdown>
                                                    {results.newSyntaxErrors.length === 0 ? <Text>There are no syntax errors in your diagram, very good!</Text> : <>
                                                        <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "missingClassName").length > 0 && <>
                                                                <List.Item icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                    <Highlight
                                                                        highlight={["missing a name"]}
                                                                        highlightStyles={{
                                                                            backgroundColor: "var(--mantine-color-orange-5)",
                                                                            fontWeight: 700,
                                                                            WebkitBackgroundClip: 'text',
                                                                            WebkitTextFillColor: 'transparent'
                                                                        }}>
                                                                        {`At least one class in the diagram is missing a name.`}
                                                                    </Highlight>
                                                                </List.Item>
                                                                <Divider my="xs" />
                                                            </>}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "duplicateClassName").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.element.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`There are two or more classes in the diagram with the same name: ${error.element.name}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {Object.entries(
                                                                results.newSyntaxErrors
                                                                    .filter((error: any) => error.type === "missingAttributeName")
                                                                    .reduce((acc: Record<string, number>, error: any) => {
                                                                        acc[error.class] = (acc[error.class] || 0) + 1;
                                                                        return acc;
                                                                    }, {})
                                                            ).map(([className, count]) => (
                                                                <>
                                                                    <List.Item key={`missing-attribute-name-${className}`} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                        <Highlight
                                                                            highlight={[className]}
                                                                            highlightStyles={{
                                                                                backgroundColor: "var(--mantine-color-orange-5)",
                                                                                fontWeight: 700,
                                                                                WebkitBackgroundClip: 'text',
                                                                                WebkitTextFillColor: 'transparent'
                                                                            }}>
                                                                            {`The class ${className} is missing a name for at least one attribute.`}
                                                                        </Highlight>
                                                                    </List.Item>
                                                                    <Divider my="xs" />
                                                                </>
                                                            ))}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "duplicateAttributeName").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.class, error.attribute.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The class ${error.class} has two or more attributes with the same name: ${error.attribute.name}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "missingAttributeType").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.class, error.attribute.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The attribute ${error.attribute.name} in the class ${error.class} is missing a type.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "missingAssociationName").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.association.source.referenceClass.name, error.association.target.referenceClass.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The association between the classes ${error.association.source.referenceClass.name} and ${error.association.target.referenceClass.name} is missing a name.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "missingAssociationMultiplicity").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.association.source.referenceClass.name, error.association.target.referenceClass.name, error.class]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }} >
                                                                                {`The association between the classes ${error.association.source.referenceClass.name} and ${error.association.target.referenceClass.name} is missing a multiplicity on the side of class ${error.class}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "invalidAssociationMultiplicity").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.association.source.referenceClass.name, error.association.target.referenceClass.name, error.class]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The association between the classes ${error.association.source.referenceClass.name} and ${error.association.target.referenceClass.name} has an invalid multiplicity on the side of class ${error.class}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "missingRecursiveAssociationRole").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.class, "at least one side", "both sides"]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`Class ${error.class} has a recursive association but is missing a role name ${error.count === 1 ? "on at least one side" : `on both sides`}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "unconnectedClass").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.element.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The class ${error.element.name} is not connected to any other class in the diagram.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "foreignKeyReference").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.attribute.name, error.containedClass, error.class]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The attribute ${error.attribute.name} in the class ${error.class} may be a foreign key reference to the class ${error.containedClass}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSyntaxErrors.filter((error: any) => error.type === "invalidAttributeType").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="orange" />} >
                                                                            <Highlight
                                                                                highlight={[error.attribute.name, error.class, error.attribute.types[0]]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-orange-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The attribute ${error.attribute.name} in the class ${error.class} has an invalid type: ${error.attribute.types[0]}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                        </List>
                                                    </>}
                                                </Popover.Dropdown>
                                            </Popover>
                                        </Center>
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Center >
                                            <Popover width={500} position="left" withArrow shadow="md">
                                                <Popover.Target>
                                                    <Button variant={results.newSemanticErrors.length > 0 ? "light" : "default"} color="red" leftSection={results.newSemanticErrors.length > 0 && <IconExclamationCircleFilled size={14} />}  >Semantic Errors</Button>
                                                </Popover.Target>
                                                <Popover.Dropdown>
                                                    {results.newSemanticErrors.length === 0 ? <Text>There are no semantic errors in your diagram, very good!</Text> : <>
                                                        <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "missingClass").map((error: any, id: number) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The concept ${error.name} is required but does not have a matching class in your diagram.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors
                                                                .filter((error) => error.type === "missingAttribute")
                                                                .reduce((acc, error) => {
                                                                    acc[error.class] = (acc[error.class] || 0) + 1;
                                                                    return acc;
                                                                }, {} as Record<string, number>)
                                                                &&
                                                                Object.entries(
                                                                    results.newSemanticErrors
                                                                        .filter((error) => error.type === "missingAttribute")
                                                                        .reduce((acc, error) => {
                                                                            acc[error.class] = (acc[error.class] || 0) + 1;
                                                                            return acc;
                                                                        }, {} as Record<string, number>)
                                                                ).map(([className, count]) => (
                                                                    <>
                                                                        <List.Item key={`missing-attribute-${className}`} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[className]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The class that represents the concept ${className} is missing at least one required attribute.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                ))
                                                            }
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "attributeType").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.name, error.class]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The attribute ${error.name} in the class that represents the concept ${error.class} has an incorrect type.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "forbiddenClass").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`Your class ${error.name} represents a concept that should not be present in the diagram.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "forbiddenAttribute").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.name, error.class]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The attribute ${error.name} in the class that represents the concept ${error.class} should not be associated to that class.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "missingAssociation").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.source, error.target]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`An association between the classes that represent ${error.source} and ${error.target} is required.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "associationMultiplicity").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.diagramSource ? error.diagramSource : "null", error.diagramTarget ? error.diagramTarget : "null", error.referenceSource.referenceClass.name, error.referenceTarget.referenceClass.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The association between the concepts that match ${error.referenceSource.referenceClass.name} and ${error.referenceTarget.referenceClass.name} has an incorrect multiplicity on the side of ${error.diagramSource ? error.diagramSource : error.diagramTarget}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "associationName").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.diagramSource.name, error.diagramTarget.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The association between the classes ${error.diagramSource.name} and ${error.diagramTarget.name} has a name that does not represent their relationship correctly.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.newSemanticErrors.filter((error: any) => error.type === "associationType").map((error: any) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={error.id} icon={<IconExclamationCircle size={16} color="red" />} >
                                                                            <Highlight
                                                                                highlight={[error.diagramSource ? error.diagramSource : "null", error.diagramTarget ? error.diagramTarget : "null", error.diagramType]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-red-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`The association between the classes ${error.diagramSource} and ${error.diagramTarget} has an incorrect type, it should not be ${error.diagramType}`}
                                                                            </Highlight>
                                                                            <Divider my="xs" />
                                                                        </List.Item>
                                                                    </>
                                                                )
                                                            })}
                                                        </List>
                                                    </>}
                                                </Popover.Dropdown>
                                            </Popover>
                                        </Center>
                                    </Grid.Col>
                                    <Grid.Col span={4}>
                                        <Center >
                                            <Popover width={500} position="left" withArrow shadow="md">
                                                <Popover.Target>
                                                    <Button variant={results.results.matchingClasses.length > 0 ? "light" : "default"} color="green" leftSection={results.results.matchingClasses.length > 0 && <IconCheck size={14} />} >Found Elements</Button>
                                                </Popover.Target>
                                                <Popover.Dropdown>
                                                    {results.results.matchingClasses.length === 0 ? <Text>There are no matching elements in your diagram, keep trying!</Text> : <>
                                                        <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                                            {results.results.matchingClasses.map((match: any, id: number) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={id} icon={<IconCheck size={16} color="green" />} >
                                                                            <Highlight
                                                                                highlight={[match.referenceClass, match.diagramClass.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-green-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}
                                                                            >
                                                                                {`Your class ${match.diagramClass.name} matches the required concept ${match.referenceClass}.`}
                                                                            </Highlight>
                                                                            {match.matchingAttributes.length > 0 && (
                                                                                <List>
                                                                                    {match.matchingAttributes.map((attr: any, attrId: number) => (
                                                                                        <>
                                                                                            <Divider my="xs" />
                                                                                            <List.Item key={attrId} icon={<IconCheck size={16} color="green" />} >
                                                                                                <Highlight
                                                                                                    highlight={[attr.referenceAttribute]} highlightStyles={{
                                                                                                        backgroundColor: "var(--mantine-color-green-5)",
                                                                                                        fontWeight: 700,
                                                                                                        WebkitBackgroundClip: 'text',
                                                                                                        WebkitTextFillColor: 'transparent'
                                                                                                    }}>
                                                                                                    {`Its attribute ${attr.diagramAttribute.name} matches the required attribute ${attr.referenceAttribute}.`}
                                                                                                </Highlight>
                                                                                            </List.Item>
                                                                                        </>
                                                                                    ))}
                                                                                </List>
                                                                            )}
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                            {results.results.matchingAssociations.map((match: any, id: number) => {
                                                                return (
                                                                    <>
                                                                        <List.Item key={id} icon={<IconCheck size={16} color="green" />} >
                                                                            <Highlight
                                                                                highlight={[match.referenceAssociation.source.referenceClass.name, match.referenceAssociation.target.referenceClass.name, match.source_pair.diagramInfo.name, match.target_pair.diagramInfo.name]}
                                                                                highlightStyles={{
                                                                                    backgroundColor: "var(--mantine-color-green-5)",
                                                                                    fontWeight: 700,
                                                                                    WebkitBackgroundClip: 'text',
                                                                                    WebkitTextFillColor: 'transparent'
                                                                                }}>
                                                                                {`Your association between ${match.source_pair.diagramInfo.name} and ${match.source_pair.diagramInfo.name} matches the required association between ${match.referenceAssociation.target.referenceClass.name} and ${match.referenceAssociation.source.referenceClass.name}.`}
                                                                            </Highlight>
                                                                        </List.Item>
                                                                        <Divider my="xs" />
                                                                    </>
                                                                )
                                                            })}
                                                        </List>
                                                    </>}
                                                </Popover.Dropdown>
                                            </Popover>
                                        </Center>
                                    </Grid.Col>
                                </Grid>
                            </Skeleton>
                        </Grid.Col>

                    </>
                </Grid>}
                <div id="apollon" className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
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
                                handleFeedback(res, false)
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

            {completeResults && <Modal opened={completeOpened} onClose={closeComplete} size="60%" radius="md" centered withCloseButton={false} >
                <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                    <Grid.Col span={8}>
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
                        >{`Your total XP gained for this exercise is: ${completeResults.reward.toString()} XP`}</Highlight>
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
                            <Text size="sm" color="dimmed" mb={4}>XP needed to reach the next level:</Text>
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
                    <Grid.Col span={4} >
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

export default ExercisePage