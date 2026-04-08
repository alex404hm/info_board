import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { kokkenvagtEntry } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const now = new Date()

  try {
    const existing = await db
      .select({ authorId: kokkenvagtEntry.authorId })
      .from(kokkenvagtEntry)
      .where(eq(kokkenvagtEntry.id, id))
      .limit(1)

    if (!existing.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (role !== "admin" && existing[0].authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await db
      .update(kokkenvagtEntry)
      .set({
        ...(body.week !== undefined && { week: body.week }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.person1 !== undefined && { person1: body.person1 }),
        ...(body.person2 !== undefined && { person2: body.person2 }),
        ...(body.note !== undefined && { note: body.note }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        updatedAt: now,
      })
      .where(eq(kokkenvagtEntry.id, id))
      .returning()

    if (!updated.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Failed to update kokkenvagt entry:", error)
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await db
      .select({ authorId: kokkenvagtEntry.authorId })
      .from(kokkenvagtEntry)
      .where(eq(kokkenvagtEntry.id, id))
      .limit(1)

    if (!existing.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (role !== "admin" && existing[0].authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await db
      .delete(kokkenvagtEntry)
      .where(eq(kokkenvagtEntry.id, id))
      .returning()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete kokkenvagt entry:", error)
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 400 }
    )
  }
}
