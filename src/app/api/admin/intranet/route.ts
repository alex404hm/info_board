import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

type IntranetPageInsert = typeof intranetPage.$inferInsert

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = getUserRole(session)

  if (!session || !["admin", "teacher"].includes(role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = (await req.json()) as Partial<IntranetPageInsert>
    const id = crypto.randomUUID()

    await db.insert(intranetPage).values({
      id,
      key: data.key ?? "",
      title: data.title ?? "",
      subtitle: data.subtitle ?? null,
      icon: data.icon ?? "Info",
      iconColor: data.iconColor ?? "#60a5fa",
      iconBg: data.iconBg ?? "rgba(96,165,250,0.22)",
      bgFrom: data.bgFrom ?? "rgba(30,58,138,0.95)",
      bgTo: data.bgTo ?? "rgba(15,23,42,0.99)",
      glowA: data.glowA ?? "rgba(96,165,250,0.22)",
      glowB: data.glowB ?? "rgba(59,130,246,0.12)",
      accentColor: data.accentColor ?? "#60a5fa",
      content: data.content ?? "",
      order: data.order ?? 0,
      isDraft: data.isDraft ?? false,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error("Failed to create intranet page:", error)
    return NextResponse.json({ error: "Kunne ikke oprette siden" }, { status: 500 })
  }
}
