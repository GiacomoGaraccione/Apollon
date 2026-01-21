import React, { } from "react";
import { Button, Center, Text, Modal, Fieldset, Tabs } from "@mantine/core";
import { IconSquareRoundedPlusFilled, IconX, IconZoomCheckFilled } from "@tabler/icons-react";
import { ElementPair, ReferenceActor, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceSystem, ReferenceUseCase, ReferenceUseCaseAssociation, UseCaseDiagramReferenceSolution } from "../../../../Utils/UseCaseDiagram/MatcherTypes";
import { ActorForm } from "./ActorForm";
import { SystemForm } from "./SystemForm";
import { UseCaseForm } from "./UseCaseReference";
import { RelationshipsForm } from "./RelationshipsForm";
import { ForbiddenElementsForm } from "./ForbiddenElementsForm";

export function UseCaseDiagramReferenceFormModal(props: {
    openedReference: boolean;
    closeReference: () => void
    setPreview: (value: boolean) => void,
    preview: boolean;
    currentReference: UseCaseDiagramReferenceSolution,
    setCurrentReference: (ref: UseCaseDiagramReferenceSolution) => void;
    saveReference: () => void;
    previewRef: React.RefObject<HTMLDivElement>;
}) {

    const addActor = (actors: ReferenceActor[]) => {
        if (!props.currentReference) {
            let ref = new UseCaseDiagramReferenceSolution()
            ref.actors = actors
            props.setCurrentReference(ref)
        } else {
            let ref = { ...props.currentReference, actors: actors }
            props.setCurrentReference(ref)
        }
    }

    const addSystem = (systems: ReferenceSystem[]) => {
        if (!props.currentReference) {
            let ref = new UseCaseDiagramReferenceSolution()
            ref.systems = systems
            props.setCurrentReference(ref)
        } else {
            let ref = { ...props.currentReference, systems: systems }
            props.setCurrentReference(ref)
        }
    }

    const addUseCase = (useCases: ReferenceUseCase[]) => {
        const ref = { ...props.currentReference!, useCases: useCases }
        props.setCurrentReference(ref)
    }

    const addActorUseCaseAssociations = (actorUseCaseAssociations: ReferenceActorUseCaseAssociation[]) => {
        let ref = { ...props.currentReference!, actorUseCaseAssociations: actorUseCaseAssociations }
        props.setCurrentReference(ref)
    }

    const addActorAssociations = (actorAssociations: ReferenceActorAssociation[]) => {
        let ref = { ...props.currentReference!, actorAssociations: actorAssociations }
        props.setCurrentReference(ref)
    }

    const addUseCaseAssociations = (useCaseAssociations: ReferenceUseCaseAssociation[]) => {
        let ref = { ...props.currentReference!, useCaseAssociations: useCaseAssociations }
        props.setCurrentReference(ref)
    }

    const addForbiddenActors = (forbiddenActors: string[]) => {
        let ref = { ...props.currentReference!, forbiddenActors: forbiddenActors }
        props.setCurrentReference(ref)
    }

    const addForbiddenUseCases = (forbiddenUseCases: string[]) => {
        let ref = { ...props.currentReference!, forbiddenUseCases: forbiddenUseCases }
        props.setCurrentReference(ref)
    }

    const addForbiddenSystems = (forbiddenSystems: string[]) => {
        let ref = { ...props.currentReference!, forbiddenSystems: forbiddenSystems }
        props.setCurrentReference(ref)
    }

    const addForbiddenActorUseCaseAssociations = (forbiddenActorUseCaseAssociations: ReferenceActorUseCaseAssociation[]) => {
        let ref = { ...props.currentReference!, forbiddenActorUseCaseAssociations: forbiddenActorUseCaseAssociations }
        props.setCurrentReference(ref)
    }

    const addForbiddenActorAssociations = (forbiddenActorAssociations: ReferenceActorAssociation[]) => {
        let ref = { ...props.currentReference!, forbiddenActorAssociations: forbiddenActorAssociations }
        props.setCurrentReference(ref)
    }

    const addForbiddenUseCaseAssociations = (forbiddenUseCaseAssociations: ReferenceUseCaseAssociation[]) => {
        let ref = { ...props.currentReference!, forbiddenUseCaseAssociations: forbiddenUseCaseAssociations }
        props.setCurrentReference(ref)
    }

    return (
        <>
            <Modal opened={props.openedReference} onClose={() => {
                props.closeReference()
                props.setPreview(false)
            }} fullScreen transitionProps={{ transition: 'fade', duration: 300 }}>
                <Fieldset legend="Solution Creator" style={{ width: "100%" }}>
                    {!props.preview && <>
                        <Tabs defaultValue="actors" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="actors">Actors</Tabs.Tab>
                                <Tabs.Tab value="systems">Systems</Tabs.Tab>
                                <Tabs.Tab value="usecases">Use Cases</Tabs.Tab>
                                <Tabs.Tab value="relationships">Relationships</Tabs.Tab>
                                <Tabs.Tab value="forbidden">Forbidden Elements</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="actors">
                                <>
                                    <ActorForm reference={props.currentReference} addActor={addActor} />
                                </>
                            </Tabs.Panel>
                            <Tabs.Panel value="systems">
                                <> <SystemForm reference={props.currentReference} addSystem={addSystem} /></>
                            </Tabs.Panel>
                            <Tabs.Panel value="usecases">
                                <><UseCaseForm reference={props.currentReference} addUseCase={addUseCase} /></>
                            </Tabs.Panel>
                            <Tabs.Panel value="relationships">
                                <><RelationshipsForm reference={props.currentReference} addUseCaseActorAssociations={addActorUseCaseAssociations} addActorAssociations={addActorAssociations} addUseCaseAssociations={addUseCaseAssociations} /></>
                            </Tabs.Panel>
                            <Tabs.Panel value="forbidden">
                                <><ForbiddenElementsForm reference={props.currentReference} addForbiddenActors={addForbiddenActors} addForbiddenUseCases={addForbiddenUseCases} addForbiddenSystems={addForbiddenSystems} addForbiddenActorUseCaseAssociations={addForbiddenActorUseCaseAssociations} addForbiddenActorAssociations={addForbiddenActorAssociations} addForbiddenUseCaseAssociations={addForbiddenUseCaseAssociations} /></>
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