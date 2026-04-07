"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { StatusBar } from "@/components/StatusBar"
import { InfoBoardIdleGuard } from "@/components/InfoBoardIdleGuard"
import { CanteenGrid } from "@/components/panels/CanteenPanel"
import type { TileConfig } from "@/lib/tiles-config"

export default function CanteenPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    fetch("/api/tiles-config", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then((data: TileConfig[] | null) => {
        if (!mounted) return
        if (!Array.isArray(data)) { setAllowed(true); return }
        const cfg = data.find(c => c.id === "kantine")
        cfg && !cfg.visible ? router.replace("/") : setAllowed(true)
      })
      .catch(() => { if (mounted) setAllowed(true) })
    return () => { mounted = false }
  }, [router])

  if (allowed === null) return <div className="h-screen bg-background" />

  return (
    <div className="home-theme flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <InfoBoardIdleGuard />
      <StatusBar />

      <div
        className="shrink-0 px-4 py-3 md:px-6"
        style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--surface-border)" }}
      >
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
            <h1 className="truncate text-base font-bold md:text-lg" style={{ color: "var(--foreground)" }}>Kantine</h1>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Vælg en kategori herunder</p>
          </div>
        </div>
      </div>

      <CanteenGrid />
    </div>
  )
}
