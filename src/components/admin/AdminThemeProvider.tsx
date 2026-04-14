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

  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === "undefined") return initialTheme
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "dark" || stored === "light" || stored === "system") return stored
    } catch {}
    return initialTheme
  })
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

  // Keep document.documentElement in sync so Radix portals (Dialog, Popover,
  // DropdownMenu etc.) rendered at body-level also inherit the dark/light vars.
  useEffect(() => {
    if (typeof window === "undefined") return
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
    document.documentElement.classList.toggle("light", resolvedTheme === "light")
    document.documentElement.setAttribute("data-admin-theme", resolvedTheme)
  }, [resolvedTheme])

  // On the server, resolve "system" using the cookie-derived initialTheme.
  // For "system" we don't know OS preference server-side, so we fall back to
  // "dark" (the admin default). The inline script already set data-admin-theme
  // on <html> to the correct resolved value before first paint, so there is no
  // visible flash — the body background is already correct.
  const themeClass = isHydrated
    ? resolvedTheme === "light" ? " light" : " dark"
    : initialTheme === "light" ? " light" : " dark"

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
