import React, { useEffect, useState, useContext } from "react";
import { Alert, Badge, Card, Fieldset, Flex, Loader, Stack, Text, } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconExclamationCircle } from "@tabler/icons-react";
import { ExamCall } from "../../Utils/Models";
import { examStatusColor, examStatusLabel, getExamStatus } from "../../Utils/ExamUtils";
import { useNavigate } from "react-router-dom";

function StudentExams() {
    const user = useContext(UserContext)
    const [exams, setExams] = useState<ExamCall[]>([])
    const [load, setLoad] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (user && Array.isArray(user.courses) && user.courses.length > 0) {
            setLoad(true)
            Promise.all(user.courses.map((course: string) => API.getStudentExamCalls(course, user.username)))
                .then((results) => {
                    setExams(results.flat())
                })
                .catch((err) => {
                    console.error("Failed to load exam calls", err)
                    setExams([])
                })
                .finally(() => {
                    setLoad(false)
                })
        } else {
            setExams([])
            setLoad(false)
        }
    }, [user])

    return (
        <>
            <Fieldset legend="Your exam calls" style={{ width: "100%" }}>
                <Flex direction="column" gap={10} style={{ width: "100%" }}>
                    {exams.length > 0 ? (
                        <Flex direction="column" gap={10} style={{ width: "100%" }}>
                            {exams.map((exam, index) => {
                                const status = getExamStatus(exam.startDate, exam.endDate)
                                return (
                                    <Card key={index} shadow="sm" padding="lg" style={{ width: "100%", margin: 'auto', cursor: "pointer" }}
                                        onClick={() => navigate(`/student/exams/${exam.courseId}/${exam.examId}`)}>
                                        <Flex align="flex-start" gap={16} justify="space-between">
                                            <Stack style={{ flex: 1, minWidth: 0 }} gap={4}>
                                                <Text w={500} size="lg">{exam.title}</Text>
                                                <Text w={500} size="sm" color="dimmed">{exam.courseId}</Text>
                                                <Text w={500} size="sm">{exam.exercises.length} exercise(s)</Text>
                                            </Stack>
                                            <Stack align="flex-end" gap={4}>
                                                <Badge variant="light" color={examStatusColor(status)}>{examStatusLabel(status)}</Badge>
                                                <Text size="sm" color="dimmed">From {exam.startDate} to {exam.endDate}</Text>
                                            </Stack>
                                        </Flex>
                                    </Card>
                                )
                            })}
                        </Flex>
                    ) : (<>
                        {!load && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No exam calls found!" >
                            You are not enrolled in any exam calls yet. Please contact your teacher if you believe this is an error.
                        </Alert>}
                    </>)}
                    {load && <>
                        Loading exam calls...
                        <Loader size={100} type={"bars"} color="cyan" style={{ margin: "auto" }} />
                    </>}
                </Flex>
            </Fieldset>
        </>
    )
}

export default StudentExams
