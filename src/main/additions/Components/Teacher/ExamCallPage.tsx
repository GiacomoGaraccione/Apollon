import React, { useEffect, useState } from 'react';
import { IconCalendarTime, IconInfoCircle } from '@tabler/icons-react';
import { Badge, Divider, Group, Text, } from '@mantine/core';
import "./style.scss"
import { useParams } from 'react-router-dom';
import API from '../../API';
import { ExamCall } from '../../Utils/Models';
import { examStatusColor, examStatusLabel, getExamStatus } from '../../Utils/ExamUtils';
import ExamEnrollmentView from './ExamEnrollmentView';
import ExamExerciseTable from './ExamExerciseTable';

function ExamCallPage() {
    const { courseId, examId } = useParams()
    const [exam, setExam] = useState<ExamCall | undefined>(undefined)

    useEffect(() => {
        if (courseId && examId) {
            API.getExamCall(courseId, examId).then((e) => {
                setExam(e)
            })
        }
    }, [])

    return (
        <>
            <Group>
                <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Exam call ID: {examId}</Badge>
                {exam && <Badge variant="light" color={examStatusColor(getExamStatus(exam.startDate, exam.endDate))}>{examStatusLabel(getExamStatus(exam.startDate, exam.endDate))}</Badge>}
            </Group>
            {exam && <>
                <Text size="xl" fw={700} mt="md">{exam.title}</Text>
                <Text size="md" color="dimmed">{exam.description}</Text>
                <Group mt="sm">
                    <Badge variant="light" color="gray" leftSection={<IconCalendarTime size={16} />}>From {exam.startDate} to {exam.endDate}</Badge>
                </Group>
            </>}
            <Divider my="md" label="Students" labelPosition='center' />
            <ExamEnrollmentView />
            <Divider my="md" label="Exercises" labelPosition='center' />
            <ExamExerciseTable />
        </>
    )
}

export default ExamCallPage
