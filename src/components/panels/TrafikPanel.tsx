"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Car, CheckCircle2, ChevronDown, ChevronUp, Clock, RefreshCw, Train } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TrafikPost } from "@/app/api/trafik/route"

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Lige nu"
  if (diffMins < 60) return `${diffMins} min siden`
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return `${hours} t siden`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d siden`
  return new Date(isoString).toLocaleDateString("da-DK", { day: "numeric", month: "short" })
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
}

function SubtypeIcon({ subtype }: { subtype: string }) {
  if (subtype === "TRAIN" || subtype === "BUS" || subtype === "METRO") {
    return <Train className="h-4 w-4" />
  }
  return <Car className="h-4 w-4" />
}

function subtypeLabel(subtype: string): string {
  const map: Record<string, string> = {
    CAR: "Bil",
    TRAIN: "Tog",
    BUS: "Bus",
    METRO: "Metro",
    BIKE: "Cykel",
  }
  return map[subtype] ?? subtype
}

// ─── single post card ─────────────────────────────────────────────────────────

function TrafikCard({ post }: { post: TrafikPost }) {
  const [expanded, setExpanded] = useState(false)
  const hasUpdates = post.updates.length > 0
  const latestUpdate = hasUpdates ? post.updates[0] : null

  const isActive = !post.concluded

  return (
    <article
      className={cn(
        "surface-panel overflow-hidden",
        isActive ? "border-[color:rgba(251,146,60,0.35)]" : ""
      )}
      style={isActive ? { boxShadow: "0 0 0 1px rgba(251,146,60,0.10)" } : undefined}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {/* Status badge */}
          {isActive ? (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 font-bold text-orange-300">
              <AlertTriangle className="h-3 w-3" />
              Aktiv
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Afsluttet
            </span>
          )}

          {/* Subtype */}
          <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium bg-white/10 text-muted">
            <SubtypeIcon subtype={post.subtype} />
            {subtypeLabel(post.subtype)}
          </span>

          {/* Region */}
          <span
            className="rounded-full px-2.5 py-0.5 font-medium bg-white/10 text-muted"
          >
            {post.region}
          </span>

          {/* Time */}
          <span className="ml-auto flex items-center gap-1 text-subtle">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(post.sortTime)}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-base font-bold leading-snug md:text-lg text-foreground-strong">
          {post.text}
        </h2>

        {/* Latest update */}
        {latestUpdate && (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            <span className="mr-1.5 font-semibold text-subtle">
              {formatTime(latestUpdate.createdTime)}:
            </span>
            {latestUpdate.text}
          </p>
        )}
      </div>

      {/* Expand/collapse updates */}
      {post.updates.length > 1 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-2.5 text-xs font-medium transition-colors border-t border-light bg-white/5 text-subtle"
          >
            <span>{post.updates.length - 1} tidligere opdateringer</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {expanded && (
            <div className="space-y-0 px-5 pb-5 pt-2">
              {post.updates.slice(1).map((update) => (
                <div
                  key={update._id}
                  className="relative py-3 pl-4 border-l-2 border-light"
                >
                  <p className="mb-0.5 text-xs font-semibold text-subtle">
                    {formatTime(update.createdTime)}
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    {update.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}

// ─── main panel ──────────────────────────────────────────────────────────────

type ApiResponse = {
  fetchedAt: string
  items: TrafikPost[]
}

export function TrafikPanel() {
  const [posts, setPosts] = useState<TrafikPost[]>([])
  const [lastUpdated, setLastUpdated] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "concluded">("active")
  const mountedRef = useRef(true)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/trafik", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as ApiResponse
      if (!mountedRef.current) return
      setPosts(data.items ?? [])
      setLastUpdated(Date.now())
    } catch {
      // keep last snapshot
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void fetchPosts()
    const id = setInterval(() => fetchPosts(), 2 * 60_000)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [fetchPosts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPosts()
    setIsRefreshing(false)
  }

  const visible = posts.filter((p) => {
    if (filter === "active") return !p.concluded
    if (filter === "concluded") return p.concluded
    return true
  })

  const activeCount = posts.filter((p) => !p.concluded).length

    if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        <span className="text-sm text-muted">Henter trafikinfo...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-2 pb-6 md:px-0">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-foreground-strong">DR Trafik</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
              {activeCount} aktiv{activeCount !== 1 ? "e" : ""}
            </span>
          )}
          {lastUpdated ? (
            <span className="text-xs text-subtle">
              — {new Date(lastUpdated).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div
            className="flex gap-1 rounded-lg p-1 bg-[color:var(--surface)] border border-[color:var(--surface-border)]"
          >
            {(["active", "concluded"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  filter === f ? "bg-white/[0.12] text-foreground-strong" : "text-subtle"
                )}
              >
                {f === "active" ? "Aktive" : "Afsluttede"}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 border border-[color:var(--surface-border)] bg-[color:var(--surface)] text-muted hover:bg-white/[0.04]"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Opdater
          </button>
        </div>
      </div>

      {/* Posts */}
      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((post) => (
            <TrafikCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="surface-panel flex flex-col items-center gap-3 rounded-xl py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <p className="text-sm font-medium text-muted">
            {filter === "active"
              ? "Ingen aktive trafikhændelser"
              : "Ingen trafikinfo tilgængelig"}
          </p>
          <p className="text-xs text-subtle">Trafikken kører normalt i København</p>
        </div>
      )}
    </div>
  )
}
