"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Trash2, Plus, Edit2, X, CalendarDays, Clock, MapPin, Tag, ChevronDown,
} from "lucide-react"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarEventEntry = {
  id: string
  title: string
  start: string
  end: string | null
  allDay: boolean
  location: string | null
  description: string | null
  category: string | null
  authorName?: string | null
}

type FormSnapshot = {
  title: string
  category: string
  allDay: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  description: string
}

const EMPTY_FORM: FormSnapshot = {
  title: "",
  category: "",
  allDay: true,
  startDate: "",
  startTime: "09:00",
  endDate: "",
  endTime: "10:00",
  location: "",
  description: "",
}

function isSameSnapshot(a: FormSnapshot, b: FormSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "Skole",    label: "Skole",    pill: "bg-blue-500/15 text-blue-400",    dot: "bg-blue-400" },
  { value: "Workshop", label: "Workshop", pill: "bg-violet-500/15 text-violet-400", dot: "bg-violet-400" },
  { value: "Fagligt",  label: "Fagligt",  pill: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400" },
  { value: "Praktik",  label: "Praktik",  pill: "bg-orange-500/15 text-orange-400", dot: "bg-orange-400" },
  { value: "Socialt",  label: "Socialt",  pill: "bg-pink-500/15 text-pink-400",    dot: "bg-pink-400" },
  { value: "Studie",   label: "Studie",   pill: "bg-teal-500/15 text-teal-400",    dot: "bg-teal-400" },
  { value: "Andet",    label: "Andet",    pill: "bg-slate-500/15 text-slate-400",  dot: "bg-slate-400" },
]

function catStyle(category: string | null) {
  return CATEGORIES.find((c) => c.value === category) ?? {
    pill: "bg-slate-500/15 text-slate-400",
    dot: "bg-slate-400",
    label: category ?? "—",
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildISO(date: string, time: string, allDay: boolean): string {
  if (!date) return ""
  return allDay ? `${date}T00:00:00` : `${date}T${time}:00`
}

function parseDate(iso: string): string {
  return iso ? iso.slice(0, 10) : ""
}

function parseTime(iso: string): string {
  return iso ? iso.slice(11, 16) : ""
}

const DK_MONTHS = [
  "januar", "februar", "marts", "april", "maj", "juni",
  "juli", "august", "september", "oktober", "november", "december",
]

function fmtDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  return `${d.getDate()}. ${DK_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTime(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarAdminPage() {
  const confirmDialog = useConfirmDialog()
  const [entries, setEntries] = useState<CalendarEventEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("10:00")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [formBaseline, setFormBaseline] = useState<FormSnapshot>(EMPTY_FORM)

  const currentSnapshot = useMemo<FormSnapshot>(() => ({
    title, category, allDay, startDate, startTime, endDate, endTime, location, description,
  }), [title, category, allDay, startDate, startTime, endDate, endTime, location, description])

  const hasUnsavedChanges = showForm && !isSameSnapshot(currentSnapshot, formBaseline)

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: editingId ? "Du har ikke-gemte ændringer" : "Du har en ikke-gemt begivenhed",
    description: "Hvis du forlader siden nu, mister du dine ændringer.",
    confirmText: "Forlad uden at gemme",
    cancelText: "Bliv og gem",
  })

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar-events")
      if (res.ok) setEntries(await res.json())
    } catch (e) {
      console.error("Failed to fetch calendar events:", e)
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
    setTitle("")
    setCategory("")
    setAllDay(true)
    setStartDate("")
    setStartTime("09:00")
    setEndDate("")
    setEndTime("10:00")
    setLocation("")
    setDescription("")
    setEditingId(null)
    setShowForm(false)
    setFormBaseline(EMPTY_FORM)
  }

  function handleEdit(entry: CalendarEventEntry) {
    const sd = parseDate(entry.start)
    const st = parseTime(entry.start) || "09:00"
    const ed = entry.end ? parseDate(entry.end) : ""
    const et = entry.end ? parseTime(entry.end) || "10:00" : "10:00"
    const snap: FormSnapshot = {
      title: entry.title,
      category: entry.category ?? "",
      allDay: entry.allDay,
      startDate: sd,
      startTime: st,
      endDate: ed,
      endTime: et,
      location: entry.location ?? "",
      description: entry.description ?? "",
    }
    setFormBaseline(snap)
    setTitle(entry.title)
    setCategory(entry.category ?? "")
    setAllDay(entry.allDay)
    setStartDate(sd)
    setStartTime(st)
    setEndDate(ed)
    setEndTime(et)
    setLocation(entry.location ?? "")
    setDescription(entry.description ?? "")
    setEditingId(entry.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate) return
    setSubmitting(true)

    const start = buildISO(startDate, startTime, allDay)
    const end = endDate ? buildISO(endDate, endTime, allDay) : null

    try {
      const url = editingId ? `/api/calendar-events/${editingId}` : "/api/calendar-events"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          start,
          end,
          allDay,
          location: location || null,
          description: description || null,
          category: category || null,
        }),
      })
      if (res.ok) {
        await fetchEntries()
        showToast("success", editingId ? "Begivenhed opdateret" : "Begivenhed oprettet")
        resetForm()
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
      title: "Slet begivenhed?",
      description: "Denne handling kan ikke fortrydes.",
      confirmText: "Slet begivenhed",
      cancelText: "Annuller",
      tone: "danger",
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/calendar-events/${id}`, { method: "DELETE" })
      if (res.ok) {
        await fetchEntries()
        showToast("success", "Begivenhed slettet")
      } else {
        showToast("error", "Fejl ved sletning")
      }
    } catch {
      showToast("error", "Fejl ved sletning")
    }
  }

  return (
    <div className="space-y-6 pb-24">

      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl animate-in slide-in-from-top-2 ${
          toast.type === "success" ? "admin-toast-success" : "admin-toast-error"
        }`}>
          {toast.text}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Kalender</h1>
            <p className="text-xs text-muted-foreground">Opret og administrer begivenheder manuelt</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm()
            } else {
              setFormBaseline(EMPTY_FORM)
              setShowForm(true)
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Annuller" : "Ny begivenhed"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-border/60 bg-card/60 shadow-sm">
          <div className="border-b border-border/40 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "Rediger begivenhed" : "Opret ny begivenhed"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">

            {/* Title + Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Titel <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Begivenhedens navn…"
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Kategori
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-input bg-transparent px-3.5 pr-9 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Ingen kategori</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* All-day toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={allDay}
                onClick={() => setAllDay((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  allDay ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                    allDay ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-foreground">Heldagsbegivenhed</span>
            </div>

            {/* Dates + Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Startdato <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {!allDay && (
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
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Slutdato
                  <span className="normal-case font-normal text-muted-foreground/60">(valgfrit)</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {!allDay && endDate && (
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
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Lokation
                <span className="normal-case font-normal text-muted-foreground/60">(valgfrit)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Fx lokale, adresse…"
                className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Beskrivelse <span className="normal-case font-normal text-muted-foreground/60">(valgfrit)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Valgfri beskrivelse af begivenheden…"
                className="w-full resize-none rounded-xl border border-input bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Annuller
              </button>
              <button
                type="submit"
                disabled={submitting || !startDate || !title}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {submitting
                  ? (editingId ? "Gemmer…" : "Opretter…")
                  : editingId ? "Gem ændringer" : "Opret begivenhed"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex h-32 items-center justify-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Henter begivenheder…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-muted/10 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Ingen begivenheder endnu</p>
          <p className="text-xs text-muted-foreground/60">Klik på &ldquo;Ny begivenhed&rdquo; for at oprette den første</p>
        </div>
      )}

      {/* Table */}
      {!loading && entries.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {["Titel", "Kategori", "Startdato", "Slutdato", "Tidspunkt", "Lokation", ""].map((h) => (
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
                  const cat = catStyle(entry.category)
                  return (
                    <tr key={entry.id} className="group transition-colors hover:bg-muted/20">
                      <td className="px-5 py-4 font-medium text-foreground max-w-[200px] truncate">
                        {entry.title}
                      </td>
                      <td className="px-5 py-4">
                        {entry.category ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${cat.pill}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
                            {entry.category}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(entry.start)}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {entry.end ? fmtDate(entry.end) : <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {entry.allDay ? (
                          <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] font-medium">Heldags</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fmtTime(entry.start)}
                            {entry.end && ` – ${fmtTime(entry.end)}`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-[140px] truncate text-xs text-muted-foreground">
                        {entry.location || <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            title="Rediger"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Slet"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
