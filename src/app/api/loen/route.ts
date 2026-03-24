import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { wageData, type WageGroup } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"

export type WageStep = {
  apprenticeshipPeriod: string
  hourlySalaryDkk: number
  monthlySalaryDkk: number
}

export type { WageGroup }

export type WageResponse = {
  groups: WageGroup[]
  currency: string
  lastUpdated: string
}

const DEFAULT_WAGE_DATA: WageResponse = {
  currency: "DKK",
  lastUpdated: "2024-01-01",
  groups: [
    {
      ageGroup: "under18",
      label: "Under 18 år",
      steps: [
        { apprenticeshipPeriod: "0–1 år",    hourlySalaryDkk:  82.60, monthlySalaryDkk: 13200 },
        { apprenticeshipPeriod: "1–2 år",    hourlySalaryDkk:  97.30, monthlySalaryDkk: 15570 },
        { apprenticeshipPeriod: "2–3 år",    hourlySalaryDkk: 104.65, monthlySalaryDkk: 16740 },
        { apprenticeshipPeriod: "3–4 år",    hourlySalaryDkk: 121.15, monthlySalaryDkk: 19380 },
        { apprenticeshipPeriod: "Over 4 år", hourlySalaryDkk: 143.40, monthlySalaryDkk: 22950 },
      ],
    },
    {
      ageGroup: "over18",
      label: "Over 18 år",
      steps: [
        { apprenticeshipPeriod: "0–1 år",    hourlySalaryDkk:  85.85, monthlySalaryDkk: 13740 },
        { apprenticeshipPeriod: "1–2 år",    hourlySalaryDkk:  97.30, monthlySalaryDkk: 15570 },
        { apprenticeshipPeriod: "2–3 år",    hourlySalaryDkk: 104.65, monthlySalaryDkk: 16740 },
        { apprenticeshipPeriod: "3–4 år",    hourlySalaryDkk: 121.15, monthlySalaryDkk: 19380 },
        { apprenticeshipPeriod: "Over 4 år", hourlySalaryDkk: 143.40, monthlySalaryDkk: 22950 },
      ],
    },
  ],
}

export async function GET() {
  try {
    const rows = await db.select().from(wageData).where(eq(wageData.id, 1)).limit(1)
    if (rows.length === 0) {
      return NextResponse.json(DEFAULT_WAGE_DATA)
    }
    const { groups, currency, lastUpdated } = rows[0]
    return NextResponse.json({ groups, currency, lastUpdated } satisfies WageResponse)
  } catch (error) {
    console.error("GET /api/loen error:", error)
    return NextResponse.json(DEFAULT_WAGE_DATA)
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as WageResponse
    const now = new Date()

    await db
      .insert(wageData)
      .values({
        id: 1,
        groups: body.groups,
        currency: body.currency ?? "DKK",
        lastUpdated: body.lastUpdated ?? now.toISOString().split("T")[0],
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: wageData.id,
        set: {
          groups: body.groups,
          currency: body.currency ?? "DKK",
          lastUpdated: body.lastUpdated ?? now.toISOString().split("T")[0],
          updatedAt: now,
        },
      })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PUT /api/loen error:", error)
    return NextResponse.json({ error: "Failed to update wage data" }, { status: 500 })
  }
}
