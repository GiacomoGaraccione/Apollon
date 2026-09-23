import React, { useEffect, useState, useRef, useContext } from "react";
import {
    Alert,
    Badge,
    Button,
    Center,
    Group,
    Modal,
    Notification,
    Skeleton,
    Stack,
    Text
} from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import {
    IconCircleDashedCheck,
    IconClockExclamation,
    IconHourglassHigh,
    IconInfoCircle,
    IconSquareXFilled
} from "@tabler/icons-react";
import { ExamCall, ExamExercise } from "../../Utils/Models";
import { useNavigate, useParams } from "react-router-dom";
import { ApollonMode, UMLDiagramType, UMLModel } from "../../../typings";
import { ApollonEditor } from "../../../apollon-editor";
import ErrorMessage from "../Common/ErrorMessage";
import { useDisclosure } from "@mantine/hooks";

function StudentExamExercisePage() {
    const user = useContext(UserContext);
    const { courseId, examId, exerciseId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState<ExamCall | null>(null);
    const [exercise, setExercise] = useState<ExamExercise | null>(null);
    const [submissionModel, setSubmissionModel] = useState<UMLModel | null>(null);
    const [editor, setEditor] = useState<ApollonEditor>();

    const [active, setActive] = useState(false);
    const [ended, setEnded] = useState(false);
    const [load, setLoad] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
    const [finalSaveCompleted, setFinalSaveCompleted] = useState(false);
    const [finalSaveSucceeded, setFinalSaveSucceeded] = useState<boolean | null>(null);

    const [errorOpened, { open: openError, close: closeError }] = useDisclosure(false);
    const [descriptionOpened, { open: openDescription, close: closeDescription }] = useDisclosure(false);
    const [warningOpened, { open: openWarning, close: closeWarning }] = useDisclosure(false);
    const [expiredOpened, { open: openExpired, close: closeExpired }] = useDisclosure(false);

    const [errorInfo, setErrorInfo] = useState<string>("");

    const apollonRef = useRef<HTMLDivElement>(null);

    const editorRef = useRef<ApollonEditor | undefined>(editor);
    const activeRef = useRef(active);
    const hasShownFiveMinuteWarningRef = useRef(false);
    const hasStartedFinalSaveRef = useRef(false);
    const hasShownExpirationModalRef = useRef(false);
    const isFinalSavingRef = useRef(false);

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    useEffect(() => {
        if (!user || !courseId || !examId || !exerciseId) return;

        setLoad(true);

        API.getExamSubmission(courseId, examId, exerciseId, user.username)
            .then((res) => {
                console.log(res);

                setExam(res.exam);
                setExercise(res.exercise);
                setSubmissionModel(res.submission?.model ?? null);
                setActive(res.active);
                setEnded(res.ended);
                setLoad(false);
            })
            .catch((err) => {
                console.error(err);
                setLoad(false);
                openError();
                setErrorInfo("There was an error while loading the exam exercise. Please reload the page.");
            });
    }, [user, courseId, examId, exerciseId, openError]);

    useEffect(() => {
        if (load) return;
        if (!exercise) return;
        if (!active && !ended) return;
        if (!apollonRef.current) return;
        if (editorRef.current) return;

        let mounted = true;
        let localEditor: ApollonEditor | undefined;

        const initialiseEditor = async () => {
            try {
                const opts = {
                    ...options,
                    type: exercise.exType as UMLDiagramType,
                    readonly: !active
                };

                localEditor = submissionModel
                    ? new ApollonEditor(apollonRef.current!, {
                        ...opts,
                        model: submissionModel as any
                    })
                    : new ApollonEditor(apollonRef.current!, opts);

                await localEditor.nextRender;

                if (!mounted) {
                    localEditor.destroy?.();
                    return;
                }

                setEditor(localEditor);
            } catch (error) {
                console.error("Error creating Apollon editor:", error);
                openError();
                setErrorInfo("There was an error while creating the diagram editor.");
            }
        };

        initialiseEditor();

        return () => {
            mounted = false;

            if (localEditor) {
                localEditor.destroy?.();
            }

            editorRef.current = undefined;
            setEditor(undefined);
        };
    }, [load, exercise, active, ended, submissionModel, openError]);

    const saveSubmission = async () => {
        if (!user || !courseId || !examId || !exerciseId) return;
        if (!editorRef.current) return;

        await API.saveExamSubmission(
            courseId,
            examId,
            exerciseId,
            user.username,
            editorRef.current.model
        );
    };

    const autoSaveSubmission = () => {
        if (!activeRef.current) return;
        if (!editorRef.current) return;
        if (isFinalSavingRef.current) return;

        setIsSaving(true);

        saveSubmission()
            .then(() => setIsSaving(false))
            .catch((err) => {
                console.error("Error while autosaving exam submission:", err);
                setIsSaving(false);
            });
    };

    const performFinalSaveBeforeExpiration = async () => {
        if (hasStartedFinalSaveRef.current) return;

        hasStartedFinalSaveRef.current = true;
        isFinalSavingRef.current = true;

        setIsSaving(true);

        try {
            await saveSubmission();
            setFinalSaveSucceeded(true);
        } catch (err) {
            console.error("Error while performing final save before exam expiration:", err);
            setFinalSaveSucceeded(false);
        } finally {
            setIsSaving(false);
            setFinalSaveCompleted(true);
            isFinalSavingRef.current = false;
        }
    };

    const handleExamExpired = () => {
        if (hasShownExpirationModalRef.current) return;

        hasShownExpirationModalRef.current = true;

        setActive(false);
        setEnded(true);
        setTimeLeftMs(0);
        closeWarning();
        openExpired();
    };

    useEffect(() => {
        if (!active || !user) return;

        const interval = setInterval(() => {
            autoSaveSubmission();
        }, 30000);

        return () => clearInterval(interval);
    }, [active, user]);

    useEffect(() => {
        if (!exam || !active) return;

        const endTime = getExamEndTime(exam);

        if (!endTime) {
            console.warn("Unable to parse exam end date:", exam.endDate);
            return;
        }

        const updateTimer = () => {
            const remaining = endTime - Date.now();

            setTimeLeftMs(Math.max(remaining, 0));

            if (
                remaining > 0 &&
                remaining <= FIVE_MINUTES_MS &&
                !hasShownFiveMinuteWarningRef.current
            ) {
                hasShownFiveMinuteWarningRef.current = true;
                openWarning();
            }

            if (
                remaining > 0 &&
                remaining <= THIRTY_SECONDS_MS &&
                !hasStartedFinalSaveRef.current
            ) {
                performFinalSaveBeforeExpiration();
            }

            if (remaining <= 0) {
                handleExamExpired();
            }
        };

        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [exam, active, openWarning, closeWarning, openExpired]);

    const closeExpirationModalAndReturn = () => {
        closeExpired();
        navigate(`/student/exams/${courseId}/${examId}`);
    };

    const deadlineColour = getDeadlineColour(timeLeftMs);
    const countdownText = getCountdownText(timeLeftMs);
    const showCountdown = active && timeLeftMs !== null && timeLeftMs <= FIVE_MINUTES_MS;

    return (
        <>
            <Skeleton visible={load}>
                {exam && exercise && (
                    <>
                        <Group justify="space-between" align="center" mb="md">
                            <Stack gap={0}>
                                <Text fw={700} fs="italic" td="underline">
                                    {exercise.title}
                                </Text>

                                <Text size="sm" color="dimmed">
                                    {exam.title}
                                </Text>

                                <Text
                                    size="sm"
                                    style={{
                                        color: deadlineColour,
                                        fontWeight: showCountdown ? 700 : 400
                                    }}
                                >
                                    Open from {exam.startDate} to {exam.endDate}
                                    {showCountdown && (
                                        <>
                                            {" "}
                                            — Time remaining: {countdownText}
                                        </>
                                    )}
                                </Text>
                            </Stack>

                            <Group>
                                <Button
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconInfoCircle size={14} />}
                                    onClick={openDescription}
                                >
                                    Exercise description
                                </Button>

                                {active && isSaving && (
                                    <Badge
                                        variant="light"
                                        color="blue"
                                        leftSection={<IconCircleDashedCheck size={14} />}
                                    >
                                        Saving...
                                    </Badge>
                                )}

                                <Button
                                    variant="light"
                                    color="red"
                                    leftSection={<IconSquareXFilled size={14} />}
                                    onClick={() => navigate(`/student/exams/${courseId}/${examId}`)}
                                >
                                    Exit
                                </Button>
                            </Group>
                        </Group>

                        {!active && !ended && (
                            <Alert
                                variant="light"
                                color="yellow"
                                icon={<IconHourglassHigh size={16} />}
                                title="Exam call not started yet"
                            >
                                This exam call will open on {exam.startDate}. You will be able to work on this exercise once it begins.
                            </Alert>
                        )}

                        {ended && !finalSaveCompleted && (
                            <Alert
                                variant="light"
                                color="gray"
                                icon={<IconClockExclamation size={16} />}
                                title="Exam call ended"
                                mb="md"
                            >
                                This exam call ended on {exam.endDate}. Your last saved submission is shown below in read-only mode.
                            </Alert>
                        )}

                        {(active || ended) && (
                            <div
                                ref={apollonRef}
                                id="apollon"
                                className="canv"
                                style={{
                                    height: "75vh",
                                    width: "100%",
                                    marginRight: "2px",
                                    marginLeft: "2px",
                                    marginTop: "0px"
                                }}
                            />
                        )}

                        {active && (
                            <Center mt="md">
                                <Text size="sm" color="dimmed">
                                    Your work is saved automatically every 30 seconds.
                                    {timeLeftMs !== null && timeLeftMs <= THIRTY_SECONDS_MS && (
                                        <>
                                            {" "}
                                            A final save is being performed before the exam expires.
                                        </>
                                    )}
                                </Text>
                            </Center>
                        )}

                        <Modal
                            opened={descriptionOpened}
                            onClose={closeDescription}
                            title={exercise.title}
                            size="lg"
                            centered
                        >
                            <Text style={{ whiteSpace: "pre-wrap" }}>
                                {exercise.description}
                            </Text>
                        </Modal>

                        <Modal
                            opened={warningOpened}
                            onClose={closeWarning}
                            title="Exam ending soon"
                            size="md"
                            centered
                        >
                            <Stack>
                                <Alert
                                    variant="light"
                                    color="red"
                                    icon={<IconClockExclamation size={16} />}
                                    title="Less than 5 minutes remaining"
                                >
                                    The exam is about to end. Your work will continue to be saved automatically, and a final save will be performed 30 seconds before the deadline.
                                </Alert>

                                <Text fw={700} style={{ color: deadlineColour }}>
                                    Time remaining: {countdownText}
                                </Text>

                                <Group justify="flex-end">
                                    <Button color="red" onClick={closeWarning}>
                                        Continue working
                                    </Button>
                                </Group>
                            </Stack>
                        </Modal>

                        <Modal
                            opened={expiredOpened}
                            onClose={closeExpirationModalAndReturn}
                            title="Exam expired"
                            size="md"
                            centered
                            closeOnClickOutside={false}
                            closeOnEscape={false}
                            withCloseButton={false}
                        >
                            <Stack>
                                {finalSaveSucceeded === true && (
                                    <Alert
                                        variant="light"
                                        color="green"
                                        icon={<IconCircleDashedCheck size={16} />}
                                        title="Submission saved"
                                    >
                                        The exam has ended. Your diagram was saved shortly before the deadline.
                                    </Alert>
                                )}

                                {finalSaveSucceeded === false && (
                                    <Alert
                                        variant="light"
                                        color="red"
                                        icon={<IconSquareXFilled size={16} />}
                                        title="Save failed"
                                    >
                                        The exam has ended, but there was an error while saving your diagram before the deadline. Please contact the instructor or reload the exam page to check the latest saved submission.
                                    </Alert>
                                )}

                                {finalSaveSucceeded === null && (
                                    <Alert
                                        variant="light"
                                        color="yellow"
                                        icon={<IconClockExclamation size={16} />}
                                        title="Final save status unknown"
                                    >
                                        The exam has ended. The final save could not be confirmed before the deadline. Please check the exam page or contact the instructor.
                                    </Alert>
                                )}

                                <Group justify="flex-end">
                                    <Button onClick={closeExpirationModalAndReturn}>
                                        Return to exam page
                                    </Button>
                                </Group>
                            </Stack>
                        </Modal>
                    </>
                )}
            </Skeleton>

            <ErrorMessage
                open={errorOpened}
                onClose={() => {
                    closeError();
                    setErrorInfo("");
                }}
                details={errorInfo}
            />

            {isSaving && active && (
                <Notification color="blue" mt="md" className="notif" loading={true}>
                    <Alert
                        variant="light"
                        color="blue"
                        icon={<IconCircleDashedCheck size={16} />}
                        title="Saving..."
                    >
                        Your diagram is being saved. Please wait...
                    </Alert>
                </Notification>
            )}
        </>
    );
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const THIRTY_SECONDS_MS = 30 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false,
    enablePopups: true
};

function getExamEndTime(exam: ExamCall): number | null {
    const rawEndDate = exam.endDate;

    if (!rawEndDate) return null;

    const parsed = new Date(rawEndDate).getTime();

    if (!Number.isNaN(parsed)) {
        return parsed;
    }

    if (typeof rawEndDate === "string") {
        const normalised = rawEndDate.replace(" ", "T");
        const parsedNormalised = new Date(normalised).getTime();

        if (!Number.isNaN(parsedNormalised)) {
            return parsedNormalised;
        }
    }

    return null;
}

function getDeadlineColour(timeLeftMs: number | null): string {
    if (timeLeftMs === null) return "var(--mantine-color-dimmed)";

    if (timeLeftMs <= 0) return "rgb(190, 0, 0)";
    if (timeLeftMs <= FIVE_MINUTES_MS) return "rgb(190, 0, 0)";
    if (timeLeftMs >= THIRTY_MINUTES_MS) return "var(--mantine-color-dimmed)";

    const progress =
        1 - (timeLeftMs - FIVE_MINUTES_MS) / (THIRTY_MINUTES_MS - FIVE_MINUTES_MS);

    const red = Math.round(120 + progress * 70);
    const green = Math.round(120 - progress * 120);
    const blue = Math.round(120 - progress * 120);

    return `rgb(${red}, ${green}, ${blue})`;
}

function getCountdownText(timeLeftMs: number | null): string {
    if (timeLeftMs === null) return "";

    const totalSeconds = Math.max(Math.ceil(timeLeftMs / 1000), 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes <= 0) {
        return `${seconds} second${seconds === 1 ? "" : "s"}`;
    }

    return `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds
        .toString()
        .padStart(2, "0")} second${seconds === 1 ? "" : "s"}`;
}

export default StudentExamExercisePage;