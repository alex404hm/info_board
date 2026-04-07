"use client"

import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin/dashboard": { title: "Oversigt",         subtitle: "Oversigt over din infoskærm" },
  "/admin/messages": { title: "Beskeder",          subtitle: "Administrer opslag og beskeder" },
  "/admin/calendar": { title: "Kalender",          subtitle: "Outlook-kalenderintegration" },
  "/admin/display":  { title: "Visning og layout", subtitle: "Konfigurer navigationspaneler" },
  "/admin/settings": { title: "Min konto",        subtitle: "Profil, adgangskode og sessioner" },
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

  // Find the best match by checking if the pathname starts with the key
  const matchedKey = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length) // Longest match first
    .find(key => pathname === key || pathname.startsWith(key + "/"))

  const page = matchedKey ? PAGE_TITLES[matchedKey] : { title: "Administration", subtitle: "" }

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
    </div>
  )
}
