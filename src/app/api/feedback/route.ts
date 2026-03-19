import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { feedback } from "@/db/schema"
import { desc, count, avg, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"

// POST /api/feedback — submit feedback from info board
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { rating?: unknown; comment?: unknown; ideas?: unknown }
    const rating = Number(body.rating)
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : ""

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
    }
    if (comment.length < 10) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const ideas   = Array.isArray(body.ideas) ? (body.ideas as string[]).slice(0, 20) : []

    await db.insert(feedback).values({
      id: crypto.randomUUID(),
      rating,
      comment,
      ideas,
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// GET /api/feedback — admin only, returns all feedback + aggregates
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !["teacher", "admin"].includes(getUserRole(session) ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await db
    .select()
    .from(feedback)
    .orderBy(desc(feedback.createdAt))

  const [agg] = await db
    .select({
      total: count(),
      avgRating: avg(feedback.rating),
      count5: sql<number>`sum(case when rating = 5 then 1 else 0 end)::int`,
      count4: sql<number>`sum(case when rating = 4 then 1 else 0 end)::int`,
      count3: sql<number>`sum(case when rating = 3 then 1 else 0 end)::int`,
      count2: sql<number>`sum(case when rating = 2 then 1 else 0 end)::int`,
      count1: sql<number>`sum(case when rating = 1 then 1 else 0 end)::int`,
    })
    .from(feedback)

  // Tally idea selections
  const ideaCounts: Record<string, number> = {}
  for (const row of rows) {
    for (const idea of row.ideas ?? []) {
      ideaCounts[idea] = (ideaCounts[idea] ?? 0) + 1
    }
  }

  return NextResponse.json({ rows, agg, ideaCounts })
}
