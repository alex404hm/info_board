import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["admin", "teacher"].includes(role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    
    await db
      .update(intranetPage)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(intranetPage.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update intranet page:", error)
    return NextResponse.json({ error: "Kunne ikke opdatere siden" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["admin", "teacher"].includes(role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.delete(intranetPage).where(eq(intranetPage.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete intranet page:", error)
    return NextResponse.json({ error: "Kunne ikke slette siden" }, { status: 500 })
  }
}
