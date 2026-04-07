import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { calendarEvent, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { desc, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  }

  const events = await db
    .select({
      id: calendarEvent.id,
      title: calendarEvent.title,
      start: calendarEvent.start,
      end: calendarEvent.end,
      allDay: calendarEvent.allDay,
      location: calendarEvent.location,
      description: calendarEvent.description,
      category: calendarEvent.category,
      authorId: calendarEvent.authorId,
      authorName: user.name,
      createdAt: calendarEvent.createdAt,
      updatedAt: calendarEvent.updatedAt,
    })
    .from(calendarEvent)
    .leftJoin(user, eq(calendarEvent.authorId, user.id))
    .orderBy(desc(calendarEvent.start))

  return NextResponse.json(events)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  }

  const body = await request.json()
  const now = new Date()

  try {
    const row = await db
      .insert(calendarEvent)
      .values({
        id: crypto.randomUUID(),
        title: body.title,
        start: body.start,
        end: body.end ?? null,
        allDay: body.allDay ?? true,
        location: body.location ?? null,
        description: body.description ?? null,
        category: body.category ?? null,
        authorId: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json(row[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create calendar event:", error)
    return NextResponse.json({ error: "Kunne ikke oprette begivenhed" }, { status: 400 })
  }
}
