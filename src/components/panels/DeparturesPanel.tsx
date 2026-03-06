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
        <p className="text-sm text-white/40">Henter afgange…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DeparturesBox
        title={stop1?.title ?? "Tættest mod skolen"}
        sourceStopName={stop1?.sourceStopName ?? "Ukendt stoppested"}
        sourceStopId={stop1?.sourceStopId ?? "-"}
        departures={stop1?.departures ?? []}
      />

      <DeparturesBox
        title={stop2?.title ?? "Alternativt stoppested"}
        sourceStopName={stop2?.sourceStopName ?? "Ukendt stoppested"}
        sourceStopId={stop2?.sourceStopId ?? "-"}
        departures={stop2?.departures ?? []}
      />
    </div>
  )
}

function DeparturesBox({
  title,
  sourceStopName,
  sourceStopId,
  departures,
}: {
  title: string
  sourceStopName: string
  sourceStopId: string
  departures: Departure[]
}) {
  return (
    <div className="ib-panel overflow-hidden">
      <div className="border-b border-white/[0.08] bg-white/[0.02] px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{title}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 p-1">
            <Image
              src="/logo/dsb.svg"
              alt="DSB"
              width={24}
              height={24}
              className="h-full w-full rounded-[4px] object-fill"
            />
          </div>
        </div>
        <p className="mt-1 text-sm font-semibold text-white/90">{sourceStopName}</p>
        <p className="text-[11px] text-white/45">Stop ID: {sourceStopId}</p>
      </div>

      {departures.length === 0 ? (
        <div className="px-5 py-5 text-sm text-white/45">Ingen afgange for dette stop lige nu</div>
      ) : (
        departures.map((dep, i) => {
          const badge = lineBadgeStyle(dep.line)
          return (
            <div
              key={`${dep.line}-${dep.destination}-${dep.sourceStopId}-${i}`}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5",
                i !== 0 && "border-t border-white/[0.06]",
              )}
            >
              <span
                className="inline-flex min-w-[52px] items-center justify-center rounded-lg px-2.5 py-1 text-sm font-bold shadow-sm"
                style={{ backgroundColor: badge.bg, color: badge.text }}
              >
                {dep.line}
              </span>
              {dep.type === "train" ? (
                <Train className="h-4 w-4 shrink-0 text-white/30" />
              ) : (
                <Bus className="h-4 w-4 shrink-0 text-white/30" />
              )}
              <span className="flex-1 truncate text-[15px] font-medium text-white/80">
                {dep.destination}
              </span>
              {dep.cancelled ? (
                <span className="rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rose-300">
                  Aflyst
                </span>
              ) : (
                <span
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    i === 0 ? "text-blue-400" : "text-white/50",
                  )}
                >
                  {dep.time}
                  {dep.delayMin > 0 && (
                    <span className="ml-1 text-xs font-semibold text-rose-400">
                      +{dep.delayMin}
                    </span>
                  )}
                </span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
