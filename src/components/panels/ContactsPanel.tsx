"use client"

import { useState } from "react"
import { Phone, Mail, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { importantContacts, instructors } from "@/data"

export function ContactsPanel() {
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="space-y-6">
      {/* Important contacts */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-400">
          Vigtige kontakter
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {importantContacts.map((c) => (
            <div
              key={c.phone}
              className="ib-panel-soft p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-white/90">{c.name}</p>
                  <p className="text-xs text-white/40">{c.role}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    c.status === "Tilgængelig"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : c.status === "På campus"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-white/[0.06] text-white/50",
                  )}
                >
                  {c.status}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <Phone className="h-3.5 w-3.5 text-white/30" />
                  {c.phone}
                </p>
                {c.email && (
                  <p className="flex items-center gap-2 text-sm text-white/60">
                    <Mail className="h-3.5 w-3.5 text-white/30" />
                    {c.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructors */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-400">
            Instruktører
          </h3>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.08] active:scale-[0.97]"
          >
            {showAll ? (
              <>
                Vis færre <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Vis alle ({instructors.length}) <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(showAll ? instructors : instructors.slice(0, 6)).map((ins) => (
            <div
              key={ins.id}
              className="ib-panel-soft flex items-center gap-3 px-4 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">
                {ins.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/90">
                  {ins.name}
                </p>
                <p className="truncate text-xs text-white/40">
                  {ins.area} · {ins.title}
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                {ins.room && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/30">
                    <MapPin className="h-2.5 w-2.5" /> {ins.room}
                  </span>
                )}
                <span className="text-[10px] tabular-nums text-white/30">
                  {ins.phone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
