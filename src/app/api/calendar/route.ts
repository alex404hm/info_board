import { NextResponse } from "next/server"
import { db } from "@/db"
import { calendarEvent } from "@/db/schema"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
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
      })
      .from(calendarEvent)
      .orderBy(calendarEvent.start)

    return NextResponse.json({ configured: true, events })
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json({ configured: false, events: [] }, { status: 500 })
  }
}
