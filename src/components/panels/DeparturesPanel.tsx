"use client"

import Image from "next/image"
import { Train, Bus } from "lucide-react"
import { cn, lineBadgeStyle } from "@/lib/utils"
import { useDeparturesData } from "@/hooks/use-api-data"

export function DeparturesPanel() {
  const departures = useDeparturesData()

  if (departures.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-white/40">Henter afgange…</p>
      </div>
    )
  }

  return (
    <div className="ib-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Live afgange</p>
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

      {departures.map((dep, i) => {
        const badge = lineBadgeStyle(dep.line)
        return (
          <div
            key={`${dep.line}-${dep.destination}-${i}`}
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
          </div>
        )
      })}
    </div>
  )
}
