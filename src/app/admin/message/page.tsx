import { redirect } from "next/navigation"

export default function AdminMessageRedirect() {
  redirect("/admin/messages")
}
