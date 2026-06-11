"use client"

import Image from "next/image"
import { Train } from "lucide-react"
import { cn, lineBadgeStyle } from "@/lib/utils"
import { useDepartureGroupsData } from "@/hooks/use-api-data"
import type { Departure } from "@/types"

export function DeparturesPanel() {
  const groups = useDepartureGroupsData()
  const stop1 = groups.find((group) => group.sourceStopSlot === 1)
  const stop2 = groups.find((group) => group.sourceStopSlot === 2)

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted">Henter afgange…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DeparturesBox
        title={stop1?.sourceStopName ?? stop1?.title ?? "Ukendt stoppested"}
        direction={stop1?.title}
        departures={stop1?.departures ?? []}
      />
      <DeparturesBox
        title={stop2?.sourceStopName ?? stop2?.title ?? "Ukendt stoppested"}
        direction={stop2?.title}
        departures={stop2?.departures ?? []}
      />
    </div>
  )
}

function DeparturesBox({
  title,
  direction,
  departures,
}: {
  title: string
  direction?: string
  departures: Departure[]
}) {
  return (
    <div className="surface-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-[color:var(--surface-alt)] border-b border-light">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted truncate">{title}</p>
            {direction && (
              <p className="text-[11px] text-subtle mt-0.5">{direction}</p>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/5 shrink-0">
            <Image src="/logo/dsb.svg" alt="DSB" width={22} height={22} className="h-full w-full rounded-[4px] object-fill" />
          </div>
        </div>
      </div>

      {departures.length === 0 ? (
        <div className="px-5 py-5 text-sm text-muted">
          Ingen afgange for dette stop lige nu
        </div>
      ) : (
        departures.map((dep, i) => {
          const badge = lineBadgeStyle(dep.line)
          const isNow = dep.minutesUntil === 0

          return (
            <div
              key={`${dep.line}-${dep.destination}-${dep.sourceStopId}-${i}`}
              className={cn("flex items-center gap-4 px-5 py-3.5 border-light", i !== 0 && "border-t")}
            >
              {/* Line badge */}
              <span
                className="inline-flex min-w-[52px] items-center justify-center rounded px-2.5 py-1 text-sm font-bold shrink-0"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {dep.line}
              </span>

              {/* Train icon — only shown for trains */}
              {dep.type === "train" && (
                <Train className="h-4 w-4 shrink-0 text-sky-400" />
              )}

              {/* Destination */}
              <span className="flex-1 truncate text-[15px] font-medium text-foreground-strong">
                {dep.destination}
              </span>

              {/* Time + delay */}
              {dep.cancelled ? (
                <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rose-400 bg-rose-500/10 border border-rose-500/30 shrink-0">
                  Aflyst
                </span>
              ) : (
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums",
                      i === 0 ? "text-accent" : "text-muted"
                    )}
                  >
                    {dep.time}
                  </span>
                  <p className="text-[11px] tabular-nums text-subtle">
                    {isNow ? (
                      <span className="font-bold text-accent">Nu</span>
                    ) : (
                      <>om {dep.minutesUntil} min</>
                    )}
                  </p>
                  {dep.delayMin > 0 && (
                    <p className="text-[10px] font-semibold text-rose-400 leading-none mt-0.5">
                      +{dep.delayMin} min forsinket
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
