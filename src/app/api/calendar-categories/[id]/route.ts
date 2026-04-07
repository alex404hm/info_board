import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { calendarCategory, calendarEvent } from "@/db/schema"
import { getUserRole } from "@/lib/session-role"

async function ensureAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return null
  }
  return session
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureAdmin()
  if (!session) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  }

  const { id } = await params
  const found = await db
    .select({ id: calendarCategory.id, name: calendarCategory.name })
    .from(calendarCategory)
    .where(eq(calendarCategory.id, id))
    .limit(1)

  if (!found.length) {
    return NextResponse.json({ error: "Kategori ikke fundet" }, { status: 404 })
  }

  const categoryName = found[0].name

  await db
    .update(calendarEvent)
    .set({ category: null, updatedAt: new Date() })
    .where(eq(calendarEvent.category, categoryName))

  await db.delete(calendarCategory).where(eq(calendarCategory.id, id))

  return NextResponse.json({ success: true })
}
