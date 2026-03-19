"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts"
import { Star, MessageSquare, Lightbulb, TrendingUp, RefreshCw } from "lucide-react"

interface FeedbackRow {
  id: string
  rating: number
  comment: string | null
  ideas: string[]
  createdAt: string
}

interface Agg {
  total: number
  avgRating: string | null
  count5: number
  count4: number
  count3: number
  count2: number
  count1: number
}

interface Data {
  rows: FeedbackRow[]
  agg: Agg
  ideaCounts: Record<string, number>
}

const RATING_COLORS: Record<number, string> = {
  5: "#34d399",
  4: "#60a5fa",
  3: "#f59e0b",
  2: "#fb923c",
  1: "#f87171",
}

const RATING_LABELS: Record<number, string> = {
  5: "Fremragende",
  4: "God",
  3: "OK",
  2: "Dårlig",
  1: "Meget dårlig",
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="h-3.5 w-3.5"
          style={{ fill: s <= rating ? "#f59e0b" : "transparent", color: s <= rating ? "#f59e0b" : "rgba(255,255,255,0.15)" }}
        />
      ))}
    </span>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days} dag${days > 1 ? "e" : ""} siden`
  if (hours > 0) return `${hours} time${hours > 1 ? "r" : ""} siden`
  if (mins > 0)  return `${mins} min siden`
  return "Lige nu"
}

export default function FeedbackAdminPage() {
  const [data, setData]       = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/feedback")
      if (!res.ok) throw new Error("Unauthorized")
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fejl")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Henter feedback…</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-destructive font-medium">{error ?? "Ukendt fejl"}</p>
        <button onClick={load} className="text-sm text-accent hover:underline">Prøv igen</button>
      </div>
    )
  }

  const { rows, agg, ideaCounts } = data
  const avg = agg.avgRating ? parseFloat(agg.avgRating) : 0

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    label: RATING_LABELS[r],
    star: r,
    count: agg[`count${r}` as keyof Agg] as number ?? 0,
  }))

  const topIdeas = Object.entries(ideaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))

  const radialData = [{ name: "Rating", value: (avg / 5) * 100, fill: avg >= 4 ? "#34d399" : avg >= 3 ? "#60a5fa" : "#f87171" }]

  const commentsWithText = rows.filter((r) => r.comment?.trim())

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">Svar fra informationsskærmens demo-test</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: "var(--surface-soft)", border: "1px solid var(--surface-border)" }}
        >
          <RefreshCw className="h-4 w-4" />
          Opdater
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Samlede svar",
            value: agg.total,
            icon: MessageSquare,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            label: "Gennemsnitlig bedømmelse",
            value: avg.toFixed(1),
            icon: Star,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            suffix: "/ 5",
          },
          {
            label: "5-stjernede svar",
            value: agg.count5 ?? 0,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            label: "Med kommentarer",
            value: commentsWithText.length,
            icon: MessageSquare,
            color: "text-violet-400",
            bg: "bg-violet-400/10",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="admin-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {agg.total === 0 ? "—" : kpi.value}
              {kpi.suffix && agg.total > 0 && (
                <span className="ml-1 text-lg font-normal text-muted-foreground">{kpi.suffix}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {agg.total === 0 ? (
        <div className="admin-panel flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <MessageSquare className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Ingen feedback endnu</p>
          <p className="mt-1 text-sm text-muted-foreground">Feedback vises her når brugerne begynder at indsende svar.</p>
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

            {/* Rating distribution bar chart */}
            <div className="admin-panel p-6">
              <p className="mb-5 font-semibold text-foreground">Fordeling af bedømmelser</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingDist} layout="vertical" barCategoryGap={8}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={90}
                    tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#0d1525",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      color: "#f0f4ff",
                      fontSize: 13,
                    }}
                    formatter={(v: unknown) => [`${v} svar`, ""]}
                    labelFormatter={(l) => l}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {ratingDist.map((entry) => (
                      <Cell key={entry.star} fill={RATING_COLORS[entry.star]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radial average score */}
            <div className="admin-panel flex flex-col items-center justify-center p-6">
              <p className="mb-2 font-semibold text-foreground">Samlet score</p>
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={radialData}
                    startAngle={225}
                    endAngle={-45}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "rgba(255,255,255,0.06)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-foreground">{avg.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">ud af 5</span>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-4 w-4"
                    style={{ fill: s <= Math.round(avg) ? "#f59e0b" : "transparent", color: s <= Math.round(avg) ? "#f59e0b" : "rgba(255,255,255,0.15)" }}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{agg.total} svar i alt</p>
            </div>
          </div>

          {/* Ideas chart */}
          {topIdeas.length > 0 && (
            <div className="admin-panel p-6">
              <div className="mb-5 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <p className="font-semibold text-foreground">Mest ønskede forbedringer</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topIdeas} barCategoryGap={10}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={54}
                  />
                  <YAxis
                    tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#0d1525",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      color: "#f0f4ff",
                      fontSize: 13,
                    }}
                    formatter={(v: unknown) => [`${v} stemmer`, ""]}
                  />
                  <Bar dataKey="value" fill="#5f9dff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent comments */}
          {commentsWithText.length > 0 && (
            <div className="admin-panel p-6">
              <p className="mb-5 font-semibold text-foreground">Kommentarer</p>
              <div className="space-y-3">
                {commentsWithText.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl p-4"
                    style={{ background: "var(--surface-soft)", border: "1px solid var(--surface-border)" }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <StarRow rating={row.rating} />
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(row.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{row.comment}</p>
                    {row.ideas && row.ideas.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {row.ideas.map((idea) => (
                          <span
                            key={idea}
                            className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: "rgba(95,157,255,0.12)", color: "#5f9dff", border: "1px solid rgba(95,157,255,0.2)" }}
                          >
                            {idea}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full table */}
          <div className="admin-panel overflow-hidden p-0">
            <div className="border-b px-6 py-4" style={{ borderColor: "var(--surface-border)" }}>
              <p className="font-semibold text-foreground">Alle svar</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    {["Tidspunkt", "Bedømmelse", "Kommentar", "Idéer"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: i < rows.length - 1 ? "1px solid var(--surface-border)" : "none",
                        background: i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent",
                      }}
                    >
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{timeAgo(row.createdAt)}</td>
                      <td className="px-5 py-3.5"><StarRow rating={row.rating} /></td>
                      <td className="px-5 py-3.5 max-w-xs text-foreground">
                        {row.comment ? (
                          <span className="line-clamp-2">{row.comment}</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {row.ideas?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {row.ideas.map((idea) => (
                              <span
                                key={idea}
                                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                style={{ background: "rgba(95,157,255,0.1)", color: "#5f9dff" }}
                              >
                                {idea}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
