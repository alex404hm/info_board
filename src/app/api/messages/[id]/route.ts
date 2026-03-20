import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { message } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

async function canManageMessage(id: string, session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>) {
  const role = getUserRole(session)
  if (role === "admin") return true
  if (role !== "teacher") return false

  const existing = await db
    .select({ authorId: message.authorId })
    .from(message)
    .where(eq(message.id, id))
    .limit(1)

  return existing[0]?.authorId === session.user.id
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || !["teacher", "admin"].includes(getUserRole(session) ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!(await canManageMessage(id, session))) {
      return NextResponse.json({ error: "Du kan kun ændre dine egne beskeder" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, priority, active, expiresAt, pinned, repeatDays } = body

    const updated = await db
      .update(message)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(priority !== undefined && { priority }),
        ...(active !== undefined && { active }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(pinned !== undefined && { pinned: Boolean(pinned) }),
        ...(repeatDays !== undefined && { repeatDays: Array.isArray(repeatDays) ? repeatDays : [] }),
        updatedAt: new Date(),
      })
      .where(eq(message.id, id))
      .returning()

    if (!updated.length) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || !["teacher", "admin"].includes(getUserRole(session) ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    if (!(await canManageMessage(id, session))) {
      return NextResponse.json({ error: "Du kan kun slette dine egne beskeder" }, { status: 403 })
    }

    const deleted = await db
      .delete(message)
      .where(eq(message.id, id))
      .returning()

    if (!deleted.length) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
