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
  const normalizedEmail = email.trim().toLowerCase()
  const hashed = await hashPassword(password)

  const [existingUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizedEmail))

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    await db
      .update(user)
      .set({
        name,
        role,
        emailVerified: true,
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: now,
      })
      .where(eq(user.id, userId))
  } else {
    userId = crypto.randomUUID()
    await db.insert(user).values({
      id: userId,
      name,
      email: normalizedEmail,
      emailVerified: true,
      role,
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  const [existingAccount] = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))

  if (!existingAccount) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: normalizedEmail,
      providerId: "credential",
      userId,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    })
  } else {
    await db
      .update(account)
      .set({
        accountId: normalizedEmail,
        providerId: "credential",
        password: hashed,
        updatedAt: now,
      })
      .where(eq(account.userId, userId))
  }

  console.log(`Seeded ${normalizedEmail} with role=${role}`)
}

async function seed() {
  await upsertUser({
    name: "Admin",
    email: "admin@tec.dk",
    role: "admin",
    password: "rozbym-2vodsa-jakDox",
  })
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
