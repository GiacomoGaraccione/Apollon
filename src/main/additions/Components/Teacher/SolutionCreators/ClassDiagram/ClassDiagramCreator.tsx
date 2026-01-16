import React, { } from "react";
import { Button, Center, Text, Modal, Fieldset, Tabs } from "@mantine/core";
import { IconSquareRoundedPlusFilled, IconX, IconZoomCheckFilled } from "@tabler/icons-react";
import { ReferenceAssociation, ReferenceClass, ClassDiagramReferenceSolution } from "../../../../Utils/ClassDiagram/MatcherTypes";
import { AssociationForm } from "./AssociationForm";
import { AttributeForm } from "./AttributeForm";
import { ClassForm } from "./ClassForm";
import { ForbiddenElementsForm } from "./ForbiddenElementsForm";

export function ClassDiagramReferenceFormModal(props: {
    openedReference: boolean;
    closeReference: () => void;
    setPreview: (value: boolean) => void,
    preview: boolean;
    currentReference: ClassDiagramReferenceSolution;
    addClass: (classes: ReferenceClass[]) => void;
    addAssociation: (associations: ReferenceAssociation[]) => void;
    addForbiddenClasses: (forbiddenClasses: string[]) => void;
    addForbiddenAssociations: (forbiddenAssociations: { source: string, target: string }[]) => void;
    saveReference: () => void;
    previewRef: React.RefObject<HTMLDivElement>;
}) {
    return (
        <>
            <Modal opened={props.openedReference} onClose={() => {
                props.closeReference()
                props.setPreview(false)
            }} fullScreen transitionProps={{ transition: 'fade', duration: 300 }}>
                <Fieldset legend="Solution Creator" style={{ width: "100%" }}>
                    {!props.preview && <>
                        <Tabs defaultValue="classes" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="classes">Classes</Tabs.Tab>
                                <Tabs.Tab value="attributes">Attributes</Tabs.Tab>
                                <Tabs.Tab value="associations">Associations</Tabs.Tab>
                                <Tabs.Tab value="forbidden">Forbidden Elements</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="classes">
                                <ClassForm reference={props.currentReference} addClass={props.addClass} />
                            </Tabs.Panel>
                            <Tabs.Panel value="attributes">
                                <AttributeForm reference={props.currentReference} addClass={props.addClass} />
                            </Tabs.Panel>
                            <Tabs.Panel value="associations">
                                <AssociationForm reference={props.currentReference} addAssociation={props.addAssociation} />
                            </Tabs.Panel>
                            <Tabs.Panel value="forbidden">
                                <ForbiddenElementsForm reference={props.currentReference} addForbiddenClasses={props.addForbiddenClasses} addForbiddenAssociations={props.addForbiddenAssociations} />
                            </Tabs.Panel>
                        </Tabs>
                        <Center mt="md">
                            <Button variant="light" color="cyan" rightSection={<IconZoomCheckFilled size={16} stroke={1.5} />} mt="sm" onClick={() => { props.setPreview(true) }} >
                                Display reference preview
                            </Button>
                        </Center>
                    </>}
                    {props.preview && <>
                        <Text size="lg" w={500} mb="md">Preview of the reference solution</Text>
                        <div ref={props.previewRef} id="apollon-preview"></div>
                        <Center mt="md">
                            <Button variant="light" color="green" rightSection={<IconSquareRoundedPlusFilled size={16} stroke={1.5} />} mt="sm" onClick={() => { props.saveReference() }}  >
                                Save reference
                            </Button>
                            <Button variant="light" color="gray" rightSection={<IconX size={16} stroke={1.5} />} mt="sm" ml="md" onClick={() => { props.setPreview(false) }} >
                                Cancel preview
                            </Button>
                        </Center>
                    </>}
                </Fieldset>
            </Modal>
        </>
    )
}