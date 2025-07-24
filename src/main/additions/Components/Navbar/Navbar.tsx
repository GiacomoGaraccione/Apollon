import React, { useState, useContext, useEffect } from 'react'
import { IconCalendarStats, IconChevronLeft, IconChevronRight, IconDeviceDesktopAnalytics, IconFingerprint, IconGauge, IconHelp, IconHome2, IconLighter, IconLogout, IconMoon, IconSettings, IconSun, IconSwitchHorizontal, IconUser, } from '@tabler/icons-react';
import { ActionIcon, Center, Stack, Tooltip, UnstyledButton, Text, Group } from '@mantine/core';
import { Roles, UserContext } from '../Login/UserContext';
import "./style.css"
import { useNavigate } from 'react-router-dom';
import API from '../../API';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';

interface NavbarLinkProps {
    icon: typeof IconHome2,
    label: string,
    active?: boolean,
    onClick: () => void
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
    return (
        <Tooltip label={label} position='right' transitionProps={{ duration: 0 }}>
            <UnstyledButton onClick={onClick} className="link" data-active={active || undefined}>
                <Icon size={40} stroke={1.5} />
            </UnstyledButton>
        </Tooltip>
    )
}


function Navbar(props: any) {
    const [active, setActive] = useState("")
    const user = useContext(UserContext)
    const navigate = useNavigate()
    const { colorScheme, setColorScheme } = useMantineColorScheme()
    const computedColorScheme = useComputedColorScheme()

    const toggleColorScheme = () => {
        setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
    }


    useEffect(() => {
        switch (window.location.pathname) {
            case "/teacher":
                setActive("Home")
                break
            case "/teacher/courses":
                setActive("Courses")
                break
            case "/teacher/grades":
                setActive("Grades")
                break
            case "/teacher/users":
                setActive("Users")
                break
            case "/student":
            case "/student/courses":
                setActive("Courses")
                break
            case "/student/examples":
                setActive("Examples")
                break
            default:
                setActive("")
        }
        if (window.location.pathname.includes("/teacher/courses/") || window.location.pathname.includes("/student/courses/")) {
            setActive("Courses")
        }
    }, [])

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', height: '90vh', padding: "var(--mantine-spacing-md)", borderRight: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))" }}>
                <div style={{ flex: 1 }}>
                    <Group style={{ paddingBottom: "var(--mantine-spacing-md)", marginBottom: "calc(var(--mantine-spacing-md)*1.5)", borderBottom: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))" }} justify='space-between' >
                        {user ? <Text>{user.username}</Text> : <></>}
                    </Group>
                    <div style={{ alignItems: "center" }}>
                        <Stack justify='center' gap={10} style={{ alignItems: "center" }} >
                            {user?.role === Roles.TEACHER && <>
                                <NavbarLink icon={IconUser} label="Users" key={"Users"} active={active === "Users"} onClick={() => {
                                    setActive("Users")
                                    navigate("/teacher/users")
                                }} />
                                <NavbarLink icon={IconCalendarStats} label="Courses" key={"Courses"} active={active === "Courses"} onClick={() => {
                                    navigate("/teacher/courses")
                                    setActive("Courses")
                                }} />
                            </>}
                            {user?.role === Roles.STUDENT && <>
                                <NavbarLink icon={IconCalendarStats} label="Courses" key={"Courses"} active={active === "Courses"} onClick={() => {
                                    navigate("/student/courses")
                                    setActive("Courses")
                                }} />
                                <NavbarLink icon={IconHelp} label="Error Examples" key={"Examples"} active={active === "Examples"} onClick={() => {
                                    navigate("/student/examples")
                                    setActive("Examples")
                                }} />
                            </>}
                        </Stack>
                    </div>

                </div>
                <div style={{ paddingTop: "calc(var(--mantine-spacing-md)*1.5)", marginTop: "calc(var(--mantine-spacing-md)*1.5)", borderTop: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))" }}>
                    <Stack justify='flex-end' gap={0} align='center'>
                        <NavbarLink icon={computedColorScheme === "dark" ? IconSun : IconMoon} label="Theme" onClick={toggleColorScheme} />
                        <NavbarLink icon={IconLogout} label='Logout' onClick={() => {
                            props.logout()
                        }} />
                    </Stack>
                </div>

            </nav>
            <ActionIcon onClick={props.toggleOpen} size="md" radius="xl" variant="filled" color="blue" style={{ position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", zIndex: 1000, boxShadow: "0 2px 8èx rgba(0, 0, 0, 0.2)" }}>
                {props.open ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
            </ActionIcon>
        </div>

    );
}

export default Navbar;