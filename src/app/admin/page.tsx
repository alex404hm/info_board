import { db } from "@/db"
import { message, user } from "@/db/schema"
import { eq, and, or, isNull, gte, count } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import {
  MessageSquare, Users, ArrowRight,
  CalendarDays, Settings, Coffee, LayoutGrid,
  ShieldCheck,
} from "lucide-react"

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

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
}: {
  label: string
  value: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  const name = session?.user.name || "Bruger"
  const now = new Date()

  // Core stats
  const [activeMessages] = await db
    .select({ count: count() })
    .from(message)
    .where(and(eq(message.active, true), or(isNull(message.expiresAt), gte(message.expiresAt, now))))

  const [totalUsers] = await db.select({ count: count() }).from(user)

  const isAdmin = role === "admin"
  const hour = now.getHours()
  const greeting =
    hour < 10 ? "Godmorgen" : hour < 13 ? "God formiddag" : hour < 18 ? "Godeftermiddag" : "Godaften"

  return (
    <div className="space-y-8 w-full">

      {/* ── Header ── */}
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

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Aktive beskeder"
          value={activeMessages?.count ?? 0}
          icon={MessageSquare}
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
          sub="på infoskærmen"
        />
        {isAdmin && (
          <StatCard
            label="Brugere"
            value={totalUsers?.count ?? 0}
            icon={Users}
            iconColor="text-violet-400"
            iconBg="bg-violet-400/10"
            sub="registrerede konti"
          />
        )}
        <StatCard
          label="Din rolle"
          value={isAdmin ? "Admin" : "Instruktør"}
          icon={ShieldCheck}
          iconColor={isAdmin ? "text-violet-400" : "text-blue-400"}
          iconBg={isAdmin ? "bg-violet-400/10" : "bg-blue-400/10"}
          sub={isAdmin ? "Fuld adgang" : "Begrænset adgang"}
        />
      </div>

      {/* ── Quick actions — instructor ── */}
      {!isAdmin && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Hurtig adgang
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <NavCard
              href="/admin/messages"
              icon={MessageSquare}
              label="Beskeder"
              description="Opret og administrer opslag på skærmen"
              accent="#5f9dff"
            />
            <NavCard
              href="/admin/kokkenvagt"
              icon={Coffee}
              label="Køkkenvagt"
              description="Vagtplan og instruktioner for køkkenet"
              accent="#f59e0b"
            />
            <NavCard
              href="/admin/calendar"
              icon={CalendarDays}
              label="Kalender"
              description="Outlook ICS kalenderintegration"
              accent="#34d399"
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

      {/* ── Quick actions — admin ── */}
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
