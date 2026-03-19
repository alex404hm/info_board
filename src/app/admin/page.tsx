import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { message, user } from "@/db/schema"
import { eq, and, or, isNull, gte, count } from "drizzle-orm"
import { MessageSquare, Users, Calendar, Activity } from "lucide-react"

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user.role === "admin") {
    redirect("/admin/users")
  }

  const now = new Date()
  const [activeMessages] = await db
    .select({ count: count() })
    .from(message)
    .where(
      and(
        eq(message.active, true),
        or(isNull(message.expiresAt), gte(message.expiresAt, now))
      )
    )

  const [totalUsers] = await db.select({ count: count() }).from(user)

  const stats = [
    { label: "Active Messages", value: activeMessages?.count ?? 0, icon: MessageSquare, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Admin Users", value: totalUsers?.count ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Calendar", value: "Connected", icon: Calendar, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "System", value: "Online", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Welcome back, {session?.user.name || "Teacher"}
          </p>
        </div>
        <span className="badge-accent">Status: Online</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted text-sm font-medium">{stat.label}</span>
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="admin-panel p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a href="/admin/messages" className="admin-panel-soft flex items-center gap-3 p-4 hover:border-accent/60 hover:bg-[color:var(--surface-alt)]">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-foreground text-sm font-medium">Post Message</p>
              <p className="text-muted text-xs">Send to info board</p>
            </div>
          </a>
          <a href="/admin/calendar" className="admin-panel-soft flex items-center gap-3 p-4 hover:border-accent/60 hover:bg-[color:var(--surface-alt)]">
            <Calendar className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-foreground text-sm font-medium">Calendar Settings</p>
              <p className="text-muted text-xs">Connect Outlook</p>
            </div>
          </a>
          <a href="/" target="_blank" className="admin-panel-soft flex items-center gap-3 p-4 hover:border-accent/60 hover:bg-[color:var(--surface-alt)]">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-foreground text-sm font-medium">View Info Board</p>
              <p className="text-muted text-xs">Open in new tab</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
