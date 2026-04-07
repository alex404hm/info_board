"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  Plus, Trash2, X, CheckCircle, AlertCircle, Pencil,
  Archive, ArchiveRestore, ChevronDown, ChevronUp, Clock, CheckSquare, Square,
  RefreshCw, Pin, PinOff,
} from "lucide-react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { YellowStickyNote } from "@/components/YellowStickyNote"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import { useConfirmDialog } from "@/components/confirm-dialog-provider"
import { AdminCreateButton } from "../_components/AdminCreateButton"

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Message {
  id: string
  title: string
  content: string
  priority: string
  active: boolean
  authorId: string
  authorName: string | null
  activeFrom: string | null
  expiresAt: string | null
  pinned: boolean
  repeatDays: number[] | null
  createdAt: string
  updatedAt: string
  canManage: boolean
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ROTATIONS = ["-1.8deg", "1.1deg", "-0.8deg", "1.6deg", "-1.2deg", "0.9deg", "-0.4deg", "1.4deg"]

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
  high:   { label: "Høj",     color: "#ea580c" },
  urgent: { label: "Vigtigt", color: "#dc2626" },
}

const EXTEND_OPTIONS = [
  { label: "+1 dag",   days: 1 },
  { label: "+3 dage",  days: 3 },
  { label: "+1 uge",   days: 7 },
  { label: "+1 måned", days: 30 },
]

const WEEKDAYS = [
  { day: 1, short: "Man", long: "Mandag" },
  { day: 2, short: "Tir", long: "Tirsdag" },
  { day: 3, short: "Ons", long: "Onsdag" },
  { day: 4, short: "Tor", long: "Torsdag" },
  { day: 5, short: "Fre", long: "Fredag" },
  { day: 6, short: "Lør", long: "Lørdag" },
  { day: 0, short: "Søn", long: "Søndag" },
]

type MessageFormSnapshot = {
  title: string
  content: string
  priority: string
  activeFromValue: string
  expiresAtValue: string
  repeatEnabled: boolean
  repeatDaysKey: string
}

const EMPTY_FORM_SNAPSHOT: MessageFormSnapshot = {
  title: "",
  content: "",
  priority: "normal",
  activeFromValue: "",
  expiresAtValue: "",
  repeatEnabled: false,
  repeatDaysKey: "",
}

const MESSAGES_DRAFT_KEY = "admin:messages:draft:v1"

type MessagesDraft = {
  version: 1
  editingId: string | null
  title: string
  content: string
  priority: string
  activeFromDate: string | null
  activeFromTime: string
  expiresDate: string | null
  expiresTime: string
  repeatEnabled: boolean
  repeatDays: number[]
  baseline: MessageFormSnapshot
}

function repeatDaysKey(days: number[]) {
  return [...days].sort((a, b) => a - b).join(",")
}

function isSameSnapshot(a: MessageFormSnapshot, b: MessageFormSnapshot) {
  return (
    a.title === b.title &&
    a.content === b.content &&
    a.priority === b.priority &&
    a.activeFromValue === b.activeFromValue &&
    a.expiresAtValue === b.expiresAtValue &&
    a.repeatEnabled === b.repeatEnabled &&
    a.repeatDaysKey === b.repeatDaysKey
  )
}

/* ─── Sticky note card ───────────────────────────────────────────────────── */
function StickyNote({ msg, index, selectionMode, selected, onToggleSelect, onEdit, onArchive, onDelete, onExtendExpiry, onPin }: {
  msg: Message
  index: number
  selectionMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (m: Message) => void
  onArchive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  onExtendExpiry: (id: string, days: number) => void
  onPin: (id: string, pinned: boolean) => void
}) {
  const expired = msg.expiresAt ? new Date(msg.expiresAt) < new Date() : false
  const badge = PRIORITY_BADGE[msg.priority]
  const rotation = selectionMode ? "0deg" : msg.active ? ROTATIONS[index % ROTATIONS.length] : "0deg"
  const [showExtend, setShowExtend] = useState(false)
  const extendRef = useRef<HTMLDivElement>(null)
  const repeatDays = msg.repeatDays ?? []

  useEffect(() => {
    if (!showExtend) return
    function handleClick(e: MouseEvent) {
      if (extendRef.current && !extendRef.current.contains(e.target as Node)) {
        setShowExtend(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showExtend])

  const tags = (
    <div style={{ display: "flex", gap: 5, marginBottom: 6, position: "relative", zIndex: 2, flexWrap: "wrap" }}>
      {msg.pinned && (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "#7c3aed", color: "#fff", borderRadius: 3, padding: "1px 6px" }}>
          📌 Fastgjort
        </span>
      )}
      {badge && (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: badge.color, color: "#fff", borderRadius: 3, padding: "1px 6px" }}>
          {badge.label}
        </span>
      )}
      {!msg.active && (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(80,80,80,0.18)", color: "#444", borderRadius: 3, padding: "1px 6px" }}>
          Arkiveret
        </span>
      )}
      {expired && msg.active && (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(220,38,38,0.15)", color: "#dc2626", borderRadius: 3, padding: "1px 6px" }}>
          Udløbet
        </span>
      )}
      {msg.activeFrom ? (
        <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.13)", color: "#065f46", borderRadius: 3, padding: "1px 6px", display: "flex", alignItems: "center", gap: 2 }}>
          📅 {format(new Date(msg.activeFrom), "d. MMM")} – {msg.expiresAt ? format(new Date(msg.expiresAt), "d. MMM") : "∞"}
        </span>
      ) : msg.expiresAt && !expired ? (
        <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(0,0,0,0.08)", color: "#555", borderRadius: 3, padding: "1px 6px" }}>
          Udløber {format(new Date(msg.expiresAt), "d. MMM")}
        </span>
      ) : null}
      {repeatDays.length > 0 && (
        <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(37,99,235,0.12)", color: "#2563eb", borderRadius: 3, padding: "1px 6px", display: "flex", alignItems: "center", gap: 2 }}>
          ↺ {repeatDays.map(d => WEEKDAYS.find(w => w.day === d)?.short).filter(Boolean).join(", ")}
        </span>
      )}
    </div>
  )

  const actions = msg.canManage ? (
    <div
      style={{
        position: "relative",
        zIndex: 4,
        display: "flex",
        alignItems: "center",
        gap: 2,
        marginTop: 10,
        paddingTop: 6,
        borderTop: "1px solid rgba(26,26,110,0.12)",
        opacity: !msg.active ? 0.6 : 1,
      }}
    >
      <button onClick={() => onPin(msg.id, msg.pinned)} title={msg.pinned ? "Frigør" : "Fastgør besked"} className="rounded-md p-1.5 transition-colors hover:bg-white/60" style={{ color: "#1a1a5e", outline: "none" }}>
        {msg.pinned ? <PinOff size={13} /> : <Pin size={13} />}
      </button>
      <button onClick={() => onEdit(msg)} title="Rediger" className="rounded-md p-1.5 transition-colors hover:bg-white/60" style={{ color: "#1a1a5e" }}>
        <Pencil size={13} />
      </button>
      <button onClick={() => onArchive(msg.id, msg.active)} title={msg.active ? "Arkiver" : "Genaktiver"} className="rounded-md p-1.5 transition-colors hover:bg-white/60" style={{ color: "#1a1a5e" }}>
        {msg.active ? <Archive size={13} /> : <ArchiveRestore size={13} />}
      </button>

      {/* Extend expiry */}
      <div ref={extendRef} className="relative">
        <button
          onClick={() => setShowExtend((v) => !v)}
          title="Forlæng udløbsdato"
          className="rounded-md p-1.5 transition-colors hover:bg-white/60"
          style={{ color: "#1a1a5e" }}
        >
          <Clock size={13} />
        </button>
        {showExtend && (
          <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[110px] rounded-lg border border-border/60 bg-white shadow-xl py-1">
            {EXTEND_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => { onExtendExpiry(msg.id, opt.days); setShowExtend(false) }}
                className="w-full px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-yellow-50 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => onDelete(msg.id)} title="Slet" className="ml-auto rounded-md p-1.5 transition-colors hover:bg-red-200/60" style={{ color: "#dc2626" }}>
        <Trash2 size={13} />
      </button>
    </div>
  ) : null

  return (
    <div
      className="relative"
      style={{ opacity: !msg.active ? 0.6 : expired ? 0.75 : 1 }}
      onClick={selectionMode ? () => onToggleSelect(msg.id) : undefined}
    >
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <div
            className="flex h-5 w-5 items-center justify-center rounded"
            style={{
              background: selected ? "#2563eb" : "rgba(255,255,255,0.85)",
              border: selected ? "2px solid #2563eb" : "2px solid #aaa",
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            {selected && <CheckSquare size={12} color="#fff" />}
          </div>
        </div>
      )}
      <div style={{ cursor: selectionMode ? "pointer" : undefined }}>
        <YellowStickyNote
          title={msg.title}
          content={msg.content}
          authorName={msg.authorName}
          createdAt={msg.createdAt}
          rotation={rotation}
          bodyClassName="sticky-y-body sticky-y-body-full"
          headerSlot={tags}
          footerSlot={selectionMode ? null : actions}
          outlineColor={selectionMode && selected ? "#2563eb" : undefined}
        />
      </div>
    </div>
  )
}

/* ─── Priority picker (new UI: mini sticky note previews) ───────────────── */
const PRIORITY_OPTIONS = [
  { key: "normal", label: "Normal",  color: "#ca8a04", tapeColor: "#fde047" },
  { key: "high",   label: "Høj",     color: "#ea580c", tapeColor: "#fb923c" },
  { key: "urgent", label: "Vigtigt", color: "#dc2626", tapeColor: "#f87171" },
]

function PriorityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PRIORITY_OPTIONS.map(({ key, label, color, tapeColor }) => {
        const selected = value === key
        const badge = PRIORITY_BADGE[key]
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="relative flex flex-col overflow-visible transition-all"
            style={{
              outline: selected ? `2px solid ${color}` : "2px solid transparent",
              outlineOffset: 3,
              boxShadow: selected ? `0 0 0 4px ${color}28` : "none",
              borderRadius: 6,
            }}
          >
            {/* Mini sticky note */}
            <div
              style={{
                background: "linear-gradient(168deg,#fffde7 0%,#fef9c3 38%,#fef08a 100%)",
                borderRadius: 6,
                padding: "20px 10px 12px",
                position: "relative",
                overflow: "hidden",
                minHeight: 90,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                boxShadow: "2px 4px 10px rgba(0,0,0,0.18)",
              }}
            >
              {/* Tape at top */}
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 36,
                height: 10,
                background: tapeColor,
                opacity: 0.85,
                borderRadius: "0 0 3px 3px",
              }} />

              {/* Red margin line */}
              <div style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: 14,
                width: 1,
                background: "rgba(220,38,38,0.25)",
              }} />

              {/* Priority badge */}
              {badge ? (
                <span style={{
                  fontSize: 7,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  background: badge.color,
                  color: "#fff",
                  borderRadius: 2,
                  padding: "1px 4px",
                  alignSelf: "stretch",
                  width: "100%",
                  textAlign: "center",
                  display: "block",
                  position: "relative",
                  zIndex: 2,
                }}>
                  {badge.label}
                </span>
              ) : (
                <div style={{ height: 11 }} />
              )}

              {/* Fake title line */}
              <div style={{ height: 5, background: "rgba(15,15,69,0.35)", borderRadius: 3, width: "80%", marginLeft: 4 }} />
              {/* Fake content lines */}
              <div style={{ height: 3, background: "rgba(15,15,69,0.18)", borderRadius: 3, width: "95%", marginLeft: 4, marginTop: 2 }} />
              <div style={{ height: 3, background: "rgba(15,15,69,0.18)", borderRadius: 3, width: "75%", marginLeft: 4 }} />
              <div style={{ height: 3, background: "rgba(15,15,69,0.18)", borderRadius: 3, width: "85%", marginLeft: 4 }} />

              {/* Selected checkmark */}
              {selected && (
                <span
                  className="absolute right-1.5 bottom-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white"
                  style={{ background: color, fontSize: 8, zIndex: 3 }}
                >
                  ✓
                </span>
              )}
            </div>

            {/* Label below the note */}
            <span
              className="mt-1.5 text-center text-xs font-semibold"
              style={{ color: selected ? color : "var(--muted-foreground)" }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Weekday picker ─────────────────────────────────────────────────────── */
function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }
  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEEKDAYS.map(({ day, short }) => {
        const active = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all border"
            style={{
              background: active ? "var(--primary)" : "transparent",
              color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
              borderColor: active ? "var(--primary)" : "var(--border)",
            }}
          >
            {short}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function MessagesPage() {
  const MAX_TITLE = 80
  const MAX_BODY = 280

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<string>("normal")
  const [activeFromDate, setActiveFromDate] = useState<Date | undefined>(undefined)
  const [activeFromTime, setActiveFromTime] = useState("")
  const [expiresDate, setExpiresDate] = useState<Date | undefined>(undefined)
  const [expiresTime, setExpiresTime] = useState("")
  const [repeatEnabled, setRepeatEnabled] = useState(false)
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [formBaseline, setFormBaseline] = useState<MessageFormSnapshot>(EMPTY_FORM_SNAPSHOT)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  /* ─ Selection state ─ */
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkExtend, setShowBulkExtend] = useState(false)
  const bulkExtendRef = useRef<HTMLDivElement>(null)
  const confirmDialog = useConfirmDialog()

  useEffect(() => {
    if (!showBulkExtend) return
    function handleClick(e: MouseEvent) {
      if (bulkExtendRef.current && !bulkExtendRef.current.contains(e.target as Node)) {
        setShowBulkExtend(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showBulkExtend])

  const activeFromValue = activeFromDate
    ? activeFromTime
      ? `${format(activeFromDate, "yyyy-MM-dd")}T${activeFromTime}`
      : format(activeFromDate, "yyyy-MM-dd")
    : ""

  const expiresAtValue = expiresDate
    ? expiresTime
      ? `${format(expiresDate, "yyyy-MM-dd")}T${expiresTime}`
      : format(expiresDate, "yyyy-MM-dd")
    : ""

  const currentFormSnapshot = useMemo<MessageFormSnapshot>(() => ({
    title,
    content,
    priority,
    activeFromValue,
    expiresAtValue,
    repeatEnabled,
    repeatDaysKey: repeatDaysKey(repeatDays),
  }), [title, content, priority, activeFromValue, expiresAtValue, repeatEnabled, repeatDays])

  const hasUnsavedChanges = showForm && !isSameSnapshot(currentFormSnapshot, formBaseline)

  useUnsavedChangesGuard({
    enabled: hasUnsavedChanges,
    title: "Er du sikker på, at du vil forlade siden?",
    description: "Hvis du forlader siden nu, mister du dine ændringer.",
    confirmText: "Forlad uden at gemme",
    cancelText: "Annullere",
    onConfirmLeave: () => {
      localStorage.removeItem(MESSAGES_DRAFT_KEY)
    },
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MESSAGES_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as MessagesDraft
      if (!draft || draft.version !== 1) return

      setEditingId(draft.editingId)
      setTitle(draft.title)
      setContent(draft.content)
      setPriority(draft.priority)
      setActiveFromDate(draft.activeFromDate ? new Date(draft.activeFromDate) : undefined)
      setActiveFromTime(draft.activeFromTime)
      setExpiresDate(draft.expiresDate ? new Date(draft.expiresDate) : undefined)
      setExpiresTime(draft.expiresTime)
      setRepeatEnabled(draft.repeatEnabled)
      setRepeatDays(Array.isArray(draft.repeatDays) ? draft.repeatDays : [])
      setFormBaseline(draft.baseline ?? EMPTY_FORM_SNAPSHOT)
      setShowForm(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      localStorage.removeItem(MESSAGES_DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (!showForm || !hasUnsavedChanges) {
      localStorage.removeItem(MESSAGES_DRAFT_KEY)
      return
    }

    const draft: MessagesDraft = {
      version: 1,
      editingId,
      title,
      content,
      priority,
      activeFromDate: activeFromDate ? activeFromDate.toISOString() : null,
      activeFromTime,
      expiresDate: expiresDate ? expiresDate.toISOString() : null,
      expiresTime,
      repeatEnabled,
      repeatDays,
      baseline: formBaseline,
    }

    localStorage.setItem(MESSAGES_DRAFT_KEY, JSON.stringify(draft))
  }, [
    showForm,
    hasUnsavedChanges,
    editingId,
    title,
    content,
    priority,
    activeFromDate,
    activeFromTime,
    expiresDate,
    expiresTime,
    repeatEnabled,
    repeatDays,
    formBaseline,
  ])

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function resetForm() {
    setTitle(""); setContent(""); setPriority("normal")
    setActiveFromDate(undefined); setActiveFromTime("")
    setExpiresDate(undefined); setExpiresTime("")
    setRepeatEnabled(false); setRepeatDays([]); setEditingId(null); setShowForm(false)
    setFormBaseline(EMPTY_FORM_SNAPSHOT)
    localStorage.removeItem(MESSAGES_DRAFT_KEY)
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll(pool: Message[]) {
    setSelectedIds(new Set(pool.map((m) => m.id)))
  }

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages?admin=true")
      if (res.ok) setMessages(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { void fetchMessages() }, [fetchMessages])

  function broadcastUpdate() {
    try { new BroadcastChannel("messages_updated").postMessage(null) } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingId ? `/api/messages/${editingId}` : "/api/messages"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          priority,
          activeFrom: activeFromValue || null,
          expiresAt: expiresAtValue || null,
          repeatDays: repeatEnabled ? repeatDays : [],
        }),
      })
      if (res.ok) {
        resetForm()
        showToast("success", editingId ? "Besked opdateret" : "Besked oprettet")
        broadcastUpdate()
        void fetchMessages()
      } else {
        const d = await res.json().catch(() => null)
        showToast("error", d?.error ?? "Kunne ikke gemme besked")
      }
    } catch {
      showToast("error", "Netværksfejl — prøv igen")
    }
    setSubmitting(false)
  }

  function handleEdit(msg: Message) {
    const af = msg.activeFrom ? new Date(msg.activeFrom) : null
    const d = msg.expiresAt ? new Date(msg.expiresAt) : null
    const initialActiveFrom = af
      ? `${format(af, "yyyy-MM-dd")}T${af.toTimeString().slice(0, 5)}`
      : ""
    const initialExpires = d
      ? `${format(d, "yyyy-MM-dd")}T${d.toTimeString().slice(0, 5)}`
      : ""
    const initialRepeatDays = msg.repeatDays ?? []
    const hasInterval = !!af

    setFormBaseline({
      title: msg.title,
      content: msg.content,
      priority: msg.priority,
      activeFromValue: initialActiveFrom,
      expiresAtValue: initialExpires,
      repeatEnabled: initialRepeatDays.length > 0,
      repeatDaysKey: repeatDaysKey(initialRepeatDays),
    })

    setEditingId(msg.id); setTitle(msg.title); setContent(msg.content)
    setPriority(msg.priority)
    if (af) {
      setActiveFromDate(af)
      setActiveFromTime(af.toTimeString().slice(0, 5))
    } else {
      setActiveFromDate(undefined)
      setActiveFromTime("")
    }
    if (d) {
      setExpiresDate(d)
      setExpiresTime(d.toTimeString().slice(0, 5))
    } else {
      setExpiresDate(undefined)
      setExpiresTime("")
    }
    const rDays = msg.repeatDays ?? []
    setRepeatEnabled(rDays.length > 0)
    setRepeatDays(rDays)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleArchive(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })
      if (res.ok) {
        showToast("success", active ? "Besked arkiveret" : "Besked genaktiveret")
        broadcastUpdate()
        void fetchMessages()
      }
    } catch { showToast("error", "Netværksfejl — prøv igen") }
  }

  async function handleDelete(id: string) {
    const ok = await confirmDialog({
      title: "Slet besked?",
      description: "Denne handling kan ikke fortrydes.",
      confirmText: "Slet besked",
      cancelText: "Annuller",
      tone: "danger",
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("success", "Besked slettet")
        broadcastUpdate()
        void fetchMessages()
      }
    } catch { showToast("error", "Netværksfejl — prøv igen") }
  }

  async function handleExtendExpiry(id: string, days: number) {
    const msg = messages.find((m) => m.id === id)
    if (!msg) return
    const base = msg.expiresAt ? new Date(msg.expiresAt) : new Date()
    base.setDate(base.getDate() + days)
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: base.toISOString() }),
      })
      if (res.ok) {
        showToast("success", `Udløbsdato sat til ${format(base, "d. MMM yyyy")}`)
        broadcastUpdate()
        void fetchMessages()
      }
    } catch { showToast("error", "Netværksfejl — prøv igen") }
  }

  async function handlePin(id: string, currentlyPinned: boolean) {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentlyPinned }),
      })
      if (res.ok) {
        showToast("success", currentlyPinned ? "Besked frigjort" : "Besked fastgjort 📌")
        broadcastUpdate()
        void fetchMessages()
      }
    } catch { showToast("error", "Netværksfejl — prøv igen") }
  }

  /* ─ Bulk actions ─ */
  async function handleBulkDelete() {
    const count = selectedIds.size
    const ok = await confirmDialog({
      title: `Slet ${count} ${count === 1 ? "besked" : "beskeder"}?`,
      description: "Denne handling kan ikke fortrydes.",
      confirmText: "Slet",
      cancelText: "Annuller",
      tone: "danger",
    })
    if (!ok) return
    await Promise.all([...selectedIds].map((id) => fetch(`/api/messages/${id}`, { method: "DELETE" })))
    showToast("success", `${count} ${count === 1 ? "besked" : "beskeder"} slettet`)
    exitSelectionMode()
    broadcastUpdate()
    void fetchMessages()
  }

  async function handleBulkArchive() {
    const ids = [...selectedIds]
    await Promise.all(ids.map((id) =>
      fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      })
    ))
    showToast("success", `${ids.length} ${ids.length === 1 ? "besked" : "beskeder"} arkiveret`)
    exitSelectionMode()
    broadcastUpdate()
    void fetchMessages()
  }

  async function handleBulkExtendExpiry(days: number) {
    const ids = [...selectedIds]
    setShowBulkExtend(false)
    await Promise.all(ids.map(async (id) => {
      const msg = messages.find((m) => m.id === id)
      if (!msg) return
      const base = msg.expiresAt ? new Date(msg.expiresAt) : new Date()
      base.setDate(base.getDate() + days)
      return fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: base.toISOString() }),
      })
    }))
    const opt = EXTEND_OPTIONS.find((o) => o.days === days)
    showToast("success", `Udløbsdato forlænget ${opt?.label ?? ""} for ${ids.length} ${ids.length === 1 ? "besked" : "beskeder"}`)
    exitSelectionMode()
    broadcastUpdate()
    void fetchMessages()
  }

  const active   = messages.filter((m) => m.active)
  const archived = messages.filter((m) => !m.active)
  const pinned   = active.filter((m) => m.pinned)
  const unpinned = active.filter((m) => !m.pinned)

  const activeSelectedCount  = [...selectedIds].filter((id) => active.find((m) => m.id === id)).length
  const anySelected = selectedIds.size > 0

  // Visible pool for select-all (both active + visible archived)
  const visiblePool = [...active, ...(showArchived ? archived : [])]

  return (
    <div className="space-y-8 pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl animate-in slide-in-from-top-2 ${
          toast.type === "success"
            ? "admin-toast-success"
            : "admin-toast-error"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Beskeder</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Opret opslag til infoskærmen
            {active.length > 0 && <span> — {active.length} {active.length === 1 ? "aktiv" : "aktive"}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && messages.length > 0 && (
            <button
              onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                selectionMode
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              {selectionMode ? "Annuller valg" : "Vælg flere"}
            </button>
          )}
          {!selectionMode && (
            showForm ? (
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
                  setFormBaseline(EMPTY_FORM_SNAPSHOT)
                  setShowForm(true)
                }}
              >
                Ny besked
              </AdminCreateButton>
            )
          )}
        </div>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-7 shadow-xl md:p-8">
          <h2 className="mb-6 text-lg font-bold text-foreground">{editingId ? "Rediger besked" : "Ny besked"}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-foreground">Titel</label>
                <span className="text-xs text-muted-foreground">{title.length}/{MAX_TITLE}</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="f.eks. Kantinen er lukket onsdag"
                required
                maxLength={MAX_TITLE}
                autoFocus
                className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-foreground">Indhold</label>
                <span className="text-xs text-muted-foreground">{content.length}/{MAX_BODY}</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Beskedens indhold vises på infoskærmen…"
                required
                rows={5}
                maxLength={MAX_BODY}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prioritet</label>
              <PriorityPicker value={priority} onChange={setPriority} />
            </div>

            {/* Date / interval section */}
            <div className="space-y-4 rounded-xl border border-border/50 bg-card/30 p-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktiv fra</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal" style={!activeFromDate ? { color: "var(--muted-foreground)" } : {}}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activeFromDate ? format(activeFromDate, "d. MMM yyyy") : "Vælg startdato"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={activeFromDate} onSelect={(d) => setActiveFromDate(d ?? undefined)} initialFocus />
                        {activeFromDate && (
                          <div className="border-t p-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">Tidspunkt</label>
                              <input type="time" value={activeFromTime} onChange={(e) => setActiveFromTime(e.target.value)} className="h-8 rounded border border-input bg-transparent px-2 text-sm outline-none focus:border-primary/60" />
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    {activeFromDate && (
                      <Button type="button" variant="outline" onClick={() => { setActiveFromDate(undefined); setActiveFromTime("") }} className="px-3">✕</Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Udløber</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal" style={!expiresDate ? { color: "var(--muted-foreground)" } : {}}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expiresDate ? format(expiresDate, "d. MMM yyyy") : "Vælg slutdato"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={expiresDate} onSelect={(d) => setExpiresDate(d ?? undefined)} initialFocus />
                        {expiresDate && (
                          <div className="border-t p-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-muted-foreground">Tidspunkt</label>
                              <input type="time" value={expiresTime} onChange={(e) => setExpiresTime(e.target.value)} className="h-8 rounded border border-input bg-transparent px-2 text-sm outline-none focus:border-primary/60" />
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    {expiresDate && (
                      <Button type="button" variant="outline" onClick={() => { setExpiresDate(undefined); setExpiresTime("") }} className="px-3">✕</Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Lad felterne stå tomme for visning uden tidsstyring</p>
              </div>
            </div>

            {/* Repeat / recurrence */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-card/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Gentag besked</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={repeatEnabled}
                  onClick={() => { setRepeatEnabled((v) => !v); if (repeatEnabled) setRepeatDays([]) }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    repeatEnabled ? "bg-primary" : "bg-input"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      repeatEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {repeatEnabled && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Besked vises kun på de valgte ugedage
                  </p>
                  <WeekdayPicker value={repeatDays} onChange={setRepeatDays} />
                  {repeatDays.length > 0 && (
                    <p className="text-xs text-primary">
                      Vises hver: {repeatDays
                        .slice()
                        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                        .map(d => WEEKDAYS.find(w => w.day === d)?.long)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-5">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-6 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:text-foreground"
              >
                Annuller
              </button>
              {editingId ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Gemmer..." : "Gem ændringer"}
                </button>
              ) : (
                <AdminCreateButton type="submit" disabled={submitting} className="px-6">
                  {submitting ? "Sender..." : "Send besked"}
                </AdminCreateButton>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Selection toolbar ── */}
      {selectionMode && (active.length > 0 || (showArchived && archived.length > 0)) && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-2.5 text-sm">
          <button
            onClick={() => selectedIds.size === visiblePool.length ? setSelectedIds(new Set()) : selectAll(visiblePool)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedIds.size === visiblePool.length && visiblePool.length > 0
              ? <CheckSquare className="h-4 w-4 text-primary" />
              : <Square className="h-4 w-4" />
            }
            {selectedIds.size === visiblePool.length && visiblePool.length > 0 ? "Fravælg alle" : "Vælg alle"}
          </button>
          <span className="text-muted-foreground/50">|</span>
          <span className="text-muted-foreground">{selectedIds.size} valgt</span>
        </div>
      )}

      {/* ── Pinned messages ── */}
      {!loading && pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-violet-500">Fastgjorte beskeder</span>
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold text-violet-500">{pinned.length}</span>
          </div>
          <div className="admin-sticky-grid">
            {pinned.map((msg, i) => (
              <StickyNote
                key={msg.id}
                msg={msg}
                index={i}
                selectionMode={selectionMode}
                selected={selectedIds.has(msg.id)}
                onToggleSelect={toggleSelect}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onExtendExpiry={handleExtendExpiry}
                onPin={handlePin}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Active messages ── */}
      {loading ? (
        <div className="flex h-32 items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Henter beskeder…</span>
        </div>
      ) : active.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/30 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-card/40">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">Ingen aktive beskeder</p>
          <p className="text-sm text-muted-foreground/70">Klik på &ldquo;Ny besked&rdquo; for at oprette dit første opslag</p>
        </div>
      ) : unpinned.length > 0 ? (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Øvrige beskeder</span>
            </div>
          )}
          <div className="admin-sticky-grid">
            {unpinned.map((msg, i) => (
              <StickyNote
                key={msg.id}
                msg={msg}
                index={i}
                selectionMode={selectionMode}
                selected={selectedIds.has(msg.id)}
                onToggleSelect={toggleSelect}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onExtendExpiry={handleExtendExpiry}
                onPin={handlePin}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Archived ── */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {showArchived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <Archive className="h-4 w-4" />
            Arkiverede beskeder ({archived.length})
          </button>

          {showArchived && (
            <div className="admin-sticky-grid mt-4">
              {archived.map((msg, i) => (
                <StickyNote
                  key={msg.id}
                  msg={msg}
                  index={i}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(msg.id)}
                  onToggleSelect={toggleSelect}
                  onEdit={handleEdit}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onExtendExpiry={handleExtendExpiry}
                  onPin={handlePin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bulk action bar ── */}
      {selectionMode && anySelected && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border/60 bg-background/95 px-5 py-3 shadow-2xl backdrop-blur-sm">
          <span className="text-sm font-medium text-muted-foreground pr-1">
            {selectedIds.size} valgt
          </span>

          {/* Bulk extend expiry */}
          <div ref={bulkExtendRef} className="relative">
            <button
              onClick={() => setShowBulkExtend((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm font-semibold border border-border/60 transition-all hover:bg-card/80 active:scale-95"
            >
              <Clock className="h-4 w-4" />
              Forlæng tid
            </button>
            {showBulkExtend && (
              <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[120px] rounded-lg border border-border/60 bg-background shadow-xl py-1">
                {EXTEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => handleBulkExtendExpiry(opt.days)}
                    className="w-full px-3 py-2 text-left text-sm font-medium hover:bg-card transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeSelectedCount > 0 && (
            <button
              onClick={handleBulkArchive}
              className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm font-semibold border border-border/60 transition-all hover:bg-card/80 active:scale-95"
            >
              <Archive className="h-4 w-4" />
              Arkiver
            </button>
          )}
          <button
            onClick={handleBulkDelete}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            Slet
          </button>
          <button
            onClick={exitSelectionMode}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
