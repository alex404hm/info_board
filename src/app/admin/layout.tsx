import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers, cookies } from "next/headers"
import AdminHeader from "./_components/AdminHeader"
import { AdminThemeProvider } from "./_components/AdminThemeProvider"
import { AppSidebar } from "@/components/app-sidebar"
import AdminLogin from "./_components/AdminLogin"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    role: getUserRole(session) ?? null,
  }

  const cookieStore = await cookies()

  const themeCookie = cookieStore.get("admin-theme")?.value
  const initialTheme =
    themeCookie === "light" || themeCookie === "dark" || themeCookie === "system"
      ? themeCookie
      : "system"

  const sidebarCookie = cookieStore.get("sidebar_state")?.value
  const defaultSidebarOpen = sidebarCookie !== "false"

  return (
    <>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AdminThemeProvider initialTheme={initialTheme}>
          <AppSidebar user={user} />
          <SidebarInset className="h-svh min-w-0 bg-background overflow-x-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-card px-4">
  <AdminHeader user={user} />
            </header>
            <ScrollArea className="flex-1 min-w-0 px-4 py-8 scroll-smooth sm:px-8 lg:px-12">
              <div className="mx-auto min-w-0 w-full max-w-5xl">{children}</div>
            </ScrollArea>
          </SidebarInset>
        </AdminThemeProvider>
      </SidebarProvider>
    </>
  )
}
