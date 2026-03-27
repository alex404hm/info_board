import { NextRequest, NextResponse } from "next/server"
import { and, gte, lt } from "drizzle-orm"

import { db } from "@/db"
import { message } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"

const DEFAULT_DAYS = 30
const MAX_DAYS = 90

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(base: Date, days: number) {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const role = getUserRole(session)

    if (!session || !["teacher", "admin"].includes(role ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawDays = Number(request.nextUrl.searchParams.get("days") ?? DEFAULT_DAYS)
    const days = Number.isFinite(rawDays)
      ? Math.max(7, Math.min(MAX_DAYS, Math.floor(rawDays)))
      : DEFAULT_DAYS

    const now = new Date()
    const currentStart = addDays(now, -(days - 1))
    currentStart.setHours(0, 0, 0, 0)

    const previousStart = addDays(currentStart, -days)

    const rows = await db
      .select({ createdAt: message.createdAt })
      .from(message)
      .where(and(gte(message.createdAt, previousStart), lt(message.createdAt, now)))

    const currentPeriodCountByDay: Record<string, number> = {}
    const previousPeriodCountByDay: Record<string, number> = {}

    for (const row of rows) {
      const createdAt = new Date(row.createdAt)
      const key = toDateKey(createdAt)

      if (createdAt >= currentStart) {
        currentPeriodCountByDay[key] = (currentPeriodCountByDay[key] ?? 0) + 1
      } else {
        previousPeriodCountByDay[key] = (previousPeriodCountByDay[key] ?? 0) + 1
      }
    }

    const data = Array.from({ length: days }, (_, index) => {
      const currentDate = addDays(currentStart, index)
      const previousDate = addDays(currentDate, -days)

      const currentKey = toDateKey(currentDate)
      const previousKey = toDateKey(previousDate)

      return {
        date: currentKey,
        current: currentPeriodCountByDay[currentKey] ?? 0,
        previous: previousPeriodCountByDay[previousKey] ?? 0,
      }
    })

    return NextResponse.json({
      days,
      data,
    })
  } catch (error) {
    console.error("GET /api/admin/dashboard/messages-chart error:", error)
    return NextResponse.json({ error: "Failed to load chart data" }, { status: 500 })
  }
}
