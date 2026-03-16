import React, { useEffect, useState, useRef, useContext, useMemo } from "react";
import { Alert, Button, Center, Text, Modal, Fieldset, Tabs, Grid, Notification, Select, Stack, TextInput, Group, Avatar, RingProgress, Drawer, List, ThemeIcon, Highlight, Divider, Progress, Skeleton, Popover, Table, ActionIcon, MultiSelect, Badge } from "@mantine/core";
import API from "../../API";
import { UserContext } from "../Login/UserContext";
import { IconCheck, IconCircleDashedCheck, IconCloudUpload, IconDownload, IconEdit, IconExclamationCircle, IconExclamationCircleFilled, IconFileDescriptionFilled, IconMedal, IconMenu4, IconReload, IconSortAscending, IconSortDescending, IconSquareRoundedPlusFilled, IconSquareXFilled, IconTrash, IconTrashFilled, IconTrophyFilled, IconUpload, IconUserUp, IconX } from "@tabler/icons-react";
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
import ErrorMessage from "./ErrorMessage";
import Modeler from "bpmn-js/lib/Modeler"
import lintModule from "bpmn-js-bpmnlint"
import resizeAllModule from "bpmn-js-nyan/lib/resize-all-rules"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css"
import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css'
import * as bpmnlintConfig from './bundled-config'


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
    const [errorOpened, { open: openError, close: closeError }] = useDisclosure(false)
    const [errorInfo, setErrorInfo] = useState<string>("")
    const apollonRef = useRef<HTMLDivElement>(null)
    const startingDiagram = `<?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" id="Definitions_0pkl0yz" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="12.0.0">
      <bpmn:process id="Process_10owelu" isExecutable="true" />
      <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_10owelu" />
      </bpmndi:BPMNDiagram>
    </bpmn:definitions>
    `
    const [modeler, setModeler] = useState<Modeler>()
    const [sortBy, setSortBy] = useState<"filename" | "exerciseType" | "lastUpdated">("lastUpdated")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const [filterTypes, setFilterTypes] = useState<string[]>([])
    const [filterMode, setFilterMode] = useState<"include" | "exclude">("include")

    useEffect(() => {
        if (user) API.getSandboxDiagrams(user.username).then((diagrams) => {
            setSavedDiagrams(diagrams)
        })
    }, [])

    useEffect(() => {
        if (openedModel) {
            const timer = setTimeout(async () => {
                try {
                    if (diagramType !== "BPMN") {
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
                                ed = new ApollonEditor(apollonRef.current, { ...options, type: currentDiagram.exerciseType as UMLDiagramType, model: currentDiagram.model as UMLModel })
                            await ed.nextRender
                            setEditor(ed)
                        }
                    } else {
                        let cont = document.getElementById("apollon")
                        let mod = new Modeler({
                            container: cont ? cont : undefined,
                            additionalModules: [lintModule, resizeAllModule],
                        })
                        let modelToLoad = startingDiagram
                        if (uploadedModel) {
                            modelToLoad = uploadedModel
                            setUploadedModel("")
                        }
                        if (currentDiagram) {
                            modelToLoad = typeof currentDiagram.model === "string" ? currentDiagram.model : startingDiagram
                        }
                        await mod.importXML(modelToLoad)
                        let linter: any = mod.get("linting")
                        linter.setLinterConfig(bpmnlintConfig)
                        linter.toggle(false)
                        setModeler(mod)
                    }
                } catch (error) {
                    console.error("Error initializing Apollon Editor:", error)
                    openError()
                    setErrorInfo("There was an error while initializing the diagram editor.")
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
        if (user) {
            let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`
            if (diagramType === "BPMN" && modeler) {
                modeler.saveXML({ format: true }).then((res) => {
                    let xml: string = res.xml ?? startingDiagram
                    if (!currentDiagram) {
                        API.saveSandboxDiagram(xml, diagramType, filename.trim() === "" ? defaultName : filename, user.username).then((res) => {
                            API.getSandboxDiagrams(user.username).then((diagrams) => {
                                setSavedDiagrams(diagrams)
                                closeModel()
                            })
                        })
                    } else {
                        API.updateSandboxDiagram(user.username, currentDiagram.diagramId, xml, diagramType, filename.trim() === "" ? currentDiagram.filename : filename).then(() => {
                            API.getSandboxDiagrams(user.username).then((diagrams) => {
                                setSavedDiagrams(diagrams)
                                closeModel()
                                setCurrentDiagram(null)
                            })
                        })
                    }
                })
            } else if (editor) {
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
        if (diagramType === "BPMN" && modeler) {
            modeler.saveXML({ format: true }).then((res) => {
                let xml: string = res.xml ?? startingDiagram
                const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xml);
                const link = document.createElement('a');
                link.href = dataStr
                let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`
                let fn = filename || defaultName
                link.download = `${fn}.xml`;
                link.click();
                link.remove()
            })
        } else if (editor) {
            let model = { ...editor.model }
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
        if (diagramType === "BPMN" && modeler) {
            modeler.saveSVG().then((res) => {
                const svg = res.svg
                const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                const svgBlobURL = URL.createObjectURL(svgBlob);
                const link = document.createElement('a');
                link.href = svgBlobURL
                let defaultName = `${diagramType}_${new Date().toLocaleString().replace(", ", "_")}`
                let fn = filename || defaultName
                link.download = `${fn}.svg`;
                link.click();
                link.remove()
                URL.revokeObjectURL(svgBlobURL)
            })
        } else if (editor) {
            const download = async () => {
                let model = { ...editor.model }
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
        const download = async () => {
            if (diagramType === "BPMN" && modeler) {
                modeler.saveSVG().then((res) => {
                    const svg = res.svg
                    const img = new Image()
                    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(svgBlob);
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
                        canvas.remove()
                    }
                    img.onerror = (err) => {
                        console.error("Error loading SVG image:", err)
                        URL.revokeObjectURL(url)
                    }
                    img.src = url
                })
            } else if (editor) {
                let model = { ...editor.model }
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

        }
        download()
    }

    const handleDrop = (files: File[]) => {
        if (files.length !== 1) {
            return
        } else {
            let nameLower = files[0]?.name?.toLowerCase() || ''
            const fileReader = new FileReader()
            fileReader.onload = (e) => {
                try {
                    if (nameLower.endsWith(".json")) {
                        let model = JSON.parse(e.target?.result as string) as UMLModel
                        if (model.type) {
                            setDiagramType(model.type)
                        } else {
                            setDiagramType("ClassDiagram")
                        }
                        setUploadedModel(e.target?.result as string)
                        closeUpload()
                        openModel()
                    } else if (nameLower.endsWith(".xml")) {
                        setDiagramType("BPMN")
                        setUploadedModel(e.target?.result as string)
                        closeUpload()
                        openModel()
                    }
                    setUploadedModel(e.target?.result as string)
                    closeUpload()
                    openModel()
                } catch (error) {
                    console.error("Error reading file:", error)
                    openError()
                    setErrorInfo("There was an error while reading the uploaded file. Please make sure it is a valid JSON file exported from the diagram editor.")
                }
            }
            fileReader.readAsText(files[0])
        }
    }

    const sortedAndFilteredDiagrams = useMemo(() => {
        let diagrams = [...savedDiagrams]
        if (filterTypes.length > 0) {
            diagrams = diagrams.filter((d) => filterMode === "include" ? filterTypes.includes(d.exerciseType) : !filterTypes.includes(d.exerciseType))
        }
        diagrams.sort((a, b) => {
            let compareA: string | number = a[sortBy]
            let compareB: string | number = b[sortBy]
            if (sortBy === "lastUpdated") {
                const parseDate = (str: string) => {
                    const [date, time] = str.split(" ")
                    const [day, month, year] = date.split("-")
                    return new Date(`${year}-${month}-${day} ${time}`).getTime()
                }
                compareA = parseDate(a.lastUpdated as string)
                compareB = parseDate(b.lastUpdated as string)
            }
            if (compareA < compareB) return sortOrder === "asc" ? -1 : 1
            if (compareA > compareB) return sortOrder === "asc" ? 1 : -1
            return 0
        })
        return diagrams
    }, [savedDiagrams, sortBy, sortOrder, filterTypes, filterMode])

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
                <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => {
                    setDiagramType("BPMN")
                    openModel()
                }} >Create new BPMN Diagram</Button>
                <Button variant="light" color="pink" rightSection={<IconUpload size={16} />} mt="sm" onClick={() => {
                    openUpload()
                }}>Upload source file</Button>
            </Center>

            <Fieldset legend="Saved diagrams" mt="md" style={{ width: "100%" }}>
                {savedDiagrams.length === 0 ? <Alert title="No diagrams found" color="yellow">You have no saved diagrams.</Alert> :
                    <>
                        <Group mb="md">
                            <Select label="Sort by" value={sortBy} onChange={(value: any) => setSortBy(value as "filename" | "exerciseType" | "lastUpdated")}
                                data={[
                                    { value: "filename", label: "Filename" },
                                    { value: "exerciseType", label: "Diagram type" },
                                    { value: "lastUpdated", label: "Last updated" },
                                ]} />
                            <ActionIcon variant="light" color="blue" onClick={() => (setSortOrder(o => o === "asc" ? "desc" : "asc"))} size="lg" mt={24}>
                                {sortOrder === "asc" ? <IconSortAscending size={16} stroke={1.5} /> : <IconSortDescending size={16} stroke={1.5} />}
                            </ActionIcon>
                            <MultiSelect label="Filter by diagram type" value={filterTypes} onChange={setFilterTypes} style={{ flexGrow: 1 }}
                                data={Array.from(new Set(savedDiagrams.map(d => d.exerciseType))).map(type => ({ value: type, label: type }))} />
                            <Select label="Filter mode" value={filterMode} onChange={(value) => setFilterMode(value as any)}
                                data={[
                                    { value: "include", label: "Include selected types" },
                                    { value: "exclude", label: "Exclude selected types" },
                                ]} disabled={filterTypes.length === 0} />
                        </Group>
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
                                {sortedAndFilteredDiagrams.map((diagram) => (
                                    <tr key={diagram.diagramId}>
                                        <td>{diagram.filename}</td>
                                        <td><Badge variant="light"
                                            color={diagram.exerciseType === "BPMN" ? "blue" :
                                                diagram.exerciseType === "ClassDiagram" ? "green" :
                                                    diagram.exerciseType === "UseCaseDiagram" ? "cyan" : "red"
                                            } >  {diagram.exerciseType}</Badge></td>
                                        <td>{diagram.lastUpdated}</td>
                                        <td>
                                            <Center>
                                                <Button variant="light" color="green" rightSection={<IconEdit size={16} stroke={1.5} />} onClick={() => {
                                                    setCurrentDiagram(diagram)
                                                    setDiagramType(diagram.exerciseType as UMLDiagramType)
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
                        </Table>
                    </>}
            </Fieldset>

            <ErrorMessage open={errorOpened} onClose={closeError} details={errorInfo} />

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
                <Dropzone onDrop={(files) => handleDrop(files)} accept={["application/json", "application/xml", "text/bpmn", "text/xml"]} className="dropzone" radius="md" maxSize={30 * 1024 ** 2}>
                    <div style={{ pointerEvents: "none" }}>
                        <Fieldset legend="Import source file" style={{ pointerEvents: "none" }}>
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
                                Drag&apos;n&apos;drop a JSON or XML file here to load a diagram into the editor.
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
                setCurrentDiagram(null)
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
                                <Button variant="light" color="yellow" onClick={exportJSON} leftSection={<IconDownload size={14} />} >Download source file</Button>
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