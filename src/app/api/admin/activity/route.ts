import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { session, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"

async function requireAdmin() {
  const s = await auth.api.getSession({ headers: await headers() })
  if (!s || getUserRole(s) !== "admin") return null
  return s
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const rows = await db
      .select({
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        userId: session.userId,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        userImage: user.image,
      })
      .from(session)
      .innerJoin(user, eq(session.userId, user.id))
      .orderBy(desc(session.createdAt))
      .limit(300)

    const now = new Date()
    const result = rows.map((row) => ({
      ...row,
      active: new Date(row.expiresAt) > now,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error("[GET /api/admin/activity]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
