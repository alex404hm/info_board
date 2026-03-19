import { db } from "@/db"
import { user, account } from "@/db/schema"
import { hashPassword } from "better-auth/crypto"

async function seed() {
  const userId = crypto.randomUUID()
  const now = new Date()

  const hashed = await hashPassword("password123")

  await db.insert(user).values({
    id: userId,
    name: "Admin",
    email: "admin@tec.dk",
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: "admin@tec.dk",
    providerId: "credential",
    userId,
    password: hashed,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()

  console.log("✓ admin@tec.dk created with role=admin")
  process.exit(0)
}

seed().catch((e) => { console.error(e); process.exit(1) })
