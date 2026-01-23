import { Divider, Highlight, List } from "@mantine/core";
import { IconCheck, IconExclamationCircle } from "@tabler/icons-react";
import React from "react";
import { getHighlightStyles } from "./highlightStyles";

export type FeedbackVariant = "syntax" | "semantic" | "success"

export interface FeedbackListItemProps{
    id?: string | number,
    variant?: FeedbackVariant,
    highlights?: string[],
    highlightColor?: string,
    message: string | ((e: any) => React.ReactNode),
    children?: React.ReactNode,
    divider?: boolean,
    error?: any
}

const defaultIcon = (variant?: FeedbackVariant) => {
    switch(variant){
        case "success":
            return <IconCheck size={16} color="green" />
        case "syntax":
        case "semantic":
            return <IconExclamationCircle size={16} color={variant === "syntax" ? "orange" : "red"} />
        default:
            return <IconExclamationCircle size={16} />
    }
}

export function FeedbackListItem(props: FeedbackListItemProps){
    const content = typeof props.message === "function" ? props.message(props.error) : props.message;
    return(
        <>
        <List.Item key={props.id} icon={defaultIcon(props.variant)} >
            {typeof content === "string" ? (
                <Highlight highlight={props.highlights ?? []} highlightStyles={getHighlightStyles(props.highlightColor)}>
                    {content}
                </Highlight>
            ) : (
                content
            )}
            {props.children}
        </List.Item>
        {props.divider && <Divider my="sm" />}
        </>
    )
}