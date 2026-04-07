"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Trash2, Edit2, X, CalendarDays, Clock, MapPin, Tag, ChevronDown, CalendarIcon, Plus,
} from "lucide-react"
import { format } from "date-fns"
import { da } from "date-fns/locale"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AdminCreateButton } from "../_components/AdminCreateButton"

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

type CalendarCategory = {
  id: string
  name: string
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
  const [categories, setCategories] = useState<CalendarCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<CalendarEventEntry | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("09:00")
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState("10:00")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [formBaseline, setFormBaseline] = useState<FormSnapshot>(EMPTY_FORM)

  // Address autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [locationOpen, setLocationOpen] = useState(false)
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const locationWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    const q = location.trim()
    if (q.length < 2) { setLocationSuggestions([]); setLocationOpen(false); return }
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.dataforsyningen.dk/autocomplete?type=adresse&stormodtagerpostnumre=true&supplerendebynavn=true&fuzzy=true&q=${encodeURIComponent(q)}&startfra=vejnavn`
        )
        if (!res.ok) return
        const data = (await res.json()) as { tekst: string }[]
        setLocationSuggestions(data.slice(0, 8).map((d) => d.tekst))
        setLocationOpen(true)
      } catch { /* ignore */ }
    }, 250)
    return () => { if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current) }
  }, [location])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(e.target as Node)) {
        setLocationOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Derived string values for buildISO / snapshot
  const startDate = startDateObj ? format(startDateObj, "yyyy-MM-dd") : ""
  const endDate = endDateObj ? format(endDateObj, "yyyy-MM-dd") : ""

  const currentSnapshot = useMemo<FormSnapshot>(() => ({
    title, category, allDay,
    startDate: startDateObj ? format(startDateObj, "yyyy-MM-dd") : "",
    startTime,
    endDate: endDateObj ? format(endDateObj, "yyyy-MM-dd") : "",
    endTime, location, description,
  }), [title, category, allDay, startDateObj, startTime, endDateObj, endTime, location, description])

  const hasUnsavedChanges = showForm && !isSameSnapshot(currentSnapshot, formBaseline)

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Er du sikker på, at du vil forlade siden?",
    description: "Hvis du forlader siden nu, mister du dine ændringer.",
    confirmText: "Forlad",
    cancelText: "Bliv og gem",
  })

  const categoryOptions = useMemo(() => {
    if (!category) return categories
    const exists = categories.some((item) => item.name === category)
    return exists ? categories : [{ id: "__selected__", name: category }, ...categories]
  }, [categories, category])

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar-events")
      if (res.ok) setEntries(await res.json())
    } catch (e) {
      console.error("Failed to fetch calendar events:", e)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar-categories")
      if (!res.ok) return
      const data = (await res.json()) as CalendarCategory[]
      setCategories(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Failed to fetch calendar categories:", e)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchEntries(), fetchCategories()])
    } finally {
      setLoading(false)
    }
  }, [fetchCategories, fetchEntries])

  useEffect(() => { void loadData() }, [loadData])

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function resetForm() {
    setTitle("")
    setCategory("")
    setAllDay(true)
    setStartDateObj(undefined)
    setStartTime("09:00")
    setEndDateObj(undefined)
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
    const sdObj = sd ? new Date(sd + "T12:00:00") : undefined
    const edObj = ed ? new Date(ed + "T12:00:00") : undefined
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
    setStartDateObj(sdObj)
    setStartTime(st)
    setEndDateObj(edObj)
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

  function handleDelete(entry: CalendarEventEntry) {
    setDeleteEntry(entry)
  }

  async function confirmDeleteEntry() {
    if (!deleteEntry) return
    const id = deleteEntry.id
    setDeletingEntryId(id)
    try {
      const res = await fetch(`/api/calendar-events/${id}`, { method: "DELETE" })
      if (res.ok) {
        await fetchEntries()
        showToast("success", "Begivenhed slettet")
        setDeleteEntry(null)
      } else {
        showToast("error", "Fejl ved sletning")
      }
    } catch {
      showToast("error", "Fejl ved sletning")
    } finally {
      setDeletingEntryId(null)
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    setCreatingCategory(true)
    try {
      const res = await fetch("/api/calendar-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) {
        showToast("error", "Kunne ikke oprette kategori")
        return
      }

      const created = (await res.json()) as CalendarCategory
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "da")))
      setCategory(created.name)
      setNewCategoryName("")
      setCategoryPopoverOpen(false)
      showToast("success", "Kategori oprettet")
    } catch {
      showToast("error", "Kunne ikke oprette kategori")
    } finally {
      setCreatingCategory(false)
    }
  }

  async function handleDeleteCategory(item: CalendarCategory) {
    const ok = await confirmDialog({
      title: "Slet kategori?",
      description: "Kategorien fjernes fra listen og fra begivenheder, der bruger den.",
      confirmText: "Slet kategori",
      cancelText: "Annullere",
      tone: "danger",
    })

    if (!ok) return

    setDeletingCategoryId(item.id)
    try {
      const res = await fetch(`/api/calendar-categories/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        showToast("error", "Kunne ikke slette kategori")
        return
      }

      setCategories((prev) => prev.filter((categoryItem) => categoryItem.id !== item.id))
      if (category === item.name) {
        setCategory("")
      }
      await fetchEntries()
      showToast("success", "Kategori slettet")
    } catch {
      showToast("error", "Kunne ikke slette kategori")
    } finally {
      setDeletingCategoryId(null)
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
        {showForm ? (
          <Button
            variant="outline"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <X className="h-4 w-4" />
            Annuller
          </Button>
        ) : (
          <AdminCreateButton
            onClick={() => {
              setFormBaseline(EMPTY_FORM)
              setShowForm(true)
            }}
          >
            Ny begivenhed
          </AdminCreateButton>
        )}
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
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 justify-between rounded-xl border-input bg-transparent px-3.5 font-normal"
                      >
                        <span className="truncate text-sm text-left">
                          {category || "Ingen kategori"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl">
                      <DropdownMenuLabel>Vælg kategori</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setCategory("")} className={category === "" ? "bg-accent" : ""}>
                        Ingen kategori
                      </DropdownMenuItem>
                      {categoryOptions.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => setCategory(item.name)}
                          className={category === item.name ? "bg-accent" : ""}
                        >
                          {item.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="h-10 w-10 rounded-xl border-border/70 bg-card/60 hover:bg-muted/60"
                        title="Opret kategori"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 rounded-2xl border border-border/60 bg-popover/95 p-3 shadow-xl" align="end">
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ny kategori</p>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Navn på kategori"
                        className="h-8 w-full rounded-lg border border-input/80 bg-background/70 px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/25"
                      />

                      <div className="mt-2.5 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 rounded-lg px-3"
                          disabled={creatingCategory || !newCategoryName.trim()}
                          onClick={handleCreateCategory}
                        >
                          {creatingCategory ? "Gemmer..." : "Opret"}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl text-left font-normal"
                      style={!startDateObj ? { color: "var(--muted-foreground)" } : {}}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateObj ? format(startDateObj, "d. MMM yyyy", { locale: da }) : "Vælg startdato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDateObj}
                      onSelect={(d) => setStartDateObj(d ?? undefined)}
                      locale={da}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start rounded-xl text-left font-normal"
                        style={!endDateObj ? { color: "var(--muted-foreground)" } : {}}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDateObj ? format(endDateObj, "d. MMM yyyy", { locale: da }) : "Vælg slutdato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDateObj}
                        onSelect={(d) => setEndDateObj(d ?? undefined)}
                        disabled={(d) => startDateObj ? d < startDateObj : false}
                        locale={da}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {endDateObj && (
                    <Button type="button" variant="outline" className="rounded-xl px-3" onClick={() => setEndDateObj(undefined)}>✕</Button>
                  )}
                </div>
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
              <div ref={locationWrapperRef} className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setLocationOpen(true) }}
                  onFocus={() => { if (locationSuggestions.length > 0) setLocationOpen(true) }}
                  placeholder="Fx lokale, adresse…"
                  className="h-10 w-full rounded-xl border border-input bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
                  autoComplete="off"
                />
                {locationOpen && locationSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg">
                    {locationSuggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setLocation(s)
                            setLocationOpen(false)
                            setLocationSuggestions([])
                          }}
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuller
              </Button>
              {editingId ? (
                <Button type="submit" disabled={submitting || !startDate || !title}>
                  {submitting ? "Gemmer..." : "Gem ændringer"}
                </Button>
              ) : (
                <AdminCreateButton type="submit" disabled={submitting || !startDate || !title}>
                  {submitting ? "Opretter..." : "Opret begivenhed"}
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
                  return (
                    <tr key={entry.id} className="group transition-colors hover:bg-muted/20">
                      <td className="px-5 py-4 font-medium text-foreground max-w-[200px] truncate">
                        {entry.title}
                      </td>
                      <td className="px-5 py-4">
                        {entry.category ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-500/15 px-2 py-0.5 text-xs font-semibold text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
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
                        <div className="flex items-center gap-1">
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
                            onClick={() => handleDelete(entry)}
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

      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent size="sm" className="border-border/60 bg-popover text-foreground dark:bg-[lab(7.78201%_-.0000149012_0)]">
          <AlertDialogHeader className="text-center">
            <AlertDialogMedia className="mx-auto bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-foreground">Slet begivenhed?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Er du sikker på, at du vil slette begivenheden <strong className="font-semibold text-foreground">{deleteEntry?.title}</strong>? Handlingen kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2.5 bg-transparent pt-2">
            <AlertDialogCancel variant="outline" className="h-10 rounded-lg border-border/70 bg-muted/50 text-foreground hover:bg-muted" disabled={deletingEntryId === deleteEntry?.id}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-10 rounded-lg font-semibold text-destructive-foreground"
              disabled={deletingEntryId === deleteEntry?.id}
              onClick={() => { void confirmDeleteEntry() }}
            >
              {deletingEntryId === deleteEntry?.id ? "Sletter..." : "Slet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
