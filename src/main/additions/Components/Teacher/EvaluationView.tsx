import React, { useEffect, useState, useRef } from "react";
import { Alert, Badge, Button, Card, Center, Code, Divider, FileInput, Flex, Grid, Modal, ScrollArea, Skeleton, Stack, Tabs, Text, RingProgress, Notification } from "@mantine/core";
import API from "../../API";
import { IconCheck, IconCloudUpload, IconDownload, IconExclamationCircleFilled, IconPlayerPlay, IconRobot, IconTrash } from "@tabler/icons-react";
import { Course, Exercise, TeacherEvaluation } from "../../Utils/Models";
import { useParams } from "react-router-dom";
import { ApollonMode } from "../../../typings";
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { ClassDiagramMatchingElementsList, ClassDiagramSemanticErrorsList, ClassDiagramSyntaxErrorsList } from "../Common/FeedbackLists";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import "csshake/dist/csshake.css";

const editorOptions = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: true,
    enablePopups: true
};

function isLlmDone(ev: TeacherEvaluation): boolean {
    if (!ev.llmResult) return false;
    try {
        return JSON.parse(ev.llmResult).status !== "not_implemented";
    } catch {
        return false;
    }
}

function parseResult(raw: string | null): any {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function EvaluationView() {
    const { courseId, exerciseId } = useParams();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
    const [load, setLoad] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [currentEval, setCurrentEval] = useState<TeacherEvaluation | null>(null);
    const [showModal, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editor, setEditor] = useState<ApollonEditor | null>(null);
    const [loadModal, setLoadModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>("original");
    const [runningStatic, setRunningStatic] = useState<string | null>(null);
    const [runningLlm, setRunningLlm] = useState<string | null>(null);
    const [llmRawDebug, setLlmRawDebug] = useState<any | null>(null);
    const [showRawModal, { open: openRawModal, close: closeRawModal }] = useDisclosure(false);
    const apollonRef = useRef<HTMLDivElement>(null);

    const fetchData = () => {
        if (courseId && exerciseId) {
            API.getCourse(courseId).then((course: Course) => {
                if (course) {
                    setExercise(course.exercises.find((e) => e.exerciseId === exerciseId) || null);
                    API.getTeacherEvaluations(courseId, exerciseId).then((evals) => {
                        setLoad(false);
                        setEvaluations(evals);
                    });
                }
            });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (showModal && currentEval) {
            let model = currentEval.originalModel;
            if (activeTab === "static" && currentEval.staticModel) {
                model = currentEval.staticModel;
            } else if (activeTab === "llm" && currentEval.llmModel) {
                model = currentEval.llmModel;
            }
            setLoadModal(true);
            const timer = setTimeout(async () => {
                if (editor) editor.destroy();
                if (apollonRef.current && exercise) {
                    let ed = new ApollonEditor(apollonRef.current, { ...editorOptions, type: exercise.exType as any });
                    await ed.nextRender;
                    if (model) ed.model = typeof model === "string" ? JSON.parse(model) : model;
                    setEditor(ed);
                    setLoadModal(false);
                }
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [showModal, currentEval, activeTab]);

    const uploadJsonFile = async (name: string, content: ArrayBuffer | string) => {
        if (!courseId || !exerciseId) return;
        try {
            const text = typeof content === "string" ? content : new TextDecoder().decode(content);
            const model = JSON.parse(text);
            const studentId = name.replace(/\.json$/i, "");
            await API.uploadStudentSolution(courseId, exerciseId, studentId, model);
        } catch (e) {
            console.error("Error uploading:", name, e);
        }
    };

    const handleUpload = async () => {
        if (!courseId || !exerciseId || files.length === 0) return;
        setUploading(true);
        for (const file of files) {
            if (file.name.toLowerCase().endsWith(".zip")) {
                try {
                    const zipData = await file.arrayBuffer();
                    const zip = await JSZip.loadAsync(zipData);
                    const jsonFiles = Object.entries(zip.files).filter(
                        ([name, entry]) => !entry.dir && name.toLowerCase().endsWith(".json")
                    );
                    for (const [name, entry] of jsonFiles) {
                        const content = await entry.async("arraybuffer");
                        const baseName = name.includes("/") ? name.split("/").pop()! : name;
                        await uploadJsonFile(baseName, content);
                    }
                } catch (e) {
                    console.error("Error processing zip:", file.name, e);
                }
            } else {
                const text = await file.text();
                await uploadJsonFile(file.name, text);
            }
        }
        setFiles([]);
        setUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        fetchData();
    };

    const handleRunStatic = async (studentId: string) => {
        if (!courseId || !exerciseId) return;
        setRunningStatic(studentId);
        try {
            let updated = await API.runStaticEvaluation(courseId, exerciseId, studentId);
            setEvaluations((prev) => prev.map((e) => e.studentId === studentId ? updated : e));
            if (currentEval && currentEval.studentId === studentId) setCurrentEval(updated);
        } catch (e) {
            console.error("Error running static evaluation:", e);
        }
        setRunningStatic(null);
    };

    const handleRunLlm = async (studentId: string) => {
        if (!courseId || !exerciseId) return;
        setRunningLlm(studentId);
        try {
            let updated = await API.runLlmEvaluation(courseId, exerciseId, studentId);
            setEvaluations((prev) => prev.map((e) => e.studentId === studentId ? updated : e));
            if (currentEval && currentEval.studentId === studentId) setCurrentEval(updated);
        } catch (e: any) {
            if (e.llmRawResult) {
                setLlmRawDebug({
                    studentId,
                    message: e.message,
                    result: e.llmRawResult,
                    time: e.llmTime,
                    tokens: e.llmTokens
                });
                openRawModal();
            } else {
                console.error("Error running LLM evaluation:", e);
            }
        }
        setRunningLlm(null);
    };

    const handleDelete = async (studentId: string) => {
        if (!courseId || !exerciseId) return;
        try {
            await API.deleteTeacherEvaluation(courseId, exerciseId, studentId);
            setEvaluations((prev) => prev.filter((e) => e.studentId !== studentId));
        } catch (e) {
            console.error("Error deleting evaluation:", e);
        }
    };

    const downloadExcel = () => {
        if (!exercise || evaluations.length === 0) return;
        const workbook = XLSX.utils.book_new();

        const statsData: any[][] = [[
            "Student ID", "Timestamp",
            "Static Completeness", "Static Class Compl.", "Static Attribute Compl.", "Static Association Compl.",
            "Static Time (s)", "Static Syntax Errors", "Static Semantic Errors",
            "LLM Completeness", "LLM Class Compl.", "LLM Attribute Compl.", "LLM Association Compl.",
            "LLM Time (s)", "LLM Tokens", "LLM Syntax Errors", "LLM Semantic Errors"
        ]];

        const syntaxData: any[][] = [["Student ID", "Evaluator", "Type", "Message", "Info"]];
        const semanticData: any[][] = [["Student ID", "Evaluator", "Type", "Message", "Info"]];
        const matchesData: any[][] = [["Student ID", "Evaluator", "Match Type", "Reference", "Diagram", "Info"]];

        evaluations.forEach((ev) => {
            const sr = parseResult(ev.staticResult);
            const lr = parseResult(ev.llmResult);
            const llmValid = lr && lr.status !== "not_implemented";

            statsData.push([
                ev.studentId,
                ev.timestamp,
                sr ? sr.completeness : "",
                sr ? sr.classCompleteness : "",
                sr ? sr.attributeCompleteness : "",
                sr ? sr.associationCompleteness : "",
                ev.staticTime ?? "",
                sr ? (sr.syntax_errors || []).length : "",
                sr ? (sr.semantic_errors || []).length : "",
                llmValid ? lr.completeness : "",
                llmValid ? lr.classCompleteness : "",
                llmValid ? lr.attributeCompleteness : "",
                llmValid ? lr.associationCompleteness : "",
                llmValid ? ev.llmTime : "",
                llmValid ? ev.llmTokens : "",
                llmValid ? (lr.syntax_errors || []).length : "",
                llmValid ? (lr.semantic_errors || []).length : "",
            ]);

            const addDetails = (result: any, evaluator: string) => {
                if (!result) return;
                (result.syntax_errors || []).forEach((err: any) => {
                    const { type, message, ...rest } = err;
                    syntaxData.push([ev.studentId, evaluator, type, message || "", JSON.stringify(rest)]);
                });
                (result.semantic_errors || []).forEach((err: any) => {
                    const { type, message, ...rest } = err;
                    semanticData.push([ev.studentId, evaluator, type, message || "", JSON.stringify(rest)]);
                });
                (result.matchingClasses || []).forEach((mc: any) => {
                    matchesData.push([ev.studentId, evaluator, "Class",
                        mc.referenceClass,
                        mc.diagramClass?.name || "unmatched",
                        `similarity: ${mc.similarity}, correctType: ${mc.correctType}, matchedAttrs: ${(mc.matchingAttributes || []).length}`
                    ]);
                    (mc.matchingAttributes || []).forEach((ma: any) => {
                        matchesData.push([ev.studentId, evaluator, "Attribute",
                            `${mc.referenceClass}.${ma.referenceAttribute}`,
                            `${mc.diagramClass?.name || ""}.${ma.diagramAttribute?.name || "unmatched"}`,
                            `similarity: ${ma.similarity}, typesMatch: ${ma.typesMatch}`
                        ]);
                    });
                });
                (result.matchingAssociations || []).forEach((ma: any) => {
                    const refSrc = ma.referenceAssociation?.source?.referenceClass?.name || ma.source_pair?.referenceInfo?.referenceClass?.name || "";
                    const refTgt = ma.referenceAssociation?.target?.referenceClass?.name || ma.target_pair?.referenceInfo?.referenceClass?.name || "";
                    const diagSrc = ma.source_pair?.diagramInfo?.name || "";
                    const diagTgt = ma.target_pair?.diagramInfo?.name || "";
                    matchesData.push([ev.studentId, evaluator, "Association",
                        `${refSrc} — ${refTgt}`,
                        `${diagSrc} — ${diagTgt}`,
                        `id: ${ma.diagramAssociation?.id || ""}`
                    ]);
                });
            };

            addDetails(sr, "Static");
            if (llmValid) addDetails(lr, "LLM");
        });

        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(statsData), "Statistics");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(syntaxData), "Syntax Errors");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(semanticData), "Semantic Errors");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(matchesData), "Matches");
        XLSX.writeFile(workbook, `${exercise.title} - evaluation results.xlsx`);
    };

    const downloadDiagramsZip = async () => {
        if (!exercise || evaluations.length === 0) return;
        try {
            const zip = new JSZip();
            const renderSvg = async (modelJson: string): Promise<string> => {
                const tempContainer = document.createElement("div");
                tempContainer.style.position = "absolute";
                tempContainer.style.left = "-9999px";
                tempContainer.style.width = "800px";
                tempContainer.style.height = "600px";
                document.body.appendChild(tempContainer);
                const ed = new ApollonEditor(tempContainer, { ...editorOptions, type: exercise.exType as any });
                await ed.nextRender;
                ed.model = JSON.parse(modelJson);
                await ed.nextRender;
                const { svg } = await ed.exportAsSVG({ margin: 5, keepOriginalSize: true });
                ed.destroy();
                document.body.removeChild(tempContainer);
                return svg;
            };
            for (const ev of evaluations) {
                if (ev.originalModel) {
                    const svg = await renderSvg(ev.originalModel);
                    zip.file(`${ev.studentId}_original.svg`, svg);
                }
                if (ev.staticModel) {
                    const svg = await renderSvg(ev.staticModel);
                    zip.file(`${ev.studentId}_static.svg`, svg);
                }
                if (ev.llmModel) {
                    const svg = await renderSvg(ev.llmModel);
                    zip.file(`${ev.studentId}_llm.svg`, svg);
                }
            }
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${exercise.title} - diagrams.zip`);
        } catch (error) {
            console.error("Error downloading diagrams:", error);
        }
    };

    const renderFeedbackPanel = (results: any) => {
        if (!results) return null;
        const syntaxErrors = results.syntax_errors || [];
        const semanticErrors = results.semantic_errors || [];
        return (
            <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
                <Grid.Col span={3}>
                    <Center>
                        <Stack align="center">
                            <RingProgress sections={[{ value: results.completeness || 0, color: "green" }]} label={<Text c="green" ta="center" size="xl">{Math.round(results.completeness || 0)} %</Text>} />
                            <Text size="md" c="green">Completeness</Text>
                        </Stack>
                    </Center>
                </Grid.Col>
                <Grid.Col span={3}>
                    <Center>
                        <ClassDiagramSyntaxErrorsList syntaxErrors={syntaxErrors} />
                    </Center>
                </Grid.Col>
                <Grid.Col span={3}>
                    <ClassDiagramSemanticErrorsList semanticErrors={semanticErrors} />
                </Grid.Col>
                <Grid.Col span={3}>
                    <ClassDiagramMatchingElementsList results={results} />
                </Grid.Col>
            </Grid>
        );
    };

    return (
        <>
            <Skeleton visible={load} height={50} width="100%" h="100%" style={{ marginBottom: 20 }}>
                <Stack gap="md">
                    <Flex gap="md" align="flex-end" wrap="wrap">
                        <FileInput
                            label="Upload student solutions"
                            placeholder="Select JSON or ZIP files"
                            accept=".json,.zip"
                            multiple
                            value={files}
                            onChange={setFiles}
                            style={{ flex: 1, minWidth: 250 }}
                        />
                        <Button
                            leftSection={<IconCloudUpload size={16} />}
                            variant="light"
                            color="blue"
                            onClick={handleUpload}
                            loading={uploading}
                            disabled={files.length === 0}
                        >
                            Upload
                        </Button>
                    </Flex>

                    <Divider />

                    {evaluations.length > 0 ? (
                        <>
                            <Center>
                                <Flex gap="md">
                                    <Button leftSection={<IconDownload size={16} />} variant="light" color="blue" onClick={downloadExcel}>Download Excel</Button>
                                    <Button leftSection={<IconDownload size={16} />} variant="light" color="blue" onClick={downloadDiagramsZip}>Download Diagrams ZIP</Button>
                                </Flex>
                            </Center>
                            <Flex direction="column" gap={10} style={{ width: "100%", maxHeight: "70vh", overflowY: "auto", flex: "1 1 auto" }}>
                                {evaluations.map((ev) => (
                                    <Card key={ev.studentId} shadow="xs" padding="lg" style={{ width: "100%", cursor: "pointer", position: "relative", minHeight: "80px", flexShrink: 0 }}>
                                        <Flex justify="space-between" align="center" style={{ height: "100%" }} onClick={() => {
                                            setCurrentEval(ev);
                                            setActiveTab("original");
                                            openModal();
                                        }}>
                                            <Text w={200} size="md" fw={500}>{ev.studentId}</Text>
                                            <Text w={200} size="sm" c="dimmed">Uploaded: {ev.timestamp}</Text>
                                            <Flex gap={6}>
                                                <Badge color={ev.staticResult ? "green" : "gray"} variant="light">
                                                    Static {ev.staticResult ? "Done" : "Pending"}
                                                </Badge>
                                                <Badge color={isLlmDone(ev) ? "green" : "gray"} variant="light">
                                                    LLM {isLlmDone(ev) ? `Done${ev.llmTokens ? ` (${ev.llmTokens} tok)` : ""}` : "Pending"}
                                                </Badge>
                                            </Flex>
                                            <Flex gap={6} onClick={(e) => e.stopPropagation()}>
                                                <Button size="xs" variant="light" color="cyan" leftSection={<IconPlayerPlay size={14} />}
                                                    loading={runningStatic === ev.studentId}
                                                    onClick={() => handleRunStatic(ev.studentId)}>
                                                    Static
                                                </Button>
                                                <Button size="xs" variant="light" color="violet" leftSection={<IconRobot size={14} />}
                                                    loading={runningLlm === ev.studentId}
                                                    onClick={() => handleRunLlm(ev.studentId)}>
                                                    LLM
                                                </Button>
                                                <Button size="xs" variant="light" color="red" leftSection={<IconTrash size={14} />}
                                                    onClick={() => handleDelete(ev.studentId)}>
                                                    Delete
                                                </Button>
                                            </Flex>
                                        </Flex>
                                    </Card>
                                ))}
                            </Flex>
                        </>
                    ) : (
                        <Alert icon={<IconExclamationCircleFilled size={16} />} title="No evaluations found" color="yellow">
                            No student solutions have been uploaded for this exercise yet.
                        </Alert>
                    )}
                </Stack>
            </Skeleton>

            {exercise && currentEval && (
                <Modal closeOnEscape={false} opened={showModal} onClose={closeModal} fullScreen transitionProps={{ transition: "fade", duration: 300 }}>
                    <Stack align="center" justify="center">
                        <Text size="lg" fw={600}>Student: {currentEval.studentId}</Text>
                        <Tabs value={activeTab} onChange={setActiveTab} style={{ width: "100%" }}>
                            <Tabs.List grow>
                                <Tabs.Tab value="original">Original Diagram</Tabs.Tab>
                                <Tabs.Tab value="static" disabled={!currentEval.staticResult}>
                                    Static Evaluation {currentEval.staticTime !== null && `(${currentEval.staticTime}s)`}
                                </Tabs.Tab>
                                <Tabs.Tab value="llm" disabled={!isLlmDone(currentEval)}>
                                    LLM Evaluation {isLlmDone(currentEval) && currentEval.llmTime !== null && `(${currentEval.llmTime}s${currentEval.llmTokens ? ` — ${currentEval.llmTokens} tokens` : ""})`}
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="original" pt="md">
                                <Skeleton visible={loadModal && activeTab === "original"} height="100%">
                                    <div ref={activeTab === "original" ? apollonRef : undefined} className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px" }}></div>
                                </Skeleton>
                            </Tabs.Panel>

                            <Tabs.Panel value="static" pt="md">
                                {currentEval.staticResult && (() => {
                                    const results = parseResult(currentEval.staticResult);
                                    return (
                                        <>
                                            {renderFeedbackPanel(results)}
                                            <Skeleton visible={loadModal && activeTab === "static"} height="100%">
                                                <div ref={activeTab === "static" ? apollonRef : undefined} className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px" }}></div>
                                            </Skeleton>
                                        </>
                                    );
                                })()}
                            </Tabs.Panel>

                            <Tabs.Panel value="llm" pt="md">
                                {currentEval.llmResult && (() => {
                                    const llmData = parseResult(currentEval.llmResult);
                                    if (!llmData || llmData.status === "not_implemented") return null;
                                    return (
                                        <>
                                            {renderFeedbackPanel(llmData)}
                                            <Skeleton visible={loadModal && activeTab === "llm"} height="100%">
                                                <div ref={activeTab === "llm" ? apollonRef : undefined} className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px" }}></div>
                                            </Skeleton>
                                        </>
                                    );
                                })()}
                            </Tabs.Panel>
                        </Tabs>
                    </Stack>
                </Modal>
            )}

            {llmRawDebug && (
                <Modal opened={showRawModal} onClose={closeRawModal} title="LLM Evaluation — Raw Result" size="xl" centered>
                    <Stack gap="sm">
                        <Alert color="orange" icon={<IconExclamationCircleFilled size={16} />} title={llmRawDebug.message}>
                            The LLM returned a result but it could not be processed for display. The raw JSON is shown below for inspection.
                            {llmRawDebug.time != null && <Text size="sm" mt={4}>Time: {llmRawDebug.time}s{llmRawDebug.tokens != null && ` — ${llmRawDebug.tokens} tokens`}</Text>}
                        </Alert>
                        <ScrollArea h={500}>
                            <Code block>{JSON.stringify(llmRawDebug.result, null, 2)}</Code>
                        </ScrollArea>
                    </Stack>
                </Modal>
            )}

            {uploadSuccess && (
                <Notification icon={<IconCheck size={20} />} color="teal" title="Success!" mt="md" className="notif" withCloseButton={false}>
                    <Text>Solutions uploaded successfully!</Text>
                </Notification>
            )}
        </>
    );
}

export default EvaluationView;
