import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Card, Center, Flex, Text, Modal, Fieldset, Tabs, Image, Grid, Stack, Notification, TextInput, NativeSelect, Textarea, Group, Loader } from "@mantine/core";
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
    const [warning, setWarning] = useState<boolean>(false)
    const [clicked, setClicked] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (user && Array.isArray(user.courses) && user.courses.length > 0) {
            setCourseLoad(true)
            Promise.all(user.courses.map((course: string) => API.getCourseInfo(course)))
                .then(results => {
                    console.log(results)
                    setCourses(results)
                })
                .catch(err => {
                    console.error("Failed to load courses", err)
                    setCourses([])
                })
                .finally(() => {
                    setCourseLoad(false)
                })
        } else {
            setCourses([])
            setCourseLoad(false)
        }
    }, [user])

    return (
        <>
            <Fieldset legend="Your courses" style={{ width: "100%" }}>
                <Flex direction="column" gap={10} style={{ width: "100%" }}>
                    {courses.length > 0 ? (<>
                        <Flex direction="column" gap={10} style={{ width: "100%" }}>
                            {courses.map((course, index) => (
                                <Card key={index} shadow="sm" padding="lg" style={{ width: "100%", margin: 'auto', cursor: course.settings ? "pointer" : "not-allowed", }}
                                    onClick={() => {
                                        setClicked(course.courseId)
                                        if (course.settings) {
                                            navigate("/student/courses/" + course.courseId)
                                        } else {
                                            setWarning(true)
                                            setTimeout(() => {
                                                setWarning(false)
                                            }, 5000)
                                        }
                                    }}
                                >
                                    <Flex align="flex-start" gap={16}>
                                        <Stack style={{ flex: 1, minWidth: 0 }}>
                                            <Text w={500} size="lg">{course.courseName}</Text>
                                            <Text w={500} size="sm" color="dimmed">{course.courseId}</Text>
                                            <Text w={500} size="sm">{course.exercises.filter((ex) => ex.visible).length} available exercises</Text>
                                        </Stack>
                                        {warning && clicked === course.courseId && (
                                            <div style={{ flex: 1 }}>
                                                <Alert variant="light" color="yellow" icon={<IconExclamationCircle size={16} />} title="Warning!" style={{ width: "100%" }} >  This course has not been configured yet. Please notify your teacher to set it up.
                                                </Alert>
                                            </div>
                                        )}
                                    </Flex>
                                </Card>
                            ))}
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