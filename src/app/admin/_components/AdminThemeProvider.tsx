"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type AdminTheme = "dark" | "light" | "system"
type ResolvedAdminTheme = "dark" | "light"

const STORAGE_KEY = "admin-theme"

const AdminThemeContext = createContext<{
  theme: AdminTheme
  resolvedTheme: ResolvedAdminTheme
  setTheme: (nextTheme: AdminTheme) => void
  toggle: () => void
}>({ theme: "dark", resolvedTheme: "dark", setTheme: () => {}, toggle: () => {} })

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}

export function AdminThemeProvider({
  children,
  initialTheme = "system",
}: {
  children: React.ReactNode
  initialTheme?: AdminTheme
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [theme, setTheme] = useState<AdminTheme>(initialTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedAdminTheme>(() => {
    if (typeof window === "undefined") return "dark"
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    return media.matches ? "dark" : "light"
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const newTheme = media.matches ? "dark" : "light"
      setSystemTheme(newTheme)
    }
    apply()

    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

  const resolvedTheme: ResolvedAdminTheme = theme === "system" ? systemTheme : theme

  const persistTheme = (nextTheme: AdminTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
      document.cookie = `${STORAGE_KEY}=${nextTheme};path=/;max-age=31536000;samesite=lax`
    } catch {}
  }

  const setThemeAndPersist = (nextTheme: AdminTheme) => {
    setTheme(nextTheme)
    persistTheme(nextTheme)
  }

  const toggle = () => {
    setTheme(prev => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark"
      persistTheme(next)
      return next
    })
  }

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeAndPersist,
      toggle,
    }),
    [theme, resolvedTheme],
  )

  const themeClass = useMemo(() => {
    if (!mounted) {
      if (initialTheme === "system") return "" // Avoid mismatch on first render
      return initialTheme === "light" ? " light" : " dark"
    }
    return resolvedTheme === "light" ? " light" : " dark"
  }, [mounted, initialTheme, resolvedTheme])

  return (
    <AdminThemeContext.Provider value={contextValue}>
      <div className={`admin-theme${themeClass} flex min-h-svh w-full text-foreground`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
