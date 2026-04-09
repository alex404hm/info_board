import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import SettingsClient from "@/components/admin/SettingsClient"

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  const initialUser = {
    name: session?.user.name ?? null,
    email: session?.user.email ?? "",
    image: session?.user.image ?? null,
  }

  return <SettingsClient initialUser={initialUser} />
}
