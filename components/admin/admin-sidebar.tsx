"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Coins,
    Package,
    ArrowLeft,
    Shield,
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
import { cn } from "@/lib/utils"

const adminNavItems = [
    {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Users",
        url: "/admin/users",
        icon: Users,
    },
    {
        title: "Transactions",
        url: "/admin/transactions",
        icon: CreditCard,
    },
    {
        title: "Credits",
        url: "/admin/credits",
        icon: Coins,
    },
    {
        title: "Packages",
        url: "/admin/packages",
        icon: Package,
    },
]

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 py-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                        <Shield className="size-4 text-white" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">Admin Panel</span>
                        <span className="truncate text-xs text-muted-foreground">
                            Affiliator Pro
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminNavItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.url
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
