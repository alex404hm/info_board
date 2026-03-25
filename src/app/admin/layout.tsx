import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import AdminHeader from "./_components/AdminHeader"
import { AdminThemeProvider } from "./_components/AdminThemeProvider"
import { AppSidebar } from "@/components/app-sidebar"
import AdminLogin from "./_components/AdminLogin"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Admin Dashboard - TEC Info Board",
  description: "Administrator dashboard for TEC Info Board",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""

  const session = await auth.api.getSession({ headers: headersList })
  const role = getUserRole(session)
  const isAuthenticated = !!session && ["teacher", "admin"].includes(role ?? "")

  // ── 2FA verification route ────────────────────────────────────────────────
  // The proxy already ensures only requests with a pending two_factor cookie
  // reach here, so we only need to handle the "already authenticated" edge case.
  if (pathname === "/admin/2fa") {
    if (isAuthenticated) {
      redirect("/admin")
    }
    return <>{children}</>
  }

  // ── All other admin routes require a full session ─────────────────────────
  if (!isAuthenticated) {
    return <AdminLogin />
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
    role: getUserRole(session),
  }

  return (
    <SidebarProvider>
      <AdminThemeProvider>
        <AppSidebar user={user} />
        <SidebarInset className="bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-card px-4">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-border/60" />
            <AdminHeader user={user} />
          </header>
          <main className="flex-1 overflow-auto px-4 py-8 sm:px-8 lg:px-12 scroll-smooth">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </SidebarInset>
      </AdminThemeProvider>
    </SidebarProvider>
  )
}
