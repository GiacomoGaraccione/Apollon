import React, { useState, useContext, useEffect } from 'react'
import { IconCalendarStats, IconChevronLeft, IconChevronRight, IconHelp, IconHome2, IconLighter, IconLogout, IconMoon, IconPencilCancel, IconPencilCheck, IconSettings, IconSun, IconSwitchHorizontal, IconUser, } from '@tabler/icons-react';
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
    onClick: () => void,
    mobile?: boolean
}

function NavbarLink({ icon: Icon, label, active, onClick, mobile }: NavbarLinkProps) {
    return (
        <Tooltip label={label} position='right' transitionProps={{ duration: 0 }} disabled={mobile}>
            <UnstyledButton onClick={onClick} className="link" data-active={active || undefined}>
                <Icon size={mobile ? 30 : 40} stroke={1.5} />
            </UnstyledButton>
        </Tooltip>
    )
}

interface NavbarProps {
    logout: () => void,
    open: boolean,
    toggleOpen: () => void,
    isMobile?: boolean
}


function Navbar(props: NavbarProps) {
    const [active, setActive] = useState("")
    const user = useContext(UserContext)
    const navigate = useNavigate()
    const { colorScheme, setColorScheme } = useMantineColorScheme()
    const computedColorScheme = useComputedColorScheme()

    const toggleColorScheme = () => {
        setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
    }


    useEffect(() => {
        let loc = window.location.pathname.replace("/uml-modeler", "")
        switch (loc) {
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
            case "/sandbox":
                setActive("Sandbox")
                break
            case "/settings":
                setActive("Settings")
                break
            default:
                setActive("")
        }
        if (loc.includes("/teacher/courses/") ||
            loc.includes("/student/courses/")) {
            setActive("Courses")
        }
    }, [])

    return (
        <div className="navbar-shell">
            <nav className="navbar-layout" style={{ padding: props.isMobile ? "var(--mantine-spacing-sm)" : "var(--mantine-spacing-md)" }}>
                <div style={{ flex: 1 }}>
                    <Group style={{ paddingBottom: "var(--mantine-spacing-md)", marginBottom: "calc(var(--mantine-spacing-md)*1.5)", borderBottom: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))" }} justify='space-between' >
                        {user ? <Text>{user.username}</Text> : <></>}
                    </Group>
                    <div style={{ alignItems: "center" }}>
                        <Stack justify='center' gap={10} style={{ alignItems: "center" }} >
                            {user?.role === Roles.TEACHER && <>
                                <NavbarLink icon={IconUser} label="Users" key={"Users"} active={active === "Users"} mobile={props.isMobile} onClick={() => {
                                    setActive("Users")
                                    navigate("/teacher/users")
                                }} />
                                <NavbarLink icon={IconCalendarStats} label="Courses" key={"Courses"} active={active === "Courses"} mobile={props.isMobile} onClick={() => {
                                    navigate("/teacher/courses")
                                    setActive("Courses")
                                }} />
                            </>}
                            {user?.role === Roles.STUDENT && <>
                                <NavbarLink icon={IconCalendarStats} label="Courses" key={"Courses"} active={active === "Courses"} mobile={props.isMobile} onClick={() => {
                                    navigate("/student/courses")
                                    setActive("Courses")
                                }} />
                                <NavbarLink icon={IconHelp} label="Error Examples" key={"Examples"} active={active === "Examples"} mobile={props.isMobile} onClick={() => {
                                    navigate("/student/examples")
                                    setActive("Examples")
                                }} />
                            </>}
                            <NavbarLink icon={IconPencilCheck} label="Sandbox" key={"Sandbox"} active={active === "Sandbox"} mobile={props.isMobile} onClick={() => {
                                navigate("/sandbox")
                                setActive("Sandbox")
                            }} />
                            <NavbarLink icon={IconSettings} label="Settings" key={"Settings"} active={active === "Settings"} mobile={props.isMobile} onClick={() => {
                                navigate("/settings")
                                setActive("Settings")
                            }} />
                        </Stack>
                    </div>

                </div>
                <div style={{ paddingTop: "calc(var(--mantine-spacing-md)*1.5)", marginTop: "calc(var(--mantine-spacing-md)*1.5)", borderTop: "1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))" }}>
                    <Stack justify='flex-end' gap={0} align='center'>
                        <NavbarLink icon={computedColorScheme === "dark" ? IconSun : IconMoon} label="Theme" mobile={props.isMobile} onClick={toggleColorScheme} />
                        <NavbarLink icon={IconLogout} label='Logout' mobile={props.isMobile} onClick={() => {
                            props.logout()
                        }} />
                    </Stack>
                </div>

            </nav>
            <ActionIcon className="desktop-navbar-toggle" onClick={props.toggleOpen} size="md" radius="xl" variant="filled" color="blue" style={{ position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", zIndex: 1000, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)" }}>
                {props.open ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
            </ActionIcon>
        </div>

    );
}

export default Navbar;