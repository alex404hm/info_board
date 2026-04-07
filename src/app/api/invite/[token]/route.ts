import { db } from "@/db"
import { user, account, invitation } from "@/db/schema"
import { eq, and, isNull, gte } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ token: string }> }

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
  const { name, password, phoneNumber, image } = await req.json()

  if (!name?.trim() || !password || password.length < 10) {
    return NextResponse.json({ error: "Ugyldig input" }, { status: 400 })
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
      name: name.trim(),
      emailVerified: true,
      phoneNumber: typeof phoneNumber === "string" ? phoneNumber.trim() || null : null,
      image: typeof image === "string" && image.startsWith("data:image/") ? image : null,
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
