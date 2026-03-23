"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import {
  Activity, Globe, LogIn, AlertTriangle, RefreshCw, Shield,
  ChevronDown, ChevronUp, Search, X, Download, Monitor,
  Smartphone, ArrowUpRight, ArrowDownLeft, Clock, Zap,
  SlidersHorizontal, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

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

type Stats = {
  total: number
  pageViews: number
  loginSuccess: number
  loginFailure: number
  errors: number
  rateLimited: number
}

type ApiData = {
  logs: LogEntry[]
  sessions: SessionEntry[]
  stats: Stats
  total: number
}

type Tab = "events" | "sessions"
type Direction = "all" | "inbound" | "api"
type StatusRange = "all" | "2xx" | "3xx" | "4xx" | "5xx"
type DateRange = "all" | "today" | "yesterday" | "7d" | "30d" | "custom"

const ALL_EVENT_TYPES = ["page_view", "login_success", "login_failure", "api_error", "rate_limited"] as const

const EVENT_META: Record<string, { label: string; color: string; dot: string }> = {
  page_view:     { label: "Sidevisning",  color: "text-sky-400 bg-sky-400/10 border-sky-400/25",           dot: "bg-sky-400" },
  login_success: { label: "Login OK",     color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25", dot: "bg-emerald-400" },
  login_failure: { label: "Login fejl",   color: "text-red-400 bg-red-400/10 border-red-400/25",             dot: "bg-red-400" },
  api_error:     { label: "API fejl",     color: "text-orange-400 bg-orange-400/10 border-orange-400/25",    dot: "bg-orange-400" },
  rate_limited:  { label: "Rate limit",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25",    dot: "bg-yellow-400" },
}

const METHOD_COLOR: Record<string, string> = {
  GET:    "text-sky-400    bg-sky-400/10    border-sky-400/25",
  POST:   "text-violet-400 bg-violet-400/10 border-violet-400/25",
  PUT:    "text-amber-400  bg-amber-400/10  border-amber-400/25",
  PATCH:  "text-amber-400  bg-amber-400/10  border-amber-400/25",
  DELETE: "text-red-400    bg-red-400/10    border-red-400/25",
}

const PAGE_SIZE = 100

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("da-DK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function relativeTime(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60_000)
  if (m < 1)  return "Lige nu"
  if (m < 60) return `${m}m siden`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}t siden`
  return `${Math.floor(h / 24)}d siden`
}

function parseBrowser(ua: string | null | undefined) {
  if (!ua) return "—"
  if (ua.includes("Edg"))     return "Edge"
  if (ua.includes("Chrome"))  return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari"))  return "Safari"
  return ua.slice(0, 18)
}

function parseDevice(ua: string | null | undefined) {
  if (!ua) return null
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return "mobile"
  return "desktop"
}

function statusColor(code: number | null) {
  if (!code) return "text-muted-foreground"
  if (code >= 500) return "text-red-400"
  if (code >= 400) return "text-orange-400"
  if (code >= 300) return "text-yellow-400"
  return "text-emerald-400"
}

function dateRangeToDates(range: DateRange, customFrom?: string, customTo?: string): { from?: string; to?: string } {
  const now  = new Date()
  const pad  = (d: Date) => d.toISOString().slice(0, 10)
  if (range === "today")     return { from: pad(now), to: pad(now) }
  if (range === "yesterday") { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: pad(y), to: pad(y) } }
  if (range === "7d")        { const s = new Date(now); s.setDate(now.getDate() - 6); return { from: pad(s) } }
  if (range === "30d")       { const s = new Date(now); s.setDate(now.getDate() - 29); return { from: pad(s) } }
  if (range === "custom")    return { from: customFrom, to: customTo }
  return {}
}

function buildParams(
  offset: number,
  eventTypes: Set<string>,
  method: string,
  direction: Direction,
  status: StatusRange,
  search: string,
  dateRange: DateRange,
  customFrom?: string,
  customTo?: string,
) {
  const p = new URLSearchParams()
  p.set("limit",  String(PAGE_SIZE))
  p.set("offset", String(offset))
  if (eventTypes.size > 0 && eventTypes.size < ALL_EVENT_TYPES.length) {
    p.set("eventType", [...eventTypes].join(","))
  }
  if (method  !== "all") p.set("method",    method)
  if (direction !== "all") p.set("direction", direction)
  if (status  !== "all") p.set("status",    status)
  if (search.trim())     p.set("search",    search.trim())
  const { from, to } = dateRangeToDates(dateRange, customFrom, customTo)
  if (from) p.set("from", from)
  if (to)   p.set("to",   to)
  return p.toString()
}

function exportCSV(logs: LogEntry[]) {
  const header = ["Tidspunkt", "Type", "Metode", "Sti", "Status", "IP", "Email", "Browser"].join(";")
  const rows = logs.map((l) =>
    [
      formatTs(l.timestamp),
      l.eventType,
      l.method,
      l.path,
      l.statusCode ?? "",
      l.ip ?? "",
      l.userEmail ?? "",
      parseBrowser(l.userAgent),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")
  )
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: `logs-${new Date().toISOString().slice(0, 10)}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

// ── UI atoms ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, dimmed }: {
  label: string; value: number; icon: React.ReactNode; color: string; dimmed?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3.5", dimmed && "opacity-50")}>
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums leading-none">{value ?? 0}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function Pill({ active, onClick, children, color }: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
        active
          ? color ?? "border-primary/50 bg-primary/15 text-primary"
          : "border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function EventBadge({ type }: { type: string }) {
  const m = EVENT_META[type] ?? { label: type, color: "text-muted-foreground bg-muted/20 border-border", dot: "bg-muted" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", m.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", m.dot)} />
      {m.label}
    </span>
  )
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={cn("inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold", METHOD_COLOR[method] ?? "text-muted-foreground bg-muted/20 border-border")}>
      {method}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [data,       setData]       = useState<ApiData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab,        setTab]        = useState<Tab>("events")
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [page,       setPage]       = useState(0)

  // Filters
  const [search,      setSearch]      = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [eventTypes,  setEventTypes]  = useState<Set<string>>(new Set())
  const [method,      setMethod]      = useState("all")
  const [direction,   setDirection]   = useState<Direction>("all")
  const [status,      setStatus]      = useState<StatusRange>("all")
  const [dateRange,   setDateRange]   = useState<DateRange>("all")
  const [customFrom,  setCustomFrom]  = useState("")
  const [customTo,    setCustomTo]    = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async (silent = false, currentPage = page) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const qs = buildParams(currentPage * PAGE_SIZE, eventTypes, method, direction, status, search, dateRange, customFrom, customTo)
      const res = await fetch(`/api/admin/logs?${qs}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, eventTypes, method, direction, status, search, dateRange, customFrom, customTo])

  useEffect(() => { void fetchData() }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => void fetchData(true), 15_000)
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current) }
  }, [autoRefresh, fetchData])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0) }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Helpers
  function toggleEventType(t: string) {
    setPage(0)
    setEventTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  function clearFilters() {
    setSearchInput(""); setSearch(""); setEventTypes(new Set())
    setMethod("all"); setDirection("all"); setStatus("all")
    setDateRange("all"); setCustomFrom(""); setCustomTo(""); setPage(0)
  }

  const hasFilters = searchInput || eventTypes.size > 0 || method !== "all" ||
    direction !== "all" || status !== "all" || dateRange !== "all"

  const { logs = [], sessions = [], stats, total = 0 } = data ?? {}
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Sessions search (client-side since no pagination)
  const [sessionSearch, setSessionSearch] = useState("")
  const filteredSessions = sessions.filter((s) => {
    if (!sessionSearch.trim()) return true
    const q = sessionSearch.toLowerCase()
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.userEmail?.toLowerCase().includes(q) ||
      s.ipAddress?.includes(q) ||
      false
    )
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-sm">Indlæser logs…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Logs</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Overvågning af forespørgsler, logins og hændelser
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            title={autoRefresh ? "Stop auto-opdatering" : "Start auto-opdatering (15s)"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
              autoRefresh
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            {autoRefresh ? "Live" : "Auto"}
          </button>

          {/* Export CSV */}
          <button
            onClick={() => exportCSV(logs)}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>

          {/* Refresh */}
          <button
            onClick={() => void fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Opdater
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Events i alt"   value={stats?.total        ?? 0} icon={<Activity    className="h-4 w-4 text-sky-400"     />} color="bg-sky-400/10"     />
        <StatCard label="Sidevisninger"  value={stats?.pageViews    ?? 0} icon={<Globe       className="h-4 w-4 text-sky-300"     />} color="bg-sky-300/10"     />
        <StatCard label="Logins (OK)"    value={stats?.loginSuccess ?? 0} icon={<LogIn       className="h-4 w-4 text-emerald-400" />} color="bg-emerald-400/10" />
        <StatCard label="Logins (fejl)"  value={stats?.loginFailure ?? 0} icon={<Shield      className="h-4 w-4 text-red-400"     />} color="bg-red-400/10"     dimmed={(stats?.loginFailure ?? 0) === 0} />
        <StatCard label="API fejl"       value={stats?.errors       ?? 0} icon={<AlertTriangle className="h-4 w-4 text-orange-400"/>} color="bg-orange-400/10"  dimmed={(stats?.errors ?? 0) === 0} />
        <StatCard label="Rate limited"   value={stats?.rateLimited  ?? 0} icon={<Shield      className="h-4 w-4 text-yellow-400"  />} color="bg-yellow-400/10"  dimmed={(stats?.rateLimited ?? 0) === 0} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/40 p-1 w-fit">
        {([["events", "Events"], ["sessions", "Sessioner"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span className={cn(
              "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
              tab === t ? "bg-white/20" : "bg-muted/30",
            )}>
              {t === "events" ? total : sessions.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Events tab ── */}
      {tab === "events" && (
        <>
          {/* Filter bar */}
          <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="admin-input flex flex-1 min-w-[180px] max-w-xs items-center gap-2 py-1.5 px-3">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Søg sti, IP, email…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-[color:var(--foreground-subtle)]"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput("")} className="shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Show/hide advanced filters */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  showFilters || hasFilters
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter {hasFilters && <span className="rounded-full bg-primary/30 px-1 text-[10px] font-bold">!</span>}
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" /> Ryd
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-3 border-t border-border/30 pt-3">
                {/* Event types */}
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Event type</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill active={eventTypes.size === 0} onClick={() => { setEventTypes(new Set()); setPage(0) }}>
                      Alle
                    </Pill>
                    {ALL_EVENT_TYPES.map((t) => {
                      const m = EVENT_META[t]
                      return (
                        <Pill
                          key={t}
                          active={eventTypes.has(t)}
                          onClick={() => toggleEventType(t)}
                          color={eventTypes.has(t) ? m.color : undefined}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                          {m.label}
                        </Pill>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {/* Direction */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Retning</p>
                    <div className="flex gap-1.5">
                      {([
                        ["all",     "Alle",              null],
                        ["inbound", "Inbound",   <ArrowDownLeft  key="in"  className="h-3 w-3" />],
                        ["api",     "API / Outbound", <ArrowUpRight key="out" className="h-3 w-3" />],
                      ] as [Direction, string, React.ReactNode][]).map(([v, label, icon]) => (
                        <Pill key={v} active={direction === v} onClick={() => { setDirection(v); setPage(0) }}>
                          {icon}{label}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  {/* Method */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Metode</p>
                    <div className="flex gap-1.5">
                      {["all", "GET", "POST", "PUT", "DELETE"].map((m) => (
                        <Pill key={m} active={method === m} onClick={() => { setMethod(m); setPage(0) }}>
                          {m === "all" ? "Alle" : m}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">HTTP status</p>
                    <div className="flex gap-1.5">
                      {([
                        ["all", "Alle", ""],
                        ["2xx", "2xx",  "text-emerald-400 bg-emerald-400/10 border-emerald-400/25"],
                        ["3xx", "3xx",  "text-yellow-400  bg-yellow-400/10  border-yellow-400/25"],
                        ["4xx", "4xx",  "text-orange-400  bg-orange-400/10  border-orange-400/25"],
                        ["5xx", "5xx",  "text-red-400     bg-red-400/10     border-red-400/25"],
                      ] as [StatusRange, string, string][]).map(([v, label, color]) => (
                        <Pill key={v} active={status === v} onClick={() => { setStatus(v); setPage(0) }} color={color || undefined}>
                          {label}
                        </Pill>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Periode</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ["all",       "Alle"],
                      ["today",     "I dag"],
                      ["yesterday", "I går"],
                      ["7d",        "7 dage"],
                      ["30d",       "30 dage"],
                      ["custom",    "Vælg dato"],
                    ] as [DateRange, string][]).map(([v, label]) => (
                      <Pill key={v} active={dateRange === v} onClick={() => { setDateRange(v); setPage(0) }}>
                        {v !== "all" && <Clock className="h-3 w-3" />} {label}
                      </Pill>
                    ))}
                  </div>
                  {dateRange === "custom" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Fra</span>
                      <input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setPage(0) }}
                        className="admin-input py-1 px-2 text-xs" />
                      <span className="text-muted-foreground">til</span>
                      <input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setPage(0) }}
                        className="admin-input py-1 px-2 text-xs" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Result count + active filter summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Viser <span className="font-semibold text-foreground tabular-nums">{logs.length}</span> af{" "}
              <span className="font-semibold text-foreground tabular-nums">{total}</span> events
              {hasFilters && " (filtreret)"}
            </span>
            {autoRefresh && (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live opdatering aktiv
              </span>
            )}
          </div>

          {/* Events table */}
          <div className="overflow-hidden rounded-xl border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-border/50 bg-muted/20">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">Tidspunkt</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Sti</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Bruger</th>
                    <th className="px-4 py-3">Enhed</th>
                    <th className="w-8 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center">
                        <Activity className="mx-auto mb-2 h-7 w-7 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Ingen events matcher de valgte filtre</p>
                        {hasFilters && (
                          <button onClick={clearFilters} className="mt-2 text-xs text-primary underline">Ryd filtre</button>
                        )}
                      </td>
                    </tr>
                  )}
                  {logs.map((log) => {
                    const isExpanded = expanded === log.id
                    const device = parseDevice(log.userAgent)
                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-white/[0.025]",
                            isExpanded && "bg-white/[0.015]",
                          )}
                          onClick={() => setExpanded(isExpanded ? null : log.id)}
                        >
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                            <div className="text-xs text-foreground">{relativeTime(log.timestamp)}</div>
                            <div className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString("da-DK")}</div>
                          </td>
                          <td className="px-4 py-3">
                            <EventBadge type={log.eventType} />
                          </td>
                          <td className="px-4 py-3">
                            <MethodBadge method={log.method} />
                          </td>
                          <td className="max-w-[200px] px-4 py-3">
                            <span className="block truncate font-mono text-xs text-foreground" title={log.path}>
                              {log.path}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {log.statusCode ? (
                              <span className={cn("font-mono text-xs font-bold", statusColor(log.statusCode))}>
                                {log.statusCode}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {log.ip ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            {log.userEmail ? (
                              <span className="text-xs text-foreground truncate max-w-[120px] block" title={log.userEmail}>
                                {log.userEmail}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Anonym</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground" title={log.userAgent ?? ""}>
                              {device === "mobile"
                                ? <Smartphone className="h-3 w-3 shrink-0" />
                                : <Monitor className="h-3 w-3 shrink-0" />}
                              {parseBrowser(log.userAgent)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {isExpanded
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-muted/[0.07]">
                            <td colSpan={9} className="px-5 py-4">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:grid-cols-3 lg:grid-cols-4">
                                <DetailField label="Tidspunkt"  value={formatTs(log.timestamp)} mono />
                                <DetailField label="Event type" value={log.eventType} mono />
                                <DetailField label="Metode"     value={log.method} mono />
                                <DetailField label="HTTP status" value={log.statusCode ? String(log.statusCode) : "—"} mono />
                                <DetailField label="Fuld sti"   value={log.path} mono />
                                {log.ip        && <DetailField label="IP"        value={log.ip} mono />}
                                {log.userId    && <DetailField label="User ID"   value={log.userId} mono />}
                                {log.userEmail && <DetailField label="Email"     value={log.userEmail} />}
                                {log.userAgent && (
                                  <div className="col-span-2 lg:col-span-3">
                                    <p className="mb-1 font-semibold text-muted-foreground">User-Agent</p>
                                    <p className="font-mono text-[11px] text-foreground break-all">{log.userAgent}</p>
                                  </div>
                                )}
                                {Object.keys(log.details ?? {}).length > 0 && (
                                  <div className="col-span-2 lg:col-span-4">
                                    <p className="mb-1 font-semibold text-muted-foreground">Details</p>
                                    <pre className="overflow-x-auto rounded-lg bg-black/20 p-3 font-mono text-[11px] text-foreground border border-border/30">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Side {page + 1} af {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  ← Forrige
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        pg === page
                          ? "border-primary/50 bg-primary/15 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {pg + 1}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                >
                  Næste →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Sessions tab ── */}
      {tab === "sessions" && (
        <>
          <div className="flex items-center gap-2">
            <div className="admin-input flex flex-1 max-w-xs items-center gap-2 py-1.5 px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Søg navn, email, IP…"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs outline-none placeholder:text-[color:var(--foreground-subtle)]"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredSessions.length} aktive sessioner
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-border/50 bg-muted/20">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="px-4 py-3">Bruger</th>
                    <th className="px-4 py-3">Rolle</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Enhed</th>
                    <th className="px-4 py-3">Oprettet</th>
                    <th className="px-4 py-3">Udløber</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                        Ingen sessioner matcher søgningen
                      </td>
                    </tr>
                  )}
                  {filteredSessions.map((s) => {
                    const expired = new Date(s.expiresAt) < new Date()
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-white/[0.025]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
                              {(s.userName ?? s.userEmail ?? "?")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{s.userName ?? "—"}</p>
                              <p className="text-[10px] text-muted-foreground">{s.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                            s.userRole === "admin"
                              ? "border-violet-400/25 bg-violet-400/10 text-violet-400"
                              : "border-blue-400/25 bg-blue-400/10 text-blue-400"
                          )}>
                            {s.userRole ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {s.ipAddress ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground" title={s.userAgent ?? ""}>
                            {parseDevice(s.userAgent) === "mobile"
                              ? <Smartphone className="h-3 w-3 shrink-0" />
                              : <Monitor className="h-3 w-3 shrink-0" />}
                            {parseBrowser(s.userAgent)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="text-xs text-foreground">{relativeTime(s.createdAt)}</div>
                          <div className="text-[10px] text-muted-foreground">{formatTs(s.createdAt)}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {formatTs(s.expiresAt)}
                        </td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Udløbet
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Aktiv
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Detail field ──────────────────────────────────────────────────────────────

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="mb-0.5 font-semibold text-muted-foreground">{label}</p>
      <p className={cn("text-foreground break-all", mono && "font-mono text-[11px]")}>{value}</p>
    </div>
  )
}
