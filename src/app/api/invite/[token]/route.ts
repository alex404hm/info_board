import { db } from "@/db"
import { user, account, invitation } from "@/db/schema"
import { eq, and, isNull, gte } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ token: string }> }

type InviteAcceptPayload = {
  name?: unknown
  password?: unknown
  phoneNumber?: unknown
  image?: unknown
}

const PHONE_REGEX = /^[0-9+()\-\s]{6,32}$/

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params

  const [inv] = await db
    .select({
      token: invitation.token,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
    })
    .from(invitation)
    .where(eq(invitation.token, token))

  if (!inv) {
    return NextResponse.json({ error: "Ugyldig invitation" }, { status: 404 })
  }
  if (inv.acceptedAt) {
    return NextResponse.json({ error: "Invitation er allerede brugt" }, { status: 410 })
  }
  if (inv.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation er udløbet" }, { status: 410 })
  }

  return NextResponse.json({ email: inv.email, role: inv.role })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Ugyldig content-type" }, { status: 415 })
  }

  const payload = (await req.json()) as InviteAcceptPayload
  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const password = typeof payload.password === "string" ? payload.password : ""
  const phoneNumber = typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : ""
  const image = typeof payload.image === "string" ? payload.image.trim() : null

  if (!name || name.length > 120 || !password || password.length < 10) {
    return NextResponse.json({ error: "Ugyldig input" }, { status: 400 })
  }

  if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
    return NextResponse.json({ error: "Ugyldigt telefonnummer" }, { status: 400 })
  }

  if (image && !image.startsWith("/uploads/")) {
    return NextResponse.json({ error: "Ugyldigt billede" }, { status: 400 })
  }

  const now = new Date()

  const [inv] = await db
    .select()
    .from(invitation)
    .where(
      and(
        eq(invitation.token, token),
        isNull(invitation.acceptedAt),
        gte(invitation.expiresAt, now)
      )
    )

  if (!inv) {
    return NextResponse.json({ error: "Ugyldig eller udløbet invitation" }, { status: 410 })
  }

  const { hashPassword } = await import("better-auth/crypto")
  const hashedPassword = await hashPassword(password)

  await db
    .update(user)
    .set({
      name,
      emailVerified: true,
      phoneNumber: phoneNumber || null,
      image,
      updatedAt: now,
    })
    .where(eq(user.id, inv.userId))

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: inv.userId,
    providerId: "credential",
    userId: inv.userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  })

  await db
    .update(invitation)
    .set({ acceptedAt: now })
    .where(eq(invitation.token, token))

  return NextResponse.json({ success: true })
}
