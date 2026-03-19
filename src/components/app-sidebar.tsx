"use client"

import * as React from "react"
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  LayoutGrid,
  Settings,
  Users,
} from "lucide-react"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const teacherSections = [
  {
    label: "Info Board",
    items: [
      { title: "Dashboard",       url: "/admin",          icon: LayoutDashboard },
      { title: "Messages",        url: "/admin/messages", icon: MessageSquare },
      { title: "Calendar",        url: "/admin/calendar", icon: CalendarDays },
      { title: "Display & Layout", url: "/admin/display", icon: LayoutGrid },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "My Account", url: "/admin/settings", icon: Settings },
    ],
  },
]

const adminSections = [
  {
    label: "Administration",
    items: [
      { title: "User Management", url: "/admin/users", icon: Users },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "My Account", url: "/admin/settings", icon: Settings },
    ],
  },
]

export function AppSidebar({ user, ...props }: { user: any } & React.ComponentProps<typeof Sidebar>) {
  const sections = user.role === "admin" ? adminSections : teacherSections

  return (
    <Sidebar variant="inset" className="border-r border-border/60" {...props}>
      <SidebarHeader className="border-b border-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex items-center justify-center px-1">
                  <Image src="/logo.svg" alt="TEC" width={56} height={20} className="h-5 w-auto" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Info Board</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.role === "admin" ? "Administrator" : "Teacher"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={sections} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
