"use client"

import { useEffect, useRef, useState } from "react"
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
  X,
  RotateCcw,
} from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

type GuideSection = {
  icon: React.ElementType
  title: string
  time?: string
  accent: string
  items: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: Coffee,
    title: "Kaffemaskine – Rens",
    time: "Fredag kl. 13:30",
    accent: "#f59e0b",
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
    time: "Kl. 07:30 dagligt",
    accent: "#3b82f6",
    items: ["Tøm opvaskemaskinen"],
  },
  {
    icon: Coffee,
    title: "Kaffemaskine – Skyl",
    time: "Kl. 14:00 (man–tor) / 13:30 (fre)",
    accent: "#8b5cf6",
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
    accent: "#10b981",
    items: [
      "Tjek om pantposen er ved at være fuld",
      "Hvis den er fuld: bind knude og sæt den på depotet",
      "Sæt en ny pose i",
    ],
  },
  {
    icon: Wind,
    title: "Overflader",
    accent: "#06b6d4",
    items: ["Aftør alle køkkenoverflader"],
  },
  {
    icon: Utensils,
    title: "Service i huset",
    accent: "#ec4899",
    items: ["Tjek borde for kaffekopper og andet service"],
  },
  {
    icon: Trash2,
    title: "Opvask",
    accent: "#f43f5e",
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
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 font-black text-primary ${sz}`}>
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
  defaultOpen = false,
}: {
  section: GuideSection
  si: number
  checked: Record<string, boolean>
  toggle: (si: number, ii: number) => void
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = section.icon
  const sectionDone = section.items.filter((_, ii) => checked[itemKey(si, ii)]).length
  const allDone = sectionDone === section.items.length

  return (
    <div
      className={[
        "rounded-2xl border overflow-hidden transition-all",
        allDone
          ? "border-green-500/30 bg-green-500/5"
          : "border-border/40 bg-card/30 backdrop-blur-sm",
      ].join(" ")}
    >
      {/* Header – tap to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${section.accent}18`, border: `1px solid ${section.accent}30` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: section.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold leading-tight ${allDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {section.title}
          </p>
          {section.time && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {section.time}
            </p>
          )}
        </div>
        {/* Progress badge */}
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
          style={{
            background: allDone ? "#22c55e18" : `${section.accent}18`,
            color: allDone ? "#22c55e" : section.accent,
          }}
        >
          {sectionDone}/{section.items.length}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Steps */}
      {open && (
        <div className="border-t border-border/30 px-4 py-3 space-y-1">
          {section.items.map((item, ii) => {
            const done = !!checked[itemKey(si, ii)]
            return (
              <button
                key={ii}
                onClick={() => toggle(si, ii)}
                className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
              >
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" style={{ color: section.accent + "80" }} />
                )}
                <p className={`text-sm leading-snug ${done ? "line-through text-muted-foreground/50" : "text-foreground/80"}`}>
                  {item}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Mobile Guide Sheet ────────────────────────────────────────────────────────

function MobileGuideSheet({
  open,
  onClose,
  checked,
  toggle,
  reset,
  doneCount,
}: {
  open: boolean
  onClose: () => void
  checked: Record<string, boolean>
  toggle: (si: number, ii: number) => void
  reset: () => void
  doneCount: number
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const pct = Math.round((doneCount / TOTAL_ITEMS) * 100)
  const allDone = doneCount === TOTAL_ITEMS

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative flex max-h-[92dvh] flex-col rounded-t-3xl border-t border-border/40 bg-background shadow-2xl">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border/60" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center gap-3 border-b border-border/30 px-5 pb-4 pt-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ListChecks className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground">Køkken Guide</h2>
            <p className="text-xs text-muted-foreground">{doneCount} af {TOTAL_ITEMS} opgaver udført</p>
          </div>
          <button
            onClick={() => { if (window.confirm("Nulstil alle opgaver?")) reset() }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fremgang</span>
            <span className={`text-xs font-bold tabular-nums ${allDone ? "text-green-500" : "text-primary"}`}>{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {allDone && (
            <p className="mt-2 text-center text-xs font-semibold text-green-500">
              Alle opgaver er udført!
            </p>
          )}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {GUIDE_SECTIONS.map((section, si) => (
            <GuideSectionCard
              key={si}
              section={section}
              si={si}
              checked={checked}
              toggle={toggle}
              defaultOpen={si === 0}
            />
          ))}

          <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 mt-1">
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

// ─── Panel ────────────────────────────────────────────────────────────────────

export function KokkenvagtPanel() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const { checked, toggle, reset, doneCount, hydrated } = useChecklist()

  const currentWeek = getISOWeek(new Date())
  const currentYear = new Date().getFullYear()
  const pct = Math.round((doneCount / TOTAL_ITEMS) * 100)
  const allDone = doneCount === TOTAL_ITEMS

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
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">

        {/* ── Schedule table ── */}
        <div>
          {/* Mobile guide progress strip */}
          {hydrated && (
            <button
              onClick={() => setSheetOpen(true)}
              className="lg:hidden w-full mb-4 flex items-center gap-3 rounded-2xl border border-border/40 bg-card/30 px-4 py-3 backdrop-blur-sm text-left hover:bg-white/5 transition-colors"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${allDone ? "bg-green-500" : "bg-primary"}`}>
                <ListChecks className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Køkken Guide</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-border/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold tabular-nums shrink-0 ${allDone ? "text-green-500" : "text-primary"}`}>
                    {doneCount}/{TOTAL_ITEMS}
                  </span>
                </div>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground rotate-90" />
            </button>
          )}

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
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold tabular-nums text-foreground">Uge {row.week}</span>
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
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.person1} />
                            <span className="font-medium text-foreground">{row.person1}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.person2} />
                            <span className="font-medium text-foreground">{row.person2}</span>
                          </div>
                        </td>
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

        {/* ── Kitchen Guide (desktop) ── */}
        <div className="hidden lg:block space-y-3">

          {/* Guide header with progress */}
          <div className="flex items-center gap-2.5 px-1 pb-1">
            <ListChecks className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex-1">Køkken Guide</h2>
            {hydrated && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tabular-nums ${allDone ? "text-green-500" : "text-primary"}`}>
                  {doneCount}/{TOTAL_ITEMS}
                </span>
                <button
                  onClick={() => { if (window.confirm("Nulstil alle opgaver?")) reset() }}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                  title="Nulstil"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Desktop progress bar */}
          {hydrated && (
            <div className="px-1 pb-1">
              <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {allDone && (
                <p className="mt-1.5 text-center text-xs font-semibold text-green-500">Alle opgaver udført!</p>
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
              defaultOpen={si === 0}
            />
          ))}

          <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
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

      {/* ── Mobile bottom sheet ── */}
      <MobileGuideSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        checked={checked}
        toggle={toggle}
        reset={reset}
        doneCount={doneCount}
      />
    </>
  )
}
