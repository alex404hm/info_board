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
  { id: "slide-1", hero: "canteen",  normals: ["calendar", "messages"] },
  { id: "slide-2", hero: null,       normals: ["dr-news", "transport", "traffic"] },
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
        <div className="flex h-full flex-col overflow-hidden rounded-xl" style={card}>
          <div className="p-4 pb-3 shrink-0">
            <div className="mb-2 flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <Image src="/logo/kanpla.png" alt="Kanpla" width={18} height={18} className="h-full w-full rounded-[3px] object-fill" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Kantine · Dagens ret</p>
            </div>
            <p className="text-xl font-bold leading-snug" style={{ color: C1 }}>
              {hasDishData ? decodeHtmlEntities(dailyDish?.name ?? "Ingen ret i dag") : "Henter dagens ret…"}
            </p>
            {isServingToday ? (
              <span className="badge-accent mt-2 inline-flex w-fit items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Serveres i dag
              </span>
            ) : dailyDish?.nextDishName ? (
              <p className="mt-1.5 text-xs" style={{ color: C2 }}>
                Næste: <span className="font-medium" style={{ color: C1 }}>{decodeHtmlEntities(dailyDish.nextDishName)}</span>
                {dailyDish.nextDishDateLabel ? ` · ${dailyDish.nextDishDateLabel}` : ""}
              </p>
            ) : null}
          </div>
          <div className="relative mx-3 mb-3 flex-1 min-h-[120px] overflow-hidden rounded-lg" style={{ background: C4, border: `1px solid ${C3}` }}>
            {isServingToday && dailyDish?.imageUrl ? (
              <Image src={dailyDish.imageUrl} alt={dailyDish.name || "Dagens ret"} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-28 w-28 opacity-50"><FoodIllustration /></div>
              </div>
            )}
          </div>
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
        p === "urgent" ? { dot: "bg-red-500",    border: "var(--status-critical-border)", label: "Akut",  labelCls: "bg-red-500/15 text-red-400" }
        : p === "high" ? { dot: "bg-orange-500", border: "var(--status-high-border)",     label: "Vigtig", labelCls: "bg-orange-500/15 text-orange-400" }
        :                { dot: "bg-violet-500", border: C3,                               label: null,    labelCls: "" }
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl p-4" style={card}>
          {/* Header */}
          <div className="mb-3 flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 shrink-0">
              <MessageSquare className="h-4 w-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Beskeder</p>
              <p className="truncate text-sm font-semibold" style={{ color: C1 }}>Meddelelser fra skolen</p>
            </div>
            {boardMessages.length > 0 && (
              <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                {boardMessages.length}
              </span>
            )}
          </div>

          {/* Message list */}
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
            {boardMessages.length > 0 ? (
              boardMessages.slice(0, 3).map((msg) => {
                const meta = priorityMeta(msg.priority)
                return (
                  <div key={msg.id} className="flex min-w-0 items-start gap-2.5 rounded-lg px-3 py-2.5"
                    style={{ background: C4, border: `1px solid ${meta.border}`, flexShrink: 0 }}>
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug" style={{ color: C1 }}>
                          {msg.title}
                        </p>
                        {meta.label && (
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${meta.labelCls}`}>
                            {meta.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs leading-snug" style={{ color: C2 }}>{msg.content}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                  <MessageSquare className="h-5 w-5 opacity-40" style={{ color: C2 }} />
                </div>
                <p className="text-xs font-medium" style={{ color: C3 }}>Ingen aktive meddelelser</p>
              </div>
            )}
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
      <div className="grid gap-4 pb-4 md:grid-cols-[1fr_340px] items-stretch">
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
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = STATIC_SLIDES

  // Live data for widgets
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [boardMessages,  setBoardMessages]  = useState<BoardMessage[]>([])
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
    const loadMessages = async () => {
      try {
        const res = await fetch("/api/messages", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as BoardMessage[]
        if (mounted && Array.isArray(data)) setBoardMessages(data)
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

    void loadCalendar(); void loadMessages(); void loadDrNews(); void loadDepartures(); void loadTrafik()
    const calId  = setInterval(loadCalendar,  10 * 60 * 1000)
    const msgId  = setInterval(loadMessages,   5 * 60 * 1000)
    const newsId = setInterval(loadDrNews,     5 * 60 * 1000)
    const depId  = setInterval(loadDepartures,     30 * 1000)
    const trafId = setInterval(loadTrafik,     2 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(calId); clearInterval(msgId); clearInterval(newsId); clearInterval(depId); clearInterval(trafId)
    }
  }, [])

  const widgetProps = useMemo<WidgetProps>(() => ({
    calendarEvents, boardMessages, drNewsItems, departures, trafikPosts,
    dailyDish, hasDishData, isServingToday,
  }), [calendarEvents, boardMessages, drNewsItems, departures, trafikPosts, dailyDish, hasDishData, isServingToday])

  const slideCount = slides.length

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

  useEffect(() => {
    if (slideCount > 0 && currentSlide >= slideCount) setCurrentSlide(slideCount - 1)
  }, [slideCount, currentSlide])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToPrevious = useCallback(() => {
    if (!slideCount) return
    setCurrentSlide((p) => (p - 1 + slideCount) % slideCount)
  }, [slideCount])

  const goToNext = useCallback(() => {
    if (!slideCount) return
    setCurrentSlide((p) => (p + 1) % slideCount)
  }, [slideCount])

  const goTo = useCallback((i: number) => {
    setCurrentSlide(i)
  }, [])

  // ── Pointer / swipe ────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    if (slideCount <= 1) return
    if (isInteractiveTarget(e.target)) { swipeDisabled.current = true; didSwipe.current = false; return }
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerStartX.current = e.clientX; pointerStartT.current = e.timeStamp
    didSwipe.current = false; swipeDisabled.current = false; setDragDelta(0)
  }, [slideCount])

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
    const isFlick = velocity >= SWIPE_VELOCITY_THRESHOLD && Math.abs(delta) >= SWIPE_MIN_DISTANCE
    const isSweep = Math.abs(delta) >= window.innerWidth * 0.15
    if (isFlick || isSweep) {
      didSwipe.current = true
      if (delta < 0) setCurrentSlide((p) => (p + 1) % slideCount)
      else           setCurrentSlide((p) => (p - 1 + slideCount) % slideCount)
    } else {
      if (Math.abs(delta) <= SWIPE_CLICK_THRESHOLD) didSwipe.current = false
    }
  }, [slideCount])

  return (
    <div className="relative px-16">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="relative flex items-center">

          {/* Prev */}
          <button
            onClick={goToPrevious}
            className="absolute -left-20 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-150 hover:bg-white/[0.08] active:scale-90"
            style={{ background: C5, border: `1px solid ${C3}`, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}
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
                transform: `translateX(calc(-${currentSlide * 100}% + ${dragDelta}px))`,
                transition: dragDelta !== 0 ? "none" : "transform 320ms cubic-bezier(0.25,0.46,0.45,0.94)",
                willChange: "transform",
              }}
            >
              {slides.map((slide) => (
                <div key={slide.id} className="w-full shrink-0">
                  <SlideContent slide={slide} widgetProps={widgetProps} />
                </div>
              ))}
            </div>
          </div>

          {/* Next */}
          <button
            onClick={goToNext}
            className="absolute -right-20 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-150 hover:bg-white/[0.08] active:scale-90"
            style={{ background: C5, border: `1px solid ${C3}`, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" style={{ color: C2 }} />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                height: "6px",
                width: i === currentSlide ? "22px" : "6px",
                borderRadius: "9999px",
                background: i === currentSlide ? C1 : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
