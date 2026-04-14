"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-fetch"
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Globe,
  MonitorSmartphone,
  RefreshCw,
  Shield,
  BookOpen,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SessionRow = {
  id: string
  createdAt: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  userId: string
  userName: string | null
  userEmail: string
  userRole: string
  userImage: string | null
  active: boolean
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Ukendt enhed"
  if (/mobile|android|iphone|ipad/i.test(ua)) return "Mobil"
  if (/macintosh|mac os/i.test(ua)) return "Mac"
  if (/windows/i.test(ua)) return "Windows"
  if (/linux/i.test(ua)) return "Linux"
  return "Desktop"
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "–"
  if (/edg\//i.test(ua)) return "Edge"
  if (/opr\//i.test(ua)) return "Opera"
  if (/chrome/i.test(ua)) return "Chrome"
  if (/safari/i.test(ua)) return "Safari"
  if (/firefox/i.test(ua)) return "Firefox"
  return "Browser"
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ")
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        <Shield className="h-2.5 w-2.5" />
        Administrator
      </span>
    )
  if (role === "teacher")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
        <BookOpen className="h-2.5 w-2.5" />
        Instruktør
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
      <User className="h-2.5 w-2.5" />
      Bruger
    </span>
  )
}

export default function ActivityPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiFetch("/api/admin/activity")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessions(data)
    } catch {
      setError("Kunne ikke hente aktivitetsdata.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const active = sessions.filter((s) => s.active)
  const inactive = sessions.filter((s) => !s.active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Brugeraktivitet</h1>
            <p className="text-xs text-muted-foreground">
              Aktive sessioner og login-historik
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Opdater
        </Button>
      </div>

      {/* Stats strip */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card/60 px-5 py-4">
            <p className="text-xs text-muted-foreground">Aktive sessioner</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{active.length}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 px-5 py-4">
            <p className="text-xs text-muted-foreground">Unikke brugere (total)</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {new Set(sessions.map((s) => s.userId)).size}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 px-5 py-4">
            <p className="text-xs text-muted-foreground">Sessions i alt</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{sessions.length}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      )}

      {/* Active sessions */}
      {!loading && !error && (
        <>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
                Aktive sessioner
                <span className="text-xs font-normal text-muted-foreground">({active.length})</span>
              </h2>
            </div>

            {active.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                Ingen aktive sessioner
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      {["Bruger", "Rolle", "IP-adresse", "Enhed / Browser", "Logget ind", "Udløber"].map(
                        (h, i) => (
                          <th
                            key={i}
                            className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {active.map((s) => (
                      <SessionRow key={s.id} s={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Session history */}
          {inactive.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  Login-historik
                  <span className="text-xs font-normal text-muted-foreground">
                    ({inactive.length})
                  </span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      {["Bruger", "Rolle", "IP-adresse", "Enhed / Browser", "Logget ind", "Udløbet"].map(
                        (h, i) => (
                          <th
                            key={i}
                            className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {inactive.map((s) => (
                      <SessionRow key={s.id} s={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SessionRow({ s }: { s: SessionRow }) {
  return (
    <tr className="group transition-colors hover:bg-muted/20">
      {/* User */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {s.userImage ? (
            <img
              src={s.userImage}
              alt={s.userName ?? s.userEmail}
              className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border/40"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {initials(s.userName, s.userEmail)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {s.userName ?? <span className="italic text-muted-foreground">Ingen navn</span>}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{s.userEmail}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-5 py-3.5">
        <RoleBadge role={s.userRole} />
      </td>

      {/* IP */}
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="h-3 w-3 shrink-0" />
          {s.ipAddress ?? "–"}
        </span>
      </td>

      {/* Device / Browser */}
      <td className="px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MonitorSmartphone className="h-3 w-3 shrink-0" />
          {parseDevice(s.userAgent)} · {parseBrowser(s.userAgent)}
        </span>
      </td>

      {/* Logged in */}
      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
        {fmtDate(s.createdAt)}
      </td>

      {/* Expires / Expired */}
      <td className="px-5 py-3.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            s.active ? "text-emerald-400" : "text-muted-foreground/60"
          )}
        >
          {s.active ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <span className="h-3 w-3 flex items-center justify-center text-[10px]">✕</span>
          )}
          {fmtDate(s.expiresAt)}
        </span>
      </td>
    </tr>
  )
}
