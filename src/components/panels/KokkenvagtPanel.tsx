"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-fetch"
import {
  ListChecks,
  Info,
  Clock,
  Coffee,
  Trash2,
  Utensils,
  ShoppingBag,
  Wind,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

type GuideSection = {
  icon: React.ElementType
  title: string
  time?: string
  items: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: Coffee,
    title: "Kaffemaskine – Rens",
    time: "Fredag kl. 13.30",
    items: [
      "Tryk øverst på displayet og vælg rensningsprogram",
      "Følg instruktionerne på skærmen",
      "Åbn maskinen og læg rensetablet i hullet over kværnen",
      "Luk maskinen igen",
      "Sæt en spand under hanen",
      "Når programmet er færdigt: Lav en kop kaffe og smid den ud",
    ],
  },
  {
    icon: Utensils,
    title: "Tøm opvaskemaskinen",
    time: "Kl. 07.30 dagligt",
    items: ["Tøm opvaskemaskinen"],
  },
  {
    icon: Coffee,
    title: "Kaffemaskine – Skyl",
    time: "Kl. 14.00 (man–tor) / 13.30 (fre)",
    items: [
      "Sæt en spand under hanen",
      "Hold toppen af display inde i 3 sekunder",
      "Vælg skylleprogram",
      "Tøm spanden og sæt en ny pose i",
      "Tøm og rengør overskudsbeholderen i bunden",
      "Fyld op med kaffe, mælkepulver og kakao",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Pant",
    items: [
      "Tjek om pantposen er ved at være fuld",
      "Hvis den er fuld: bind knude og sæt den på depotet",
      "Sæt en ny pose i",
    ],
  },
  {
    icon: Wind,
    title: "Overflader",
    items: ["Aftør alle køkkenoverflader"],
  },
  {
    icon: Utensils,
    title: "Service i huset",
    items: ["Tjek borde for kaffekopper og andet service"],
  },
  {
    icon: Trash2,
    title: "Opvask",
    items: [
      "Sæt service i opvaskemaskinen",
      "Start program 4 med opvasketablet",
      "Tjek for salt og afspændingsmiddel",
    ],
  },
]

const TOTAL_ITEMS = GUIDE_SECTIONS.reduce((s, g) => s + g.items.length, 0)

function todayKey() {
  return `kokkenvagt_checklist_${new Date().toISOString().slice(0, 10)}`
}

function itemKey(si: number, ii: number) {
  return `${si}-${ii}`
}

// ─── Schedule helpers ──────────────────────────────────────────────────────────

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
  const sizeClass = size === "sm" ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]"
  return (
    <div 
      className={`flex shrink-0 items-center justify-center rounded-full font-black ${sizeClass}`}
      style={{
        background: "var(--accent-soft)",
        border: "1px solid var(--accent-border)",
        color: "var(--accent)",
      }}
    >
      {initials(name)}
    </div>
  )
}

// ─── Checklist hook ────────────────────────────────────────────────────────────

function useChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey())
      setChecked(raw ? (JSON.parse(raw) as Record<string, boolean>) : {})
    } catch {
      setChecked({})
    }
    setHydrated(true)
  }, [])

  const toggle = (si: number, ii: number) => {
    setChecked(prev => {
      const key = itemKey(si, ii)
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(todayKey(), JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const reset = () => {
    setChecked({})
    try { localStorage.removeItem(todayKey()) } catch { /* ignore */ }
  }

  const doneCount = Object.values(checked).filter(Boolean).length

  return { checked, toggle, reset, doneCount, hydrated }
}

// ─── GuideSectionCard ──────────────────────────────────────────────────────────

function GuideSectionCard({
  section,
  si,
  checked,
  toggle,
  isOpen,
  onToggle,
}: {
  section: GuideSection
  si: number
  checked: Record<string, boolean>
  toggle: (si: number, ii: number) => void
  isOpen: boolean
  onToggle: () => void
}) {
  const Icon = section.icon
  const sectionDone = section.items.filter((_, ii) => checked[itemKey(si, ii)]).length
  const allDone = sectionDone === section.items.length

  return (
    <div
      className={["rounded-2xl border overflow-hidden transition-all", allDone ? "" : ""].join(" ")}
      style={{
        background: allDone ? "var(--surface-soft)" : "var(--surface-soft)",
        border: "1px solid var(--surface-border)",
      }}
    >
      {/* Header – tap to expand */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--accent-soft)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold leading-tight ${allDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {section.title}
          </p>
          {section.time && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-foreground/80">
              <Clock className="h-3 w-3" />
              {section.time}
            </p>
          )}
        </div>
        {/* Progress badge */}
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={{
            background: allDone ? "transparent" : "var(--accent-soft)",
            color: allDone ? "var(--foreground-muted)" : "var(--accent)",
            border: allDone ? "1px solid var(--surface-border)" : "none",
          }}
        >
          {sectionDone}/{section.items.length}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Steps */}
      <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="border-t px-4 py-3 space-y-1" style={{ borderColor: "var(--surface-border)" }}>
            {section.items.map((item, ii) => {
              const done = !!checked[itemKey(si, ii)]
              return (
                <button
                  key={ii}
                  onClick={() => toggle(si, ii)}
                  className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors"
                  style={{
                    background: done ? "transparent" : "transparent",
                    color: done ? "var(--foreground-muted)" : "var(--foreground)",
                  }}
                  onMouseEnter={(e) => {
                    if (!done) (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent"
                  }}
                >
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--accent-border)" }} />
                  )}
                  <p className={`text-sm leading-snug ${done ? "line-through" : ""}`} style={{ opacity: done ? 0.72 : 1 }}>
                    {item}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function KokkenvagtPanel() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [openGuideSection, setOpenGuideSection] = useState<number | null>(0)
  const { checked, toggle, reset, doneCount, hydrated } = useChecklist()

  const currentWeek = getISOWeek(new Date())
  const currentYear = new Date().getFullYear()
  const pct = Math.round((doneCount / TOTAL_ITEMS) * 100)
  const allDone = doneCount === TOTAL_ITEMS

  const toggleGuideSection = (sectionIndex: number) => {
    setOpenGuideSection((current) => (current === sectionIndex ? null : sectionIndex))
  }

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await apiFetch("/api/kokkenvagt")
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
    <>
      <div className="grid grid-cols-[1fr_420px] gap-8">

        {/* ── Schedule table ── */}
        <div>
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-soft)" }}>

            {/* Header */}
            <div className="border-b px-6 py-5" style={{ borderColor: "var(--surface-border)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Vagtplan — Køkken</h2>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>To personer per uge har ansvar for køkkenet</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--surface-border)" }}>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>Uge</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>Person 1</th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>Person 2</th>
                    <th className="table-cell px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>Instruktor</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
                        Indlæser...
                      </td>
                    </tr>
                  )}
                  {!loading && schedule.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
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
                        className="last:border-0 transition-colors"
                        style={{
                          borderBottom: "1px solid var(--surface-border)",
                          background: isCurrent ? "var(--accent-soft)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold tabular-nums" style={{ color: "var(--foreground)" }}>Uge {row.week}</span>
                              {isCurrent && (
                                <span className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: "var(--accent-border)", background: "var(--accent-soft)", color: "var(--accent)" }}>
                                  Nu
                                </span>
                              )}
                            </div>
                            <span className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                              {fmtDate(start)} – {fmtDate(end)}
                            </span>
                            {row.startTime && row.endTime && (
                              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                                <Clock className="h-3 w-3" />
                                {row.startTime} – {row.endTime}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.person1} />
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>{row.person1}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.person2} />
                            <span className="font-medium" style={{ color: "var(--foreground)" }}>{row.person2}</span>
                          </div>
                        </td>
                        <td className="table-cell px-5 py-4">
                          {row.authorName ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={row.authorName} size="sm" />
                              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{row.authorName}</span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--foreground-muted)", opacity: 0.3 }}>—</span>
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

        {/* ── Kitchen Guide (desktop) ── */}
        <div className="block space-y-3">

          {/* Guide header with progress */}
          <div className="flex items-center gap-2.5 px-1 pb-1">
            <ListChecks className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-bold uppercase tracking-widest flex-1" style={{ color: "var(--foreground)" }}>Køkken Guide</h2>
            {hydrated && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tabular-nums`} style={{ color: "var(--accent)" }}>
                  {doneCount}/{TOTAL_ITEMS}
                </span>
                <button
                  onClick={() => { if (window.confirm("Nulstil alle opgaver?")) reset() }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "var(--foreground-muted)" }}
                  title="Nulstil"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-soft)"
                    ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent"
                    ;(e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)"
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <p className="px-1 -mt-1 text-[11px]" style={{ color: "var(--foreground)" }}>
            Kun én sektion kan være åben ad gangen
          </p>

          {/* Desktop progress bar */}
          {hydrated && (
            <div className="px-1 pb-1">
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-border)" }}>
                <div
                  className={`h-full rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
              {allDone && (
                <p className="mt-1.5 text-center text-xs font-semibold" style={{ color: "var(--accent)" }}>Alle opgaver udført!</p>
              )}
            </div>
          )}

          {GUIDE_SECTIONS.map((section, si) => (
            <GuideSectionCard
              key={si}
              section={section}
              si={si}
              checked={checked}
              toggle={toggle}
              isOpen={openGuideSection === si}
              onToggle={() => toggleGuideSection(si)}
            />
          ))}

        </div>

      </div>
    </>
  )
}
