import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"

export default async function LogsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (role !== "admin") redirect("/admin")
  return <>{children}</>
}
