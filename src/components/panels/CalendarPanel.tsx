"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
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

const DAYS   = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"]
const MONTHS = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December",
]

// Category colours — pill for grid chips, bar for hero stripe, rgb for gradients
const CAT: Record<string, { dot: string; pill: string; bar: string }> = {
  Skole:     { dot: "bg-blue-400",    pill: "bg-blue-500/15 text-blue-300",       bar: "bg-blue-500"    },
  Workshop:  { dot: "bg-violet-400",  pill: "bg-violet-500/15 text-violet-300",   bar: "bg-violet-500"  },
  Fagligt:   { dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-300", bar: "bg-emerald-500" },
  Praktik:   { dot: "bg-orange-400",  pill: "bg-orange-500/15 text-orange-300",   bar: "bg-orange-500"  },
  Socialt:   { dot: "bg-pink-400",    pill: "bg-pink-500/15 text-pink-300",       bar: "bg-pink-500"    },
  Studie:    { dot: "bg-teal-400",    pill: "bg-teal-500/15 text-teal-300",       bar: "bg-teal-500"    },
  Helligdag: { dot: "bg-rose-400",    pill: "bg-rose-500/15 text-rose-300",       bar: "bg-rose-500"    },
  Ferie:     { dot: "bg-amber-400",   pill: "bg-amber-500/15 text-amber-300",     bar: "bg-amber-500"   },
}
const DEF = { dot: "bg-slate-400", pill: "bg-white/10 text-slate-400", bar: "bg-slate-500" }
const catColor = (c: string | null) => CAT[c ?? ""] ?? DEF

function cells(y: number, m: number) {
  const first = (new Date(y, m, 1).getDay() + 6) % 7
  const dim   = new Date(y, m + 1, 0).getDate()
  const arr: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ]
  while (arr.length % 7) arr.push(null)
  return arr
}

function onDay(ev: CalendarEvent, y: number, m: number, d: number) {
  const dt = new Date(ev.start)
  return !isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
}

function dayLabel(iso: string) {
  const d = new Date(iso); d.setHours(0, 0, 0, 0)
  const t = new Date();    t.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000)
  if (diff === 0) return "I dag"
  if (diff === 1) return "I morgen"
  return d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })
}


// ── Main component ────────────────────────────────────────────────────────────
export function CalendarPanel() {
  const now = new Date()
  const [vy, setVY]     = useState(now.getFullYear())
  const [vm, setVM]     = useState(now.getMonth())
  const [events, setEvents]   = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const prev    = () => { if (vm === 0) { setVM(11); setVY((y) => y - 1) } else setVM((m) => m - 1) }
  const next    = () => { if (vm === 11) { setVM(0); setVY((y) => y + 1) } else setVM((m) => m + 1) }
  const goToday = () => { const t = new Date(); setVY(t.getFullYear()); setVM(t.getMonth()) }

  const grid    = cells(vy, vm)
  const isToday = (d: number) => d === now.getDate() && vm === now.getMonth() && vy === now.getFullYear()
  const evtsOn  = (d: number) => events.filter((e) => onDay(e, vy, vm, d))

  // All events within the next 30 days, sorted
  const upcoming = (() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const limit = new Date(t); limit.setDate(limit.getDate() + 30)
    return events
      .filter((e) => { const d = new Date(e.start); return d >= t && d < limit })
      .sort((a, b) => a.start.localeCompare(b.start))
  })()

  const isEventToday = (iso: string) => {
    const d = new Date(iso); d.setHours(0,0,0,0)
    const t = new Date();    t.setHours(0,0,0,0)
    return d.getTime() === t.getTime()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">

      {/* ── Calendar grid ──────────────────────────────────────────────────── */}
      <div className="surface-panel overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-light px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button onClick={prev} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.08] active:scale-95 text-muted">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={next} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.08] active:scale-95 text-muted">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-foreground-strong">
              {MONTHS[vm]} <span className="text-subtle">{vy}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/5">
              <Image src="/logo/outlook.svg" alt="Outlook" width={22} height={22} className="h-full w-full rounded-[4px] object-fill" />
            </div>
            <button onClick={goToday} className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 active:scale-95 bg-emerald-500/10 border border-emerald-500/30">
              I dag
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-light">
          {DAYS.map((d, i) => (
            <div key={d} className={cn("py-3 text-center text-[11px] font-bold uppercase tracking-wider", i >= 5 ? "text-slate-600" : "text-slate-500")}>
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const isLastRow  = i >= grid.length - 7
            const isRightEdge = (i + 1) % 7 === 0
            const de         = day ? evtsOn(day) : []
            const isT        = day ? isToday(day) : false
            const isWeekend  = i % 7 >= 5

            return (
              <div
                key={i}
                className={cn(
                  "relative min-h-[100px] overflow-hidden p-2 border-light",
                  !isLastRow && "border-b",
                  !isRightEdge && "border-r",
                  !day && "pointer-events-none",
                  isWeekend && !isT && "bg-black/[0.07]",
                )}
              >
                {day && (
                  <>
                    <div className="mb-1.5">
                      <span className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums",
                        isT  && "bg-emerald-500 font-bold text-white shadow-sm shadow-emerald-500/30",
                        !isT && isWeekend  && "text-slate-600",
                        !isT && !isWeekend && "text-slate-300",
                      )}>
                        {day}
                      </span>
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {de.slice(0, 2).map((ev) => {
                        const col = catColor(ev.category)
                        return (
                          <div key={ev.id} className={cn("flex min-w-0 items-center gap-1 rounded-[4px] px-1.5 py-[3px] text-[10px] font-medium leading-tight overflow-hidden", col.pill)}>
                            <span className={cn("h-1 w-1 shrink-0 rounded-full", col.dot)} />
                            <span className="min-w-0 truncate">{ev.title}</span>
                          </div>
                        )
                      })}
                      {de.length > 2 && (
                        <p className="px-1.5 text-[10px] font-medium text-subtle">+{de.length - 2} mere</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Upcoming 30 days ───────────────────────────────────────────────── */}
      <div className="surface-panel flex flex-col overflow-hidden">

        {/* Panel header */}
        <div className="flex items-center gap-2.5 border-b border-light px-5 py-4 shrink-0">
          <CalendarDays className="h-4 w-4 text-accent shrink-0" />
          <p className="flex-1 text-sm font-semibold text-foreground-strong">Kommende 30 dage</p>
          {upcoming.length > 0 && (
            <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-400">
              {upcoming.length}
            </span>
          )}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Henter…
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <CalendarDays className="h-7 w-7 text-slate-700" />
              <p className="text-sm text-slate-600">Ingen kommende begivenheder</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((ev) => {
                const col   = catColor(ev.category)
                const today = isEventToday(ev.start)
                const dateStr = new Date(ev.start).toLocaleDateString("da-DK", {
                  day: "numeric", month: "short",
                })
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      today
                        ? "bg-emerald-500/[0.08]"
                        : "bg-white/[0.03] hover:bg-white/[0.06]",
                    )}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", col.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground-strong">{ev.title}</p>
                      {ev.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />{ev.location}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("text-[11px] font-semibold tabular-nums", today ? "text-emerald-400" : "text-muted")}>
                        {today ? "I dag" : dateStr}
                      </p>
                      {!ev.allDay && (
                        <p className="text-[10px] tabular-nums text-subtle">{fmtTime(ev.start)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
