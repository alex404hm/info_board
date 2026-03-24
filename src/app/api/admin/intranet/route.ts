import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["admin", "teacher"].includes(role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const id = crypto.randomUUID()
    
    await db.insert(intranetPage).values({
      id,
      ...data,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Failed to create intranet page:", error)
    return NextResponse.json({ error: "Kunne ikke oprette siden" }, { status: 500 })
  }
}
