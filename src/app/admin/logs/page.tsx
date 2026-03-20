"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  Activity, Globe, LogIn, MessageSquare, AlertTriangle,
  RefreshCw, Shield, Clock, User, ChevronDown, ChevronUp,
} from "lucide-react"

/* ─── Types ────────────────────────────────────────────────────────────────── */
type LogEntry = {
  id: string
  timestamp: string
  eventType: string
  ip: string | null
  method: string
  path: string
  statusCode: number | null
  userId: string | null
  userEmail: string | null
  userAgent: string | null
  details: Record<string, unknown>
}

type SessionEntry = {
  id: string
  createdAt: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  userId: string
  userName: string | null
  userEmail: string | null
  userRole: string | null
}

type FeedbackEntry = {
  id: string
  rating: number
  comment: string | null
  ideas: string[]
  ip: string | null
  createdAt: string
}

type Stats = {
  total: number
  pageViews: number
  loginSuccess: number
  loginFailure: number
  errors: number
}

type ApiData = {
  logs: LogEntry[]
  sessions: SessionEntry[]
  feedbacks: FeedbackEntry[]
  stats: Stats
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function formatTs(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString("da-DK", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "Lige nu"
  if (m < 60) return `${m}m siden`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}t siden`
  return `${Math.floor(h / 24)}d siden`
}

const EVENT_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  page_view:     { label: "Side",      color: "text-sky-400 bg-sky-400/10 border-sky-400/20",      icon: <Globe className="h-3 w-3" /> },
  login_success: { label: "Login OK",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: <LogIn className="h-3 w-3" /> },
  login_failure: { label: "Login fejl", color: "text-red-400 bg-red-400/10 border-red-400/20",       icon: <Shield className="h-3 w-3" /> },
  feedback:      { label: "Feedback",  color: "text-violet-400 bg-violet-400/10 border-violet-400/20", icon: <MessageSquare className="h-3 w-3" /> },
  api_error:     { label: "API fejl",  color: "text-orange-400 bg-orange-400/10 border-orange-400/20",  icon: <AlertTriangle className="h-3 w-3" /> },
  rate_limited:  { label: "Rate limit", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: <Shield className="h-3 w-3" /> },
}

function EventBadge({ type }: { type: string }) {
  const meta = EVENT_META[type] ?? { label: type, color: "text-muted-foreground bg-muted/20 border-border", icon: <Activity className="h-3 w-3" /> }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.icon}{meta.label}
    </span>
  )
}

function StatusBadge({ code }: { code: number | null }) {
  if (!code) return <span className="text-xs text-muted-foreground">—</span>
  const color = code >= 500 ? "text-red-400" : code >= 400 ? "text-orange-400" : code >= 300 ? "text-yellow-400" : "text-emerald-400"
  return <span className={`font-mono text-xs font-bold ${color}`}>{code}</span>
}

function UA({ ua }: { ua: string | null }) {
  if (!ua) return <span className="text-xs text-muted-foreground">—</span>
  const short = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : ua.slice(0, 24)
  return <span className="text-xs text-muted-foreground" title={ua}>{short}</span>
}

/* ─── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/40 px-5 py-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value ?? 0}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
type Tab = "logs" | "sessions" | "feedback"

export default function LogsPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<Tab>("logs")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch("/api/admin/logs?limit=200")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Indlæser logs…</span>
      </div>
    )
  }

  const { logs = [], sessions = [], feedbacks = [], stats } = data ?? {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overvågning af forespørgsler, logins og hændelser
          </p>
        </div>
        <button
          onClick={() => void fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Opdater
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Forespørgsler i alt" value={stats?.total ?? 0} icon={<Activity className="h-5 w-5 text-sky-400" />} color="bg-sky-400/10" />
        <StatCard label="Side visninger" value={stats?.pageViews ?? 0} icon={<Globe className="h-5 w-5 text-sky-400" />} color="bg-sky-400/10" />
        <StatCard label="Logins (OK)" value={stats?.loginSuccess ?? 0} icon={<LogIn className="h-5 w-5 text-emerald-400" />} color="bg-emerald-400/10" />
        <StatCard label="Logins (fejl)" value={stats?.loginFailure ?? 0} icon={<Shield className="h-5 w-5 text-red-400" />} color="bg-red-400/10" />
        <StatCard label="API fejl" value={stats?.errors ?? 0} icon={<AlertTriangle className="h-5 w-5 text-orange-400" />} color="bg-orange-400/10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border/50 bg-card/40 p-1 w-fit">
        {(["logs", "sessions", "feedback"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "logs" ? `Events (${logs.length})` : t === "sessions" ? `Sessions (${sessions.length})` : `Feedback (${feedbacks.length})`}
          </button>
        ))}
      </div>

      {/* ── Events tab ── */}
      {tab === "logs" && (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tidspunkt</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Sti</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Browser</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {logs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Ingen events endnu — logs vil vises her</td></tr>
              )}
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-xs text-muted-foreground">
                      <span title={formatTs(log.timestamp)}>{relativeTime(log.timestamp)}</span>
                    </td>
                    <td className="px-4 py-3"><EventBadge type={log.eventType} /></td>
                    <td className="px-4 py-3 font-mono text-xs">{log.ip ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs">{log.path}</td>
                    <td className="px-4 py-3"><StatusBadge code={log.statusCode} /></td>
                    <td className="px-4 py-3"><UA ua={log.userAgent} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {expandedRow === log.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr key={`${log.id}-detail`} className="bg-muted/10">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="flex flex-wrap gap-6 text-xs">
                          <div><span className="font-semibold text-muted-foreground">Tidspunkt: </span>{formatTs(log.timestamp)}</div>
                          <div><span className="font-semibold text-muted-foreground">Metode: </span>{log.method}</div>
                          {log.userId && <div><span className="font-semibold text-muted-foreground">User ID: </span>{log.userId}</div>}
                          {log.userEmail && <div><span className="font-semibold text-muted-foreground">Email: </span>{log.userEmail}</div>}
                          {log.userAgent && <div><span className="font-semibold text-muted-foreground">User-Agent: </span><span className="font-mono">{log.userAgent}</span></div>}
                          {Object.keys(log.details).length > 0 && (
                            <div><span className="font-semibold text-muted-foreground">Details: </span><code className="rounded bg-muted/30 px-1">{JSON.stringify(log.details)}</code></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sessions tab ── */}
      {tab === "sessions" && (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tidspunkt</th>
                <th className="px-4 py-3">Bruger</th>
                <th className="px-4 py-3">Rolle</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Browser</th>
                <th className="px-4 py-3">Udløber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Ingen aktive sessioner</td></tr>
              )}
              {sessions.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular-nums">{relativeTime(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-black text-primary">
                        {(s.userName ?? s.userEmail ?? "?")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{s.userName ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{s.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.userRole === "admin" ? "bg-violet-400/10 text-violet-400" : "bg-blue-400/10 text-blue-400"}`}>
                      {s.userRole ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{s.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3"><UA ua={s.userAgent} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatTs(s.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Feedback tab ── */}
      {tab === "feedback" && (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Tidspunkt</th>
                <th className="px-4 py-3">Bedømmelse</th>
                <th className="px-4 py-3">Kommentar</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {feedbacks.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">Ingen feedback endnu</td></tr>
              )}
              {feedbacks.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{relativeTime(f.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm">
                      {"★".repeat(f.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - f.rating)}</span>
                    </span>
                  </td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-xs">{f.comment ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{f.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
