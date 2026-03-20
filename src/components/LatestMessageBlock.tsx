"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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

const POLL_INTERVAL = 15_000
const MESSAGES_CHANNEL = "messages_updated"

const PRIORITY_BADGE: Record<string, React.ReactNode> = {
  urgent: (
    <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "#dc2626", color: "#fff", borderRadius: 3, padding: "1px 6px", display: "inline-block", marginBottom: 6, position: "relative", zIndex: 2 }}>
      Vigtigt
    </div>
  ),
  high: (
    <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "#ea580c", color: "#fff", borderRadius: 3, padding: "1px 6px", display: "inline-block", marginBottom: 6, position: "relative", zIndex: 2 }}>
      Høj
    </div>
  ),
}

export function LatestMessageBlock() {
  const [msg, setMsg] = useState<BoardMessage | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLatest = () => {
    fetch("/api/messages", { cache: "no-store" })
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

  const pinnedBadge = msg?.pinned ? (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, position: "relative", zIndex: 2 }}>
      <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", background: "#7c3aed", color: "#fff", borderRadius: 3, padding: "1px 6px" }}>
        📌 Fastgjort
      </span>
    </div>
  ) : null

  const headerSlot = msg ? (
    <>
      {pinnedBadge}
      {PRIORITY_BADGE[msg.priority] ?? null}
    </>
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
