"use client"

import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"

import { YellowStickyNote } from "@/components/YellowStickyNote"

type BoardMessage = {
  id: string
  title: string
  content: string
  priority: string
  authorName: string | null
  createdAt: string
}

const ROTATIONS = ["-1.8deg", "1.1deg", "-0.8deg", "1.6deg", "-1.2deg", "0.9deg", "-0.4deg", "1.4deg"]

export function MessagesBoard() {
  const [messages, setMessages] = useState<BoardMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/messages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
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

  return (
    <section>
      <div className="yellow-sticky-grid">
        {messages.map((msg, index) => (
          <YellowStickyNote
            key={msg.id}
            title={msg.title}
            content={msg.content}
            authorName={msg.authorName}
            createdAt={msg.createdAt}
            rotation={ROTATIONS[index % ROTATIONS.length]}
            bodyClassName="sticky-y-body sticky-y-body-full"
          />
        ))}
      </div>
    </section>
  )
}
