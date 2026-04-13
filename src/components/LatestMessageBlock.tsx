"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { YellowStickyNote } from "@/components/YellowStickyNote"
import { apiFetch } from "@/lib/api-fetch"

type BoardMessage = {
  id: string
  title: string
  content: string
  priority: string
  pinned: boolean
  authorName: string | null
  createdAt: string
}

const POLL_INTERVAL = 15_000
const MESSAGES_CHANNEL = "messages_updated"

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
  urgent: { label: "Vigtigt", color: "#dc2626" },
  high:   { label: "Høj",    color: "#ea580c" },
}

export function LatestMessageBlock() {
  const [msg, setMsg] = useState<BoardMessage | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLatest = () => {
    apiFetch("/api/messages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BoardMessage[]) => {
        if (!Array.isArray(data) || data.length === 0) { setMsg(null); return }
        // Prefer pinned, otherwise first (API already sorts pinned first)
        setMsg(data[0])
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchLatest()
    intervalRef.current = setInterval(fetchLatest, POLL_INTERVAL)
    const channel = new BroadcastChannel(MESSAGES_CHANNEL)
    channel.onmessage = () => fetchLatest()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      channel.close()
    }
  }, [])

  const badge = msg ? PRIORITY_BADGE[msg.priority] : undefined
  const hasBadge = !!badge
  const isPinned = msg?.pinned ?? false

  const headerSlot = msg && (isPinned || hasBadge) ? (
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
  ) : null

  return (
    <AnimatePresence mode="wait">
      {msg && (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.15 }}
        >
          <YellowStickyNote
            title={msg.title}
            content={msg.content}
            authorName={msg.authorName}
            createdAt={msg.createdAt}
            href="/beskeder"
            linkLabel="Se alle beskeder ->"
            rotation="-1.8deg"
            headerSlot={headerSlot}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
