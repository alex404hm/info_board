"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Image from "next/image"
import { Clock3, ExternalLink, Newspaper, RefreshCw } from "lucide-react"

import type { DrNewsApiResponse, DrNewsItem } from "@/types"

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return ""
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMins = Math.floor(diffMs / 60000)

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

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "DR"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function inferTopics(text: string): string[] {
  const normalized = text.toLowerCase()
  const topicMap = [
    { label: "Politik", keywords: ["folketing", "regering", "minister", "valg", "politik"] },
    { label: "Verden", keywords: ["eu", "usa", "ukraine", "krig", "israel", "gaza", "kina"] },
    { label: "Klima", keywords: ["klima", "vejret", "co2", "miljo", "miljoe", "gron"] },
    { label: "Tech", keywords: ["ai", "kunstig intelligens", "teknologi", "digital", "data"] },
    { label: "Oekonomi", keywords: ["okonomi", "inflation", "rente", "krone", "arbejde", "job"] },
    { label: "Sport", keywords: ["sport", "fodbold", "superliga", "ol", "landshold"] },
  ]

  const matches = topicMap
    .filter((topic) => topic.keywords.some((keyword) => normalized.includes(keyword)))
    .map((topic) => topic.label)

  if (matches.length > 0) return matches.slice(0, 2)
  return ["Nyhed"]
}

function getSummary(text: string, maxLen: number): string {
  const trimmed = text.trim()
  if (!trimmed) return "Tryk for at laese hele artiklen."
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen - 3).trimEnd()}...`
}

type NewsItemWithTimestamp = DrNewsItem & { timestamp: number }

export function NewsPanel() {
  const [items, setItems] = useState<NewsItemWithTimestamp[]>([])
  const [lastUpdated, setLastUpdated] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchDrNews = useCallback(async () => {
    try {
      const res = await fetch("/api/dr-news", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as DrNewsApiResponse
      const nextItems: NewsItemWithTimestamp[] = (data.items || []).map((item) => ({
        ...item,
        timestamp: item.pubDate ? new Date(item.pubDate).getTime() : 0,
      }))
      setItems(nextItems.sort((a, b) => b.timestamp - a.timestamp))
      setLastUpdated(Date.now())
    } catch {
      // Keep latest successful snapshot on transient errors.
    }
  }, [])

  useEffect(() => {
    const initialLoadId = setTimeout(() => {
      void fetchDrNews()
    }, 0)

    const intervalId = setInterval(fetchDrNews, 5 * 60_000)

    return () => {
      clearTimeout(initialLoadId)
      clearInterval(intervalId)
    }
  }, [fetchDrNews])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDrNews()
    setIsRefreshing(false)
  }

  const visibleItems = useMemo(() => items.slice(0, 14), [items])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
        <span className="text-xs text-slate-400">Henter DR-nyheder...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 px-1 pb-2 md:px-3">
      <div className="ib-panel mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 bg-slate-950/70 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Newspaper className="h-4 w-4 text-rose-300" />
          <div>
            <p className="text-sm font-semibold text-slate-100">DR.dk nyhedsfeed</p>
            <p className="text-[11px] text-slate-400">
              {lastUpdated
                ? `Opdateret ${new Date(lastUpdated).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`
                : "Live feed"}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Opdater
        </button>
      </div>

      <div className="mx-auto w-full max-w-[1080px] space-y-6">
        {visibleItems.map((item, idx) => {
          const fallbackText = stripHtml(item.content || item.description)
          const articleText = item.bodyParagraphs?.length
            ? item.bodyParagraphs.map((paragraph) => stripHtml(paragraph)).filter(Boolean)
            : [fallbackText].filter(Boolean)

          const articleUrl = item.link.startsWith("http")
            ? item.link
            : `https://www.dr.dk${item.link}`
          const leadParagraph =
            articleText.find((paragraph) => paragraph.trim().length > 30) ||
            fallbackText ||
            item.description ||
            item.title
          const summary = getSummary(leadParagraph, 280)
          const byline = item.author?.trim() || "DR Nyheder"
          const readMinutes = estimateReadTime(`${item.title} ${articleText.join(" ")}`)
          const topics = inferTopics(`${item.title} ${fallbackText}`).slice(0, 2)
          const hasImage = Boolean(item.imageUrl)
          const previewParagraphs = articleText.length > 1 ? articleText.slice(1) : []

          return (
            <article
              key={`${item.link}-${item.timestamp}-${idx}`}
              className="ib-panel mx-auto w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-[0_14px_36px_rgba(0,0,0,0.38)]"
            >
              <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="group block">
                <div
                  className={
                    hasImage
                      ? "grid gap-0 md:grid-cols-[390px_minmax(0,1fr)] xl:grid-cols-[430px_minmax(0,1fr)]"
                      : "grid gap-0"
                  }
                >
                  {hasImage ? (
                    <div className="relative h-64 w-full overflow-hidden border-b border-white/10 md:h-full md:min-h-[290px] md:border-b-0 md:border-r">
                      <Image
                        src={item.imageUrl!}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 320px"
                      />
                    </div>
                  ) : null}

                  <div className={`p-5 md:p-6 ${!hasImage ? "md:px-8 lg:px-10" : ""}`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500/20 text-[10px] font-bold text-rose-200">
                          {getInitials(byline)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{byline}</p>
                          <p className="text-xs text-slate-400">{readMinutes} min read</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <h3 className="text-[1.38rem] font-bold leading-tight text-slate-100 transition-colors group-hover:text-rose-200 md:text-[1.7rem]">
                      {item.title}
                    </h3>

                    <p className="mt-3 min-h-[48px] max-w-[82ch] text-[15px] leading-relaxed text-slate-300">
                      {summary}
                    </p>

                    <div className="mt-4 space-y-3">
                      {previewParagraphs.map((paragraph, paragraphIdx) => (
                        <p
                          key={`${item.link}-paragraph-${paragraphIdx}`}
                          className="max-w-[88ch] text-[15px] leading-relaxed text-slate-200/95"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {item.imageCaption ? (
                      <p className="mt-3 border-l-2 border-white/20 pl-3 text-xs italic leading-relaxed text-slate-400">
                        {item.imageCaption}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {topics.map((topic) => (
                        <span
                          key={`${item.link}-${topic}`}
                          className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-slate-200"
                        >
                          {topic}
                        </span>
                      ))}

                      <span className="rounded-full border border-rose-400/40 bg-rose-500/12 px-2.5 py-1 text-[11px] font-semibold text-rose-200">
                        DR
                      </span>

                      <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-rose-200">
                        Læs artikel
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {idx === 0 ? (
                      <div className="mt-4 h-px w-full bg-gradient-to-r from-rose-400/60 via-rose-300/20 to-transparent" />
                    ) : null}
                  </div>
                </div>
              </a>
            </article>
          )
        })}
      </div>

      {visibleItems.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Newspaper className="h-6 w-6 text-slate-500/40" />
          <p className="text-[11px] text-slate-400">Ingen DR-nyheder lige nu</p>
        </div>
      )}
    </div>
  )
}
