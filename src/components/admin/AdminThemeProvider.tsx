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
}>({ theme: "system", resolvedTheme: "light", setTheme: () => {}, toggle: () => {} })

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
    if (typeof window === "undefined") return "light"
    const htmlTheme = document.documentElement.getAttribute("data-admin-theme")
    if (htmlTheme === "dark" || htmlTheme === "light") return htmlTheme
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

  const themeClass = isHydrated
    ? resolvedTheme === "light" ? " light" : " dark"
    : initialTheme === "light"
      ? " light"
      : initialTheme === "dark"
        ? " dark"
        : " system"

  return (
    <AdminThemeContext.Provider value={contextValue}>
      <div
        suppressHydrationWarning
        className={`admin-theme${themeClass} flex min-h-svh w-full text-foreground`}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
