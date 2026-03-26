import { NextResponse } from "next/server"
import { db } from "@/db"
import { wageData } from "@/db/schema"
import type { WageGroup } from "@/db/schema"

export type WageResponse = {
  groups: WageGroup[]
  lastUpdated: string
}

export async function GET() {
  const row = await db.select().from(wageData).limit(1)
  if (!row[0]) {
    return NextResponse.json({ error: "No wage data found" }, { status: 404 })
  }
  const response: WageResponse = {
    groups: row[0].groups,
    lastUpdated: row[0].lastUpdated,
  }
  return NextResponse.json(response)
}
