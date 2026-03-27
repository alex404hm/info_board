import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

type IntranetPageInsert = typeof intranetPage.$inferInsert

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
    const data = (await req.json()) as Partial<IntranetPageInsert>
    
    await db
      .update(intranetPage)
      .set({
        key: data.key,
        title: data.title,
        subtitle: data.subtitle ?? null,
        icon: data.icon,
        iconColor: data.iconColor,
        iconBg: data.iconBg,
        bgFrom: data.bgFrom,
        bgTo: data.bgTo,
        glowA: data.glowA,
        glowB: data.glowB,
        accentColor: data.accentColor,
        content: data.content,
        order: data.order,
        isDraft: data.isDraft,
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
