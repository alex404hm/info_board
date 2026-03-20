"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { ArrowUp, CheckCircle2, Clock3, Info, Newspaper, RefreshCw } from "lucide-react"

import type { DrNewsApiResponse, DrNewsItem } from "@/types"
import { decodeHtmlEntities } from "@/lib/utils"

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return ""
  const diffMins = Math.floor((Date.now() - timestamp) / 60000)
  if (diffMins < 1) return "Lige nu"
  if (diffMins < 60) return `${diffMins} min siden`
  const hours = Math.floor(diffMins / 60)
  if (hours < 24) return `${hours} t siden`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d siden`
  return new Date(timestamp).toLocaleDateString("da-DK", { day: "numeric", month: "short" })
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = words / 130
  if (minutes < 0.5) return "< 1 min"
  return `${Math.max(1, Math.round(minutes))} min`
}

function inferTopics(text: string): string[] {
  const normalized = text.toLowerCase()
  const topicMap = [
    { label: "Politik", keywords: ["folketing", "regering", "minister", "valg", "politik"] },
    { label: "Verden", keywords: ["eu", "usa", "ukraine", "krig", "israel", "gaza", "kina"] },
    { label: "Klima", keywords: ["klima", "vejret", "co2", "miljo", "miljoe", "gron"] },
    { label: "Tech", keywords: ["ai", "kunstig intelligens", "teknologi", "digital", "data"] },
    { label: "Økonomi", keywords: ["okonomi", "inflation", "rente", "krone", "arbejde", "job"] },
    { label: "Sport", keywords: ["sport", "fodbold", "superliga", "ol", "landshold"] },
  ]
  const matches = topicMap
    .filter((t) => t.keywords.some((k) => normalized.includes(k)))
    .map((t) => t.label)
  return matches.length > 0 ? matches.slice(0, 2) : ["Nyhed"]
}

// ─── toast ──────────────────────────────────────────────────────────────────

type ToastInfo = { message: string; kind: "new" | "uptodate" }

function Toast({ toast, onDone }: { toast: ToastInfo; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  const isNew = toast.kind === "new"

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl text-sm font-medium transition-all"
      style={{
        background: isNew ? "var(--accent-soft)" : "rgba(255,255,255,0.08)",
        border: `1px solid ${isNew ? "var(--accent-border)" : "var(--surface-border)"}`,
        backdropFilter: "blur(12px)",
        color: isNew ? "var(--accent)" : "var(--foreground-muted)",
      }}
    >
      {isNew
        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
        : <Info className="h-4 w-4 shrink-0 text-soft" />
      }
      {toast.message}
    </div>
  )
}

// ─── main component ─────────────────────────────────────────────────────────

type NewsItemWithTimestamp = DrNewsItem & { timestamp: number }

export function NewsPanel() {
  const [items, setItems] = useState<NewsItemWithTimestamp[]>([])
  const [lastUpdated, setLastUpdated] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toast, setToast] = useState<ToastInfo | null>(null)
  const [showJumpTop, setShowJumpTop] = useState(false)

  const knownLinksRef = useRef<Set<string>>(new Set())

  const fetchDrNews = useCallback(async (isManual = false) => {
    try {
      const res = await fetch("/api/dr-news", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as DrNewsApiResponse
      const nextItems: NewsItemWithTimestamp[] = (data.items ?? []).map((item) => ({
        ...item,
        timestamp: item.pubDate ? new Date(item.pubDate).getTime() : 0,
      }))
      const sorted = nextItems.sort((a, b) => b.timestamp - a.timestamp)

      if (isManual) {
        const newLinks = sorted.map((i) => i.link)
        const newCount = newLinks.filter((l) => !knownLinksRef.current.has(l)).length
        if (newCount > 0) {
          setToast({
            kind: "new",
            message: newCount === 1
              ? "Opdateret – 1 ny artikel fundet"
              : `Opdateret – ${newCount} nye artikler fundet`,
          })
        } else {
          setToast({ kind: "uptodate", message: "Opdateret – ingen nye artikler" })
        }
      }

      knownLinksRef.current = new Set(sorted.map((i) => i.link))
      setItems(sorted)
      setLastUpdated(Date.now())
    } catch {
    }
  }, [])

  useEffect(() => {
    void fetchDrNews(false)
    const id = setInterval(() => fetchDrNews(false), 5 * 60_000)
    return () => clearInterval(id)
  }, [fetchDrNews])

  useEffect(() => {
    const scrollEl = document.querySelector("main.custom-scrollbar") as HTMLElement | null

    const onScroll = () => {
      const y = scrollEl ? scrollEl.scrollTop : window.scrollY
      setShowJumpTop(y > 220)
    }

    onScroll()
    if (scrollEl) {
      scrollEl.addEventListener("scroll", onScroll, { passive: true })
      return () => scrollEl.removeEventListener("scroll", onScroll)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDrNews(true)
    setIsRefreshing(false)
  }

  const visibleItems = useMemo(() => items.slice(0, 14), [items])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
        <span className="text-sm text-muted">Henter DR-nyheder...</span>
      </div>
    )
  }

  return (
    <>
      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}

      <div className="mx-auto w-full max-w-3xl space-y-3 px-2 pb-6 md:px-0">
        {/* Feed header */}
        <div className="flex items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2 text-sm">
            <Newspaper className="h-4 w-4 text-accent" />
            <span className="font-semibold text-foreground-strong">DR.dk</span>
            {lastUpdated ? (
              <span className="text-xs text-subtle">
                — opdateret{" "}
                {new Date(lastUpdated).toLocaleTimeString("da-DK", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              color: "var(--foreground-muted)",
            }}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Opdater
          </button>
        </div>

        {/* Articles */}
        <div className="space-y-4">
          {visibleItems.map((item, idx) => {
            const descText = stripHtml(item.description ?? "")
            const paragraphs = item.bodyParagraphs?.length
              ? item.bodyParagraphs.map((p) => stripHtml(p)).filter((p) => p.length > 10)
              : [stripHtml(item.content || "")].filter(Boolean)

            const byline = item.author?.trim() || "DR Nyheder"
            const topics = inferTopics(`${item.title} ${descText}`).slice(0, 2)
            const hasImage = Boolean(item.imageUrl)
            const isHero = idx === 0

            const allText = [item.title, descText, ...paragraphs].filter(Boolean).join(" ")
            const readTime = estimateReadTime(allText)

            return (
              <article
                key={`${item.link}-${item.timestamp}-${idx}`}
                className="surface-panel overflow-hidden"
              >
                {/* Hero image */}
                {hasImage && (
                  <div className={`relative w-full overflow-hidden ${isHero ? "h-72 md:h-96" : "h-52 md:h-64"}`}>
                    <Image
                      src={item.imageUrl!}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                    <div className="absolute bottom-4 left-5 flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <span
                          key={`${item.link}-${topic}`}
                          className="rounded-full bg-black/60 px-3 py-0.5 text-[11px] font-semibold text-slate-200 backdrop-blur-sm"
                        >
                          {topic}
                        </span>
                      ))}
                      <span className="rounded-full bg-rose-600/80 px-3 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                        DR
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 md:p-8">
                  {/* Meta row */}
                  <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
                    {!hasImage && (
                      <div className="flex flex-wrap gap-2">
                        {topics.map((topic) => (
                          <span
                            key={`${item.link}-${topic}`}
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-white/10 text-muted border border-white/10"
                          >
                            {topic}
                          </span>
                        ))}
                        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
                          DR
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-muted">{byline}</span>
                    <span className="text-soft">·</span>
                    <span>{readTime} læsetid</span>
                    <span className="text-soft">·</span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className={`font-bold leading-tight ${
                      isHero ? "text-2xl md:text-4xl" : "text-xl md:text-2xl"
                    } text-foreground-strong`}
                  >
                    {decodeHtmlEntities(item.title)}
                  </h2>

                  {/* Body */}
                  {paragraphs.length > 0 && (
                    <div className="mt-5 space-y-4">
                      {paragraphs.map((paragraph, pIdx) => (
                        <p
                          key={`${item.link}-p-${pIdx}`}
                          className={`leading-relaxed ${pIdx === 0 ? "text-[16px] font-[450]" : "text-[15px]"} text-muted`}
                        >
                          {decodeHtmlEntities(paragraph)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Image caption */}
                  {item.imageCaption && (
                    <p className="mt-5 border-l-2 border-white/20 pl-3 text-xs italic leading-relaxed text-muted">
                      {item.imageCaption}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        {visibleItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Newspaper className="h-7 w-7 text-soft" />
            <p className="text-sm text-muted">Ingen DR-nyheder lige nu</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          const scrollEl = document.querySelector("main.custom-scrollbar") as HTMLElement | null
          if (scrollEl) {
            scrollEl.scrollTo({ top: 0, behavior: "smooth" })
            return
          }
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}
        aria-label="Til toppen"
        className={`fixed bottom-6 right-6 z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 ${
          showJumpTop
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-2 opacity-0 pointer-events-none"
        }`}
        style={{
          background: "var(--surface)",
          borderColor: "var(--surface-border)",
          color: "var(--foreground-muted)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.30)",
        }}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </>
  )
}
