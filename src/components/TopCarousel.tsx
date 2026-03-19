"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useDailyDishData } from "@/hooks/use-api-data"
import { decodeHtmlEntities, lineBadgeStyle } from "@/lib/utils"
import type { Departure } from "@/types"
import type { TrafikPost } from "@/app/api/trafik/route"

const SWIPE_VELOCITY_THRESHOLD = 0.3
const SWIPE_MIN_DISTANCE = 10
const SWIPE_CLICK_THRESHOLD = 10

const C1 = "var(--foreground)"
const C2 = "var(--foreground-muted)"
const C3 = "var(--surface-border)"
const C4 = "var(--surface-soft)"
const C5 = "var(--surface)"

const card    = { background: C5, backdropFilter: "blur(12px)", border: `1px solid ${C3}` } as const
const rowItem = { background: C4, border: `1px solid ${C3}` } as const
const linkBtn = { background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" } as const

type CalendarEvent = { id: string; title: string; start: string; end: string | null; allDay: boolean }
type BoardMessage  = { id: string; title: string; content: string; priority: string; authorName: string | null; createdAt: string }
type DrNewsItem    = { title: string; link: string }

type ModuleId = "canteen" | "calendar" | "messages" | "weather" | "dr-news" | "transport" | "traffic"

interface ConfigSlide {
  id: string
  hero: ModuleId | null
  normals: ModuleId[]
}

const STATIC_SLIDES: ConfigSlide[] = [
  { id: "slide-1", hero: null, normals: ["canteen", "calendar"] },
  { id: "slide-2", hero: null, normals: ["dr-news", "transport"] },
]

// ── FoodIllustration ──────────────────────────────────────────────────────────
function FoodIllustration() {
  return (
    <svg viewBox="0 0 160 140" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M58 46 C56 38 59 30 57 22" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <path d="M80 42 C78 34 81 26 79 18" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <path d="M102 46 C100 38 103 30 101 22" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="80" cy="118" rx="54" ry="8" fill="rgba(0,0,0,0.25)" />
      <path d="M24 70 Q24 118 80 118 Q136 118 136 70 Z" fill="#854d0e" />
      <ellipse cx="80" cy="70" rx="56" ry="14" fill="#a16207" />
      <ellipse cx="80" cy="68" rx="48" ry="11" fill="#d97706" />
      <ellipse cx="68" cy="66" rx="6" ry="3" fill="#fbbf24" opacity="0.7" />
      <ellipse cx="84" cy="64" rx="5" ry="2.5" fill="#fbbf24" opacity="0.7" />
      <ellipse cx="96" cy="67" rx="5.5" ry="3" fill="#fbbf24" opacity="0.7" />
      <ellipse cx="74" cy="70" rx="4.5" ry="2" fill="#fbbf24" opacity="0.55" />
      <circle cx="72" cy="63" r="4" fill="#4ade80" opacity="0.85" />
      <circle cx="89" cy="61" r="3" fill="#86efac" opacity="0.75" />
      <circle cx="96" cy="64" r="3.5" fill="#f87171" opacity="0.9" />
      <rect x="140" y="58" width="3" height="36" rx="1.5" fill="rgba(255,255,255,0.20)" />
      <rect x="136" y="58" width="1.5" height="14" rx="0.75" fill="rgba(255,255,255,0.20)" />
      <rect x="143" y="58" width="1.5" height="14" rx="0.75" fill="rgba(255,255,255,0.20)" />
      <rect x="16" y="60" width="3" height="36" rx="1.5" fill="rgba(255,255,255,0.20)" />
      <ellipse cx="17.5" cy="58" rx="5" ry="7" fill="rgba(255,255,255,0.18)" />
    </svg>
  )
}

// ── Widget node factory ────────────────────────────────────────────────────────
// Returns a React node for a given module id, driven by fetched data.

interface WidgetProps {
  calendarEvents: CalendarEvent[]
  boardMessages: BoardMessage[]
  drNewsItems: DrNewsItem[]
  departures: Departure[]
  trafikPosts: TrafikPost[]
  dailyDish: ReturnType<typeof useDailyDishData>
  hasDishData: boolean
  isServingToday: boolean
}

function buildWidgetNode(id: ModuleId, props: WidgetProps): React.ReactNode {
  const { calendarEvents, boardMessages, drNewsItems, departures, trafikPosts, dailyDish, hasDishData, isServingToday } = props

  switch (id) {
    case "canteen":
      return (
        <div className="ib-panel flex h-full flex-col items-center justify-center p-6 text-center shadow-xl shadow-black/30"
          style={{ background: "#2a272a", border: "1px solid rgba(251,191,36,0.25)" }}>
          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/30">
              <Image src="/logo/kanpla.png" alt="Kanpla" width={32} height={32} className="h-full w-full rounded-[4px] object-fill" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/70">Kantine</p>
              <h3 className="text-xl font-bold" style={{ color: "#d6ecea" }}>Dagens ret</h3>
            </div>
          </div>

          <p className="text-2xl font-bold tracking-tight leading-snug" style={{ color: "#d6ecea" }}>
            {hasDishData ? decodeHtmlEntities(dailyDish?.name ?? "Ingen ret i dag") : "Henter dagens ret…"}
          </p>

          {!isServingToday && dailyDish?.nextDishName ? (
            <p className="mt-4 text-xs text-amber-300/60">
              Næste: <span className="font-medium text-amber-300/90">{decodeHtmlEntities(dailyDish.nextDishName)}</span>
              {dailyDish.nextDishDateLabel ? ` · ${dailyDish.nextDishDateLabel}` : ""}
            </p>
          ) : null}
        </div>
      )

    case "calendar":
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl p-4" style={card}>
          <div className="mb-3 flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 shrink-0">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Kalender</p>
              <p className="text-sm font-semibold" style={{ color: C1 }}>Kommende begivenheder</p>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            {calendarEvents.length > 0 ? (
              calendarEvents.slice(0, 2).map((ev) => {
                const d = new Date(ev.start)
                return (
                  <div key={ev.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5" style={rowItem}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: C1 }}>
                      {decodeHtmlEntities(ev.title)}
                    </p>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] tabular-nums" style={{ color: C2 }}>
                        {d.toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                      </p>
                      {!ev.allDay && (
                        <p className="text-[9px] tabular-nums" style={{ color: C3 }}>
                          {d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="py-2 text-center text-[10px]" style={{ color: C3 }}>Ingen kommende begivenheder</p>
            )}
          </div>
        </div>
      )

    case "messages": {
      const priorityMeta = (p: string) =>
        p === "urgent"
          ? { bg: "#fecaca", fold: "#fca5a5", tape: "#dc2626", textDark: "#450a0a", textMid: "#7f1d1d", textFaint: "#991b1b", label: "AKUT", avatarBg: "#dc2626" }
          : p === "high"
          ? { bg: "#fed7aa", fold: "#fdba74", tape: "#ea580c", textDark: "#431407", textMid: "#7c2d12", textFaint: "#9a3412", label: "VIGTIG", avatarBg: "#ea580c" }
          : { bg: "#fef08a", fold: "#fde047", tape: "#ca8a04", textDark: "#422006", textMid: "#713f12", textFaint: "#92400e", label: null, avatarBg: "#d97706" }

      const msg = boardMessages[0] ?? null

      if (!msg) {
        return (
          <div className="relative flex h-full flex-col items-center justify-center gap-2"
            style={{ background: "#fef08a", transform: "rotate(-0.8deg)", boxShadow: "4px 6px 20px rgba(0,0,0,0.45), 1px 2px 5px rgba(0,0,0,0.2)", borderRadius: "2px" }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-6 w-14 rounded-sm opacity-60"
              style={{ background: "#ca8a04", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }} />
            <MessageSquare className="h-6 w-6 opacity-20" style={{ color: "#713f12" }} />
            <p className="text-xs font-medium opacity-40" style={{ color: "#713f12" }}>Ingen meddelelser</p>
          </div>
        )
      }

      const meta = priorityMeta(msg.priority)
      const initials = (msg.authorName ?? "??")
        .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
      const dateStr = new Date(msg.createdAt).toLocaleDateString("da-DK", { day: "numeric", month: "long" })

      return (
        <div
          key={msg.id}
          className="relative flex h-full flex-col"
          style={{
            background: meta.bg,
            transform: "rotate(-1deg)",
            boxShadow: "4px 6px 20px rgba(0,0,0,0.45), 1px 2px 5px rgba(0,0,0,0.2)",
            borderRadius: "2px",
          }}
        >
          {/* Tape strip at top */}
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 h-7 w-16 rounded-sm"
            style={{ background: meta.tape, opacity: 0.65, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
          />

          {/* Folded bottom-right corner shadow */}
          <div className="absolute bottom-0 right-0 z-10" style={{
            width: 0, height: 0, borderStyle: "solid",
            borderWidth: "0 0 28px 28px",
            borderColor: `transparent transparent rgba(0,0,0,0.15) transparent`,
          }} />
          {/* Folded corner face */}
          <div className="absolute bottom-0 right-0 z-10" style={{
            width: 0, height: 0, borderStyle: "solid",
            borderWidth: "28px 28px 0 0",
            borderColor: `${meta.fold} transparent transparent transparent`,
            opacity: 0.6,
          }} />

          {/* Content */}
          <div className="flex h-full flex-col px-5 pb-5 pt-8">

            {/* Priority badge */}
            {meta.label && (
              <span
                className="mb-3 self-start rounded-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white"
                style={{ background: meta.tape, opacity: 0.88 }}
              >
                {meta.label}
              </span>
            )}

            {/* Title */}
            <h3
              className="text-base font-black leading-snug"
              style={{ color: meta.textDark, fontFamily: "sans-serif", letterSpacing: "-0.01em" }}
            >
              {msg.title}
            </h3>

            {/* Ruled lines decoration */}
            <div className="my-3 flex flex-col gap-2">
              {[0,1,2,3].map((i) => (
                <div key={i} className="h-px w-full" style={{ background: `${meta.textFaint}22` }} />
              ))}
            </div>

            {/* Body text */}
            <p
              className="flex-1 overflow-hidden text-sm leading-relaxed"
              style={{ color: meta.textMid, display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}
            >
              {msg.content}
            </p>

            {/* Teacher row */}
            <div
              className="mt-4 flex items-center gap-3 border-t pt-3"
              style={{ borderColor: `${meta.textDark}18` }}
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                style={{ background: meta.avatarBg }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: meta.textDark }}>
                  {msg.authorName ?? "Skolen"}
                </p>
                <p className="text-[10px]" style={{ color: meta.textFaint }}>Klasselærer · 7.B</p>
              </div>
              <p className="shrink-0 text-[9px]" style={{ color: meta.textFaint, opacity: 0.6 }}>{dateStr}</p>
            </div>
          </div>
        </div>
      )
    }

    case "weather":
      return (
        <div className="flex h-full flex-col rounded-xl p-4" style={card}>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
              <span className="text-sm">🌤️</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Vejr · I dag</p>
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-xl font-bold leading-tight" style={{ color: C1 }}>Delvist skyet</p>
              <span className="badge-accent mt-2 inline-flex w-fit items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> 8°C
              </span>
            </div>
            <div className="mr-2 text-4xl opacity-80">🌤️</div>
          </div>
        </div>
      )

    case "dr-news":
      return (
        <div className="flex h-full flex-col rounded-xl p-4" style={card}>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 shrink-0">
              <Image src="/logo/dr-news.svg" alt="DR Nyheder" width={20} height={20} className="h-full w-full rounded-[3px] object-fill" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">DR Nyheder</p>
          </div>
          <div className="flex-1 space-y-1">
            {drNewsItems.length > 0 ? (
              drNewsItems.slice(0, 2).map((item, i) => (
                <div key={`${item.link}-${i}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5" style={rowItem}>
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: C1 }}>{decodeHtmlEntities(item.title)}</p>
                </div>
              ))
            ) : (
              <p className="py-2 text-center text-[10px]" style={{ color: C3 }}>Henter nyheder…</p>
            )}
          </div>
        </div>
      )

    case "transport":
      return (
        <div className="flex h-full flex-col rounded-xl p-4" style={card}>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 shrink-0">
              <Image src="/logo/dsb.svg" alt="DSB" width={20} height={20} className="h-full w-full rounded-[3px] object-fill" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Transport</p>
          </div>
          <div className="flex-1 space-y-1">
            {departures.length > 0 ? (
              departures.slice(0, 2).map((dep, i) => {
                const badge = lineBadgeStyle(dep.line)
                return (
                  <div key={`${dep.line}-${dep.destination}-${i}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5" style={rowItem}>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dep.type === "train" ? "bg-blue-400" : "bg-sky-400"}`} />
                    <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold tabular-nums"
                      style={{ backgroundColor: badge.bg, color: badge.text }}>{dep.line}</span>
                    <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: C1 }}>{dep.destination}</p>
                    <span className="shrink-0 text-[10px] tabular-nums font-semibold"
                      style={{ color: dep.delayMin > 0 ? "var(--destructive)" : C2 }}>{dep.time}</span>
                  </div>
                )
              })
            ) : (
              <p className="py-2 text-center text-[10px]" style={{ color: C3 }}>Henter afgange…</p>
            )}
          </div>
        </div>
      )

    case "traffic":
      return (
        <div className="flex h-full flex-col rounded-xl p-4" style={card}>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 shrink-0">
              <Image src="/logo/p4-trafik.svg" alt="P4 Trafik" width={20} height={20} className="h-full w-full rounded-[3px] object-fill" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Trafik</p>
          </div>
          <div className="flex-1 space-y-1">
            {trafikPosts.length > 0 ? (
              trafikPosts.slice(0, 2).map((post) => (
                <div key={post._id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5" style={rowItem}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${!post.concluded ? "bg-orange-400" : "bg-emerald-400"}`} />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: C1 }}>{post.text}</p>
                  <span className="shrink-0 text-[9px] font-medium" style={{ color: C3 }}>{post.region}</span>
                </div>
              ))
            ) : (
              <p className="py-2 text-center text-[10px]" style={{ color: C3 }}>Ingen trafikmeldinger</p>
            )}
          </div>
        </div>
      )

    default:
      return null
  }
}

// ── Slide renderer ─────────────────────────────────────────────────────────────

function SlideContent({
  slide,
  widgetProps,
}: {
  slide: ConfigSlide
  widgetProps: WidgetProps
}) {
  const heroNode   = slide.hero    ? buildWidgetNode(slide.hero, widgetProps) : null
  const normalNodes = slide.normals.filter(Boolean).map((id) => ({ id, node: buildWidgetNode(id, widgetProps) }))

  if (heroNode) {
    return (
      <div className="grid gap-4 pb-4 md:grid-cols-[360px_1fr] items-stretch">
        <div className="flex flex-col">{heroNode}</div>
        <div className="flex h-full flex-col gap-4">
          {normalNodes.map(({ id, node }) => (
            <div key={id} className="flex flex-1 flex-col overflow-hidden min-h-0">{node}</div>
          ))}
        </div>
      </div>
    )
  }

  const gridCols =
    normalNodes.length === 1 ? "grid-cols-1" :
    normalNodes.length === 2 ? "grid-cols-2" : "grid-cols-3"
  return (
    <div className={`grid gap-4 pb-4 ${gridCols} items-stretch`}>
      {normalNodes.map(({ id, node }) => (
        <div key={id} className="flex flex-col">{node}</div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TopCarousel() {
  const slides = STATIC_SLIDES
  const N = slides.length

  // Infinite carousel: render [lastClone, ...slides, firstClone]
  // visualIdx 0 = lastClone, 1..N = real slides, N+1 = firstClone
  const extSlides = N > 1 ? [slides[N - 1], ...slides, slides[0]] : slides
  const [visualIdx, setVisualIdx] = useState(N > 1 ? 1 : 0)
  const [jumping, setJumping] = useState(false)

  // The real slide index (for dots)
  const realIdx = N <= 1 ? 0 : visualIdx <= 0 ? N - 1 : visualIdx >= N + 1 ? 0 : visualIdx - 1

  // After a no-transition snap, re-enable transitions on the next frame
  useEffect(() => {
    if (!jumping) return
    const id = requestAnimationFrame(() => setJumping(false))
    return () => cancelAnimationFrame(id)
  }, [jumping])

  // ── Idle dimming ────────────────────────────────────────────────────────────
  const [idle, setIdle] = useState(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdle = useCallback(() => {
    setIdle(false)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), 15_000)
  }, [])

  useEffect(() => {
    resetIdle()
    return () => { if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [resetIdle])

  // Live data for widgets
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [boardMessages,  setBoardMessages]  = useState<BoardMessage[]>([
    {
      id: "demo-1",
      title: "Skolefest fredag d. 28. marts",
      content: "Kære elever og forældre — vi afholder vores årlige skolefest på fredag kl. 18.00 i gymnastiksalen. Der vil være musik, mad og masser af hygge. Alle er velkomne, og vi håber at se jer der!",
      priority: "normal",
      authorName: "Mette Andersen",
      createdAt: new Date().toISOString(),
    },
  ])
  const [drNewsItems,    setDrNewsItems]    = useState<DrNewsItem[]>([])
  const [departures,     setDepartures]     = useState<Departure[]>([])
  const [trafikPosts,    setTrafikPosts]    = useState<TrafikPost[]>([])

  const dailyDish      = useDailyDishData()
  const hasDishData    = Boolean(dailyDish)
  const isServingToday = Boolean(dailyDish?.servingToday)

  // ── Live data fetching ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    const loadCalendar = async () => {
      try {
        const res = await fetch("/api/calendar", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { events?: CalendarEvent[] }
        if (mounted && Array.isArray(data.events)) setCalendarEvents(data.events)
      } catch { /* keep snapshot */ }
    }
    const loadDrNews = async () => {
      try {
        const res = await fetch("/api/dr-news", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { items?: DrNewsItem[] }
        if (mounted && Array.isArray(data.items)) setDrNewsItems(data.items.slice(0, 3))
      } catch { /* keep snapshot */ }
    }
    const loadDepartures = async () => {
      try {
        const res = await fetch("/api/departures", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { groups?: { departures: Departure[] }[] }
        if (!mounted || !Array.isArray(data.groups)) return
        const all    = data.groups.flatMap((g) => g.departures ?? [])
        const active = all.filter((d) => !d.cancelled).slice(0, 3)
        setDepartures(active)
      } catch { /* keep snapshot */ }
    }
    const loadTrafik = async () => {
      try {
        const res = await fetch("/api/trafik", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { items?: TrafikPost[] }
        if (mounted && Array.isArray(data.items)) setTrafikPosts(data.items)
      } catch { /* keep snapshot */ }
    }

    void loadCalendar(); void loadDrNews(); void loadDepartures(); void loadTrafik()
    const calId  = setInterval(loadCalendar,  10 * 60 * 1000)
    const newsId = setInterval(loadDrNews,     5 * 60 * 1000)
    const depId  = setInterval(loadDepartures,     30 * 1000)
    const trafId = setInterval(loadTrafik,     2 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(calId); clearInterval(newsId); clearInterval(depId); clearInterval(trafId)
    }
  }, [])

  const widgetProps = useMemo<WidgetProps>(() => ({
    calendarEvents, boardMessages, drNewsItems, departures, trafikPosts,
    dailyDish, hasDishData, isServingToday,
  }), [calendarEvents, boardMessages, drNewsItems, departures, trafikPosts, dailyDish, hasDishData, isServingToday])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToPrevious = useCallback(() => {
    if (N <= 1) return
    resetIdle()
    setJumping(false)
    setVisualIdx((v) => v - 1)
  }, [N, resetIdle])

  const goToNext = useCallback(() => {
    if (N <= 1) return
    resetIdle()
    setJumping(false)
    setVisualIdx((v) => v + 1)
  }, [N, resetIdle])

  const goTo = useCallback((i: number) => {
    if (N <= 1) return
    resetIdle()
    setJumping(false)
    setVisualIdx(i + 1)
  }, [N, resetIdle])

  // After the slide animation ends, snap from clone to real slide (no transition)
  const handleTransitionEnd = useCallback(() => {
    if (N <= 1) return
    if (visualIdx >= N + 1) {
      setJumping(true)
      setVisualIdx(1)
    } else if (visualIdx <= 0) {
      setJumping(true)
      setVisualIdx(N)
    }
  }, [N, visualIdx])

  // ── Swipe ──────────────────────────────────────────────────────────────────
  const pointerStartX = useRef<number | null>(null)
  const pointerStartT = useRef<number>(0)
  const didSwipe      = useRef(false)
  const swipeDisabled = useRef(false)
  const [dragDelta, setDragDelta] = useState(0)

  const handlePointerCancel = useCallback(() => {
    pointerStartX.current = null; swipeDisabled.current = false; didSwipe.current = false; setDragDelta(0)
  }, [])
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (didSwipe.current) { e.stopPropagation(); e.preventDefault(); didSwipe.current = false }
  }, [])
  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return Boolean(target.closest("a,button,input,textarea,select,option,[role='button'],[data-no-swipe]"))
  }

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    if (N <= 1) return
    resetIdle()
    if (isInteractiveTarget(e.target)) { swipeDisabled.current = true; didSwipe.current = false; return }
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerStartX.current = e.clientX; pointerStartT.current = e.timeStamp
    didSwipe.current = false; swipeDisabled.current = false; setDragDelta(0)
  }, [N, resetIdle])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null || swipeDisabled.current) return
    const raw = e.clientX - pointerStartX.current
    if (Math.abs(raw) > SWIPE_CLICK_THRESHOLD) didSwipe.current = true
    setDragDelta(raw)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeDisabled.current) { swipeDisabled.current = false; pointerStartX.current = null; setDragDelta(0); return }
    if (pointerStartX.current === null) return
    const delta    = e.clientX - pointerStartX.current
    const elapsed  = e.timeStamp - pointerStartT.current
    const velocity = elapsed > 0 ? Math.abs(delta) / elapsed : 0
    pointerStartX.current = null; setDragDelta(0)
    resetIdle()
    const isFlick = velocity >= SWIPE_VELOCITY_THRESHOLD && Math.abs(delta) >= SWIPE_MIN_DISTANCE
    const isSweep = Math.abs(delta) >= window.innerWidth * 0.15
    if (isFlick || isSweep) {
      didSwipe.current = true
      setJumping(false)
      if (delta < 0) setVisualIdx((v) => v + 1)
      else           setVisualIdx((v) => v - 1)
    } else {
      if (Math.abs(delta) <= SWIPE_CLICK_THRESHOLD) didSwipe.current = false
    }
  }, [resetIdle])

  const ctrlOpacity = idle ? 0.15 : 1
  const ctrlTransition = "opacity 800ms ease"

  return (
    <div className="relative px-16">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="relative flex items-center">

          {/* Prev */}
          <button
            onClick={goToPrevious}
            className="absolute -left-20 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/[0.08] active:scale-90"
            style={{ background: C5, border: `1px solid ${C3}`, boxShadow: "0 4px 12px rgba(0,0,0,0.35)", opacity: ctrlOpacity, transition: ctrlTransition }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: C2 }} />
          </button>

          {/* Viewport */}
          <div
            className="w-full select-none"
            style={{ overflowX: "clip", cursor: dragDelta !== 0 ? "grabbing" : "grab", touchAction: "pan-y" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClickCapture={handleClickCapture}
            onDragStart={(e) => e.preventDefault()}
          >
            <div
              className="flex"
              style={{
                transform: `translateX(calc(-${visualIdx * 100}% + ${dragDelta}px))`,
                transition: jumping || dragDelta !== 0 ? "none" : "transform 320ms cubic-bezier(0.25,0.46,0.45,0.94)",
                willChange: "transform",
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extSlides.map((slide, i) => (
                <div key={`${slide.id}-${i}`} className="w-full shrink-0">
                  <SlideContent slide={slide} widgetProps={widgetProps} />
                </div>
              ))}
            </div>
          </div>

          {/* Next */}
          <button
            onClick={goToNext}
            className="absolute -right-20 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/[0.08] active:scale-90"
            style={{ background: C5, border: `1px solid ${C3}`, boxShadow: "0 4px 12px rgba(0,0,0,0.35)", opacity: ctrlOpacity, transition: ctrlTransition }}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" style={{ color: C2 }} />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="mt-3 flex justify-center gap-2" style={{ opacity: ctrlOpacity, transition: ctrlTransition }}>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                height: "6px",
                width: i === realIdx ? "22px" : "6px",
                borderRadius: "9999px",
                background: i === realIdx ? C1 : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
