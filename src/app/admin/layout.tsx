import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers, cookies } from "next/headers"
import AdminHeader from "./_components/AdminHeader"
import { AdminThemeProvider } from "./_components/AdminThemeProvider"
import { AppSidebar } from "@/components/app-sidebar"
import AdminLogin from "./_components/AdminLogin"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const metadata = {
  title: "Admin - TEC Info Board",
  description: "Login and administration for TEC Info Board",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  const role = getUserRole(session)
  const isAuthenticated = !!session && ["teacher", "admin"].includes(role ?? "")

  // ── All admin routes require a full session ──────────────────────────────
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

  const cookieStore = await cookies()
  const themeCookie = cookieStore.get("admin-theme")?.value
  const initialTheme = themeCookie === "light" ? "light" : "dark"

  return (
    <SidebarProvider>
      <AdminThemeProvider initialTheme={initialTheme}>
        <AppSidebar user={user} />
        <SidebarInset className="bg-background h-svh overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-card px-4">
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
