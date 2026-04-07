"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"

type AdminTheme = "dark" | "light" | "system"
type ResolvedAdminTheme = "dark" | "light"

const STORAGE_KEY = "admin-theme"

const AdminThemeContext = createContext<{
  theme: AdminTheme
  resolvedTheme: ResolvedAdminTheme
  setTheme: (nextTheme: AdminTheme) => void
  toggle: () => void
}>({ theme: "system", resolvedTheme: "dark", setTheme: () => {}, toggle: () => {} })

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
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

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

  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      try {
        localStorage.setItem(STORAGE_KEY, "system")
        document.cookie = `${STORAGE_KEY}=system;path=/;max-age=31536000;samesite=lax`
      } catch {}
    }
  }, [])

  const resolvedTheme: ResolvedAdminTheme = theme === "system" ? systemTheme : theme

  const persistTheme = useCallback((nextTheme: AdminTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme)
      document.cookie = `${STORAGE_KEY}=${nextTheme};path=/;max-age=31536000;samesite=lax`
    } catch {}
  }, [])

  const setThemeAndPersist = useCallback((nextTheme: AdminTheme) => {
    setTheme(nextTheme)
    persistTheme(nextTheme)
  }, [persistTheme])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: AdminTheme = prev === "dark" ? "light" : "dark"
      persistTheme(next)
      return next
    })
  }, [persistTheme])

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeAndPersist,
      toggle,
    }),
    [theme, resolvedTheme, setThemeAndPersist, toggle],
  )

  const themeClass = useMemo(() => {
    if (!isHydrated) {
      if (initialTheme === "system") {
        // The init script set data-admin-theme on <html> before paint.
        // Use it to avoid flash; fall back to empty string if unavailable (SSR).
        if (typeof document !== "undefined") {
          const pre = document.documentElement.getAttribute("data-admin-theme")
          if (pre === "light") return " light"
          if (pre === "dark") return " dark"
        }
        return "" // SSR: CSS @media handles system theme, no flash
      }
      return initialTheme === "light" ? " light" : " dark"
    }
    return resolvedTheme === "light" ? " light" : " dark"
  }, [isHydrated, initialTheme, resolvedTheme])

  return (
    <AdminThemeContext.Provider value={contextValue}>
      <div className={`admin-theme${themeClass} flex min-h-svh w-full text-foreground`}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
