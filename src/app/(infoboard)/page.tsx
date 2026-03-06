"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Train,
  Utensils,
  CalendarDays,
  Newspaper,
  Users,
  CloudSun,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { StatusBar } from "@/components/StatusBar"
import {
  useDeparturesData,
  useDailyDishData,
  useWeatherData,
} from "@/hooks/use-api-data"

type Tile = {
  id: string
  href: string
  label: string
  icon: LucideIcon
  logoSrc?: string
  logoAlt?: string
  color: string
  bg: string
  activeBg: string
  ring: string
  iconBg: string
}

type HomeCalendarEvent = {
  id: string
  title: string
  start: string
  end: string | null
  allDay: boolean
  location: string | null
}

const TILES: Tile[] = [
  {
    id: "afgange",
    href: "/afgange",
    label: "Afgange",
    icon: Train,
    logoSrc: "/logo/dsb.svg",
    logoAlt: "DSB",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    activeBg: "bg-blue-500/20",
    ring: "ring-blue-500/50",
    iconBg: "bg-blue-500/15",
  },
  {
    id: "kantine",
    href: "/kantine",
    label: "Kantine",
    icon: Utensils,
    logoSrc: "/logo/kanpla.png",
    logoAlt: "Kanpla",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    activeBg: "bg-amber-500/20",
    ring: "ring-amber-500/50",
    iconBg: "bg-amber-500/15",
  },
  {
    id: "kalender",
    href: "/kalender",
    label: "Kalender",
    icon: CalendarDays,
    logoSrc: "/logo/outlook.svg",
    logoAlt: "Outlook",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    activeBg: "bg-emerald-500/20",
    ring: "ring-emerald-500/50",
    iconBg: "bg-emerald-500/15",
  },
  {
    id: "nyheder",
    href: "/nyheder",
    label: "Nyheder",
    icon: Newspaper,
    logoSrc: "/logo/dr-news.svg",
    logoAlt: "DR Nyheder",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    activeBg: "bg-rose-500/20",
    ring: "ring-rose-500/50",
    iconBg: "bg-rose-500/15",
  },
  {
    id: "kontakter",
    href: "/kontakter",
    label: "Kontakter",
    color: "text-violet-400",
    icon: Users,
    bg: "bg-violet-500/10",
    activeBg: "bg-violet-500/20",
    ring: "ring-violet-500/50",
    iconBg: "bg-violet-500/15",
  },
  {
    id: "vejr",
    href: "/vejr",
    label: "Vejr",
    icon: CloudSun,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    activeBg: "bg-sky-500/20",
    ring: "ring-sky-500/50",
    iconBg: "bg-sky-500/15",
  },
]

export default function InfoBoardHome() {
  const departures = useDeparturesData()
  const dailyDish = useDailyDishData()
  const weather = useWeatherData()
  const [calendarEvents, setCalendarEvents] = useState<HomeCalendarEvent[]>([])
  const hasDishData = Boolean(dailyDish)
  const isServingToday = Boolean(dailyDish?.servingToday)
  const nextDeparture = departures[0]

  useEffect(() => {
    let mounted = true

    const loadCalendar = async () => {
      try {
        const response = await fetch("/api/calendar", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as { events?: HomeCalendarEvent[] }
        if (mounted && Array.isArray(data.events)) {
          setCalendarEvents(data.events)
        }
      } catch {
        // Keep latest snapshot on transient errors.
      }
    }

    void loadCalendar()
    const id = setInterval(loadCalendar, 10 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const todaysEvents = useMemo(() => {
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const intersectsToday = (event: HomeCalendarEvent) => {
      const start = new Date(event.start)
      if (Number.isNaN(start.getTime())) return false

      if (event.allDay) {
        if (!event.end) {
          return (
            start.getFullYear() === dayStart.getFullYear() &&
            start.getMonth() === dayStart.getMonth() &&
            start.getDate() === dayStart.getDate()
          )
        }
        const end = new Date(event.end)
        if (Number.isNaN(end.getTime())) return false
        return start < dayEnd && end > dayStart
      }

      const end = event.end ? new Date(event.end) : null
      if (end && !Number.isNaN(end.getTime())) {
        return start < dayEnd && end > dayStart
      }
      return start >= dayStart && start < dayEnd
    }

    return calendarEvents
      .filter(intersectsToday)
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [calendarEvents])

  function formatEventTime(event: HomeCalendarEvent): string {
    if (event.allDay) return "Hele dagen"
    const start = new Date(event.start)
    if (Number.isNaN(start.getTime())) return "Tidspunkt ukendt"
    const startLabel = start.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
    if (!event.end) return startLabel
    const end = new Date(event.end)
    if (Number.isNaN(end.getTime())) return startLabel
    const endLabel = end.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
    return `${startLabel} - ${endLabel}`
  }

  function snippet(id: string): string | null {
    switch (id) {
      case "afgange": {
        const d = departures[0]
        return d ? `${d.line} → ${d.time}` : null
      }
      case "kantine":
        return dailyDish?.name ?? null
      case "vejr":
        return weather ? `${weather.temperatureC ?? "--"}° ${weather.condition ?? ""}` : null
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-[#0B1120] via-[#0d1526] to-[#0B1120]">
      <StatusBar />

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="mx-auto w-full max-w-[1400px] space-y-10 px-6 py-8">
          <div className="ib-panel mx-auto w-full max-w-[760px] border-amber-300/15 bg-gradient-to-br from-amber-500/12 via-amber-500/5 to-white/[0.02] p-6 shadow-xl shadow-black/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20">
                <Image
                  src="/logo/kanpla.png"
                  alt="Kanpla"
                  width={28}
                  height={28}
                  className="h-full w-full rounded-[4px] object-fill"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-100/60">Kantine</p>
                <h3 className="text-xl font-bold text-white">Dagens ret</h3>
              </div>
            </div>

            {isServingToday && dailyDish?.imageUrl ? (
              <div className="relative mb-5 h-44 w-full overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={dailyDish.imageUrl}
                  alt={dailyDish.name || "Dagens ret"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}

            <p className="text-2xl font-bold tracking-tight text-white">
              {hasDishData ? dailyDish?.name : "Henter dagens ret..."}
            </p>

            {!isServingToday && dailyDish?.nextDishName ? (
              <p className="mt-4 text-sm text-amber-200/80">
                Næste ret: <span className="font-semibold">{dailyDish.nextDishName}</span>
                {dailyDish.nextDishDateLabel ? ` (${dailyDish.nextDishDateLabel})` : ""}
              </p>
            ) : null}
          </div>

          <div className="ib-panel mx-auto w-full max-w-[980px] p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75">Dagens overblik</h3>
              <span className="text-xs text-white/40">Hurtigt overblik</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="ib-panel-soft p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-300/70">Næste afgang</p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  {nextDeparture ? `${nextDeparture.line} → ${nextDeparture.destination}` : "Ingen data endnu"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {nextDeparture ? `${nextDeparture.time}${nextDeparture.delayMin > 0 ? ` (+${nextDeparture.delayMin})` : ""}` : "Opdateres automatisk"}
                </p>
              </div>

              <div className="ib-panel-soft p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/70">Vejret nu</p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  {weather ? `${weather.temperatureC ?? "--"}° ${weather.condition}` : "Henter vejrdata..."}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  {weather?.windKmh != null ? `Vind ${weather.windKmh} km/t` : "Lokalt overblik"}
                </p>
              </div>

              <div className="ib-panel-soft p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/70">I dag i kalender</p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  {todaysEvents.length > 0 ? `${todaysEvents.length} aktivitet(er) i dag` : "Ingen aktiviteter i dag"}
                </p>
                <p className="mt-1 truncate text-xs text-white/50">
                  {todaysEvents[0]?.title ?? "Nyd en rolig dag"}
                </p>
                <Link
                  href="/kalender"
                  className="mt-2 inline-flex rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/[0.08]"
                >
                  Åbn kalender
                </Link>
              </div>

              <div className="ib-panel-soft p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-300/70">Dagens skema</p>
                <div className="mt-2 space-y-1.5">
                  {todaysEvents.length > 0 ? (
                    todaysEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-2 text-xs">
                        <span className="truncate text-white/75">{event.title}</span>
                        <span className="shrink-0 tabular-nums text-white/45">{formatEventTime(event)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/50">Ingen punkter i dagens skema</p>
                  )}
                </div>
                <Link
                  href="/kalender"
                  className="mt-2 inline-flex rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/[0.08]"
                >
                  Se hele skemaet
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/[0.06] pt-10">
            <div className="mx-auto grid w-full max-w-[1400px] grid-cols-3 gap-3">
              {TILES.map((t) => {
                const Icon = t.icon
                const sub = snippet(t.id)

                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    className={cn(
                      "relative flex items-center gap-3 rounded-2xl border transition-all duration-300 active:scale-[0.97]",
                      "flex-col px-3 py-5",
                      `${t.bg} border-white/[0.06] hover:border-white/[0.12] hover:shadow-md hover:shadow-black/20 hover:ring-2 ${t.ring}`,
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                        t.iconBg,
                      )}
                    >
                      {t.logoSrc ? (
                        <Image
                          src={t.logoSrc}
                          alt={t.logoAlt ?? t.label}
                          width={28}
                          height={28}
                          className="h-full w-full rounded-[4px] object-fill"
                        />
                      ) : (
                        <Icon className={cn(t.color, "h-6 w-6 transition-all duration-300")} />
                      )}
                    </div>
                    <span className="text-[13px] font-semibold text-white/90 transition-all duration-300">
                      {t.label}
                    </span>
                    {sub && (
                      <span className="max-w-full truncate text-[11px] font-medium text-white/40">
                        {sub}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
