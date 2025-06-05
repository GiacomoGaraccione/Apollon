import React, { useState, useContext, useEffect } from 'react'
import { IconCalendarStats, IconDeviceDesktopAnalytics, IconFingerprint, IconGauge, IconHome2, IconLogout, IconSettings, IconSwitchHorizontal, IconUser, } from '@tabler/icons-react';
import { Center, Stack, Tooltip, UnstyledButton } from '@mantine/core';
import { Roles, UserContext } from '../Login/UserContext';
import "./style.css"
import { useNavigate } from 'react-router-dom';
import API from '../../API';

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

const studentLink = [
    { icon: IconHome2, label: 'Home' },
    { icon: IconCalendarStats, label: 'Courses' },
    { icon: IconDeviceDesktopAnalytics, label: 'Grades' },
    { icon: IconFingerprint, label: 'Profile' }
]

const teacherLink = [
    { icon: IconHome2, label: 'Home' },
    { icon: IconCalendarStats, label: 'Courses' },
    { icon: IconGauge, label: 'Grades' },
    { icon: IconUser, label: 'Students' },
    { icon: IconSettings, label: 'Settings' }
]

function Navbar(props: any) {
    const [active, setActive] = useState("")
    const user = useContext(UserContext)
    const navigate = useNavigate()

    const links = user?.role === Roles.STUDENT ? studentLink : teacherLink
    const linkComponents = links.map((link, index) => (
        <NavbarLink
            {...link}
            key={link.label}
            active={link.label === active}
            onClick={() => setActive(link.label)}
        />
    ))

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
                setActive("Home")
                break
            case "/student/courses":
                setActive("Courses")
                break
            default:
                setActive("")
        }
        if (window.location.pathname.includes("/teacher/courses/") || window.location.pathname.includes("/student/courses/")) {
            setActive("Courses")
        }
    }, [])

    return (
        <nav style={{ display: 'flex', flexDirection: 'column', height: '90vh', justifyContent: 'space-between' }}>
            <div style={{ alignItems: "center" }}>
                <Stack justify='center' gap={10} style={{ alignItems: "center" }} >
                    {user?.role === Roles.TEACHER && <>
                        <NavbarLink icon={IconHome2} label="Home" key={"Home"} active={active === "Home"} onClick={() => {
                            navigate("/teacher")
                            setActive("Home")
                        }} />
                        <NavbarLink icon={IconUser} label="Users" key={"Users"} active={active === "Users"} onClick={() => {
                            setActive("Users")
                            navigate("/teacher/users")
                        }} />
                        <NavbarLink icon={IconCalendarStats} label="Courses" key={"Courses"} active={active === "Courses"} onClick={() => {
                            navigate("/teacher/courses")
                            setActive("Courses")
                        }} />
                        <NavbarLink icon={IconGauge} label="Grades" key={"Grades"} active={active === "Grades"} onClick={() => {
                            navigate("/teacher")
                            setActive("Grades")
                        }} />
                    </>}
                    {user?.role === Roles.STUDENT && <>
                        <NavbarLink icon={IconHome2} label="Home" key={"Home"} active={active === "Home"} onClick={() => {
                            navigate("/student")
                            setActive("Home")
                        }} />
                        <NavbarLink icon={IconCalendarStats} label="Courses" key={"Courses"} active={active === "Courses"} onClick={() => {
                            navigate("/student/courses")
                            setActive("Courses")
                        }} />
                    </>}
                </Stack>
            </div>

            <Stack justify='flex-end' gap={0} align='center'>
                <NavbarLink icon={IconLogout} label='Logout' onClick={() => {
                    props.logout()
                }} />
            </Stack>
        </nav>
    );
}

export default Navbar;