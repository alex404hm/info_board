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
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
        <span className="text-sm text-slate-400">Henter DR-nyheder...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 px-2 pb-6 md:px-0">
      {/* Feed header */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-rose-400" />
          <span className="text-sm font-semibold text-slate-200">DR.dk</span>
          {lastUpdated ? (
            <span className="text-xs text-slate-500">
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
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          Opdater
        </button>
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {visibleItems.map((item, idx) => {
          const fallbackText = stripHtml(item.content || item.description)
          const allParagraphs = item.bodyParagraphs?.length
            ? item.bodyParagraphs.map((p) => stripHtml(p)).filter((p) => p.length > 10)
            : [fallbackText].filter(Boolean)

          const articleUrl = item.link.startsWith("http")
            ? item.link
            : `https://www.dr.dk${item.link}`

          const byline = item.author?.trim() || "DR Nyheder"
          const readMinutes = estimateReadTime(`${item.title} ${allParagraphs.join(" ")}`)
          const topics = inferTopics(`${item.title} ${fallbackText}`).slice(0, 2)
          const hasImage = Boolean(item.imageUrl)
          const isHero = idx === 0

          return (
            <article
              key={`${item.link}-${item.timestamp}-${idx}`}
              className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-900/70 transition-all duration-300 hover:border-white/[0.13] hover:bg-slate-900/90 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            >
              <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="block">
                {/* Hero image — only when article has one */}
                {hasImage && (
                  <div className={`relative w-full overflow-hidden ${isHero ? "h-72 md:h-96" : "h-52 md:h-64"}`}>
                    <Image
                      src={item.imageUrl!}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 800px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                    {/* Topic badges overlaid on image */}
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
                  <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
                    {/* Topics only shown here when no image */}
                    {!hasImage && (
                      <div className="flex flex-wrap gap-2">
                        {topics.map((topic) => (
                          <span
                            key={`${item.link}-${topic}`}
                            className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300"
                          >
                            {topic}
                          </span>
                        ))}
                        <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-300">
                          DR
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-slate-300">{byline}</span>
                    <span className="text-slate-600">·</span>
                    <span>{readMinutes} min læsetid</span>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className={`font-bold leading-tight text-white transition-colors duration-200 group-hover:text-rose-200 ${
                      isHero ? "text-2xl md:text-4xl" : "text-xl md:text-2xl"
                    }`}
                  >
                    {item.title}
                  </h2>

                  {/* Full article paragraphs */}
                  {allParagraphs.length > 0 && (
                    <div className="mt-5 space-y-4">
                      {allParagraphs.map((paragraph, pIdx) => (
                        <p
                          key={`${item.link}-p-${pIdx}`}
                          className={`leading-relaxed text-slate-300 ${pIdx === 0 ? "text-[16px] font-[450]" : "text-[15px]"}`}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Image caption */}
                  {item.imageCaption && (
                    <p className="mt-5 border-l-2 border-white/20 pl-3 text-xs italic leading-relaxed text-slate-500">
                      {item.imageCaption}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-rose-300 transition-all duration-200 group-hover:gap-3 group-hover:text-rose-200">
                    Læs hele artiklen på DR.dk
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </div>
              </a>
            </article>
          )
        })}
      </div>

      {visibleItems.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Newspaper className="h-7 w-7 text-slate-600" />
          <p className="text-sm text-slate-500">Ingen DR-nyheder lige nu</p>
        </div>
      )}
    </div>
  )
}
