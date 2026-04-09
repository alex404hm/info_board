import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import KokkenvagtAdminPage from "./_components/KokkenvagtClient"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (role === "admin") redirect("/admin/dashboard")
  return <KokkenvagtAdminPage />
}
