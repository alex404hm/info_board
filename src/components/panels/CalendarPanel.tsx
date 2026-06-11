"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { apiFetch } from "@/lib/api-fetch"
import {
  Clock3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string | null
  allDay: boolean
  location: string | null
  description: string | null
  category: string | null
}

const DAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]
const MONTHS = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December",
]

// Category styles — pill class for the event label, bar color for the cell accent
const CAT: Record<string, { dot: string; pill: string }> = {
  Skole:     { dot: "bg-blue-400",    pill: "bg-blue-500/20 text-blue-200" },
  Workshop:  { dot: "bg-violet-400",  pill: "bg-violet-500/20 text-violet-200" },
  Fagligt:   { dot: "bg-emerald-400", pill: "bg-emerald-500/20 text-emerald-200" },
  Praktik:   { dot: "bg-orange-400",  pill: "bg-orange-500/20 text-orange-200" },
  Socialt:   { dot: "bg-pink-400",    pill: "bg-pink-500/20 text-pink-200" },
  Studie:    { dot: "bg-teal-400",    pill: "bg-teal-500/20 text-teal-200" },
  Helligdag: { dot: "bg-rose-400",    pill: "bg-rose-500/20 text-rose-200" },
  Ferie:     { dot: "bg-amber-400",   pill: "bg-amber-500/20 text-amber-200" },
}
const DEF = { dot: "bg-slate-400", pill: "bg-white/10 text-slate-300" }
const catStyle = (c: string | null) => CAT[c ?? ""] ?? DEF

// CSS color values for the per-cell top accent bar
const BAR_COLOR: Record<string, string> = {
  Skole:     "#60a5fa",
  Workshop:  "#a78bfa",
  Fagligt:   "#34d399",
  Praktik:   "#fb923c",
  Socialt:   "#f472b6",
  Studie:    "#2dd4bf",
  Helligdag: "#fb7185",
  Ferie:     "#fbbf24",
}
const barColor = (c: string | null) => BAR_COLOR[c ?? ""] ?? "#94a3b8"

function cells(y: number, m: number) {
  const first = (new Date(y, m, 1).getDay() + 6) % 7
  const dim = new Date(y, m + 1, 0).getDate()
  const arr: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ]
  while (arr.length % 7) arr.push(null)
  return arr
}

function onDay(ev: CalendarEvent, y: number, m: number, d: number) {
  const start = new Date(ev.start)
  if (isNaN(start.getTime())) return false
  start.setHours(0, 0, 0, 0)
  const cell = new Date(y, m, d)
  if (ev.end) {
    const end = new Date(ev.end)
    end.setHours(0, 0, 0, 0)
    return cell >= start && cell <= end
  }
  return start.getFullYear() === y && start.getMonth() === m && start.getDate() === d
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
}

function daysUntil(iso: string) {
  const eventDate = new Date(iso)
  if (isNaN(eventDate.getTime())) return Number.POSITIVE_INFINITY
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)
  return Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function EventRow({ ev, isEventToday }: { ev: CalendarEvent; isEventToday: (ev: CalendarEvent) => boolean }) {
  const col = catStyle(ev.category)
  const today = isEventToday(ev)
  const days = daysUntil(ev.start)
  const isSoon = days > 0 && days <= 5
  const dateStr = new Date(ev.start).toLocaleDateString("da-DK", { day: "numeric", month: "short" })

  return (
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-white/3 hover:bg-white/6 transition-colors">
      {/* Category dot – pings on today */}
      <div className="relative shrink-0 flex items-center justify-center">
        <span className={cn("block h-2.5 w-2.5 rounded-full shrink-0", col.dot)} />
        {today && (
          <span className={cn("absolute h-2.5 w-2.5 rounded-full animate-ping opacity-50", col.dot)} />
        )}
      </div>

      {/* Title + location */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate text-[14px] font-semibold leading-snug",
          today ? "text-white" : isSoon ? "text-slate-100" : "text-slate-200",
        )}>
          {ev.title}
        </p>
        {ev.location && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            {ev.location}
          </p>
        )}
      </div>

      {/* Right side – date badge + time */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        {today ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[12px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            I dag
          </span>
        ) : isSoon ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[12px] font-bold text-amber-300">
            <Clock3 className="h-3 w-3" />
            Om {days} {days === 1 ? "dag" : "dage"}
          </span>
        ) : (
          <span className="text-[12px] font-semibold tabular-nums text-slate-400">{dateStr}</span>
        )}
        {!ev.allDay && (
          <span className="text-[10px] tabular-nums text-slate-500">{fmtTime(ev.start)}</span>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-3 pb-1.5 first:pt-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <span className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] font-bold tabular-nums text-slate-600">{count}</span>
    </div>
  )
}

function UpcomingList({ events, isEventToday }: { events: CalendarEvent[]; isEventToday: (ev: CalendarEvent) => boolean }) {
  const todayEvts = events.filter((e) => isEventToday(e))
  const soonEvts  = events.filter((e) => { const d = daysUntil(e.start); return !isEventToday(e) && d > 0 && d <= 5 })
  const laterEvts = events.filter((e) => !isEventToday(e) && daysUntil(e.start) > 5)

  return (
    <div className="space-y-0.5">
      {todayEvts.length > 0 && (
        <>
          <SectionHeader label="I dag" count={todayEvts.length} />
          <div className="space-y-1.5">
            {todayEvts.map((ev) => <EventRow key={ev.id} ev={ev} isEventToday={isEventToday} />)}
          </div>
        </>
      )}
      {soonEvts.length > 0 && (
        <>
          <SectionHeader label="Inden for 5 dage" count={soonEvts.length} />
          <div className="space-y-1.5">
            {soonEvts.map((ev) => <EventRow key={ev.id} ev={ev} isEventToday={isEventToday} />)}
          </div>
        </>
      )}
      {laterEvts.length > 0 && (
        <>
          <SectionHeader label="Senere i måneden" count={laterEvts.length} />
          <div className="space-y-1.5">
            {laterEvts.map((ev) => <EventRow key={ev.id} ev={ev} isEventToday={isEventToday} />)}
          </div>
        </>
      )}
    </div>
  )
}

export function CalendarPanel() {
  const now = new Date()
  const [vy, setVY] = useState(now.getFullYear())
  const [vm, setVM] = useState(now.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = () =>
      apiFetch("/api/calendar")
        .then((r) => r.json())
        .then((d) => { if (mounted) setEvents(Array.isArray(d.events) ? d.events : []) })
        .catch(() => {})
        .finally(() => { if (mounted) setLoading(false) })
    void load()
    const id = setInterval(load, 2 * 60 * 1000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const prev = () => vm === 0 ? (setVM(11), setVY((y) => y - 1)) : setVM((m) => m - 1)
  const next = () => vm === 11 ? (setVM(0), setVY((y) => y + 1)) : setVM((m) => m + 1)

  const grid = cells(vy, vm)
  const isToday  = (d: number) => d === now.getDate() && vm === now.getMonth() && vy === now.getFullYear()
  const evtsOn   = (d: number) => events.filter((e) => onDay(e, vy, vm, d))

  const upcoming = (() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const limit = new Date(t); limit.setDate(limit.getDate() + 30)
    return events
      .filter((e) => {
        const start = new Date(e.start)
        if (isNaN(start.getTime())) return false
        if (e.end) {
          const end = new Date(e.end); end.setHours(0, 0, 0, 0)
          return end >= t && start < limit
        }
        return start >= t && start < limit
      })
      .sort((a, b) => a.start.localeCompare(b.start))
  })()

  const isEventToday = (ev: CalendarEvent) => {
    const start = new Date(ev.start); start.setHours(0, 0, 0, 0)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    if (ev.end) {
      const end = new Date(ev.end); end.setHours(0, 0, 0, 0)
      return start <= t && end >= t
    }
    return start.getTime() === t.getTime()
  }

  return (
    // flex-1 fills the fillHeight content wrapper; min-h-0 prevents grid blowout
    <div className="grid gap-5 grid-cols-[1fr_310px] flex-1 min-h-0">

      {/* ── Calendar card ────────────────────────────────────────────── */}
      <div className="surface-panel flex flex-col overflow-hidden min-h-0">

        {/* Month nav header */}
        <div className="flex items-center justify-between border-b border-light px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <button
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/8 active:scale-95 text-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/8 active:scale-95 text-muted"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {MONTHS[vm]}{" "}
              <span style={{ color: "var(--foreground-muted)" }}>{vy}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 shrink-0">
              <Image src="/logo/outlook.svg" alt="Outlook" width={20} height={20} className="h-full w-full rounded-[3px] object-fill" />
            </div>
          </div>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-light shrink-0">
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                "py-3 text-center text-[11px] font-bold uppercase tracking-widest",
                // Weekends: visibly dimmer than weekdays but still legible
                i >= 5 ? "text-slate-500" : "text-slate-400",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells — flex-1 fills remaining card height; gridAutoRows distributes equally */}
        <div
          className="grid grid-cols-7 flex-1 min-h-0 overflow-hidden"
          style={{ gridAutoRows: "1fr" }}
        >
          {grid.map((day, i) => {
            const isLastRow  = i >= grid.length - 7
            const isRightEdge = (i + 1) % 7 === 0
            const isWeekend  = i % 7 >= 5
            const de         = day ? evtsOn(day) : []
            const isT        = day ? isToday(day) : false
            const hasEvents  = de.length > 0

            return (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden p-2 border-light",
                  !isLastRow  && "border-b",
                  !isRightEdge && "border-r",
                  !day        && "pointer-events-none",
                  // Today: subtle green tint behind the whole cell
                  isT         && "bg-emerald-500/[0.07]",
                  // Weekend (non-today): very slight darkening
                  isWeekend   && !isT && "bg-black/[0.06]",
                  // Cells with events (non-today): faint surface-alt background
                  hasEvents   && !isT && "bg-white/[0.03]",
                )}
              >
                {day && (
                  <>
                    {/* Colored top accent bar — only on cells with events */}
                    {hasEvents && (
                      <div
                        className="absolute top-0 left-0 right-0"
                        style={{
                          height: 3,
                          background: barColor(de[0].category),
                          opacity: isT ? 0 : 0.75,
                        }}
                      />
                    )}

                    {/* Day number */}
                    <div className="mb-1 pl-1">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] tabular-nums",
                          isT
                            ? "bg-emerald-500 font-bold text-white shadow-sm shadow-emerald-500/30"
                            // Weekends: readable but clearly dimmer than weekdays
                            : isWeekend
                              ? "text-slate-400 font-medium"
                              : "text-slate-200 font-semibold",
                        )}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Event pills */}
                    <div className="space-y-0.5 overflow-hidden">
                      {de.slice(0, 2).map((ev) => {
                        const col = catStyle(ev.category)
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              "flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold leading-none overflow-hidden",
                              col.pill,
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", col.dot)} />
                            <span className="min-w-0 truncate">{ev.title}</span>
                          </div>
                        )
                      })}
                      {de.length > 2 && (
                        <p className="px-1.5 text-[10px] font-semibold" style={{ color: "var(--foreground-muted)" }}>
                          +{de.length - 2} mere
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Upcoming 30 days ─────────────────────────────────────────── */}
      <div className="surface-panel flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center gap-2.5 border-b border-light px-5 py-4 shrink-0">
          <CalendarDays className="h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
          <p className="flex-1 text-[14px] font-bold" style={{ color: "var(--foreground)" }}>
            Kommende 30 dage
          </p>
          {upcoming.length > 0 && (
            <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-400">
              {upcoming.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Henter...
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <CalendarDays className="h-7 w-7 text-slate-700" />
              <p className="text-[13px] text-slate-600">Ingen kommende begivenheder</p>
            </div>
          ) : (
            <UpcomingList events={upcoming} isEventToday={isEventToday} />
          )}
        </div>
      </div>
    </div>
  )
}
