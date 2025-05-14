import React from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Badge, Divider, } from '@mantine/core';
import "./style.scss"
import { useParams } from 'react-router-dom';
import EnrollmentView from './EnrollmentView';
import ExerciseTable from './ExerciseTable';

function CoursePage() {
    const { courseId } = useParams()

    return (
        <>
            <Badge color="cyan" size="xl" leftSection={<IconInfoCircle size={16} />} >Course ID: {courseId}</Badge>
            <Divider my="md" label="Students" labelPosition='center' />
            <EnrollmentView />
            <Divider my="md" label="Exercises" labelPosition='center' />
            <ExerciseTable />
        </>
    )
}

export default CoursePage