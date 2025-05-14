import React, { useState } from "react"
import { Anchor, Button, Checkbox, Paper, PasswordInput, Text, TextInput, Title, } from '@mantine/core';
import "./style.css"
import API from "../../API";

function Login(props: any) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        props.doLogin(username, password)
    }

    return (
        <>
            <div className="wrapper">
                <Paper className="form" radius={0} p={30} shadow="xl">
                    <Title order={2} className="title" ta="center" mt="md" mb={50}>
                        Login
                    </Title>
                    <TextInput label="Username" placeholder="sXXXXXX" size="md" onChange={(event) => setUsername(event.target.value)} />
                    <PasswordInput label="Password" placeholder="Your password" mt="md" size="md" onChange={(event) => setPassword(event.target.value)} />
                    <Button fullWidth mt="xl" size="md" onClick={() => handleLogin()}>
                        Login
                    </Button>

                    <Text ta="center" mt="md">
                        Don&apos;t have an account?{' '}
                        Contact your teacher.
                    </Text>
                </Paper>
            </div>
        </>
    )
}

export default Login