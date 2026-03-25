"use client"

import * as React from "react"
import {
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  LayoutGrid,
  Settings,
  Users,
  Coffee,
  Wallet,
  BookOpen,
} from "lucide-react"

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
    ],
  },
  {
    label: "Konto",
    items: [
      { title: "Min konto", url: "/admin/settings", icon: Settings },
      // Removed 2FA page, now in settings
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
        { title: "Køkkenvagt",       url: "/admin/kokkenvagt", icon: Coffee },

        { title: "Intranet",         url: "/admin/intranet",   icon: BookOpen },
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
      <svg
        viewBox="0 0 98 34"
        fill="currentColor"
        aria-label="TEC"
        className="h-4 w-auto shrink-0 text-sidebar-foreground"
      >
        <path d="M37.4531 33.1214H37.4831V33.2298H64.3249V30.3762H40.2834V3.37987H64.3291V0.527344H37.4883L37.4531 33.1214Z" />
        <path d="M43.8203 7.22852V15.4161H58.7137V12.5636H46.6506V10.081H64.3298V7.22852H43.8203Z" />
        <path d="M46.6506 21.3135H58.7137V18.4609L43.8203 18.4714L43.8213 27.3114H64.3298V24.4578H46.6506V21.3135Z" />
        <path d="M95.4375 24.1449C93.1076 29.2632 87.782 31.1475 83.5212 31.1475C75.4263 31.1475 69.5529 25.2246 69.5529 17.0641C69.5529 8.90359 75.5214 2.85357 83.4374 2.85357C91.3534 2.85357 94.0813 7.23919 95.2411 9.96144C96.1704 9.54664 97.048 9.15477 97.8388 8.80042C97.1814 7.25482 96.0836 5.42157 94.2519 3.78426C91.4826 1.30902 87.7438 0 83.4374 0C79.1311 0 74.7968 1.68004 71.6957 4.73059C68.4892 7.88431 66.7227 12.2647 66.7227 17.0631C66.7227 21.8614 68.4717 26.2366 71.6472 29.3361C74.7286 32.3439 78.945 34 83.5212 34C91.3017 34 95.9244 29.7634 98.0011 25.2871C97.2227 24.9401 96.3575 24.5545 95.4375 24.1438V24.1449Z" />
        <path d="M83.4363 9.3438C87.0418 9.3438 88.5841 11.249 89.2291 12.6455C90.0891 12.262 90.9605 11.8722 91.8216 11.4876C90.6328 8.84667 87.9814 6.49023 83.4353 6.49023C78.5366 6.49023 73.5759 10.1223 73.5759 17.0634C73.5759 20.1025 74.6282 22.7174 76.6191 24.6247C78.4467 26.3766 80.8975 27.3407 83.519 27.3407C87.8657 27.3407 90.5657 25.1156 91.9125 22.5715C91.0546 22.188 90.1873 21.8003 89.3294 21.4178C87.7509 24.2391 84.5713 24.4881 83.519 24.4881C78.8488 24.4881 76.4062 20.7529 76.4062 17.0645C76.4062 11.7607 80.0489 9.34485 83.4353 9.34485L83.4363 9.3438Z" />
        <path d="M0 10.2822H11.6218V33.2723H14.452V7.42969H0V10.2822Z" />
        <path d="M17.8496 33.2723H20.6788V10.2822H32.467V7.42969H17.8496V33.2723Z" />
        <path d="M32.4682 0.728516H0V3.58208H32.4682V0.728516Z" />
      </svg>
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
    <Sidebar collapsible="icon" variant="sidebar" className="border-r border-border/60" {...props}>
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
