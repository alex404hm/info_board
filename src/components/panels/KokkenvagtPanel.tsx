"use client"

import { useEffect, useState } from "react"
import { ListChecks, Info, Clock } from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

const INSTRUCTIONS = [
  "Tøm opvaskemaskinen hver morgen inden kl. 09:00.",
  "Tør alle borde og overflader af efter frokost (kl. 12:30).",
  "Sørg for at kaffemaskinen er ren og klar til næste dag.",
  "Fyld op med kopper, skeer og servietter.",
  "Tøm skraldespanden hvis den er fuld.",
]

type ScheduleEntry = {
  week: number
  year: number
  person1: string
  person2: string
  startTime?: string | null
  endTime?: string | null
  authorName?: string | null
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]

function getWeekDates(week: number, year: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const week1Mon = new Date(jan4.getTime() - (jan4Day - 1) * 86400000)
  const start = new Date(week1Mon.getTime() + (week - 1) * 7 * 86400000)
  const end = new Date(start.getTime() + 4 * 86400000)
  return { start, end }
}

function fmtDate(d: Date): string {
  return `${d.getUTCDate()}. ${MONTHS_SHORT[d.getUTCMonth()]}`
}

function initials(name: string): string {
  const parts = name.trim().split(" ")
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]"
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 font-black text-primary ${sz}`}>
      {initials(name)}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function KokkenvagtPanel() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)

  const currentWeek = getISOWeek(new Date())
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/kokkenvagt")
        if (res.ok) {
          const data = await res.json()
          setSchedule(data)
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchSchedule()

    try {
      const channel = new BroadcastChannel("kokkenvagt_updated")
      channel.addEventListener("message", () => { void fetchSchedule() })
      return () => channel.close()
    } catch {
      // BroadcastChannel not available
    }
  }, [])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

      {/* ── Schedule table ── */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm">

          {/* Header */}
          <div className="border-b border-border/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Vagtplan — Køkken</h2>
                <p className="text-xs text-muted-foreground">To personer per uge har ansvar for køkkenet</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Uge</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Person 1</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Person 2</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Instruktor</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Indlæser...
                    </td>
                  </tr>
                )}
                {!loading && schedule.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Ingen planlagte vagter
                    </td>
                  </tr>
                )}
                {!loading && schedule.map((row, i) => {
                  const isCurrent = row.week === currentWeek && row.year === currentYear
                  const { start, end } = getWeekDates(row.week, row.year)
                  return (
                    <tr
                      key={`${row.year}-${row.week}`}
                      className={[
                        "border-b border-border/20 last:border-0 transition-colors",
                        isCurrent ? "bg-primary/5" : i % 2 === 0 ? "" : "bg-white/[0.015]",
                      ].join(" ")}
                    >
                      {/* Week */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold tabular-nums text-foreground">
                              Uge {row.week}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                                Nu
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {fmtDate(start)} – {fmtDate(end)}
                          </span>
                          {row.startTime && row.endTime && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {row.startTime} – {row.endTime}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Person 1 */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.person1} />
                          <span className="font-medium text-foreground">{row.person1}</span>
                        </div>
                      </td>

                      {/* Person 2 */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={row.person2} />
                          <span className="font-medium text-foreground">{row.person2}</span>
                        </div>
                      </td>

                      {/* Instruktor */}
                      <td className="hidden sm:table-cell px-5 py-4">
                        {row.authorName ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={row.authorName} size="sm" />
                            <span className="text-xs text-muted-foreground">{row.authorName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Instructions ── */}
      <div>
        <div className="rounded-2xl border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
          <h2 className="mb-5 flex items-center gap-2.5 text-sm font-bold uppercase tracking-widest text-foreground">
            <ListChecks className="h-4 w-4 text-primary" />
            Sådan gør du
          </h2>

          <div className="space-y-2.5">
            {INSTRUCTIONS.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border/30 p-3.5"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold text-primary">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Husk!</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                Et rent køkken giver gladere kolleger. Tak for din indsats!
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
