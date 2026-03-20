import { db } from "@/db"
import { user } from "@/db/schema"
import { or, eq, and, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  const contacts = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      image: user.image,
      role: user.role,
    })
    .from(user)
    .where(
      and(
        or(eq(user.role, "teacher"), eq(user.role, "admin")),
        sql`${user.banned} IS NOT TRUE`
      )
    )
    .orderBy(user.name)

  return NextResponse.json({ contacts })
}
