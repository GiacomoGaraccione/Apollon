import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Stack, TextInput, NativeSelect, Textarea, Group, Loader } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconExclamationCircle } from "@tabler/icons-react";
import { Course } from "../../Utils/Models";
import { AvatarUnlockOptions } from "../../Utils/AvatarUtils";
import { useNavigate } from "react-router-dom";

function StudentCourses() {
    const user = useContext(UserContext)
    const [courses, setCourses] = useState<Course[]>([])
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null)
    const [courseLoad, setCourseLoad] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            setCourseLoad(true)
            Promise.all(user.courses.map((course: string) => API.getCourseInfo(course)))
                .then(results => {
                    let cs = results.map((course: any) => {
                        let settings: AvatarUnlockOptions | null
                        try {
                            settings = JSON.parse(course.settings) as AvatarUnlockOptions
                        } catch (error) {
                            settings = null
                            console.error("Error parsing settings:", error)
                        }
                        return new Course(course.courseId, course.courseName, [], course.exercises, settings)
                    })
                    setCourseLoad(false)
                    setCourses(cs)
                })
        }
    }, [])

    return (
        <>
            <Fieldset legend="Your courses" style={{ width: "100%" }}>
                <Flex direction="column" gap={10} style={{ width: "100%" }}>
                    {courses.length > 0 ? (<>
                        <Flex direction="column" gap={10} style={{ width: "100%" }}>
                            {courses.map((course, index) => (
                                <Card key={index} shadow="sm" padding="lg" style={{
                                    width: "100%", margin: 'auto', cursor: "pointer",
                                    border: currentCourse === course ? '5px solid cyan' : undefined
                                }} onClick={() => {
                                    navigate("/student/courses/" + course.courseId)
                                }}>
                                    <Stack >
                                        <Text w={500} size="lg">{course.courseName}</Text>
                                        <Text w={500} size="sm" color="dimmed">{course.courseId}</Text>
                                        <Text w={500} size="sm">{course.exercises.filter((ex) => ex.visible).length} available exercises</Text>
                                    </Stack>
                                </Card>
                            ))}
                        </Flex>
                        <Flex wrap="wrap" justify="center" gap="md">
                            {currentCourse && <>
                                <Fieldset legend="Exercises" style={{ width: "100%" }}>
                                    <Flex direction="column" gap={10} style={{ width: "100%" }}>
                                        {currentCourse.exercises.filter((ex) => ex.visible).length > 0 ? (<>
                                            {currentCourse.exercises.filter((ex) => ex.visible).map((exercise, index) => (
                                                <Card key={index} shadow="sm" padding="lg" style={{
                                                    width: "100%", margin: 'auto', cursor: "pointer",
                                                }} >
                                                    <Text w={500} size="lg">{exercise.title}</Text>
                                                </Card>
                                            ))}
                                        </>) : (<>
                                            <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No exercises found!" >
                                                This course has no exercises yet.
                                            </Alert>
                                        </>)}
                                    </Flex>
                                </Fieldset>
                            </>}
                        </Flex>
                    </>) : (<>
                        {!courseLoad && <Alert variant="light" color="cyan" icon={<IconExclamationCircle size={16} />} title="No courses found!" >
                            You are not enrolled in any courses. Please contact your teacher to be added to a course.
                        </Alert>}
                    </>)}
                    {courseLoad && <>
                        Loading courses...
                        <Loader size={100} type={"bars"} color="cyan" style={{ margin: "auto" }} />
                    </>}
                </Flex>
            </Fieldset>
        </>
    )
}

export default StudentCourses;