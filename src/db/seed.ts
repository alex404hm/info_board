import { db } from "@/db"
import { user, account } from "@/db/schema"
import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"

async function upsertUser({
  name,
  email,
  role,
  password,
}: {
  name: string
  email: string
  role: string
  password: string
}) {
  const now = new Date()
  const hashed = await hashPassword(password)

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    await db
      .update(user)
      .set({ role, updatedAt: now })
      .where(eq(user.id, userId))
  } else {
    userId = crypto.randomUUID()
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role,
      createdAt: now,
      updatedAt: now,
    })
  }

  // Upsert account
  const [existingAccount] = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))

  if (!existingAccount) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: email,
      providerId: "credential",
      userId,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    })
  } else {
    await db
      .update(account)
      .set({ password: hashed, updatedAt: now })
      .where(eq(account.userId, userId))
  }

  console.log(`✓ ${email} seeded with role=${role}`)
}

async function seed() {
  await upsertUser({
    name: "Admin",
    email: "admin@tec.dk",
    role: "admin",
    password: "password123",
  })

  await upsertUser({
    name: "Teacher",
    email: "teacher@tec.dk",
    role: "teacher",
    password: "password123",
  })

  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})