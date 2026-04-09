import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import AdminIntranetPage from "./_components/IntranetClient"

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (role === "admin") redirect("/admin/dashboard")
  return <AdminIntranetPage />
}
