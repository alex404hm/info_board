"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ExternalLink, Sun, Moon } from "lucide-react"
import { useAdminTheme } from "./AdminThemeProvider"

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin/dashboard": { title: "Dashboard",        subtitle: "Overview of your info board" },
  "/admin/messages": { title: "Messages",          subtitle: "Manage announcements & alerts" },
  "/admin/calendar": { title: "Calendar",          subtitle: "Outlook ICS integration" },
  "/admin/display":  { title: "Display & Layout",  subtitle: "Configure navigation tiles" },
  "/admin/settings": { title: "My Account",        subtitle: "Profile, password & sessions" },
  "/admin/kokkenvagt": { title: "Køkkenvagt",        subtitle: "Administrer vagtplanen uge for uge" },
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
    .find(key => pathname === key || pathname.startsWith(key + "/"))

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

      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          title={theme === "dark" ? "Skift til lyst tema" : "Skift til mørkt tema"}
          className="rounded-lg p-2 transition-colors border border-border bg-card text-muted-foreground hover:text-foreground hover:border-ring"
          style={{ outline: "none" }}
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Se infoskærm"
          className="rounded-lg p-2 transition-colors border border-border bg-card text-muted-foreground hover:text-foreground hover:border-ring"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
