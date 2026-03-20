import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user, invitation } from "@/db/schema"
import { getUserRole } from "@/lib/session-role"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { sendInviteEmail } from "@/lib/email"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || getUserRole(session) !== "admin") return null
  return session
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let email: string
  try {
    ;({ email } = await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const [existingUser] = await db
      .select({ id: user.id, role: user.role, name: user.name })
      .from(user)
      .where(eq(user.email, normalizedEmail))

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (existingUser.name) {
      return NextResponse.json({ error: "User has already set up their account" }, { status: 409 })
    }

    // Delete any existing invitations for this user
    await db.delete(invitation).where(eq(invitation.userId, existingUser.id))

    // Create a fresh invitation
    const token = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    await db.insert(invitation).values({
      token,
      email: normalizedEmail,
      role: existingUser.role,
      userId: existingUser.id,
      expiresAt,
      createdAt: now,
    })

    await sendInviteEmail(normalizedEmail, token, existingUser.role)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[POST /api/admin/invite/resend]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
