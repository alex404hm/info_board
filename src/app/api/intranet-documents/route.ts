import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { db } from "@/db"
import { setting } from "@/db/schema"
import { auth } from "@/lib/auth"
import {
  INTRANET_DOCUMENTS_SETTING_KEY,
  normalizeIntranetDocuments,
} from "@/lib/intranet-documents"
import { getUserRole } from "@/lib/session-role"

export async function GET() {
  try {
    const existing = await db
      .select()
      .from(setting)
      .where(eq(setting.key, INTRANET_DOCUMENTS_SETTING_KEY))
      .limit(1)

    if (!existing.length) {
      return NextResponse.json([])
    }

    return NextResponse.json(normalizeIntranetDocuments(JSON.parse(existing[0].value)))
  } catch {
    return NextResponse.json([])
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
    const docs = normalizeIntranetDocuments(body)
    const value = JSON.stringify(docs)
    const now = new Date()

    const existing = await db
      .select()
      .from(setting)
      .where(eq(setting.key, INTRANET_DOCUMENTS_SETTING_KEY))
      .limit(1)

    if (existing.length) {
      await db
        .update(setting)
        .set({ value, updatedAt: now })
        .where(eq(setting.key, INTRANET_DOCUMENTS_SETTING_KEY))
    } else {
      await db
        .insert(setting)
        .values({ key: INTRANET_DOCUMENTS_SETTING_KEY, value, updatedAt: now })
    }

    return NextResponse.json({ success: true, docs })
  } catch {
    return NextResponse.json({ error: "Kunne ikke gemme dokumenter" }, { status: 500 })
  }
}
