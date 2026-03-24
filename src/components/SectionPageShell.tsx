"use client"

import Link from "next/link"
import { ArrowLeft, ArrowUp } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
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
}

export function SectionPageShell({ title, subtitle, children, noHeader }: ShellProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const mainRef  = useRef<HTMLElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // ── Tile visibility guard ────────────────────────────────────────────────
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const tileId = PATH_TO_TILE[pathname]
    if (!tileId) { setAllowed(true); return }

    let mounted = true
    fetch("/api/tiles-config", { cache: "no-store" })
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
  }, [pathname, router])

  // ── Scroll-to-top visibility ─────────────────────────────────────────────
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 300)
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [allowed])

  function scrollToTop() {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  // While checking visibility, show blank screen to prevent flash
  if (allowed === null) {
    return <div className="h-screen bg-background" />
  }

  return (
    <div className="home-theme flex h-screen flex-col bg-background text-foreground">
      <InfoBoardIdleGuard />
      <StatusBar />

      {/* Header */}
      {!noHeader && (
        <div className="shrink-0 px-4 py-3 md:px-6"
          style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--surface-border)" }}>
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: "var(--surface-soft)", border: "1px solid var(--surface-border)", color: "var(--foreground-muted)" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tilbage
            </Link>
            <div className="min-w-0 flex-1 text-right">
              <h1 className="truncate text-base font-bold md:text-lg" style={{ color: "var(--foreground)" }}>{title}</h1>
              {subtitle && (
                <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-10 pt-4 sm:px-4 sm:pt-6 md:px-10 md:pt-8 md:pb-12">
          {children}
        </div>

        {/* Scroll-to-top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 hover:opacity-90"
            style={{
              background: "var(--accent)",
              boxShadow: "0 4px 16px rgba(95,157,255,0.35)",
              color: "#fff",
            }}
            aria-label="Rul til toppen"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </main>

    </div>
  )
}