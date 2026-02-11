import React, { useEffect, useState, useRef, useContext } from "react";
import { Alert, Button, Center, Text, Modal, Fieldset, Tabs, Grid, Notification, Stack, TextInput, Group, Avatar, RingProgress, Drawer, List, ThemeIcon, Highlight, Divider, Progress, Skeleton, Popover, Table } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconCircleDashedCheck, IconCloudUpload, IconDownload, IconEdit, IconExclamationCircle, IconExclamationCircleFilled, IconFileDescriptionFilled, IconMedal, IconMenu4, IconReload, IconSquareRoundedPlusFilled, IconSquareXFilled, IconTrash, IconTrashFilled, IconTrophyFilled, IconUpload, IconUserUp, IconX } from "@tabler/icons-react";
import { Exercise, SandboxDiagram } from "../../Utils/Models";
import { useNavigate, useParams } from "react-router-dom";
import { ApollonMode, UMLDiagramType, UMLModel } from "../../../typings"
import { ApollonEditor } from "../../../apollon-editor";
import { useDisclosure } from "@mantine/hooks";
import { ClassDiagramEvaluationResults } from "../../Utils/ClassDiagram/EvaluationTypes";
import "csshake/dist/csshake.css"
import { Shake, ShakeCrazy } from "reshake"
import { Dropzone } from "@mantine/dropzone";
import 'svg2pdf.js'
import jsPDF from "jspdf";
import { Canvg } from "canvg";

const options = {
    colorEnabled: false,
    scale: 0.8,
    mode: ApollonMode.Modelling,
    readonly: false,
    enablePopups: true
}


export function Sandbox() {
    const user = useContext(UserContext)
    const [editor, setEditor] = useState<ApollonEditor>()
    const [diagramType, setDiagramType] = useState<UMLDiagramType>("ClassDiagram")
    const [openedModel, { open: openModel, close: closeModel }] = useDisclosure(false)
    const [openedDelete, { open: openDelete, close: closeDelete }] = useDisclosure(false)
    const [openedUpload, { open: openUpload, close: closeUpload }] = useDisclosure(false)
    const [uploadedModel, setUploadedModel] = useState("")
    const [filename, setFilename] = useState("")
    const [savedDiagrams, setSavedDiagrams] = useState<SandboxDiagram[]>([])
    const [currentDiagram, setCurrentDiagram] = useState<SandboxDiagram | null>(null)
    const apollonRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (user) API.getSandboxDiagrams(user.username).then((diagrams) => {
            setSavedDiagrams(diagrams)
        })
    }, [])

    useEffect(() => {
        if (openedModel) {
            const timer = setTimeout(async () => {
                try {
                    if (editor) {
                        editor.destroy?.()
                        setEditor(undefined)
                    }
                    if (apollonRef.current) {
                        let ed = new ApollonEditor(apollonRef.current, { ...options, type: diagramType })
                        if (uploadedModel) {
                            ed = new ApollonEditor(apollonRef.current, { ...options, type: diagramType, model: JSON.parse(uploadedModel) as UMLModel })
                            setUploadedModel("")
                        }
                        if (currentDiagram)
                            ed = new ApollonEditor(apollonRef.current, { ...options, type: currentDiagram.exerciseType as UMLDiagramType, model: currentDiagram.model })
                        await ed.nextRender
                        setEditor(ed)
                    }
                } catch (error) {
                    console.error("Error initializing Apollon Editor:", error)
                }
            }, 350)

            return () => {
                clearTimeout(timer)
            }
        }
    }, [openedModel])

    useEffect(() => {
        if (currentDiagram) {
            setFilename(currentDiagram.filename)
        } else {
            setFilename("")
        }
    }, [currentDiagram])

    const saveDiagram = () => {
        if (editor && user) {
            let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`
            if (!currentDiagram) {
                API.saveSandboxDiagram(editor.model, diagramType, filename.trim() === "" ? defaultName : filename, user.username).then((res) => {
                    API.getSandboxDiagrams(user.username).then((diagrams) => {
                        setSavedDiagrams(diagrams)
                        closeModel()
                    })
                })
            } else {
                API.updateSandboxDiagram(user.username, currentDiagram.diagramId, editor.model, diagramType, filename.trim() === "" ? currentDiagram.filename : filename).then(() => {
                    API.getSandboxDiagrams(user.username).then((diagrams) => {
                        setSavedDiagrams(diagrams)
                        closeModel()
                        setCurrentDiagram(null)
                    })
                })
            }
        }
    }

    const deleteDiagram = () => {
        if (user && currentDiagram) {
            API.deleteSandboxDiagram(user.username, currentDiagram.diagramId).then(() => {
                API.getSandboxDiagrams(user.username).then((diagrams) => {
                    setSavedDiagrams(diagrams)
                    closeDelete()
                    setCurrentDiagram(null)
                })
            })
        }
    }

    const exportJSON = () => {
        if (editor) {
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
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(model, null, 2));
            const link = document.createElement('a');
            link.href = dataStr
            let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`
            let fn = filename || defaultName
            link.download = `${fn}.json`;
            link.click();
            link.remove()
        }
    }

    const exportSVG = () => {
        if (editor) {
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
                let ed = new ApollonEditor(newDiv, { ...options, type: diagramType as UMLDiagramType, model: model })
                await ed.nextRender
                const { svg } = await ed.exportAsSVG({ keepOriginalSize: true, margin: 20 });
                const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                const svgBlobURL = URL.createObjectURL(svgBlob);

                const link = document.createElement('a');
                link.href = svgBlobURL
                let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`
                let fn = filename || defaultName
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
        if (editor) {
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
                let ed = new ApollonEditor(newDiv, { ...options, type: diagramType as UMLDiagramType, model: model })
                await ed.nextRender
                const { svg } = await ed.exportAsSVG({ keepOriginalSize: true, margin: 20 });
                const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
                const url = URL.createObjectURL(blob);
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = img.width
                    canvas.height = img.height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0)
                    const pndDataUrl = canvas.toDataURL('image/png')
                    const doc = new jsPDF({
                        orientation: img.width > img.height ? 'landscape' : 'portrait',
                        unit: 'pt',
                        format: [img.width, img.height],
                    })
                    doc.addImage(pndDataUrl, 'PNG', 0, 0, img.width, img.height);
                    let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`;
                    let fn = filename || defaultName;
                    doc.save(`${fn}.pdf`);

                    URL.revokeObjectURL(url)
                    newDiv.remove()
                    ed.destroy()
                    canvas.remove()
                }
                img.onerror = (err) => {
                    console.error("Error loading SVG image:", err)
                    URL.revokeObjectURL(url)
                    newDiv.remove()
                    ed.destroy()
                }
                img.src = url
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
                    setUploadedModel(e.target?.result as string)
                    closeUpload()
                    openModel()
                } catch (error) {
                    console.error("Error reading file:", error)
                }
            }
            fileReader.readAsText(files[0])
        }
    }

    return (
        <>
            <Center mt="md">
                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => {
                    setDiagramType("ClassDiagram")
                    openModel()
                }} >Create new UML Class Diagram</Button>
                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => {
                    setDiagramType("UseCaseDiagram")
                    openModel()
                }} >Create new UML Use Case Diagram</Button>
                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => {
                    setDiagramType("DeploymentDiagram")
                    openModel()
                }} >Create new UML Deployment Diagram</Button>
                <Button variant="light" color="pink" rightSection={<IconUpload size={16} />} mt="sm" onClick={() => {
                    openUpload()
                }}>Upload JSON source</Button>
            </Center>

            <Fieldset legend="Saved diagrams" mt="md" style={{ width: "100%" }}>
                {savedDiagrams.length === 0 ? <Alert title="No diagrams found" color="yellow">You have no saved diagrams.</Alert> :
                    <Table horizontalSpacing="md" verticalSpacing="xs" miw={700} layout='fixed'>
                        <Table.Thead>
                            <tr>
                                <th>Filename</th>
                                <th>Type</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {savedDiagrams.map((diagram) => (
                                <tr key={diagram.diagramId}>
                                    <td>{diagram.filename}</td>
                                    <td>{diagram.exerciseType}</td>
                                    <td>{diagram.lastUpdated}</td>
                                    <td>
                                        <Center>
                                            <Button variant="light" color="green" rightSection={<IconEdit size={16} stroke={1.5} />} onClick={() => {
                                                setCurrentDiagram(diagram)
                                                openModel()
                                            }} >Edit</Button>
                                            <Button variant="light" color="red" rightSection={<IconTrashFilled size={16} stroke={1.5} />} onClick={() => {
                                                setCurrentDiagram(diagram)
                                                openDelete()
                                            }} ml="sm" >Delete</Button>
                                        </Center>
                                    </td>
                                </tr>
                            ))}
                        </Table.Tbody>
                    </Table>}
            </Fieldset>

            <Modal opened={openedDelete} onClose={() => {
                closeDelete()
                setCurrentDiagram(null)
            }} transitionProps={{ transition: "fade", duration: 300 }}>
                <Stack gap="sm" align='center' justify="center">
                    <Alert variant="light" color="red" title="Warning!" icon={<IconExclamationCircleFilled size={24} stroke={1.5} />}>
                        Are you sure you want to delete this diagram? This action cannot be undone.
                    </Alert>
                    <Grid>
                        <Grid.Col span={6}>
                            <Button variant='light' color="gray" onClick={() => {
                                closeDelete()
                                setCurrentDiagram(null)
                            }} leftSection={<IconX size={16} stroke={1.5} />}>Cancel</Button>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Button variant="light" color="red" onClick={() => deleteDiagram()} rightSection={<IconTrashFilled size={16} stroke={1.5} />}>Delete diagram</Button>
                        </Grid.Col>
                    </Grid>
                </Stack>
            </Modal>

            <Modal opened={openedUpload} onClose={() => closeUpload()} transitionProps={{ transition: "fade", duration: 300 }}>
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
            </Modal>

            <Modal opened={openedModel} onClose={() => {
                if (editor) {
                    editor.destroy?.()
                    setEditor(undefined)
                }
                closeModel()
            }} fullScreen transitionProps={{ transition: 'fade', duration: 300 }} >
                <Fieldset legend="Sandbox" style={{ width: "100%" }}>
                    <div ref={apollonRef} id="apollon" style={{ height: "80vh" }} ></div>
                    <Grid mt="md" justify="center">
                        <Grid.Col span={6}>
                            <TextInput label="Filename" placeholder="Filename" value={filename} onChange={(e) => setFilename(e.currentTarget.value)} style={{ width: "30%" }} />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Center mt="md">
                                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} onClick={saveDiagram} >
                                    Save diagram
                                </Button>
                                <Button variant="light" color="yellow" onClick={exportJSON} leftSection={<IconDownload size={14} />} >Download JSON source file</Button>
                                <Button variant="light" color="cyan" onClick={exportSVG} leftSection={<IconDownload size={14} />}>Download diagram as SVG image</Button>
                                <Button variant="light" color="pink" onClick={exportPDF} leftSection={<IconDownload size={14} />}>Download diagram as PDF file</Button>
                            </Center>
                        </Grid.Col>
                    </Grid>
                </Fieldset>
            </Modal>
        </>
    )
}