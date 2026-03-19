import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { setting } from "@/db/schema"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const key = request.nextUrl.searchParams.get("key")
    if (key) {
      const result = await db.select().from(setting).where(eq(setting.key, key)).limit(1)
      return NextResponse.json(result[0] ?? null)
    }

    const all = await db.select().from(setting)
    return NextResponse.json(all)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    const now = new Date()
    const existing = await db.select().from(setting).where(eq(setting.key, key)).limit(1)

    if (existing.length) {
      await db.update(setting).set({ value, updatedAt: now }).where(eq(setting.key, key))
    } else {
      await db.insert(setting).values({ key, value, updatedAt: now })
    }

    return NextResponse.json({ key, value })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}
