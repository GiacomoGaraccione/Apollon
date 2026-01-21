import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, NativeSelect, Tabs, Checkbox } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";
import { ReferenceUseCase, ReferenceSystem, UseCaseDiagramReferenceSolution, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceUseCaseAssociation, ReferenceActor } from "../../../../Utils/UseCaseDiagram/MatcherTypes";
import { ActorUseCaseAssociationForm } from "./Relationships/ActorUseCase";
import { ActorActorAssociationForm } from "./Relationships/ActorActor";
import { UseCaseUseCaseAssociationForm } from "./Relationships/UseCaseUseCase";


export function RelationshipsForm(props: {
    reference: UseCaseDiagramReferenceSolution | undefined, addUseCaseActorAssociations: (associations: ReferenceActorUseCaseAssociation[]) => void,
    addActorAssociations: (associations: ReferenceActorAssociation[]) => void,
    addUseCaseAssociations: (associations: ReferenceUseCaseAssociation[]) => void
}) {
    const [actorUseCaseAssociations, setActorUseCaseAssociations] = useState<ReferenceActorUseCaseAssociation[]>([])
    const [actorAssociations, setActorAssociations] = useState<ReferenceActorAssociation[]>([])
    const [useCaseAssociations, setUseCaseAssociations] = useState<ReferenceUseCaseAssociation[]>([])
    const [actors, setActors] = useState<ReferenceActor[]>([])
    const [useCases, setUseCases] = useState<ReferenceUseCase[]>([])
    const [systems, setSystems] = useState<ReferenceSystem[]>([])

    useEffect(() => {
        if (props.reference) {
            setActorUseCaseAssociations(props.reference.actorUseCaseAssociations)
            setActorAssociations(props.reference.actorAssociations)
            setUseCaseAssociations(props.reference.useCaseAssociations)
            setActors(props.reference.actors)
            setUseCases(props.reference.useCases)
            setSystems(props.reference.systems)
        }
    }, [props.reference])

    return (
        <>
            <Grid justify="center" align="center">
                <Grid.Col span={12}>
                    <Fieldset legend="Associations" style={{ width: "100%" }}>
                        <Tabs defaultValue="actorUseCase" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="actorUseCase">Actor-Use Case</Tabs.Tab>
                                <Tabs.Tab value="actorActor">Actor-Actor</Tabs.Tab>
                                <Tabs.Tab value="useCaseUseCase">Use Case-Use Case</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="actorUseCase">
                                <>
                                    <ActorUseCaseAssociationForm actors={actors} useCases={useCases} systems={systems} associations={actorUseCaseAssociations} setAssociations={props.addUseCaseActorAssociations} />
                                </>
                            </Tabs.Panel>
                            <Tabs.Panel value="actorActor">
                                <>
                                    <ActorActorAssociationForm actors={actors} associations={actorAssociations} addActorAssociations={props.addActorAssociations} />
                                </>
                            </Tabs.Panel>
                            <Tabs.Panel value="useCaseUseCase">
                                <>
                                    <UseCaseUseCaseAssociationForm useCases={useCases} associations={useCaseAssociations} addUseCaseAssociations={props.addUseCaseAssociations} />
                                </>
                            </Tabs.Panel>
                        </Tabs>
                    </Fieldset>
                </Grid.Col>
            </Grid>
        </>
    )
}