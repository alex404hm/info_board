import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user, invitation } from "@/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { sendInviteEmail } from "@/lib/email"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== "admin") return null
  return session
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let email: string, role: string
  try {
    ;({ email, role } = await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!email || !["teacher", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, normalizedEmail))
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const userId = crypto.randomUUID()
    const token = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await db.insert(user).values({
      id: userId,
      email: normalizedEmail,
      emailVerified: false,
      role,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(invitation).values({
      token,
      email: normalizedEmail,
      role,
      userId,
      expiresAt,
      createdAt: now,
    })

    const inviteLink = await sendInviteEmail(normalizedEmail, token, role)

    return NextResponse.json({ success: true, inviteLink })
  } catch (err) {
    console.error("[POST /api/admin/invite]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
