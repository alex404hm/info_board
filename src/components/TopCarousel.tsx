"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useDailyDishData } from "@/hooks/use-api-data"
import { decodeHtmlEntities, lineBadgeStyle } from "@/lib/utils"
import type { Departure, DrNewsItem, DrNewsApiResponse } from "@/types"
import type { TrafikPost } from "@/app/api/trafik/route"

const SWIPE_VELOCITY_THRESHOLD = 0.3
const SWIPE_MIN_DISTANCE = 10
const SWIPE_CLICK_THRESHOLD = 10

const C1 = "var(--foreground)"
const C2 = "var(--foreground-muted)"
const C3 = "var(--surface-border)"
const C4 = "var(--surface-soft)"
const C5 = "var(--surface)"

const card    = { background: C5, border: `1px solid ${C3}`, boxShadow: "none" } as const
const rowItem = { background: C4, border: `1px solid ${C3}` } as const
const linkBtn = { background: "var(--accent-soft)", border: "1px solid var(--accent-border)", color: "var(--accent)" } as const

type CalendarEvent = { id: string; title: string; start: string; end: string | null; allDay: boolean; category?: string | null; location?: string | null }
type ModuleId = "canteen" | "calendar" | "transport" | "traffic" | "weather" | "news"

interface ConfigSlide {
  id: string
  hero: ModuleId | null
  normals: ModuleId[]
}

const STATIC_SLIDES: ConfigSlide[] = [
  { id: "slide-1", hero: null, normals: ["canteen", "calendar"] },
  { id: "slide-2", hero: null, normals: ["news", "transport", "traffic"] },
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
  departures: Departure[]
  trafikPosts: TrafikPost[]
  dailyDish: ReturnType<typeof useDailyDishData>
  hasDishData: boolean
  isServingToday: boolean
  drNewsItems: DrNewsItem[]
}

function buildWidgetNode(id: ModuleId, props: WidgetProps): React.ReactNode {
  const { calendarEvents, departures, trafikPosts, dailyDish, hasDishData, isServingToday, drNewsItems } = props

  switch (id) {
    case "canteen": {
      const weekMenu = dailyDish?.weekMenu ?? []
      const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" }).format(new Date())
      const todayRegular = hasDishData ? (dailyDish?.regular ?? null) : null
      const todayVegan   = hasDishData ? (dailyDish?.vegetarian ?? null) : null
      return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: "var(--surface-alt)", border: `1px solid ${C3}` }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
              <Image src="/logo/kanpla.png" alt="Kanpla" width={20} height={20} className="h-full w-full rounded-[3px] object-fill" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none" style={{ color: C2 }}>Kantine</p>
              <p className="text-[15px] font-bold leading-tight mt-0.5" style={{ color: C1 }}>Dagens ret</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0 flex-col px-3 pb-3 pt-3 gap-2">

            {/* Today's dishes */}
            {!hasDishData ? (
              <p className="text-sm px-1" style={{ color: C2 }}>Henter dagens ret…</p>
            ) : (
              <div className="flex flex-col gap-2 shrink-0">
                {(todayRegular || todayVegan) ? (
                  /* One box, vertical line in the middle */
                  <div className="flex items-stretch rounded-lg overflow-hidden shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {/* Left – regular */}
                    {todayRegular && (
                      <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-4 overflow-hidden">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] leading-none mb-2 truncate"
                          style={{ color: "#f09458" }}>
                          Dagens ret
                        </p>
                        <p className="text-[15px] font-bold leading-snug truncate" style={{ color: "#ffffff" }}>
                          {decodeHtmlEntities(todayRegular.dishName || "Ingen ret i dag")}
                        </p>
                      </div>
                    )}
                    {/* Vertical divider — inset top/bottom via margin */}
                    {todayRegular && todayVegan && (
                      <div className="self-stretch shrink-0 w-px my-3 rounded-full" style={{ background: "rgba(255,255,255,0.13)" }} />
                    )}
                    {/* Right – vegan */}
                    {todayVegan && (
                      <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-4 overflow-hidden">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] leading-none mb-2 truncate"
                          style={{ color: "#52c484" }}>
                          Grøn ret
                        </p>
                        <p className="text-[15px] font-bold leading-snug truncate" style={{ color: "#ffffff" }}>
                          {decodeHtmlEntities(todayVegan.dishName || "Ingen grøn ret i dag")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback */
                  <div className="flex items-stretch rounded-lg overflow-hidden shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex-1 min-w-0 px-4 py-4 overflow-hidden">
                      <p className="text-[15px] font-bold leading-snug truncate" style={{ color: "#ffffff" }}>
                        {decodeHtmlEntities(dailyDish?.name ?? "Ingen ret i dag")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weekly menu — desktop only */}
            {weekMenu.length > 0 && (
              <div className="hidden sm:contents">
                <div className="shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }} />
                <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Ugens menu
                </p>
                <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
                  {weekMenu.filter(item => item.dateKey > todayKey).map((item) => (
                    <div key={item.dateKey}
                      className="flex items-stretch rounded-lg overflow-hidden"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid transparent",
                      }}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2">
                        <span className="w-7 shrink-0 text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.50)" }}>
                          {item.dayLabel}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium leading-snug" style={{ color: "rgba(255,255,255,0.65)" }}>
                            {decodeHtmlEntities(item.regular?.dishName ?? item.dishName)}
                          </p>
                          {item.vegetarian?.dishName && (
                            <p className="truncate text-[11px] leading-snug" style={{ color: "rgba(82,196,132,0.55)" }}>
                              {decodeHtmlEntities(item.vegetarian.dishName)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    case "calendar": {
      const now       = new Date()
      const todayD    = now.getDate()
      const thisMonth = now.getMonth()
      const thisYear  = now.getFullYear()

      const monthNames  = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"]
      const dayInitials = ["M","T","O","T","F","L","S"]

      const firstDayDow = (new Date(thisYear, thisMonth, 1).getDay() + 6) % 7
      const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate()

      const catColor = (cat?: string | null): string => {
        switch ((cat ?? "").toLowerCase()) {
          case "skole":     return "#3b82f6"
          case "workshop":  return "#8b5cf6"
          case "fagligt":   return "#10b981"
          case "praktik":   return "#f59e0b"
          case "socialt":   return "#ec4899"
          case "studie":    return "#14b8a6"
          case "helligdag": return "#f43f5e"
          case "ferie":     return "#fb923c"
          default:          return "#60a5fa"
        }
      }

      // Map each calendar day → its event colors (for dots)
      const dayColors = new Map<number, string>()
      calendarEvents.forEach(ev => {
        const d = new Date(ev.start)
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
          if (!dayColors.has(d.getDate())) dayColors.set(d.getDate(), catColor(ev.category))
        }
      })

      const cells: (number | null)[] = [
        ...Array(firstDayDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
      ]

      // Relative date label
      const relLabel = (d: Date): string => {
        const dd = d.getDate(), mm = d.getMonth(), yy = d.getFullYear()
        if (dd === todayD && mm === thisMonth && yy === thisYear) return "I dag"
        const tom = new Date(now); tom.setDate(todayD + 1)
        if (dd === tom.getDate() && mm === tom.getMonth() && yy === tom.getFullYear()) return "I morgen"
        return d.toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" })
      }

      const todayMidnight = new Date()
      todayMidnight.setHours(0, 0, 0, 0)

      const upcoming = calendarEvents
        .filter(ev => { const d = new Date(ev.start); return !isNaN(d.getTime()) && d >= todayMidnight })
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 5)

      const fmtTime = (iso: string) =>
        new Date(iso).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })

      return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl" style={card}>

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0" style={{ borderBottom: `1px solid ${C3}` }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 shrink-0">
              <Calendar className="h-[18px] w-[18px]" style={{ color: "#a78bfa" }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] leading-none" style={{ color: "var(--foreground-muted)" }}>Kalender</p>
              <p className="text-[15px] font-bold leading-tight mt-0.5" style={{ color: C1 }}>
                {monthNames[thisMonth]} {thisYear}
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 min-h-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-3 gap-4 sm:gap-5">

            {/* Left: mini calendar — hidden on mobile */}
            <div className="hidden sm:flex flex-col shrink-0" style={{ width: 248 }}>
              {/* DOW row */}
              <div className="grid grid-cols-7 mb-1">
                {dayInitials.map((ltr, i) => (
                  <div key={i} className="flex items-center justify-center h-6">
                    <span className="text-[9px] font-bold uppercase" style={{ color: "var(--accent)", opacity: 0.5 }}>{ltr}</span>
                  </div>
                ))}
              </div>
              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, i) => {
                  if (day === null) return <div key={i} className="h-8" />
                  const isToday  = day === todayD
                  const isPast   = day < todayD
                  const dotColor = dayColors.get(day)
                  return (
                    <div key={i} className="flex flex-col items-center justify-center h-8">
                      <span
                        className="flex items-center justify-center rounded-full text-[11px] leading-none"
                        style={{
                          width: 26, height: 26,
                          background: isToday ? "var(--accent)" : "transparent",
                          color: isToday ? "#fff" : isPast ? "rgba(255,255,255,0.2)" : C1,
                          fontWeight: isToday ? 700 : isPast ? 400 : 500,
                        }}
                      >
                        {day}
                      </span>
                      {dotColor && !isToday && (
                        <span className="rounded-full mt-px" style={{ width: 3, height: 3, background: dotColor, opacity: 0.8 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: event table */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden justify-start">
              {upcoming.length > 0 ? (
                <div className="flex flex-col gap-0 overflow-hidden">
                  {upcoming.map((ev, idx) => {
                    const d        = new Date(ev.start)
                    const color    = catColor(ev.category)
                    const label    = relLabel(d)
                    const isToday  = label === "I dag"
                    const timeFrom = fmtTime(ev.start)
                    const timeTo   = ev.end ? fmtTime(ev.end) : null
                    const timeStr  = ev.allDay ? "Hele dagen" : timeTo ? `${timeFrom}–${timeTo}` : timeFrom
                    return (
                      <div key={ev.id}>
                        {idx > 0 && (
                          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
                        )}
                        <div className="flex items-center gap-2.5 py-2 px-1">
                          {/* Color dot */}
                          <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, background: color, opacity: isToday ? 1 : 0.7, flexShrink: 0 }} />
                          {/* Title */}
                          <p className="flex-1 min-w-0 truncate text-[11px] font-medium leading-none" style={{ color: isToday ? "#ffffff" : C2 }}>
                            {decodeHtmlEntities(ev.title)}
                          </p>
                        </div>
                        {/* Date + time row */}
                        <div className="flex items-center gap-2.5 pb-1.5 px-1" style={{ marginTop: -4 }}>
                          <span style={{ width: 6, flexShrink: 0 }} />
                          <p className="text-[9px] tabular-nums leading-none" style={{ color: isToday ? color : "rgba(255,255,255,0.32)" }}>
                            {label} · {timeStr}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-[10px]" style={{ color: C3 }}>Ingen kommende begivenheder</p>
                </div>
              )}
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
                    <div className="shrink-0 text-right">
                      <span className="block text-[10px] tabular-nums font-semibold"
                        style={{ color: dep.delayMin > 0 ? "var(--destructive)" : C2 }}>{dep.time}</span>
                      <span className="block text-[9px] tabular-nums" style={{ color: C3 }}>om {dep.minutesUntil} min</span>
                    </div>
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

    case "news": {
      const newsItems = drNewsItems.slice(0, 4)
      return (
        <div className="flex h-full flex-col rounded-xl p-4" style={card}>
          <div className="mb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 shrink-0">
                <Image src="/logo/dr-news.svg" alt="DR Nyheder" width={20} height={20} className="h-full w-full rounded-[3px] object-fill" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Seneste nyheder</p>
            </div>
            <Link href="/nyheder" className="text-[10px] font-medium" style={{ color: "var(--accent)" }}>
              Alle →
            </Link>
          </div>
          <div className="flex-1 space-y-1 overflow-hidden">
            {newsItems.length > 0 ? (
              newsItems.map((item, i) => {
                const ts = item.pubDate ? new Date(item.pubDate).getTime() : 0
                const diffMins = ts ? Math.floor((Date.now() - ts) / 60000) : null
                const timeLabel = diffMins === null ? "" : diffMins < 60 ? `${diffMins} min` : `${Math.floor(diffMins / 60)} t`
                return (
                  <div key={`${item.link}-${i}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5" style={rowItem}>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <p className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: C1 }}>
                      {decodeHtmlEntities(item.title)}
                    </p>
                    {timeLabel && (
                      <span className="shrink-0 text-[9px] font-medium tabular-nums" style={{ color: C3 }}>{timeLabel}</span>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="py-2 text-center text-[10px]" style={{ color: C3 }}>Henter nyheder…</p>
            )}
          </div>
        </div>
      )
    }

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
  const normalNodes = slide.normals.filter(Boolean).map((id) => ({ id, node: buildWidgetNode(id, widgetProps) })).filter(({ node }) => node !== null)

  if (heroNode) {
    return (
      <div className="grid gap-3 pb-3 sm:gap-4 sm:pb-4 md:grid-cols-[360px_1fr] items-stretch">
        <div className="flex flex-col">{heroNode}</div>
        <div className="flex h-full flex-col gap-3 sm:gap-4">
          {normalNodes.map(({ id, node }) => (
            <div key={id} className="flex flex-1 flex-col overflow-hidden min-h-0">{node}</div>
          ))}
        </div>
      </div>
    )
  }

  const gridCols =
    normalNodes.length === 1 ? "grid-cols-1" :
    normalNodes.length === 2 ? "grid-cols-1 min-[480px]:grid-cols-2" :
    "grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3"
  return (
    <div className={`grid gap-3 pb-3 sm:gap-4 sm:pb-4 ${gridCols} items-stretch`}>
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
  const [departures,     setDepartures]     = useState<Departure[]>([])
  const [trafikPosts,    setTrafikPosts]    = useState<TrafikPost[]>([])
  const [drNewsItems,    setDrNewsItems]    = useState<DrNewsItem[]>([])

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

    const loadDrNews = async () => {
      try {
        const res = await fetch("/api/dr-news", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as DrNewsApiResponse
        if (mounted && Array.isArray(data.items)) setDrNewsItems(data.items)
      } catch { /* keep snapshot */ }
    }

    void loadCalendar(); void loadDepartures(); void loadTrafik(); void loadDrNews()
    const calId   = setInterval(loadCalendar,  10 * 60 * 1000)
    const depId   = setInterval(loadDepartures,     30 * 1000)
    const trafId  = setInterval(loadTrafik,     2 * 60 * 1000)
    const newsId  = setInterval(loadDrNews,    10 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(calId); clearInterval(depId); clearInterval(trafId); clearInterval(newsId)
    }
  }, [])

  const widgetProps = useMemo<WidgetProps>(() => ({
    calendarEvents, departures, trafikPosts,
    dailyDish, hasDishData, isServingToday,
    drNewsItems,
  }), [calendarEvents, departures, trafikPosts, dailyDish, hasDishData, isServingToday, drNewsItems])

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

  return (
    <div className="relative sm:px-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="relative flex items-center">

          {/* Prev — sits outside the viewport in the side padding zone */}
          <button
            onClick={goToPrevious}
            className="absolute -left-20 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/[0.10] active:scale-90"
            style={{ background: C5, border: `1px solid ${C3}`, boxShadow: "0 6px 20px rgba(0,0,0,0.50)" }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" style={{ color: C2 }} />
          </button>

          {/* Viewport — fills full width between the padding zones */}
          <div
            className="w-full select-none"
            style={{ overflow: "hidden", cursor: dragDelta !== 0 ? "grabbing" : "grab", touchAction: "pan-y" }}
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
                <div key={`${slide.id}-${i}`} className="w-full shrink-0 overflow-hidden px-1 sm:px-3">
                  <SlideContent slide={slide} widgetProps={widgetProps} />
                </div>
              ))}
            </div>
          </div>

          {/* Next — sits outside the viewport in the side padding zone */}
          <button
            onClick={goToNext}
            className="absolute -right-20 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/[0.10] active:scale-90"
            style={{ background: C5, border: `1px solid ${C3}`, boxShadow: "0 6px 20px rgba(0,0,0,0.50)" }}
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
