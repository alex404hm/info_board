import { auth } from "@/lib/auth"
import { db } from "@/db"
import { getUserRole } from "@/lib/session-role"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || getUserRole(session) !== "admin") return null
  return session
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbudt" }, { status: 403 })

  const { id } = await params
  const { name, role } = await req.json()

  if (role && !["teacher", "admin"].includes(role)) {
    return NextResponse.json({ error: "Ugyldig rolle" }, { status: 400 })
  }

  // Prevent removing the last admin
  if (role && role !== "admin") {
    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"))
    if (admins.length === 1 && admins[0].id === id) {
      return NextResponse.json({ error: "Kan ikke fjerne den sidste administratorkonto" }, { status: 400 })
    }
  }

  await db
    .update(user)
    .set({
      ...(name ? { name } : {}),
      ...(role ? { role } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbudt" }, { status: 403 })

  const { id } = await params

  // Prevent self-deletion
  if (session.user.id === id) {
    return NextResponse.json({ error: "Kan ikke slette din egen konto" }, { status: 400 })
  }

  // Prevent deleting the last admin
  const targetUser = await db.select({ role: user.role }).from(user).where(eq(user.id, id))
  if (targetUser[0]?.role === "admin") {
    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"))
    if (admins.length === 1) {
      return NextResponse.json({ error: "Kan ikke slette den sidste administratorkonto" }, { status: 400 })
    }
  }

  await db.delete(user).where(eq(user.id, id))

  return NextResponse.json({ success: true })
}
