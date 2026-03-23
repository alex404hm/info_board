import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { db } from "@/db"
import { requestLog, session, user } from "@/db/schema"
import { desc, eq, count, sql, and, gte, lte, like, or, inArray } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const sess = await auth.api.getSession({ headers: await headers() })
  if (!sess || getUserRole(sess) !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const limit  = Math.min(parseInt(searchParams.get("limit")  ?? "100"), 500)
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"),   0)

  // ── Filters ────────────────────────────────────────────────────────────────
  const eventTypeParam = searchParams.get("eventType")   // comma-separated
  const methodParam    = searchParams.get("method")       // GET | POST | etc.
  const directionParam = searchParams.get("direction")    // inbound | api
  const statusParam    = searchParams.get("status")       // 2xx | 3xx | 4xx | 5xx
  const searchParam    = searchParams.get("search")       // path / ip / email
  const fromParam      = searchParams.get("from")         // ISO date
  const toParam        = searchParams.get("to")           // ISO date

  const conditions: ReturnType<typeof eq>[] = []

  // Event types
  if (eventTypeParam) {
    const types = eventTypeParam.split(",").filter(Boolean)
    if (types.length > 0) {
      conditions.push(inArray(requestLog.eventType, types))
    }
  }

  // HTTP method
  if (methodParam && methodParam !== "all") {
    conditions.push(eq(requestLog.method, methodParam.toUpperCase()))
  }

  // Direction: inbound = paths NOT starting /api, api = paths starting /api
  if (directionParam === "inbound") {
    conditions.push(sql`${requestLog.path} NOT LIKE '/api/%'`)
  } else if (directionParam === "api") {
    conditions.push(sql`${requestLog.path} LIKE '/api/%'`)
  }

  // Status code ranges
  if (statusParam) {
    if (statusParam === "2xx") conditions.push(sql`${requestLog.statusCode} >= 200 AND ${requestLog.statusCode} < 300`)
    if (statusParam === "3xx") conditions.push(sql`${requestLog.statusCode} >= 300 AND ${requestLog.statusCode} < 400`)
    if (statusParam === "4xx") conditions.push(sql`${requestLog.statusCode} >= 400 AND ${requestLog.statusCode} < 500`)
    if (statusParam === "5xx") conditions.push(sql`${requestLog.statusCode} >= 500`)
  }

  // Text search across path, ip, userEmail
  if (searchParam && searchParam.trim()) {
    const q = `%${searchParam.trim()}%`
    conditions.push(
      or(
        like(requestLog.path,      q),
        like(requestLog.ip,        q),
        like(requestLog.userEmail, q),
      )!
    )
  }

  // Date range
  if (fromParam) {
    const from = new Date(fromParam)
    if (!isNaN(from.getTime())) {
      conditions.push(gte(requestLog.timestamp, from))
    }
  }
  if (toParam) {
    const to = new Date(toParam)
    if (!isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999)
      conditions.push(lte(requestLog.timestamp, to))
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  // ── Queries ────────────────────────────────────────────────────────────────
  const [logs, [{ total }]] = await Promise.all([
    db.select().from(requestLog)
      .where(where)
      .orderBy(desc(requestLog.timestamp))
      .limit(limit)
      .offset(offset),

    db.select({ total: count() }).from(requestLog)
      .where(where),
  ])

  // Active sessions with user info
  const sessions = await db
    .select({
      id:        session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      userId:    session.userId,
      userName:  user.name,
      userEmail: user.email,
      userRole:  user.role,
    })
    .from(session)
    .leftJoin(user, eq(session.userId, user.id))
    .orderBy(desc(session.createdAt))
    .limit(200)

  // Aggregate stats (always over all logs, ignoring filters)
  const [stats] = await db
    .select({
      total:        count(),
      pageViews:    sql<number>`sum(case when event_type = 'page_view'     then 1 else 0 end)::int`,
      loginSuccess: sql<number>`sum(case when event_type = 'login_success' then 1 else 0 end)::int`,
      loginFailure: sql<number>`sum(case when event_type = 'login_failure' then 1 else 0 end)::int`,
      errors:       sql<number>`sum(case when event_type = 'api_error'     then 1 else 0 end)::int`,
      rateLimited:  sql<number>`sum(case when event_type = 'rate_limited'  then 1 else 0 end)::int`,
    })
    .from(requestLog)

  return NextResponse.json({ logs, sessions, stats, total })
}
