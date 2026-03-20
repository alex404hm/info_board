import { NextRequest, NextResponse } from "next/server"
import { log } from "@/lib/logger"

const INTERNAL_SECRET = process.env.LOG_SECRET ?? "ib-internal-log"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-log-secret")
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json() as Record<string, unknown>
    await log({
      eventType: String(body.eventType ?? "event"),
      ip: body.ip != null ? String(body.ip) : null,
      method: body.method != null ? String(body.method) : "GET",
      path: body.path != null ? String(body.path) : "/",
      statusCode: body.statusCode != null ? Number(body.statusCode) : null,
      userId: body.userId != null ? String(body.userId) : null,
      userEmail: body.userEmail != null ? String(body.userEmail) : null,
      userAgent: body.userAgent != null ? String(body.userAgent) : null,
      details: typeof body.details === "object" && body.details !== null
        ? body.details as Record<string, unknown>
        : {},
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
