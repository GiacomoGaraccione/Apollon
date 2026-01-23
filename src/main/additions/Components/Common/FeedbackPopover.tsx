import React from "react";
import { Button, Center, Text, Popover, List } from "@mantine/core";
import { IconCheck, IconExclamationCircleFilled } from "@tabler/icons-react";

export interface FeedbackPopoverProps {
    title: string,
    count: number,
    color?: "red" | "orange" | "green",
    emptyMessage?: string,
    children: React.ReactNode
    width?: number
    position?: "top" | "bottom" | "left" | "right"
}

export function FeedbackPopover(props: FeedbackPopoverProps) {
    const { title, count, color = "gray", emptyMessage = "No items", children, width = 500, position = "left" } = props

    const leftIcon = count > 0 ? (
        color === "green" ? (
            <IconCheck size={16} color="green" />
        ) : (
            <IconExclamationCircleFilled size={16} color={color} />
        )
    ) : undefined

    return (
        <Center>
            <Popover width={width} position={position} withArrow shadow="md">
                <Popover.Target>
                    <Button variant={count > 0 ? "light" : "default"} color={color} leftSection={leftIcon}>
                        {title}
                    </Button>
                </Popover.Target>
                <Popover.Dropdown>
                    {count === 0 ? <Text>{emptyMessage}</Text> :
                        <List style={{ maxHeight: "70vh", overflowY: "auto" }}>{children}</List>}
                </Popover.Dropdown>
            </Popover>
        </Center>
    )
}