import { NextRequest, NextResponse } from "next/server"
import { asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { calendarCategory } from "@/db/schema"
import { getUserRole } from "@/lib/session-role"

export const dynamic = "force-dynamic"

async function ensureAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)
  if (!session || !["teacher", "admin"].includes(role ?? "")) {
    return null
  }
  return session
}

export async function GET() {
  const session = await ensureAdmin()
  if (!session) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  }

  const categories = await db
    .select({
      id: calendarCategory.id,
      name: calendarCategory.name,
    })
    .from(calendarCategory)
    .orderBy(asc(calendarCategory.name))

  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const session = await ensureAdmin()
  if (!session) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const name = String(body?.name ?? "").trim()
  if (!name) {
    return NextResponse.json({ error: "Kategori navn mangler" }, { status: 400 })
  }

  const existing = await db
    .select({ id: calendarCategory.id })
    .from(calendarCategory)
    .where(eq(calendarCategory.name, name))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: "Kategori findes allerede" }, { status: 409 })
  }

  const now = new Date()
  const created = await db
    .insert(calendarCategory)
    .values({
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: calendarCategory.id, name: calendarCategory.name })

  return NextResponse.json(created[0], { status: 201 })
}