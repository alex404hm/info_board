import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { setting } from "@/db/schema"
import { auth } from "@/lib/auth"
import {
  DEFAULT_INTRANET_FAQ_ITEMS,
  INTRANET_FAQ_SETTING_KEY,
  normalizeIntranetFaqItems,
} from "@/lib/intranet-faq"
import { getUserRole } from "@/lib/session-role"

export async function GET() {
  try {
    const existing = await db
      .select()
      .from(setting)
      .where(eq(setting.key, INTRANET_FAQ_SETTING_KEY))
      .limit(1)

    if (!existing.length) {
      return NextResponse.json(DEFAULT_INTRANET_FAQ_ITEMS)
    }

    return NextResponse.json(normalizeIntranetFaqItems(JSON.parse(existing[0].value)))
  } catch {
    return NextResponse.json(DEFAULT_INTRANET_FAQ_ITEMS)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const role = getUserRole(session)

    if (!session || !["teacher", "admin"].includes(role ?? "")) {
      return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
    }

    const body = await request.json()
    const items = normalizeIntranetFaqItems(body)
    const value = JSON.stringify(items)
    const now = new Date()

    const existing = await db
      .select()
      .from(setting)
      .where(eq(setting.key, INTRANET_FAQ_SETTING_KEY))
      .limit(1)

    if (existing.length) {
      await db
        .update(setting)
        .set({ value, updatedAt: now })
        .where(eq(setting.key, INTRANET_FAQ_SETTING_KEY))
    } else {
      await db.insert(setting).values({ key: INTRANET_FAQ_SETTING_KEY, value, updatedAt: now })
    }

    return NextResponse.json({ success: true, items })
  } catch {
    return NextResponse.json({ error: "Kunne ikke gemme intranetindhold" }, { status: 500 })
  }
}
