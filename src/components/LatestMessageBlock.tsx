"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

import { YellowStickyNote } from "@/components/YellowStickyNote"

type BoardMessage = {
  id: string
  title: string
  content: string
  priority: string
  authorName: string | null
  createdAt: string
}

export function LatestMessageBlock() {
  const [msg, setMsg] = useState<BoardMessage | null>(null)

  useEffect(() => {
    fetch("/api/messages", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BoardMessage[]) => {
        if (Array.isArray(data) && data.length > 0) setMsg(data[0])
      })
      .catch(() => {})
  }, [])

  if (!msg) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
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
      />
    </motion.div>
  )
}
