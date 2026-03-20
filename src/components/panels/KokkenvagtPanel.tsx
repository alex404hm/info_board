"use client"

import { useEffect, useState } from "react"
import { Coffee, ListChecks, Info, Clock, User } from "lucide-react"

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
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ")
  const ini = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/25 text-[11px] font-black text-primary">
      {ini}
    </div>
  )
}

function PersonCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Initials name={name} />
      <span className="text-sm font-semibold text-foreground">{name}</span>
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

    // Listen for updates from admin page
    try {
      const channel = new BroadcastChannel("kokkenvagt_updated")
      channel.addEventListener("message", () => {
        void fetchSchedule()
      })
      return () => channel.close()
    } catch {
      // BroadcastChannel not available, no-op
    }
  }, [])

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Schedule */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/40 shadow-2xl backdrop-blur-md">
          <div className="border-b border-border/50 bg-card/40 px-6 py-5">
            <h2 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Vagtplan — Køkken
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              To personer per uge har ansvar for køkkenet.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Uge</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Person 1</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Person 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground text-sm">
                      Indlæser...
                    </td>
                  </tr>
                )}
                {!loading && schedule.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground text-sm">
                      Ingen planlagte vagter
                    </td>
                  </tr>
                )}
                {!loading && schedule.map((row) => {
                  const isCurrent = row.week === currentWeek && row.year === currentYear
                  return (
                    <tr
                      key={`${row.year}-${row.week}`}
                      className={`transition-colors ${isCurrent ? "bg-primary/8" : "hover:bg-primary/5"}`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 sm:px-6 sm:py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-black tabular-nums text-primary text-sm sm:text-base">UGE {row.week}</span>
                          {isCurrent && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/25">
                              Nu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-5">
                        <PersonCell name={row.person1} />
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-5">
                        <PersonCell name={row.person2} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-border/50 bg-card/40 p-6 shadow-2xl backdrop-blur-md">
          <h2 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-foreground">
            <ListChecks className="h-5 w-5 text-primary" />
            Sådan gør du
          </h2>
          <div className="space-y-3">
            {INSTRUCTIONS.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 rounded-xl border border-border/30 bg-card/20 p-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-[10px] font-black text-primary shadow-sm shadow-primary/5">
                  {i + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed text-foreground/90">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-5 shadow-inner">
            <div className="flex gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Husk!</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground/80">
                  Et rent køkken giver gladere kolleger. Tak for din indsats!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
