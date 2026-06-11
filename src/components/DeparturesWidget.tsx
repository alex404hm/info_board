"use client"

import { useEffect, useState } from "react"
import { Bus, Train } from "lucide-react"
import Image from "next/image"
import { apiFetch } from "@/lib/api-fetch"
import { lineBadgeStyle } from "@/lib/utils"
import type { DeparturesApiResponse, Departure } from "@/types"

const C1 = "var(--foreground)"
const C2 = "var(--foreground-muted)"
const C3 = "var(--surface-border)"

const POLL_MS = 30_000

function minuteColor(min: number): string {
  if (min <= 1) return "var(--status-critical)"
  if (min <= 4) return "var(--status-high)"
  return "var(--accent)"
}

export function DeparturesWidget() {
  const [dep, setDep] = useState<Departure | null>(null)
  const [stopName, setStopName] = useState("")
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await apiFetch("/api/departures", { cache: "no-store" })
        if (!res.ok) {
          if (mounted) setStatus("error")
          return
        }
        const data: DeparturesApiResponse = await res.json()
        if (!mounted) return

        const groups = data.groups ?? []
        const bySlot1 = groups.find((g) => g.sourceStopSlot === 1)
        const bySlot2 = groups.find((g) => g.sourceStopSlot === 2)
        const name = bySlot1?.sourceStopName ?? bySlot2?.sourceStopName ?? ""

        const next = [
          ...(bySlot1?.departures ?? []),
          ...(bySlot2?.departures ?? []),
        ]
          .filter((d) => !d.cancelled)
          .sort((a, b) => a.minutesUntil - b.minutesUntil)[0] ?? null

        setDep(next)
        setStopName(name)
        setStatus("ok")
      } catch {
        if (mounted) setStatus("error")
      }
    }

    void load()
    const id = setInterval(load, POLL_MS)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const badge = dep ? lineBadgeStyle(dep.line) : null
  const mins = dep?.minutesUntil ?? 0
  const mColor = minuteColor(mins)
  const isUrgent = !!dep && mins <= 4

  return (
    <div
      style={{
        width: 220,
        background: "var(--surface)",
        border: `1px solid ${C3}`,
        borderRadius: "0.625rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderBottom: `1px solid ${C3}` }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/15 shrink-0">
          <Image
            src="/logo/dsb.svg"
            alt="DSB"
            width={16}
            height={16}
            className="h-full w-full rounded-[2px] object-fill"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] font-bold uppercase tracking-[0.12em] leading-none"
            style={{ color: C2 }}
          >
            Næste afgang
          </p>
          <p
            className="text-[11px] font-semibold leading-tight mt-0.5 truncate"
            style={{ color: C1 }}
          >
            {status === "loading" ? "Henter…" : stopName || "Stoppested"}
          </p>
        </div>
      </div>

      {/* Single departure row */}
      <div className="p-2">
        {(status === "loading" || status === "error" || !dep) ? (
          <p
            className="py-2 text-center text-[10px] font-medium"
            style={{ color: C2 }}
          >
            {status === "loading"
              ? "Henter…"
              : status === "error"
              ? "Ikke tilgængelig"
              : "Ingen afgange"}
          </p>
        ) : (
          <div
            className="flex items-center gap-2 rounded px-2.5 py-2"
            style={{
              background: isUrgent ? "rgba(249,115,22,0.10)" : "var(--surface-soft)",
              border: isUrgent ? "1px solid rgba(249,115,22,0.30)" : `1px solid ${C3}`,
            }}
          >
            {/* Line badge */}
            <span
              className="shrink-0 rounded text-[11px] font-bold tabular-nums"
              style={{
                background: badge!.bg,
                color: badge!.text,
                minWidth: 30,
                textAlign: "center",
                lineHeight: "20px",
                padding: "0 5px",
              }}
            >
              {dep.line}
            </span>

            {/* Vehicle icon */}
            {dep.type === "train" ? (
              <Train className="h-3 w-3 shrink-0" style={{ color: C2, opacity: 0.55 }} />
            ) : (
              <Bus className="h-3 w-3 shrink-0" style={{ color: C2, opacity: 0.55 }} />
            )}

            {/* Destination */}
            <p
              className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-none"
              style={{ color: C1 }}
            >
              {dep.destination}
            </p>

            {/* Minutes */}
            <div className="shrink-0 flex items-baseline gap-0.5">
              <span
                className="text-[20px] font-bold leading-none tabular-nums"
                style={{ color: mColor, transition: "color 600ms ease" }}
              >
                {mins}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wide leading-none"
                style={{ color: C2 }}
              >
                min
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
