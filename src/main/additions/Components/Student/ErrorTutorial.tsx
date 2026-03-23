import React, { useEffect, useState, useRef } from "react";
import { Card, Center, Text, Modal, Fieldset, Grid, Skeleton } from "@mantine/core";
import API from "../../API";
import { ApollonMode } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { ClassDiagramErrorExample } from "../../Utils/ClassDiagram/EvaluationTypes";
import "csshake/dist/csshake.css"
import 'svg2pdf.js'

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: true,
    enablePopups: true
}

function ErrorTutorial() {
    const [errorExamples, setErrorExamples] = useState<ClassDiagramErrorExample[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [opened, { open, close }] = useDisclosure(false)
    const [currentExample, setCurrentExample] = useState<ClassDiagramErrorExample | null>(null)
    const [loadModal, setLoadModal] = useState(false)
    const apollonRef = useRef<HTMLDivElement>(null)
    const [editor, setEditor] = useState<ApollonEditor | null>(null)


    useEffect(() => {
        API.getExampleErrors().then((errs) => {
            setErrorExamples(errs)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        if (opened && currentExample) {
            setLoadModal(true)
            const timer = setTimeout(async () => {
                if (editor) {
                    editor.destroy()
                }
                if (apollonRef.current) {
                    let ed = new ApollonEditor(apollonRef.current, { ...options, type: "ClassDiagram" })
                    await ed.nextRender;
                    if (currentExample.model) {
                        ed.model = currentExample.model
                    }
                    setEditor(ed)
                    setLoadModal(false)
                }
            }, 350)

            return () => {
                clearTimeout(timer)
            }
        }
    }, [opened, currentExample])

    return (
        <>
            <Fieldset legend="Error Examples" style={{ marginTop: "1rem" }}>
                <Grid columns={2} gutter="md">
                    <Grid.Col span={1}>
                        <Text fw={500} mb="md">Syntax Errors</Text>
                        <div style={{ maxHeight: "500px", overflowY: "auto", borderRight: "1px solid #eee", paddingRight: "1rem" }}>
                            <Skeleton visible={loading}>
                                {errorExamples.filter((e) => e.type === "syntax").map((error, idx) => (
                                    <Card key={idx} shadow="sm" padding="sm" mb="sm" style={{ width: "100%", margin: 'auto', cursor: "pointer", position: "relative", minHeight: "80px", height: "80px", flexShrink: 0 }}
                                        onClick={() => {
                                            setCurrentExample(error)
                                            open()
                                        }} >
                                        <Text fw={500}>{error.id}</Text>
                                    </Card>
                                ))}
                            </Skeleton>
                        </div>
                    </Grid.Col>
                    <Grid.Col span={1}>
                        <Text fw={500} mb="md">Semantic Errors</Text>
                        <div style={{ maxHeight: "500px", overflowY: "auto", paddingLeft: "1rem" }}>
                            <Skeleton visible={loading}>
                                {errorExamples.filter((e) => e.type === "semantic").map((error, idx) => (
                                    <Card key={idx} shadow="sm" padding="sm" mb="sm" style={{ width: "100%", margin: 'auto', cursor: "pointer", position: "relative", minHeight: "80px", height: "80px", flexShrink: 0 }}
                                        onClick={() => {
                                            setCurrentExample(error)
                                            open()
                                        }} >
                                        <Text fw={500}>{error.id}</Text>
                                    </Card>
                                ))}
                            </Skeleton>
                        </div>
                    </Grid.Col>
                </Grid>
            </Fieldset>

            {errorExamples && currentExample && <Modal closeOnEscape={false} opened={opened} onClose={close} fullScreen transitionProps={{ transition: 'fade', duration: 300 }} >
                <Center>
                    <Text fw={500} mb="md" style={{ marginTop: "1rem" }}>{currentExample.id} </Text>
                </Center>
                <Text>{currentExample.description}</Text>
                <div ref={apollonRef} id="apollon" className="canv" style={{ width: "100%", marginRight: "2px", marginLeft: "2px", marginTop: "0px" }}></div>
            </Modal>}
        </>
    )
}

export default ErrorTutorial;