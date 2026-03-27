import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (session && ["teacher", "admin"].includes(role ?? "")) {
    redirect("/admin/dashboard")
  }

  return null
}
