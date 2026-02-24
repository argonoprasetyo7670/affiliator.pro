"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { CreditDisplay } from "@/components/credit-display"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  LayoutDashboard,
  ImageIcon,
  Video,
  DockIcon,
  BookKeyIcon,
  Coins,
  Shield,
  Bot,
} from "lucide-react"

// Navigation items
const baseNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Image Tools",
    url: "#",
    icon: ImageIcon,
    items: [
      {
        title: "Image Generator",
        url: "/dashboard/image-generator",
      },
    ],
  },
  {
    title: "Video Tools",
    url: "#",
    icon: Video,
    items: [
      {
        title: "Video Generator",
        url: "/dashboard/video-generator",
      },
      {
        title: "Frame-to-Frame",
        url: "/dashboard/frame-to-frame",
      }
    ],
  },
  // {
  //   title: "Automation Tools",
  //   url: "/automation-tools",
  //   icon: Bot,
  // },
  {
    title: "Kredit",
    url: "/dashboard/credits",
    icon: Coins,
  },
  {
    title: "API Docs",
    url: "/dashboard/api-docs",
    icon: BookKeyIcon,
  },
]

const adminNavItem = {
  title: "Admin",
  url: "/admin",
  icon: Shield,
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  } | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Add admin nav item if user is admin
  const navItems = React.useMemo(() => {
    if (user?.role === "admin") {
      return [...baseNavItems, adminNavItem]
    }
    return baseNavItems
  }, [user?.role])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            <img src="/affiliator.png" alt="Logo" className="size-8 object-contain" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">Affiliator Pro</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <CreditDisplay compact className="mb-2" />
        <NavUser user={user || { name: "User", email: "user@example.com", image: null }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
