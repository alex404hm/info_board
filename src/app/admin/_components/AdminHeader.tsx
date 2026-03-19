"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin":          { title: "Dashboard",        subtitle: "Overview of your info board" },
  "/admin/messages": { title: "Messages",          subtitle: "Manage announcements & alerts" },
  "/admin/calendar": { title: "Calendar",          subtitle: "Outlook ICS integration" },
  "/admin/display":  { title: "Display & Layout",  subtitle: "Configure navigation tiles" },
  "/admin/settings": { title: "My Account",        subtitle: "Profile, password & sessions" },
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
  const page = PAGE_TITLES[pathname] ?? { title: "Admin", subtitle: "" }

  return (
    <div className="flex flex-1 items-center justify-between">
      <div>
        <h1 className="text-sm font-bold text-foreground">{page.title}</h1>
        {page.subtitle && (
          <p className="text-[10px] text-muted">
            {page.subtitle}
          </p>
        )}
      </div>

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors admin-panel-soft text-muted hover:text-foreground hover:border-accent/50"
      >
        <ExternalLink className="h-3 w-3" />
        Se infoskærm
      </Link>
    </div>
  )
}
