import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (getUserRole(session) !== "admin") {
    redirect("/admin")
  }

  return <>{children}</>
}
