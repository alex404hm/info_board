"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Trash2, Edit2, X, CalendarDays, Clock, ChefHat, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, format, addMonths, subMonths, isSameMonth } from "date-fns"
import { da } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import { AdminCreateButton } from "../_components/AdminCreateButton"

// ─── Types ────────────────────────────────────────────────────────────────────

type KokkenvagtEntry = {
  id: string
  week: number
  year: number
  person1: string
  person2: string
  note?: string
  startTime?: string
  endTime?: string
  createdAt?: string
  updatedAt?: string
}

type KokkenvagtFormSnapshot = {
  weekKey: string
  person1: string
  person2: string
  startTime: string
  endTime: string
  note: string
}

const EMPTY_FORM_SNAPSHOT: KokkenvagtFormSnapshot = {
  weekKey: "",
  person1: "",
  person2: "",
  startTime: "08:00",
  endTime: "14:00",
  note: "",
}

function isSameSnapshot(a: KokkenvagtFormSnapshot, b: KokkenvagtFormSnapshot) {
  return (
    a.weekKey === b.weekKey &&
    a.person1 === b.person1 &&
    a.person2 === b.person2 &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.note === b.note
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekRange(date: Date): { from: Date; to: Date } {
  return { from: startOfISOWeek(date), to: endOfISOWeek(date) }
}

function isSameWeek(a: Date, b: Date) {
  return getISOWeek(a) === getISOWeek(b) && getISOWeekYear(a) === getISOWeekYear(b)
}

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  // pad start
  const startDow = (first.getDay() + 6) % 7 // Mon=0
  for (let i = 0; i < startDow; i++) {
    days.push(new Date(year, month, 1 - startDow + i))
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  // pad end to fill row
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - last.getDate() - startDow + 1))
  }
  return days
}

// ─── Mini Week Calendar ───────────────────────────────────────────────────────

function WeekCalendar({
  selected,
  onSelect,
}: {
  selected: Date | undefined
  onSelect: (d: Date) => void
}) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(selected ?? today)
  const month = viewDate.getMonth()
  const year = viewDate.getFullYear()
  const days = getDaysInMonth(year, month)

  const selectedRange = selected ? getWeekRange(selected) : null

  const inRange = (d: Date) => {
    if (!selectedRange) return false
    return d >= selectedRange.from && d <= selectedRange.to
  }

  const isRangeStart = (d: Date) =>
    selectedRange ? d.toDateString() === selectedRange.from.toDateString() : false
  const isRangeEnd = (d: Date) =>
    selectedRange ? d.toDateString() === selectedRange.to.toDateString() : false
  const isToday = (d: Date) => d.toDateString() === today.toDateString()

  const DAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"]

  return (
    <div className="w-72 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize">
          {format(viewDate, "MMMM yyyy", { locale: da })}
        </span>
        <button
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-[11px] font-semibold uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const outside = !isSameMonth(d, viewDate)
          const inSel = inRange(d)
          const start = isRangeStart(d)
          const end = isRangeEnd(d)
          const todayDay = isToday(d)
          const hoverWeekClass = "group-hover/week:bg-muted/70"

          return (
            <div
              key={i}
              className={`group/week flex cursor-pointer items-center justify-center py-0.5 transition-colors
                ${inSel ? "bg-primary/15" : ""}
                ${start ? "rounded-l-full" : ""}
                ${end ? "rounded-r-full" : ""}
              `}
              onClick={() => !outside && onSelect(d)}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all
                  ${outside ? "opacity-25 pointer-events-none" : ""}
                  ${start || end ? "bg-primary text-primary-foreground font-semibold shadow-sm" : ""}
                  ${inSel && !start && !end ? `text-foreground font-medium ${hoverWeekClass}` : ""}
                  ${!inSel && !outside ? "text-foreground/80 hover:bg-muted" : ""}
                  ${todayDay && !inSel ? "ring-1 ring-primary/50 font-semibold" : ""}
                `}
              >
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week hint */}
      <div className="mt-3 border-t border-border/40 pt-3 text-center text-[11px] text-muted-foreground">
        Klik en dag for at vælge hele ugen
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KokkenvagtAdminPage() {
  const confirmDialog = useConfirmDialog()
  const [entries, setEntries] = useState<KokkenvagtEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [calOpen, setCalOpen] = useState(false)

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [person1, setPerson1] = useState("")
  const [person2, setPerson2] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("14:00")
  const [note, setNote] = useState("")
  const [formBaseline, setFormBaseline] = useState<KokkenvagtFormSnapshot>(EMPTY_FORM_SNAPSHOT)

  const currentFormSnapshot = useMemo<KokkenvagtFormSnapshot>(() => ({
    weekKey: selectedDate ? `${getISOWeekYear(selectedDate)}-${getISOWeek(selectedDate)}` : "",
    person1,
    person2,
    startTime,
    endTime,
    note,
  }), [selectedDate, person1, person2, startTime, endTime, note])

  const hasUnsavedChanges = showForm && !isSameSnapshot(currentFormSnapshot, formBaseline)
  const dirtyFields = [
    currentFormSnapshot.weekKey !== formBaseline.weekKey ? "uge" : null,
    currentFormSnapshot.person1 !== formBaseline.person1 ? "person 1" : null,
    currentFormSnapshot.person2 !== formBaseline.person2 ? "person 2" : null,
    currentFormSnapshot.startTime !== formBaseline.startTime ? "starttid" : null,
    currentFormSnapshot.endTime !== formBaseline.endTime ? "sluttid" : null,
    currentFormSnapshot.note !== formBaseline.note ? "note" : null,
  ].filter(Boolean).join(", ")

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: editingId ? "Du har ikke-gemte ændringer i vagten" : "Du har en ikke-gemt vagt",
    description: dirtyFields
      ? `Ikke-gemte felter: ${dirtyFields}. Hvis du forlader siden nu, mister du disse ændringer.`
      : "Hvis du forlader siden nu, mister du de ændringer, du har lavet i vagtformularen.",
    confirmText: "Forlad uden at gemme",
    cancelText: "Bliv og gem",
  })

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/kokkenvagt?admin=true")
      if (res.ok) setEntries(await res.json())
    } catch (e) {
      console.error("Failed to fetch entries:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchEntries() }, [fetchEntries])

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function resetForm() {
    setSelectedDate(undefined)
    setPerson1("")
    setPerson2("")
    setStartTime("08:00")
    setEndTime("14:00")
    setNote("")
    setEditingId(null)
    setShowForm(false)
    setCalOpen(false)
    setFormBaseline(EMPTY_FORM_SNAPSHOT)
  }

  function handleEdit(entry: KokkenvagtEntry) {
    const jan4 = new Date(entry.year, 0, 4)
    const monday = startOfISOWeek(jan4)
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() + (entry.week - 1) * 7)
    setFormBaseline({
      weekKey: `${entry.year}-${entry.week}`,
      person1: entry.person1,
      person2: entry.person2,
      startTime: entry.startTime ?? "08:00",
      endTime: entry.endTime ?? "14:00",
      note: entry.note ?? "",
    })
    setSelectedDate(weekStart)
    setPerson1(entry.person1)
    setPerson2(entry.person2)
    setStartTime(entry.startTime ?? "08:00")
    setEndTime(entry.endTime ?? "14:00")
    setNote(entry.note ?? "")
    setEditingId(entry.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate) return
    setSubmitting(true)
    try {
      const week = getISOWeek(selectedDate)
      const year = getISOWeekYear(selectedDate)
      const url = editingId ? `/api/kokkenvagt/${editingId}` : "/api/kokkenvagt"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week, year, person1, person2,
          note: note || null,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      })
      if (res.ok) {
        await fetchEntries()
        showToast("success", editingId ? "Vagt opdateret" : "Vagt oprettet")
        resetForm()
        try { new BroadcastChannel("kokkenvagt_updated").postMessage(null) } catch {}
      } else {
        showToast("error", "Fejl ved gemning")
      }
    } catch {
      showToast("error", "Fejl ved gemning")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirmDialog({
      title: "Slet vagt?",
      description: "Denne handling kan ikke fortrydes.",
      confirmText: "Slet vagt",
      cancelText: "Annuller",
      tone: "danger",
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/kokkenvagt/${id}`, { method: "DELETE" })
      if (res.ok) {
        await fetchEntries()
        showToast("success", "Vagt slettet")
        try { new BroadcastChannel("kokkenvagt_updated").postMessage(null) } catch {}
      } else {
        showToast("error", "Fejl ved sletning")
      }
    } catch {
      showToast("error", "Fejl ved sletning")
    }
  }

  const selectedWeek = selectedDate ? getISOWeek(selectedDate) : null
  const selectedYear = selectedDate ? getISOWeekYear(selectedDate) : null
  const weekRange = selectedDate ? getWeekRange(selectedDate) : null

  return (
    <div className="space-y-6 pb-24">

      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl animate-in slide-in-from-top-2 ${
          toast.type === "success"
            ? "admin-toast-success"
            : "admin-toast-error"
        }`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Køkkenvagt</h1>
            <p className="text-xs text-muted-foreground">Administrer vagtplanen uge for uge</p>
          </div>
        </div>
        {showForm ? (
          <Button
            variant="outline"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            <X className="h-4 w-4" />
            Annuller
          </Button>
        ) : (
          <AdminCreateButton
            onClick={() => {
              setFormBaseline(EMPTY_FORM_SNAPSHOT)
              setShowForm(true)
            }}
          >
            Ny vagt
          </AdminCreateButton>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-border/60 bg-card/60 shadow-sm">
          <div className="border-b border-border/40 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "Rediger vagt" : "Opret ny vagt"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">

            {/* Week picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Uge
              </label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-full items-center gap-2.5 rounded-xl border border-input bg-transparent px-3.5 text-sm transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 data-[state=open]:ring-2 data-[state=open]:ring-primary/30"
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {selectedWeek ? (
                      <span className="font-medium">
                        Uge {selectedWeek}, {selectedYear}
                        {weekRange && (
                          <span className="ml-2 text-muted-foreground font-normal">
                            ({format(weekRange.from, "d. MMM", { locale: da })} – {format(weekRange.to, "d. MMM", { locale: da })})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Vælg uge…</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <WeekCalendar
                    selected={selectedDate}
                    onSelect={(d) => {
                      setSelectedDate(d)
                      setCalOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Starttid
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Sluttid
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Persons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Person 1
                </label>
                <input
                  type="text"
                  required
                  value={person1}
                  onChange={(e) => setPerson1(e.target.value)}
                  placeholder="Fulde navn"
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Person 2
                </label>
                <input
                  type="text"
                  required
                  value={person2}
                  onChange={(e) => setPerson2(e.target.value)}
                  placeholder="Fulde navn"
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Note <span className="normal-case font-normal text-muted-foreground/60">(valgfrit)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Valgfri bemærkning…"
                className="w-full resize-none rounded-xl border border-input bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuller
              </Button>
              {editingId ? (
                <Button type="submit" disabled={submitting || !selectedDate}>
                  {submitting ? "Gemmer..." : "Gem ændringer"}
                </Button>
              ) : (
                <AdminCreateButton type="submit" disabled={submitting || !selectedDate}>
                  {submitting ? "Opretter..." : "Opret vagt"}
                </AdminCreateButton>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex h-32 items-center justify-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Henter vagter…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-muted/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground">
            <ChefHat className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Ingen vagter endnu</p>
          <p className="text-xs text-muted-foreground/60">Klik på &ldquo;Ny vagt&rdquo; for at oprette den første</p>
        </div>
      )}

      {/* Table */}
      {!loading && entries.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Uge", "Periode", "Tidspunkt", "Person 1", "Person 2", "Note", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {entries.map((entry) => {
                  const weekStart = startOfISOWeek(new Date(entry.year, 0, 4))
                  const mondayOfWeek = new Date(weekStart)
                  mondayOfWeek.setDate(weekStart.getDate() + (entry.week - 1) * 7)
                  const weekEnd = endOfISOWeek(mondayOfWeek)

                  return (
                    <tr key={entry.id} className="group transition-colors hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <span className="inline-flex h-6 min-w-[40px] items-center justify-center rounded-md bg-primary/10 px-2 text-xs font-bold text-primary">
                          Uge {entry.week}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {format(mondayOfWeek, "d. MMM", { locale: da })} – {format(weekEnd, "d. MMM yyyy", { locale: da })}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {entry.startTime && entry.endTime
                          ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{entry.startTime} – {entry.endTime}</span>
                          : <span className="opacity-30">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">{entry.person1}</td>
                      <td className="px-5 py-4 font-medium text-foreground">{entry.person2}</td>
                      <td className="px-5 py-4 max-w-[160px] truncate text-xs text-muted-foreground">
                        {entry.note || <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(entry)}
                            title="Rediger"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(entry.id)}
                            title="Slet"
                            className="hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
