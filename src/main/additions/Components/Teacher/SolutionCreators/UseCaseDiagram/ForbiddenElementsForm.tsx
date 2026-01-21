import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Flex, Text, Fieldset, Grid, TextInput, Textarea, Group, Tabs, List } from "@mantine/core";
import { IconArrowBackUp, IconExclamationCircle, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { ListEditor } from "../../../Teacher/SolutionCreators/ListEditor";
import { ElementPair, ReferenceActor, ReferenceActorAssociation, ReferenceActorUseCaseAssociation, ReferenceUseCaseAssociation, UseCaseDiagramReferenceSolution } from "../../../../Utils/UseCaseDiagram/MatcherTypes";
import { ForbiddenActorActorAssociationForm } from "./Relationships/ForbiddenActorActor";
import { ForbiddenActorUseCaseAssociationForm } from "./Relationships/ForbiddenActorUseCase";
import { ForbiddenUseCaseUseCaseAssociationForm } from "./Relationships/ForbiddenUseCaseUseCase";

export function ForbiddenElementsForm(props: {
    reference: UseCaseDiagramReferenceSolution | undefined,
    addForbiddenActors: (forbiddenActors: string[]) => void,
    addForbiddenUseCases: (forbiddenUseCases: string[]) => void,
    addForbiddenSystems: (forbiddenSystems: string[]) => void,
    addForbiddenActorUseCaseAssociations: (forbiddenActorUseCaseAssociations: ReferenceActorUseCaseAssociation[]) => void,
    addForbiddenActorAssociations: (forbiddenActorAssociations: ReferenceActorAssociation[]) => void,
    addForbiddenUseCaseAssociations: (forbiddenUseCaseAssociations: ReferenceUseCaseAssociation[]) => void,
}) {


    return (
        <>
            <Grid justify="center" align="center">
                <Grid.Col span={12}>
                    <Fieldset legend="Forbidden Elements" style={{ width: "100%" }}>

                        <Tabs defaultValue="forbiddenActors" color="cyan">
                            <Tabs.List>
                                <Tabs.Tab value="forbiddenActors">Forbidden Actors</Tabs.Tab>
                                <Tabs.Tab value="forbiddenUseCases">Forbidden Use Cases</Tabs.Tab>
                                <Tabs.Tab value="forbiddenSystems">Forbidden Systems</Tabs.Tab>
                                <Tabs.Tab value="forbiddenActorUseCaseAssociations">Forbidden Actor-Use Case Associations</Tabs.Tab>
                                <Tabs.Tab value="forbiddenActorAssociations">Forbidden Actor-Actor Associations</Tabs.Tab>
                                <Tabs.Tab value="forbiddenUseCaseAssociations">Forbidden Use Case-Use Case Associations</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panel value="forbiddenActors">
                                <ListEditor list={props.reference ? props.reference.forbiddenActors : []} onListChange={props.addForbiddenActors} mode="forbiddenActors" onSave={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="forbiddenUseCases">
                                <ListEditor list={props.reference ? props.reference.forbiddenUseCases : []} onListChange={props.addForbiddenUseCases} mode="forbiddenUseCases" onSave={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="forbiddenSystems">
                                <ListEditor list={props.reference ? props.reference.forbiddenSystems : []} onListChange={props.addForbiddenSystems} mode="forbiddenSystems" onSave={() => { }} />
                            </Tabs.Panel>
                            <Tabs.Panel value="forbiddenActorUseCaseAssociations">
                                <ForbiddenActorUseCaseAssociationForm actors={props.reference ? props.reference.actors : []} useCases={props.reference ? props.reference.useCases : []} systems={props.reference ? props.reference.systems : []} associations={props.reference ? props.reference.forbiddenActorUseCaseAssociations : []} setAssociations={props.addForbiddenActorUseCaseAssociations} />
                            </Tabs.Panel>
                            <Tabs.Panel value="forbiddenActorAssociations">
                                <ForbiddenActorActorAssociationForm actors={props.reference ? props.reference.actors : []} associations={props.reference ? props.reference.forbiddenActorAssociations : []} addForbiddenActorAssociations={props.addForbiddenActorAssociations} />
                            </Tabs.Panel>
                            <Tabs.Panel value="forbiddenUseCaseAssociations">
                                <ForbiddenUseCaseUseCaseAssociationForm useCases={props.reference ? props.reference.useCases : []} associations={props.reference ? props.reference.forbiddenUseCaseAssociations : []} addUseCaseAssociations={props.addForbiddenUseCaseAssociations} />
                            </Tabs.Panel>
                        </Tabs>
                    </Fieldset>
                </Grid.Col>
            </Grid>
        </>
    )
}