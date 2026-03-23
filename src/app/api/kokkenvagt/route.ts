import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { kokkenvagtEntry, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { eq, gte, or, isNull, and, desc } from "drizzle-orm"

const entryWithAuthor = {
  id: kokkenvagtEntry.id,
  week: kokkenvagtEntry.week,
  year: kokkenvagtEntry.year,
  person1: kokkenvagtEntry.person1,
  person2: kokkenvagtEntry.person2,
  note: kokkenvagtEntry.note,
  startTime: kokkenvagtEntry.startTime,
  endTime: kokkenvagtEntry.endTime,
  authorId: kokkenvagtEntry.authorId,
  authorName: user.name,
  createdAt: kokkenvagtEntry.createdAt,
  updatedAt: kokkenvagtEntry.updatedAt,
}

function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function GET(request: NextRequest) {
  const isAdmin = request.nextUrl.searchParams.get("admin") === "true"

  if (isAdmin) {
    const session = await auth.api.getSession({ headers: await headers() })
    const role = getUserRole(session)
    if (!session || !["teacher", "admin"].includes(role ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return all entries sorted by year DESC, then week DESC
    const entries = await db
      .select(entryWithAuthor)
      .from(kokkenvagtEntry)
      .leftJoin(user, eq(kokkenvagtEntry.authorId, user.id))
      .orderBy(desc(kokkenvagtEntry.year), desc(kokkenvagtEntry.week))

    return NextResponse.json(entries)
  }

  // Public: return current + future weeks only
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentWeek = getISOWeek(now)

  const entries = await db
    .select(entryWithAuthor)
    .from(kokkenvagtEntry)
    .leftJoin(user, eq(kokkenvagtEntry.authorId, user.id))
    .where(
      or(
        gte(kokkenvagtEntry.year, currentYear),
        and(
          eq(kokkenvagtEntry.year, currentYear),
          gte(kokkenvagtEntry.week, currentWeek)
        )
      )
    )
    .orderBy(kokkenvagtEntry.year, kokkenvagtEntry.week)

  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const now = new Date()

  try {
    const row = await db
      .insert(kokkenvagtEntry)
      .values({
        id: crypto.randomUUID(),
        week: body.week,
        year: body.year,
        person1: body.person1,
        person2: body.person2,
        note: body.note || null,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        authorId: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json(row[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create kokkenvagt entry:", error)
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 400 }
    )
  }
}
