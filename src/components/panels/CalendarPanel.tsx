"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
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

const CAT: Record<string, { dot: string; badge: string }> = {
  Skole:     { dot: "bg-blue-400",    badge: "bg-blue-500/15 text-blue-400" },
  Workshop:  { dot: "bg-violet-400",  badge: "bg-violet-500/15 text-violet-400" },
  Fagligt:   { dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
  Praktik:   { dot: "bg-orange-400",  badge: "bg-orange-500/15 text-orange-400" },
  Socialt:   { dot: "bg-pink-400",    badge: "bg-pink-500/15 text-pink-400" },
  Studie:    { dot: "bg-teal-400",    badge: "bg-teal-500/15 text-teal-400" },
  Helligdag: { dot: "bg-rose-400",    badge: "bg-rose-500/15 text-rose-400" },
  Ferie:     { dot: "bg-amber-400",   badge: "bg-amber-500/15 text-amber-400" },
}
const DEF = { dot: "bg-white/40", badge: "bg-white/[0.06] text-white/50" }
const catColor = (c: string | null) => CAT[c ?? ""] ?? DEF

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
  const dt = new Date(ev.start)
  return !isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
}

export function CalendarPanel() {
  const now = new Date()
  const [vy, setVY] = useState(now.getFullYear())
  const [vm, setVM] = useState(now.getMonth())
  const [sy, setSY] = useState(now.getFullYear())
  const [sm, setSM] = useState(now.getMonth())
  const [sd, setSD] = useState(now.getDate())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const prev = () => { if (vm === 0) { setVM(11); setVY((y) => y - 1) } else setVM((m) => m - 1) }
  const next = () => { if (vm === 11) { setVM(0); setVY((y) => y + 1) } else setVM((m) => m + 1) }
  const today = () => {
    const t = new Date()
    setVY(t.getFullYear()); setVM(t.getMonth())
    setSY(t.getFullYear()); setSM(t.getMonth()); setSD(t.getDate())
  }
  const pick = (d: number) => { setSD(d); setSM(vm); setSY(vy) }

  const grid = cells(vy, vm)
  const isToday = (d: number) => d === now.getDate() && vm === now.getMonth() && vy === now.getFullYear()
  const isSel = (d: number) => d === sd && vm === sm && vy === sy
  const evtsOn = (d: number) => events.filter((e) => onDay(e, vy, vm, d))
  const selEvts = events.filter((e) => onDay(e, sy, sm, sd)).sort((a, b) => a.start.localeCompare(b.start))

  const selLabel = new Date(sy, sm, sd).toLocaleDateString("da-DK", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Calendar grid */}
      <div className="ib-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Outlook kalender</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 p-1">
            <Image
              src="/logo/outlook.svg"
              alt="Outlook"
              width={24}
              height={24}
              className="h-full w-full rounded-[4px] object-fill"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <button onClick={prev} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] active:scale-95">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white/90">{MONTHS[vm]} {vy}</span>
            <button onClick={today} className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold text-emerald-400 active:scale-95">
              I dag
            </button>
          </div>
          <button onClick={next} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] active:scale-95">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white/30">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px">
          {grid.map((day, i) => {
            if (!day) return <div key={i} className="h-11" />
            const de = evtsOn(day)
            return (
              <button
                key={i}
                onClick={() => pick(day)}
                className={cn(
                  "flex h-11 flex-col items-center justify-start rounded-lg pt-2 text-xs transition-all",
                  isToday(day) && !isSel(day) && "bg-emerald-500/10 font-bold text-emerald-400",
                  isSel(day) && "bg-emerald-500 font-bold text-white shadow-sm",
                  !isToday(day) && !isSel(day) && "text-white/60 hover:bg-white/[0.04]",
                )}
              >
                <span className="tabular-nums leading-none">{day}</span>
                {de.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {de.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("h-1 w-1 rounded-full", isSel(day) ? "bg-white/70" : catColor(e.category).dot)} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Events sidebar */}
      <div className="ib-panel p-5">
        <h3 className="mb-3 text-xs font-semibold capitalize text-white/50">{selLabel}</h3>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-white/40">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Henter…
          </div>
        ) : selEvts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <CalendarDays className="h-6 w-6 text-white/20" />
            <p className="text-xs text-white/40">Ingen begivenheder</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selEvts.map((ev) => {
              const col = catColor(ev.category)
              return (
                <div key={ev.id} className="ib-panel-soft p-3">
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", col.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/90">{ev.title}</p>
                      {ev.category && (
                        <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium", col.badge)}>
                          {ev.category}
                        </span>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-white/30">
                        <Clock className="h-2.5 w-2.5" />
                        {ev.allDay ? "Hele dagen" : `${fmtTime(ev.start)}${ev.end ? ` – ${fmtTime(ev.end)}` : ""}`}
                      </p>
                      {ev.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/30">
                          <MapPin className="h-2.5 w-2.5" /> {ev.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
