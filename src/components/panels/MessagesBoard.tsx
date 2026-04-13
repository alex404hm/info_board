"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Pin } from "lucide-react"
import { apiFetch } from "@/lib/api-fetch"

import { YellowStickyNote } from "@/components/YellowStickyNote"

type BoardMessage = {
  id: string
  title: string
  content: string
  priority: string
  pinned: boolean
  authorName: string | null
  createdAt: string
}

const ROTATIONS = ["-1.5deg", "1.0deg", "-0.7deg", "1.4deg", "-1.1deg", "0.8deg", "-0.4deg", "1.2deg"]
const POLL_INTERVAL = 15_000
const MESSAGES_CHANNEL = "messages_updated"

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
  high:   { label: "Høj",     color: "#ea580c" },
  urgent: { label: "Vigtigt", color: "#dc2626" },
}

function buildHeaderSlot(msg: BoardMessage) {
  const badge = PRIORITY_BADGE[msg.priority]
  const hasBadge = !!badge
  const isPinned = msg.pinned

  if (!hasBadge && !isPinned) return undefined

  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 6, position: "relative", zIndex: 2, flexWrap: "wrap" }}>
      {isPinned && (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "#7c3aed", color: "#fff", borderRadius: 3, padding: "1px 6px" }}>
          📌 Fastgjort
        </span>
      )}
      {hasBadge && (
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: badge!.color, color: "#fff", borderRadius: 3, padding: "1px 6px" }}>
          {badge!.label}
        </span>
      )}
    </div>
  )
}

function SectionLabel({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        {icon}
      </span>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--foreground-soft)" }}>
        {label}
      </span>
      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
        style={{ background: "rgba(255,255,255,0.06)", color: "var(--foreground-subtle)" }}>
        {count}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--surface-border)" }} />
    </div>
  )
}

export function MessagesBoard() {
  const [messages, setMessages] = useState<BoardMessage[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = () => {
    apiFetch("/api/messages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchMessages()
    intervalRef.current = setInterval(fetchMessages, POLL_INTERVAL)
    const channel = new BroadcastChannel(MESSAGES_CHANNEL)
    channel.onmessage = () => fetchMessages()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      channel.close()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-300 border-t-transparent" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <MessageSquare className="h-10 w-10 opacity-20" style={{ color: "var(--foreground-muted)" }} />
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Ingen aktive beskeder fra skolen
        </p>
      </div>
    )
  }

  const pinned   = messages.filter((m) => m.pinned)
  const unpinned = messages.filter((m) => !m.pinned)

  return (
    <section className="w-full space-y-8">
      {pinned.length > 0 && (
        <div>
          <SectionLabel
            icon={<Pin className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />}
            label="Fastgjorte beskeder"
            count={pinned.length}
          />
          <div className="messages-grid">
            {pinned.map((msg, index) => (
              <YellowStickyNote
                key={msg.id}
                title={msg.title}
                content={msg.content}
                authorName={msg.authorName}
                createdAt={msg.createdAt}
                rotation={ROTATIONS[index % ROTATIONS.length]}
                bodyClassName="sticky-y-body sticky-y-body-full"
                headerSlot={buildHeaderSlot(msg)}
              />
            ))}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <SectionLabel
              icon={<MessageSquare className="h-3.5 w-3.5" style={{ color: "var(--foreground-muted)" }} />}
              label="Alle beskeder"
              count={unpinned.length}
            />
          )}
          <div className="messages-grid">
            {unpinned.map((msg, index) => (
              <YellowStickyNote
                key={msg.id}
                title={msg.title}
                content={msg.content}
                authorName={msg.authorName}
                createdAt={msg.createdAt}
                rotation={ROTATIONS[(pinned.length + index) % ROTATIONS.length]}
                bodyClassName="sticky-y-body sticky-y-body-full"
                headerSlot={buildHeaderSlot(msg)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
