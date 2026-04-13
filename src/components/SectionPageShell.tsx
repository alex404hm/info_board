"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-fetch"
import { useEffect, useRef, useState } from "react"

import { StatusBar } from "@/components/StatusBar"
import { InfoBoardIdleGuard } from "@/components/InfoBoardIdleGuard"
import type { TileId, TileConfig } from "@/lib/tiles-config"

const PATH_TO_TILE: Record<string, TileId> = {
  "/afgange":   "afgange",
  "/kantine":   "kantine",
  "/kalender":  "kalender",
  "/nyheder":   "nyheder",
  "/kontakter": "kontakter",
  "/vejr":      "vejr",
  "/trafik":    "trafik",
  "/kokkenvagt": "kokkenvagt",
  "/beskeder":  "beskeder",
  "/intranet":  "intranet",
}

type ShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  noHeader?: boolean
  fullWidth?: boolean
  backHref?: string
  headerAlign?: "contained" | "edge"
}

export function SectionPageShell({
  title,
  subtitle,
  children,
  noHeader,
  fullWidth = false,
  backHref = "/",
  headerAlign = "contained",
}: ShellProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const mainRef  = useRef<HTMLElement>(null)
  const tileId = PATH_TO_TILE[pathname]

  // ── Tile visibility guard ────────────────────────────────────────────────
  const [allowed, setAllowed] = useState<boolean | null>(() => (tileId ? null : true))

  useEffect(() => {
    if (!tileId) return

    let mounted = true
    apiFetch("/api/tiles-config", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: TileConfig[] | null) => {
        if (!mounted) return
        if (!Array.isArray(data)) { setAllowed(true); return }
        const cfg = data.find((c) => c.id === tileId)
        if (cfg && !cfg.visible) {
          router.replace("/")
        } else {
          setAllowed(true)
        }
      })
      .catch(() => { if (mounted) setAllowed(true) })
    return () => { mounted = false }
  }, [tileId, router])

  // While checking visibility, show blank screen to prevent flash
  if (allowed === null) {
    return <div className="h-screen bg-background" />
  }

  return (
    <div className="home-theme flex h-dvh flex-col bg-background text-foreground">
      <InfoBoardIdleGuard />
      <StatusBar />

      {/* Header */}
      {!noHeader && (
        <div className="shrink-0 px-8 py-4"
          style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--surface-border)" }}>
          <div
            className={
              headerAlign === "edge"
                ? "flex w-full items-start justify-between gap-3"
                : "mx-auto flex w-full max-w-350 items-center justify-between gap-3"
            }
          >
            <Link
              href={backHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: "var(--surface-soft)", border: "1px solid var(--surface-border)", color: "var(--foreground-muted)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tilbage
            </Link>
            <div className="min-w-0 flex-1 text-right">
              <h1 className="truncate text-lg font-bold" style={{ color: "var(--foreground)" }}>{title}</h1>
              {subtitle && (
                <p className="truncate text-xs" style={{ color: "var(--foreground-muted)" }}>{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-none custom-scrollbar relative">
        <div className={`${fullWidth ? "w-full px-8 pb-12 pt-8" : "mx-auto w-full max-w-350 px-10 pb-12 pt-8"}`} style={{ paddingBottom: "3rem" }}>
          {children}
        </div>

      </main>

    </div>
  )
}
