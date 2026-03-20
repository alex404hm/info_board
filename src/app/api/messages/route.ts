import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { message, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { eq, desc, and, or, isNull, gte } from "drizzle-orm"
import { headers } from "next/headers"

// GET /api/messages — public (active only) or admin (all)
export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.nextUrl.searchParams.get("admin") === "true"

    if (isAdmin) {
      const session = await auth.api.getSession({ headers: await headers() })
      const role = getUserRole(session)
      if (!session || !["teacher", "admin"].includes(role ?? "")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const rows = await db
        .select({
          id: message.id,
          title: message.title,
          content: message.content,
          priority: message.priority,
          active: message.active,
          authorId: message.authorId,
          authorName: user.name,
          expiresAt: message.expiresAt,
          pinned: message.pinned,
          repeatDays: message.repeatDays,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        })
        .from(message)
        .leftJoin(user, eq(message.authorId, user.id))
        .orderBy(desc(message.pinned), desc(message.createdAt))

      const messages = rows.map((msg) => ({
        ...msg,
        canManage: role === "admin" || msg.authorId === session.user.id,
      }))

      return NextResponse.json(messages)
    }

    // Public: only active, non-expired messages
    const now = new Date()
    const messages = await db
      .select({
        id: message.id,
        title: message.title,
        content: message.content,
        priority: message.priority,
        authorName: user.name,
        createdAt: message.createdAt,
        expiresAt: message.expiresAt,
        pinned: message.pinned,
        repeatDays: message.repeatDays,
      })
      .from(message)
      .leftJoin(user, eq(message.authorId, user.id))
      .where(
        and(
          eq(message.active, true),
          or(isNull(message.expiresAt), gte(message.expiresAt, now))
        )
      )
      .orderBy(desc(message.pinned), desc(message.createdAt))
      .limit(10)

    const today = new Date().getDay()
    const filtered = messages.filter(
      (m) => !m.repeatDays || m.repeatDays.length === 0 || m.repeatDays.includes(today)
    )

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("GET /api/messages error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/messages — create (auth required)
export async function POST(request: NextRequest) {
  try {
    const MAX_MESSAGE_CHARS = 280
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || !["teacher", "admin"].includes(getUserRole(session) ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, priority, expiresAt, repeatDays } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }
    if (String(content).length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: `Message content exceeds ${MAX_MESSAGE_CHARS} characters` }, { status: 400 })
    }

    const now = new Date()
    const newMessage = await db
      .insert(message)
      .values({
        id: crypto.randomUUID(),
        title,
        content,
        priority: priority || "normal",
        active: true,
        authorId: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        repeatDays: Array.isArray(repeatDays) ? repeatDays : [],
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json(newMessage[0], { status: 201 })
  } catch (error) {
    console.error("POST /api/messages error:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
