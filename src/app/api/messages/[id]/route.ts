import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { message } from "@/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, content, priority, active, expiresAt } = body

    const updated = await db
      .update(message)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(priority !== undefined && { priority }),
        ...(active !== undefined && { active }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date(),
      })
      .where(eq(message.id, id))
      .returning()

    if (!updated.length) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const deleted = await db
      .delete(message)
      .where(eq(message.id, id))
      .returning()

    if (!deleted.length) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
