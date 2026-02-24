"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Bot,
    Video,
    ImageIcon,
    Plug,
    ArrowLeft,
    Info,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"

const automationNavItems = [
    {
        title: "Connection",
        url: "/automation-tools",
        icon: Plug,
        description: "Koneksi extension & syarat penggunaan",
    },
    {
        title: "Video Tools",
        url: "/automation-tools/video",
        icon: Video,
        description: "Automasi generate video",
    },
    {
        title: "Image Tools",
        url: "/automation-tools/image",
        icon: ImageIcon,
        description: "Automasi generate gambar",
    },
]

export function AutomationSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 py-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                        <Bot className="size-4 text-white" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">Automation Tools</span>
                        <span className="truncate text-xs text-muted-foreground">
                            AP Extension
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {automationNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.url ||
                                    (item.url !== "/automation-tools" && pathname.startsWith(item.url))
                                return (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.url}>
                                                <Icon className="size-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Back to Dashboard">
                            <Link href="/dashboard">
                                <ArrowLeft className="size-4" />
                                <span>Back to Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
