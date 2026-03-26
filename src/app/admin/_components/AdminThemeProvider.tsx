"use client"

import { createContext, useContext, useState } from "react"

type AdminTheme = "dark" | "light"

const STORAGE_KEY = "admin-theme"

const AdminThemeContext = createContext<{
  theme: AdminTheme
  toggle: () => void
}>({ theme: "dark", toggle: () => {} })

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}

export function AdminThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: React.ReactNode
  initialTheme?: AdminTheme
}) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme)

  const toggle = () => {
    setTheme(prev => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark"
      try {
        localStorage.setItem(STORAGE_KEY, next)
        document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`
      } catch {}
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div className={`admin-theme${theme === "light" ? " light" : " dark"} flex min-h-svh w-full text-foreground`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
