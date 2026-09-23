import React, { useEffect, useState, useContext } from 'react';
import { IconCalendarTime, IconChevronRight, IconInfoCircle } from '@tabler/icons-react';
import { Badge, Card, Center, Divider, Fieldset, Flex, Group, Stack, Text, } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../API';
import { ExamCall } from '../../Utils/Models';
import { examStatusColor, examStatusLabel, getExamStatus } from '../../Utils/ExamUtils';
import { UserContext } from '../Login/UserContext';

function StudentExamCallPage() {
    const user = useContext(UserContext)
    const { courseId, examId } = useParams()
    const [exam, setExam] = useState<ExamCall | undefined>(undefined)
    const navigate = useNavigate()

    useEffect(() => {
        if (courseId && user) {
            API.getStudentExamCalls(courseId, user.username).then((exams) => {
                setExam(exams.find((e) => e.examId === examId))
            })
        }
    }, [])

    const status = exam ? getExamStatus(exam.startDate, exam.endDate) : undefined
    console.log(exam)

    return (
        <>
            <Group>
                <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Exam call ID: {examId}</Badge>
                {status && <Badge variant="light" color={examStatusColor(status)}>{examStatusLabel(status)}</Badge>}
            </Group>
            {exam && <>
                <Text size="xl" fw={700} mt="md">{exam.title}</Text>
                <Text size="md" color="dimmed">{exam.description}</Text>
                <Group mt="sm">
                    <Badge variant="light" color="gray" leftSection={<IconCalendarTime size={16} />}>From {exam.startDate} to {exam.endDate}</Badge>
                </Group>
            </>}
            <Divider my="md" label="Exercises" labelPosition='center' />
            <Fieldset legend="Exam exercises">
                <Flex direction="column" gap={10} style={{ width: "100%" }}>
                    {exam && exam.exercises.length > 0 ? exam.exercises.map((exercise, index) => (
                        <Card key={index} shadow="sm" padding="lg" style={{ width: "100%", margin: 'auto', cursor: "pointer" }}
                            onClick={() => navigate(`/student/exams/${courseId}/${examId}/exercises/${exercise.exerciseId}`)}>
                            <Flex align="center" justify="space-between" gap={16}>
                                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                                    <Text w={500} size="lg">{exercise.title}</Text>
                                    <Text w={500} size="sm" color="dimmed">{exercise.exType}</Text>
                                </Stack>
                                <IconChevronRight size={20} />
                            </Flex>
                        </Card>
                    )) : (
                        <Center>
                            <Text color="dimmed">No exercises have been published for this exam call yet.</Text>
                        </Center>
                    )}
                </Flex>
            </Fieldset>
        </>
    )
}

export default StudentExamCallPage
