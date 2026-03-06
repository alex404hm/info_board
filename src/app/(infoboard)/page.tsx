"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Train,
  Utensils,
  CalendarDays,
  Newspaper,
  Users,
  CloudSun,
  Calendar,
  MessageSquare,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { StatusBar } from "@/components/StatusBar"
import { useDailyDishData } from "@/hooks/use-api-data"
import { instructors } from "@/data"

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string | null
  allDay: boolean
}

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
  const dailyDish = useDailyDishData()
  const hasDishData = Boolean(dailyDish)
  const isServingToday = Boolean(dailyDish?.servingToday)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    let mounted = true

    const loadCalendar = async () => {
      try {
        const response = await fetch("/api/calendar", { cache: "no-store" })
        if (!response.ok) return
        const data = (await response.json()) as { events?: CalendarEvent[] }
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

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-[#111827] via-[#1a202c] to-[#111827]">
      <StatusBar />

      <div className="flex-1 overflow-y-auto scroll-smooth flex flex-col">
        <div className="flex-1 px-6 py-8">
          <div className="ib-panel mx-auto w-full max-w-[760px] border-amber-300/25 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-white/[0.04] p-6 shadow-xl shadow-black/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/30">
                <Image
                  src="/logo/kanpla.png"
                  alt="Kanpla"
                  width={28}
                  height={28}
                  className="h-full w-full rounded-[4px] object-fill"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Kantine</p>
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

          <div className="mt-8 grid w-full gap-6 md:grid-cols-2">
            {/* Calendar Box */}
            <div className="ib-panel mx-auto w-full rounded-2xl border-emerald-300/20 bg-gradient-to-br from-emerald-500/15 via-emerald-500/8 to-white/[0.03] p-5 shadow-lg shadow-black/20">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/25">
                  <Calendar className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/75">Kalender</p>
                  <h4 className="text-sm font-bold text-white">Kommende begivenheder</h4>
                </div>
              </div>
              <div className="space-y-2">
                {calendarEvents.length > 0 ? (
                  calendarEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="truncate rounded-lg bg-white/[0.04] px-3 py-2">
                      <p className="text-xs font-semibold text-white/85 truncate">{event.title}</p>
                      <p className="text-[11px] text-white/50">
                        {event.allDay ? "Hele dagen" : new Date(event.start).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/50">Ingen kommende begivenheder</p>
                )}
              </div>
              <Link
                href="/kalender"
                className="mt-3 inline-flex w-full justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
              >
                Se kalenderen
              </Link>
            </div>

            {/* Instructors Box */}
            <div className="ib-panel mx-auto w-full rounded-2xl border-violet-300/20 bg-gradient-to-br from-violet-500/15 via-violet-500/8 to-white/[0.03] p-5 shadow-lg shadow-black/20">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/25">
                  <MessageSquare className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/75">Instruktører</p>
                  <h4 className="text-sm font-bold text-white">Tilgængelige instruktører</h4>
                </div>
              </div>
              <div className="space-y-2">
                {instructors.slice(0, 3).map((instructor) => (
                  <div key={instructor.id} className="rounded-lg bg-white/[0.04] px-3 py-2">
                    <p className="text-xs font-semibold text-white/85">{instructor.name}</p>
                    <p className="text-[11px] text-white/50">{instructor.area}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/instruktorer"
                className="mt-3 inline-flex w-full justify-center rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 transition-all hover:bg-violet-500/20"
              >
                Se alle instruktører
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-white/[0.12] px-6 py-8">
          <div className="mx-auto w-full max-w-[1400px] flex justify-center">
            <div className="flex flex-wrap gap-3 justify-center">
              {TILES.map((t) => {
                const Icon = t.icon

                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    className={cn(
                      "relative flex items-center justify-center rounded-xl border transition-all duration-300 active:scale-[0.97]",
                      "p-3",
                      `${t.bg} border-white/[0.15] hover:border-white/[0.25] hover:shadow-md hover:shadow-black/20 hover:ring-2 ${t.ring}`,
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                        t.iconBg,
                      )}
                    >
                      {t.logoSrc ? (
                        <Image
                          src={t.logoSrc}
                          alt={t.logoAlt ?? t.label}
                          width={20}
                          height={20}
                          className="h-full w-full rounded-[3px] object-fill"
                        />
                      ) : (
                        <Icon className={cn(t.color, "h-5 w-5 transition-all duration-300")} />
                      )}
                    </div>
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
