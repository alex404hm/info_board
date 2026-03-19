import { db } from "@/db"
import { invitation } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import InviteForm from "./InviteForm"

type Props = { params: Promise<{ token: string }> }

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  const [inv] = await db
    .select({
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
    })
    .from(invitation)
    .where(eq(invitation.token, token))

  if (!inv) return notFound()

  const expired = inv.expiresAt < new Date()
  const used = !!inv.acceptedAt

  if (expired || used) {
    return (
      <div style={{ minHeight: "100svh", background: "#040b16", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ width: 24, height: 24 }}>
              <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f4f6ff", margin: "0 0 10px" }}>
            {used ? "Already accepted" : "Link expired"}
          </h1>
          <p style={{ fontSize: 15, color: "#a3b2d4", lineHeight: 1.6 }}>
            {used
              ? "This invitation has already been accepted. You can sign in to the admin panel."
              : "This invitation link has expired. Please ask an admin to send a new one."}
          </p>
          {used && (
            <a href="/admin" style={{ display: "inline-block", marginTop: 24, background: "#10b981", color: "#fff", padding: "11px 22px", borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
              Go to sign in
            </a>
          )}
        </div>
      </div>
    )
  }

  return <InviteForm token={token} email={inv.email} role={inv.role} />
}
