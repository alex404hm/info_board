"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, X, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react"

interface Message {
  id: string
  title: string
  content: string
  priority: string
  active: boolean
  authorName: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

const priorityConfig = {
  urgent: { label: "Vigtig", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-500/30" },
  high: { label: "Høj", icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-500/30" },
  normal: { label: "Normal", icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/30" },
}

export default function MessagesPage() {
  const MAX_TITLE_CHARS = 80
  const MAX_MESSAGE_CHARS = 280
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState("normal")
  const [expiresAt, setExpiresAt] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages?admin=true")
      if (res.ok) {
        setMessages(await res.json())
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          priority,
          expiresAt: expiresAt || null,
        }),
      })

      if (res.ok) {
        setTitle("")
        setContent("")
        setPriority("normal")
        setExpiresAt("")
        setShowForm(false)
        showToast("success", "Besked blev oprettet")
        fetchMessages()
      } else {
        const data = await res.json().catch(() => null)
        showToast("error", data?.error || "Kunne ikke oprette besked")
      }
    } catch {
      showToast("error", "Netværksfejl — prøv igen")
    }

    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Vil du slette denne besked permanent?")) return
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("success", "Besked slettet")
        fetchMessages()
      }
    } catch {}
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      })
      if (res.ok) {
        showToast("success", active ? "Besked deaktiveret" : "Besked aktiveret")
        fetchMessages()
      }
    } catch {}
  }

  const isExpired = (msg: Message) => {
    if (!msg.expiresAt) return false
    return new Date(msg.expiresAt) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-top-2 ${
          toast.type === "success"
            ? "bg-emerald-900/90 border-emerald-700/50 text-emerald-200"
            : "bg-red-900/90 border-red-700/50 text-red-200"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />
          }
          {toast.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-muted text-sm mt-1">
            Opret opslag til infoskærmen
            {messages.length > 0 && <span className="text-muted"> — {messages.filter(m => m.active && !isExpired(m)).length} aktive</span>}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-primary-foreground text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Annuller" : "Ny besked"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-panel p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="f.eks. Kantinen er lukket onsdag"
              required
              maxLength={MAX_TITLE_CHARS}
              className="admin-input focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>Maks {MAX_TITLE_CHARS} tegn</span>
              <span>{title.length}/{MAX_TITLE_CHARS}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Indhold</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Den fulde besked som vil blive vist på infoskærmen..."
              required
              rows={3}
              maxLength={MAX_MESSAGE_CHARS}
              className="admin-input resize-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>Maks {MAX_MESSAGE_CHARS} tegn</span>
              <span>{content.length}/{MAX_MESSAGE_CHARS}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Prioritet</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="admin-input focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
              >
                <option value="normal">Normal</option>
                <option value="high">Høj</option>
                <option value="urgent">Vigtig</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Udløber automatisk <span className="text-muted font-normal">(valgfrit)</span>
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="admin-input focus:ring-2 focus:ring-accent/40 focus:border-accent/60 [color-scheme:dark]"
              />
              <p className="text-muted text-xs mt-1">Lad stå tom for at beholde beskeden indtil du manuelt fjerner den</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-muted text-sm font-medium hover:text-foreground transition-colors"
            >
              Annuller
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-primary hover:bg-accent disabled:opacity-50 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? "Poster..." : "Send besked"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-muted text-center py-12">Henter beskeder...</div>
        ) : messages.length === 0 ? (
          <div className="admin-panel p-12 text-center">
            <EmptyIcon />
            <p className="text-muted mt-3">Ingen beskeder endnu</p>
            <p className="text-muted text-sm mt-1">Klik på &quot;Ny besked&quot; for at oprette dit første opslag</p>
          </div>
        ) : (
          messages.map((msg) => {
            const config = priorityConfig[msg.priority as keyof typeof priorityConfig] || priorityConfig.normal
            const Icon = config.icon
            const expired = isExpired(msg)
            const dimmed = !msg.active || expired

            return (
              <div key={msg.id} className={`admin-panel ${dimmed ? "" : ""} ${config.border} p-5 transition-opacity ${dimmed ? "opacity-50" : ""} overflow-hidden`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 ${config.bg} rounded-lg flex items-center justify-center mt-0.5 shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3 className="text-foreground font-medium truncate min-w-0 max-w-[40ch]">{msg.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} shrink-0`}>{config.label}</span>
                        {!msg.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full admin-panel-soft text-muted shrink-0">Deaktiveret</span>
                        )}
                        {expired && msg.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 shrink-0">Udløbet</span>
                        )}
                      </div>
                      <p className="text-muted text-sm mt-1 line-clamp-2 break-all">{msg.content}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-muted text-xs">
                        <span>
                          {new Date(msg.createdAt).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {msg.authorName && (
                          <>
                            <span>·</span>
                            <span>af {msg.authorName}</span>
                          </>
                        )}
                        {msg.expiresAt && (
                          <>
                            <span>·</span>
                            <span className={expired ? "text-red-400" : ""}>
                              {expired ? "Udløbet" : "Udløber"} {new Date(msg.expiresAt).toLocaleDateString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <button
                      onClick={() => handleToggle(msg.id, msg.active)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        msg.active
                          ? "admin-panel-soft text-foreground hover:bg-[color:var(--surface-alt)]"
                          : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      }`}
                    >
                      {msg.active ? "Deaktiver" : "Aktiver"}
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function EmptyIcon() {
  return (
    <div className="w-12 h-12 admin-panel-soft rounded-xl flex items-center justify-center mx-auto">
      <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
  )
}
