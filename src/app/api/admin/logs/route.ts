import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { db } from "@/db"
import { requestLog, session, feedback, user } from "@/db/schema"
import { desc, eq, count, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const sess = await auth.api.getSession({ headers: await headers() })
  if (!sess || getUserRole(sess) !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500)

  // Request logs
  const logs = await db
    .select()
    .from(requestLog)
    .orderBy(desc(requestLog.timestamp))
    .limit(limit)

  // Recent sessions (= login events)
  const sessions = await db
    .select({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      userId: session.userId,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
    })
    .from(session)
    .leftJoin(user, eq(session.userId, user.id))
    .orderBy(desc(session.createdAt))
    .limit(100)

  // Recent feedback
  const feedbacks = await db
    .select()
    .from(feedback)
    .orderBy(desc(feedback.createdAt))
    .limit(50)

  // Stats
  const [stats] = await db
    .select({
      total: count(),
      pageViews: sql<number>`sum(case when event_type = 'page_view' then 1 else 0 end)::int`,
      loginSuccess: sql<number>`sum(case when event_type = 'login_success' then 1 else 0 end)::int`,
      loginFailure: sql<number>`sum(case when event_type = 'login_failure' then 1 else 0 end)::int`,
      errors: sql<number>`sum(case when event_type = 'api_error' then 1 else 0 end)::int`,
    })
    .from(requestLog)

  return NextResponse.json({ logs, sessions, feedbacks, stats })
}
