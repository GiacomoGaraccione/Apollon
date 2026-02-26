import React from 'react'
import { Modal, Group, Stack, Title, Text, ScrollArea, Button, CopyButton } from '@mantine/core'

type ErrorMessageProps = {
    open: boolean
    onClose: () => void
    title?: string
    message?: string
    details?: string | string[]
}

export default function ErrorMessage({
    open,
    onClose,
    details,
}: ErrorMessageProps) {

    return (
        <Modal opened={open} onClose={onClose} centered size="lg" title="Error" >
            <Stack align="flex-start" >
                <Text fz="xl">Sorry! An error has occurred 😢</Text>
                <Text fz="sm">Please reload the page. If the problem persists, please contact the course's teacher.</Text>

                {details && <>
                    <Text fz="sm">Error details: {details}</Text>
                </>}
            </Stack>
        </Modal>

    )
}
