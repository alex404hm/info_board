"use client"

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react"

type AdminTheme = "dark" | "light"

const STORAGE_KEY = "admin-theme"

const AdminThemeContext = createContext<{
  theme: AdminTheme
  toggle: () => void
}>({ theme: "dark", toggle: () => {} })

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}

// Read saved theme synchronously before first paint to avoid flash
const getInitialTheme = (): AdminTheme => {
  if (typeof window === "undefined") return "dark"
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "light" || saved === "dark") return saved
  } catch {}
  return "dark"
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>("dark")

  // Apply saved theme before first paint (synchronous on client)
  useLayoutEffect(() => {
    setTheme(getInitialTheme())
  }, [])

  const toggle = () => {
    setTheme(prev => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark"
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {}
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div className={`admin-theme${theme === "light" ? " light" : ""} flex min-h-svh w-full`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
