"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ExternalLink, Moon, Sun } from "lucide-react"
import { useAdminTheme } from "./AdminThemeProvider"

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin":          { title: "Dashboard",        subtitle: "Overview of your info board" },
  "/admin/messages": { title: "Messages",          subtitle: "Manage announcements & alerts" },
  "/admin/calendar": { title: "Calendar",          subtitle: "Outlook ICS integration" },
  "/admin/display":  { title: "Display & Layout",  subtitle: "Configure navigation tiles" },
  "/admin/settings": { title: "My Account",        subtitle: "Profile, password & sessions" },
  "/admin/intranet": { title: "Intranet",          subtitle: "Administrer intranet-sider og indhold" },
}

interface AdminHeaderProps {
  user: {
    id: string
    name: string | null
    email: string
    role?: string
  }
}

export default function AdminHeader({ user: _user }: AdminHeaderProps) {
  const pathname = usePathname()
  const { theme, toggle } = useAdminTheme()

  // Find the best match by checking if the pathname starts with the key
  const matchedKey = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length) // Longest match first
    .find(key => pathname === key || (key !== "/admin" && pathname.startsWith(key + "/")))

  const page = matchedKey ? PAGE_TITLES[matchedKey] : { title: "Admin", subtitle: "" }

  return (
    <div className="flex flex-1 items-center justify-between">
      <div>
        <h1 className="text-sm font-bold text-foreground">{page.title}</h1>
        {page.subtitle && (
          <p className="text-[10px] text-muted-foreground">
            {page.subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors border border-border bg-card text-muted-foreground hover:text-foreground hover:border-ring"
        >
          <ExternalLink className="h-3 w-3" />
          Se infoskærm
        </Link>
      </div>
    </div>
  )
}
