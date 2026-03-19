import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import AdminHeader from "./_components/AdminHeader"
import { AppSidebar } from "@/components/app-sidebar"
import AdminLogin from "./_components/AdminLogin"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export const metadata = {
  title: "Admin Dashboard - TEC Info Board",
  description: "Administrator dashboard for TEC Info Board",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  const role = getUserRole(session)
  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return <AdminLogin />
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: getUserRole(session),
  }

  return (
    <SidebarProvider>
      <div className="admin-theme flex min-h-svh w-full">
        <AppSidebar user={user} />
        <SidebarInset className="bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-[color:var(--surface)] px-4">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-border/60" />
            <AdminHeader user={user} />
          </header>
          <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-10 scroll-smooth">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
