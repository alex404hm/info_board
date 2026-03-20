"use client"

import { useEffect, useState, useRef } from "react"
import { Clock, TrendingUp, Wallet, AlertCircle } from "lucide-react"
import NumberFlow from "@number-flow/react"
import type { WageResponse } from "@/app/api/loen/route"

type ViewMode = "monthly" | "hourly"

// Spring overshoot easing — snappy bounce at the end
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)"
// Smooth deceleration for digit spin
const SMOOTH = "cubic-bezier(0.22, 1, 0.36, 1)"

const TRANSFORM_TIMING = { duration: 820, easing: SPRING }
const SPIN_TIMING      = { duration: 550, easing: SMOOTH }
const OPACITY_TIMING   = { duration: 250, easing: "ease" }

export function LoenPanel() {
  const [data, setData] = useState<WageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("monthly")
  // revealedRows tracks how many rows have been "revealed" (started from 0 → real value)
  const [revealedRows, setRevealedRows] = useState(0)
  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    fetch("/api/loen")
      .then((r) => r.json())
      .then((d: WageResponse) => {
        setData(d)
        setLoading(false)
        // Reset and stagger-reveal each row
        setRevealedRows(0)
        const steps = d.groups.find((g) => g.ageGroup === "under18")?.steps ?? []
        staggerTimers.current.forEach(clearTimeout)
        staggerTimers.current = steps.map((_, i) =>
          setTimeout(() => setRevealedRows(i + 1), 120 + i * 110)
        )
      })
      .catch(() => { setError(true); setLoading(false) })
    return () => staggerTimers.current.forEach(clearTimeout)
  }, [])

  const under18  = data?.groups.find((g) => g.ageGroup === "under18")
  const over18   = data?.groups.find((g) => g.ageGroup === "over18")
  const steps    = under18?.steps ?? []
  const isHourly = viewMode === "hourly"

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="inline-flex rounded-xl border border-border/60 bg-card/40 p-1 gap-1">
        <button
          onClick={() => setViewMode("monthly")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === "monthly"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Månedsløn
        </button>
        <button
          onClick={() => setViewMode("hourly")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === "hourly"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Timeløn
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Henter løndata…</span>
        </div>
      ) : error || !data ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Kunne ikke hente løndata — prøv igen senere.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden shadow-xl">
          {/* Column headers */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-border/50 bg-card/60">
            <div className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Læretid
            </div>
            <div className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-l border-border/40">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                Under 18
              </span>
            </div>
            <div className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-l border-border/40">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400 inline-block" />
                Over 18
              </span>
            </div>
          </div>

          {/* Rows */}
          {steps.map((step, i) => {
            const isLast  = i === steps.length - 1
            const u18step = under18?.steps[i]
            const o18step = over18?.steps[i]
            const u18val  = isHourly ? (u18step?.hourlySalaryDkk  ?? 0) : (u18step?.monthlySalaryDkk ?? 0)
            const o18val  = isHourly ? (o18step?.hourlySalaryDkk  ?? 0) : (o18step?.monthlySalaryDkk ?? 0)
            const u18prev = i > 0 ? (isHourly ? under18?.steps[i-1].hourlySalaryDkk  : under18?.steps[i-1].monthlySalaryDkk)  : undefined
            const o18prev = i > 0 ? (isHourly ? over18?.steps[i-1].hourlySalaryDkk   : over18?.steps[i-1].monthlySalaryDkk)   : undefined

            const revealed = i < revealedRows
            const displayU18 = revealed ? u18val : 0
            const displayO18 = revealed ? o18val : 0
            const numFormat = isHourly
              ? { style: "currency" as const, currency: "DKK", minimumFractionDigits: 2, maximumFractionDigits: 2 }
              : { style: "currency" as const, currency: "DKK", maximumFractionDigits: 0 }

            return (
              <div
                key={step.apprenticeshipPeriod}
                className={`grid grid-cols-[1.2fr_1fr_1fr] transition-colors hover:bg-white/[0.03] ${
                  !isLast ? "border-b border-border/40" : ""
                }`}
              >
                {/* Period */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{step.apprenticeshipPeriod}</span>
                </div>

                {/* Under 18 */}
                <div className="flex flex-col justify-center px-5 py-4 border-l border-border/40">
                  <span className="text-sm font-bold tabular-nums text-blue-400">
                    <NumberFlow
                      value={displayU18}
                      format={numFormat}
                      locales="da-DK"
                      transformTiming={TRANSFORM_TIMING}
                      spinTiming={SPIN_TIMING}
                      opacityTiming={OPACITY_TIMING}
                      willChange
                    />
                  </span>
                  {!isLast && u18prev != null && revealed && (
                    <span className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +<NumberFlow
                        value={u18val - u18prev}
                        format={numFormat}
                        locales="da-DK"
                        transformTiming={TRANSFORM_TIMING}
                        spinTiming={SPIN_TIMING}
                        opacityTiming={OPACITY_TIMING}
                        willChange
                      />
                    </span>
                  )}
                </div>

                {/* Over 18 */}
                <div className="flex flex-col justify-center px-5 py-4 border-l border-border/40">
                  <span className="text-sm font-bold tabular-nums text-violet-400">
                    <NumberFlow
                      value={displayO18}
                      format={numFormat}
                      locales="da-DK"
                      transformTiming={TRANSFORM_TIMING}
                      spinTiming={SPIN_TIMING}
                      opacityTiming={OPACITY_TIMING}
                      willChange
                    />
                  </span>
                  {!isLast && o18prev != null && revealed && (
                    <span className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +<NumberFlow
                        value={o18val - o18prev}
                        format={numFormat}
                        locales="da-DK"
                        transformTiming={TRANSFORM_TIMING}
                        spinTiming={SPIN_TIMING}
                        opacityTiming={OPACITY_TIMING}
                        willChange
                      />
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div className="grid grid-cols-[1.2fr_1fr_1fr] border-t border-border/50 bg-primary/5">
            <div className="px-5 py-3 text-xs font-medium text-muted-foreground">
              Maks. løn
            </div>
            <div className="px-5 py-3 border-l border-border/40">
              <span className="text-xs font-bold text-blue-400">
                {under18 && (
                  <NumberFlow
                    value={revealedRows >= steps.length
                      ? (isHourly ? Math.max(...under18.steps.map(s => s.hourlySalaryDkk)) : Math.max(...under18.steps.map(s => s.monthlySalaryDkk)))
                      : 0
                    }
                    format={isHourly
                      ? { style: "currency", currency: "DKK", minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      : { style: "currency", currency: "DKK", maximumFractionDigits: 0 }
                    }
                    locales="da-DK"
                    transformTiming={TRANSFORM_TIMING}
                    spinTiming={SPIN_TIMING}
                    opacityTiming={OPACITY_TIMING}
                    willChange
                  />
                )}
              </span>
            </div>
            <div className="px-5 py-3 border-l border-border/40">
              <span className="text-xs font-bold text-violet-400">
                {over18 && (
                  <NumberFlow
                    value={revealedRows >= steps.length
                      ? (isHourly ? Math.max(...over18.steps.map(s => s.hourlySalaryDkk)) : Math.max(...over18.steps.map(s => s.monthlySalaryDkk)))
                      : 0
                    }
                    format={isHourly
                      ? { style: "currency", currency: "DKK", minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      : { style: "currency", currency: "DKK", maximumFractionDigits: 0 }
                    }
                    locales="da-DK"
                    transformTiming={TRANSFORM_TIMING}
                    spinTiming={SPIN_TIMING}
                    opacityTiming={OPACITY_TIMING}
                    willChange
                  />
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground">
          Sidst opdateret:{" "}
          {new Date(data.lastUpdated).toLocaleDateString("da-DK", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  )
}
