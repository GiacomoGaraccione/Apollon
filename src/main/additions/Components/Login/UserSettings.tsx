import React, { useState, useContext } from "react"
import { Alert, Button, Container, Group, PasswordInput, Paper, Stack, Title, Text, Progress, Box, Popover } from '@mantine/core';
import { useForm } from "@mantine/form"
import { IconAlertCircle, IconX, IconCheck } from '@tabler/icons-react';
import API from "../../API";
import { UserContext } from "../Login/UserContext";

function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
    return (
        <Text
            c={meets ? 'teal' : 'red'}
            style={{ display: 'flex', alignItems: 'center' }}
            mt={7}
            size="sm"
        >
            {meets ? <IconCheck size={14} /> : <IconX size={14} />}
            <Box ml={10}>{label}</Box>
        </Text>
    );
}

const requirements = [
    { re: /[0-9]/, label: 'Includes number' },
    { re: /[a-z]/, label: 'Includes lowercase letter' },
    { re: /[A-Z]/, label: 'Includes uppercase letter' },
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
];

function getStrength(password: string) {
    let multiplier = password.length > 5 ? 0 : 1;

    requirements.forEach((requirement) => {
        if (!requirement.re.test(password)) {
            multiplier += 1;
        }
    });

    return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

function UserSettings() {
    const user = useContext(UserContext)
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [popoverOpened, setPopoverOpened] = useState(false)

    const form = useForm({
        mode: "controlled",
        initialValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: ""
        },
        validate: (values) => ({
            oldPassword: values.oldPassword.length === 0 ? "Current password is required" : null,
            newPassword: values.newPassword.length < 8 ? "Password must be at least 8 characters" : null,
            confirmPassword: values.confirmPassword !== values.newPassword ? "Passwords do not match" : null
        })
    })

    const handleChangePassword = async () => {
        if (form.validate().hasErrors) {
            return
        }

        setLoading(true)
        setSuccessMessage("")
        setErrorMessage("")

        try {
            await API.changePassword(form.values.oldPassword, form.values.newPassword)
            setSuccessMessage("Password changed successfully!")
            form.reset()
            setTimeout(() => setSuccessMessage(""), 5000)
        } catch (error) {
            setErrorMessage((error as Error).message)
            setTimeout(() => setErrorMessage(""), 5000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Container size="sm" py="xl">
            <Paper radius="md" p="lg" withBorder>
                <Title order={2} mb="md">User Settings</Title>
                <Text mb="lg" c="dimmed">Username: {user?.username}</Text>

                <Stack gap="md">
                    <Title order={3} size="h5">Change Password</Title>

                    <PasswordInput
                        label="Current Password"
                        placeholder="Enter your current password"
                        size="md"
                        value={form.values.oldPassword}
                        onChange={(event) => form.setFieldValue('oldPassword', event.currentTarget.value)}
                        error={form.errors.oldPassword}
                    />

                    <Popover opened={popoverOpened} position="bottom" width="target" transitionProps={{ transition: 'pop' }}>
                        <Popover.Target>
                            <div
                                onFocusCapture={() => setPopoverOpened(true)}
                                onBlurCapture={() => setPopoverOpened(false)}
                            >
                                <PasswordInput
                                    label="New Password"
                                    placeholder="Enter your new password"
                                    size="md"
                                    value={form.values.newPassword}
                                    onChange={(event) => form.setFieldValue('newPassword', event.currentTarget.value)}
                                    error={form.errors.newPassword}
                                />
                            </div>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Progress
                                color={getStrength(form.values.newPassword) === 100 ? 'teal' : getStrength(form.values.newPassword) > 50 ? 'yellow' : 'red'}
                                value={getStrength(form.values.newPassword)}
                                size={5}
                                mb="xs"
                            />
                            <PasswordRequirement label="Includes at least 8 characters" meets={form.values.newPassword.length >= 8} />
                            {requirements.map((requirement, index) => (
                                <PasswordRequirement
                                    key={index}
                                    label={requirement.label}
                                    meets={requirement.re.test(form.values.newPassword)}
                                />
                            ))}
                        </Popover.Dropdown>
                    </Popover>

                    <PasswordInput
                        label="Confirm New Password"
                        placeholder="Confirm your new password"
                        size="md"
                        value={form.values.confirmPassword}
                        onChange={(event) => form.setFieldValue('confirmPassword', event.currentTarget.value)}
                        error={form.errors.confirmPassword}
                    />

                    {successMessage && (
                        <Alert color="green" title="Success">
                            {successMessage}
                        </Alert>
                    )}

                    {errorMessage && (
                        <Alert icon={<IconAlertCircle />} color="red" title="Error">
                            {errorMessage}
                        </Alert>
                    )}

                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => form.reset()}>
                            Clear form
                        </Button>
                        <Button loading={loading} onClick={handleChangePassword}>
                            Change Password
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </Container>
    )
}

export default UserSettings