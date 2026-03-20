import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function InfoboardLayout({ children }: { children: React.ReactNode }) {
  // Allow all users (including admins) to view the info board
  return <>{children}</>
}
