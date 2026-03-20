"use client"

import * as React from "react"
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  LayoutGrid,
  Settings,
  Users,
  BarChart2,
  ScrollText,
  Coffee,
  Wallet,
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
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const adminSections = [
  {
    label: "Administration",
    items: [
      { title: "Dashboard",   url: "/admin",          icon: LayoutDashboard },
      { title: "Brugere",     url: "/admin/users",    icon: Users },
      { title: "System Logs", url: "/admin/logs",     icon: ScrollText },
    ],
  },
  {
    label: "Konto",
    items: [
      { title: "Min konto", url: "/admin/settings", icon: Settings },
    ],
  },
]

function buildInstructorSections() {
  return [
    {
      label: "Administrer",
      items: [
        { title: "Dashboard",        url: "/admin",            icon: LayoutDashboard },
        { title: "Beskeder",         url: "/admin/messages",   icon: MessageSquare },
        { title: "Kalender",         url: "/admin/calendar",   icon: CalendarDays },
        { title: "Display & Layout", url: "/admin/display",    icon: LayoutGrid },
        { title: "Feedback",         url: "/admin/feedback",   icon: BarChart2 },
        { title: "Køkkenvagt",       url: "/admin/kokkenvagt", icon: Coffee },
        { title: "Lønsatser",        url: "/admin/loen",       icon: Wallet },
      ],
    },
    {
      label: "Konto",
      items: [
        { title: "Min konto", url: "/admin/settings", icon: Settings },
      ],
    },
  ]
}

function SidebarLogo({ role }: { role: string }) {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <button
      onClick={toggleSidebar}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Image
        src="/logo.svg"
        alt="TEC"
        width={56}
        height={20}
        className="h-5 w-auto shrink-0"
      />
      {!collapsed && (
        <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
          <span className="truncate font-semibold">Info Board</span>
          <span className="truncate text-xs text-muted-foreground">
            {role === "admin" ? "Administrator" : "Instruktør"}
          </span>
        </div>
      )}
    </button>
  )
}

export function AppSidebar({ user, ...props }: { user: any } & React.ComponentProps<typeof Sidebar>) {
  const sections = user.role === "admin" ? adminSections : buildInstructorSections()

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-border/60" {...props}>
      <SidebarHeader className="border-b border-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarLogo role={user.role} />
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
