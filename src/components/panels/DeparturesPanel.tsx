"use client"

import Image from "next/image"
import { Train, Bus } from "lucide-react"
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
        title={stop1?.title ?? "Tættest mod skolen"}
        sourceStopName={stop1?.sourceStopName ?? "Ukendt stoppested"}
        departures={stop1?.departures ?? []}
      />
      <DeparturesBox
        title={stop2?.title ?? "Alternativt stoppested"}
        sourceStopName={stop2?.sourceStopName ?? "Ukendt stoppested"}
        departures={stop2?.departures ?? []}
      />
    </div>
  )
}

function DeparturesBox({
  title,
  sourceStopName,
  departures,
}: {
  title: string
  sourceStopName: string
  departures: Departure[]
}) {
  return (
    <div className="surface-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-[color:var(--surface-alt)] border-b border-light">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/5">
            <Image src="/logo/dsb.svg" alt="DSB" width={22} height={22} className="h-full w-full rounded-[4px] object-fill" />
          </div>
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground-strong">{sourceStopName}</p>
      </div>

      {departures.length === 0 ? (
        <div className="px-5 py-5 text-sm text-muted">
          Ingen afgange for dette stop lige nu
        </div>
      ) : (
        departures.map((dep, i) => {
          const badge = lineBadgeStyle(dep.line)
          return (
            <div
              key={`${dep.line}-${dep.destination}-${dep.sourceStopId}-${i}`}
              className={cn("flex items-center gap-4 px-5 py-3.5 border-light", i !== 0 && "border-t")}
            >
              <span
                className="inline-flex min-w-[52px] items-center justify-center rounded px-2.5 py-1 text-sm font-bold"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {dep.line}
              </span>
              {dep.type === "train" ? (
                <Train className="h-4 w-4 shrink-0 text-subtle" />
              ) : (
                <Bus className="h-4 w-4 shrink-0 text-subtle" />
              )}
              <span className="flex-1 truncate text-[15px] font-medium text-foreground-strong">
                {dep.destination}
              </span>
              {dep.cancelled ? (
                <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rose-400 bg-rose-500/10 border border-rose-500/30">
                  Aflyst
                </span>
              ) : (
                <div className="text-right">
                  <span
                    className={cn(
                      "text-lg font-bold tabular-nums",
                      i === 0 ? "text-accent" : "text-muted"
                    )}
                  >
                    {dep.time}
                    {dep.delayMin > 0 && (
                      <span className="ml-1 text-xs font-semibold text-rose-400">+{dep.delayMin} min</span>
                    )}
                  </span>
                  <p className="text-[11px] tabular-nums text-subtle">
                    om {dep.minutesUntil} min
                  </p>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
