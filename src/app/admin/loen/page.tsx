"use client"

import { useCallback, useEffect, useState } from "react"
import { Wallet, Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react"
import type { WageGroup, WageStep } from "@/db/schema"

type WageResponse = {
  groups: WageGroup[]
  currency: string
  lastUpdated: string
}

function formatDkk(value: number) {
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 2 }).format(value)
}

export default function LoenAdminPage() {
  const [data, setData] = useState<WageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/loen")
      if (res.ok) setData(await res.json())
    } catch {
      showToast("error", "Kunne ikke hente løndata")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  function updateStep(ageGroup: WageGroup["ageGroup"], stepIndex: number, field: keyof WageStep, rawValue: string) {
    if (!data) return
    const value = field === "apprenticeshipPeriod" ? rawValue : parseFloat(rawValue) || 0
    setData({
      ...data,
      groups: data.groups.map((g: WageGroup) =>
        g.ageGroup !== ageGroup ? g : {
          ...g,
          steps: g.steps.map((s: WageStep, i: number) =>
            i !== stepIndex ? s : { ...s, [field]: value }
          ),
        }
      ),
    })
  }

  function updateLastUpdated(value: string) {
    if (!data) return
    setData({ ...data, lastUpdated: value })
  }

  async function handleSave() {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch("/api/loen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        showToast("success", "Løndata gemt")
      } else {
        showToast("error", "Fejl ved gemning")
      }
    } catch {
      showToast("error", "Fejl ved gemning")
    } finally {
      setSaving(false)
    }
  }

  const under18 = data?.groups.find((g: WageGroup) => g.ageGroup === "under18")
  const over18 = data?.groups.find((g: WageGroup) => g.ageGroup === "over18")

  return (
    <div className="space-y-6 pb-24">

      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ring-1 animate-in slide-in-from-top-2 ${
          toast.type === "success"
            ? "bg-emerald-950 ring-emerald-800 text-emerald-300"
            : "bg-red-950 ring-red-800 text-red-300"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Lønsatser</h1>
            <p className="text-xs text-muted-foreground">Administrer timeløn og månedsløn for lærlinge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nulstil
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !data}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Gemmer…" : "Gem ændringer"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Henter løndata…</span>
        </div>
      ) : !data ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Kunne ikke hente løndata.
        </div>
      ) : (
        <>
          {/* Last updated */}
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-5 py-4">
            <span className="text-sm font-medium text-muted-foreground min-w-[120px]">Sidst opdateret</span>
            <input
              type="date"
              value={data.lastUpdated}
              onChange={(e) => updateLastUpdated(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Under 18 */}
          {under18 && (
            <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/40 bg-card/60 px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <h2 className="text-sm font-semibold">Under 18 år</h2>
              </div>
              <div className="divide-y divide-border/30">
                <div className="grid grid-cols-[1.5fr_1fr_1fr] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Læretid</span>
                  <span>Timeløn (DKK)</span>
                  <span>Månedsløn (DKK)</span>
                </div>
                {under18.steps.map((step: WageStep, i: number) => (
                  <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-3 px-5 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-[10px] font-bold text-blue-400">{i + 1}</span>
                      {step.apprenticeshipPeriod}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={step.hourlySalaryDkk}
                      onChange={(e) => updateStep("under18", i, "hourlySalaryDkk", e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={step.monthlySalaryDkk}
                      onChange={(e) => updateStep("under18", i, "monthlySalaryDkk", e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Over 18 */}
          {over18 && (
            <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border/40 bg-card/60 px-5 py-3.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                <h2 className="text-sm font-semibold">Over 18 år</h2>
              </div>
              <div className="divide-y divide-border/30">
                <div className="grid grid-cols-[1.5fr_1fr_1fr] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Læretid</span>
                  <span>Timeløn (DKK)</span>
                  <span>Månedsløn (DKK)</span>
                </div>
                {over18.steps.map((step: WageStep, i: number) => (
                  <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr] items-center gap-3 px-5 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400/15 text-[10px] font-bold text-violet-400">{i + 1}</span>
                      {step.apprenticeshipPeriod}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={step.hourlySalaryDkk}
                      onChange={(e) => updateStep("over18", i, "hourlySalaryDkk", e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={step.monthlySalaryDkk}
                      onChange={(e) => updateStep("over18", i, "monthlySalaryDkk", e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview summary */}
          <div className="rounded-xl border border-border/40 bg-muted/10 px-5 py-3.5 text-xs text-muted-foreground">
            Maks. løn under 18:{" "}
            <span className="font-semibold text-blue-400">
              {under18 ? formatDkk(Math.max(...under18.steps.map((s: WageStep) => s.monthlySalaryDkk))) : "–"} / md.
            </span>
            {" · "}
            Over 18:{" "}
            <span className="font-semibold text-violet-400">
              {over18 ? formatDkk(Math.max(...over18.steps.map((s: WageStep) => s.monthlySalaryDkk))) : "–"} / md.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
