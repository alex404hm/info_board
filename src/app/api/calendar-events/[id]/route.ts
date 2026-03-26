import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { calendarEvent } from "@/db/schema"
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
    const updated = await db
      .update(calendarEvent)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        ...(body.start !== undefined && { start: body.start }),
        ...(body.end !== undefined && { end: body.end }),
        ...(body.allDay !== undefined && { allDay: body.allDay }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        updatedAt: now,
      })
      .where(eq(calendarEvent.id, id))
      .returning()

    if (!updated.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Failed to update calendar event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 400 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const deleted = await db
      .delete(calendarEvent)
      .where(eq(calendarEvent.id, id))
      .returning()

    if (!deleted.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete calendar event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 400 })
  }
}
