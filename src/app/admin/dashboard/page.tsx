import { db } from "@/db"
import { message, user } from "@/db/schema"
import { and, or, isNull, gte, lt, count } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import {
  MessageSquare, Users, ArrowRight,
  Settings, LayoutGrid,
  ShieldCheck, TrendingUp, TrendingDown, Minus,
} from "lucide-react"
import { ChartBarInteractive } from "@/components/chart-bar-interactive"

function NavCard({
  href,
  icon: Icon,
  label,
  description,
  accent,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  accent?: string
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-px"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
        style={accent
          ? { background: accent + "18", borderColor: accent + "30", color: accent }
          : { background: "var(--muted)", borderColor: "var(--border)" }}
      >
        <Icon className="h-5 w-5 [color:inherit]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </a>
  )
}

function Delta({ thisWeek, lastWeek }: { thisWeek: number; lastWeek: number }) {
  const diff = thisWeek - lastWeek
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        Ingen ændring fra forrige uge
      </span>
    )
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-500">
        <TrendingUp className="h-3 w-3" />
        +{diff} fra forrige uge
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-rose-400">
      <TrendingDown className="h-3 w-3" />
      {diff} fra forrige uge
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
  delta,
  className,
}: {
  label: string
  value: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  sub?: string
  delta?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 flex flex-col gap-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
        {delta
          ? <div className="mt-0.5">{delta}</div>
          : sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        }
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  const name = session?.user.name || "Bruger"
  const now = new Date()

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    [activeMessages],
    [totalMessages],
    [totalUsers],
    [messagesThisWeek],
    [messagesLastWeek]
  ] = await Promise.all([
    db.select({ count: count() })
      .from(message)
      .where(and(or(isNull(message.expiresAt), gte(message.expiresAt, now)))),
    db.select({ count: count() }).from(message),
    db.select({ count: count() }).from(user),
    db.select({ count: count() })
      .from(message)
      .where(gte(message.createdAt, oneWeekAgo)),
    db.select({ count: count() })
      .from(message)
      .where(and(gte(message.createdAt, twoWeeksAgo), lt(message.createdAt, oneWeekAgo))),
  ])

  const isAdmin = role === "admin"
  const hour = now.getHours()
  const greeting =
    hour < 10 ? "Godmorgen" : hour < 13 ? "God formiddag" : hour < 18 ? "Godeftermiddag" : "Godaften"

  const msgThisWeek = messagesThisWeek?.count ?? 0
  const msgLastWeek = messagesLastWeek?.count ?? 0

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Administrator" : "Instruktør"} · Infoskærm kontrolpanel
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <StatCard
          label="Aktive beskeder"
          value={activeMessages?.count ?? 0}
          icon={MessageSquare}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          delta={<Delta thisWeek={msgThisWeek} lastWeek={msgLastWeek} />}
          className="flex-1 min-w-[200px] max-w-[280px]"
        />
        <StatCard
          label="Beskeder i alt"
          value={totalMessages?.count ?? 0}
          icon={MessageSquare}
          iconColor="text-sky-400"
          iconBg="bg-sky-400/10"
          sub="oprettede beskeder"
          className="flex-1 min-w-[200px] max-w-[280px]"
        />
        {isAdmin ? (
          <StatCard
            label="Brugere"
            value={totalUsers?.count ?? 0}
            icon={Users}
            iconColor="text-violet-400"
            iconBg="bg-violet-400/10"
            sub="registrerede konti"
            className="flex-1 min-w-[200px] max-w-[280px]"
          />
        ) : (
          <StatCard
            label="Din rolle"
            value={isAdmin ? "Administrator" : "Instruktør"}
            icon={ShieldCheck}
            iconColor="text-blue-400"
            iconBg="bg-blue-400/10"
            sub="Begrænset adgang"
            className="flex-1 min-w-[200px] max-w-[280px]"
          />
        )}
      </div>

      <ChartBarInteractive days={30} />

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Administration
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <NavCard
              href="/admin/users"
              icon={Users}
              label="Brugere"
              description="Inviter og administrer brugere"
              accent="#a78bfa"
            />
            <NavCard
              href="/admin/display"
              icon={LayoutGrid}
              label="Display & Layout"
              description="Konfigurer paneler og navigation"
              accent="#38bdf8"
            />
            <NavCard
              href="/admin/settings"
              icon={Settings}
              label="Min konto"
              description="Profil, adgangskode og sessioner"
              accent="#94a3b8"
            />
          </div>
        </section>
      )}
    </div>
  )
}

