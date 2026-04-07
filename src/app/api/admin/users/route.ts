import { auth } from "@/lib/auth"
import { db } from "@/db"
import { getUserRole } from "@/lib/session-role"
import { user, account } from "@/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || getUserRole(session) !== "admin") return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbudt" }, { status: 403 })
  }

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(user.createdAt)

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbudt" }, { status: 403 })
  }

  const { email, name, password, role } = await req.json()

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Manglende påkrævede felter" }, { status: 400 })
  }
  if (!["teacher", "admin"].includes(role)) {
    return NextResponse.json({ error: "Ugyldig rolle" }, { status: 400 })
  }
  if (password.length < 10) {
    return NextResponse.json({ error: "Adgangskoden skal være mindst 10 tegn" }, { status: 400 })
  }

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase()))
  if (existing.length > 0) {
    return NextResponse.json({ error: "E-mail er allerede i brug" }, { status: 409 })
  }

  const { hashPassword } = await import("better-auth/crypto")
  const hashedPassword = await hashPassword(password)
  const userId = crypto.randomUUID()
  const now = new Date()

  await db.insert(user).values({
    id: userId,
    name,
    email: email.toLowerCase(),
    emailVerified: false,
    role,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ success: true })
}
