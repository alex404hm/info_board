import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { message, user } from "@/db/schema"
import { auth } from "@/lib/auth"
import { eq, desc, and, or, isNull, gte } from "drizzle-orm"
import { headers } from "next/headers"

// GET /api/messages — public (active only) or admin (all)
export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.nextUrl.searchParams.get("admin") === "true"

    if (isAdmin) {
      // Admin: verify auth, return ALL messages with full data
      const session = await auth.api.getSession({ headers: await headers() })
      if (!session || session.user.role !== "teacher") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const messages = await db
        .select({
          id: message.id,
          title: message.title,
          content: message.content,
          priority: message.priority,
          active: message.active,
          authorName: user.name,
          expiresAt: message.expiresAt,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        })
        .from(message)
        .leftJoin(user, eq(message.authorId, user.id))
        .orderBy(desc(message.createdAt))

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
      })
      .from(message)
      .leftJoin(user, eq(message.authorId, user.id))
      .where(
        and(
          eq(message.active, true),
          or(isNull(message.expiresAt), gte(message.expiresAt, now))
        )
      )
      .orderBy(desc(message.createdAt))
      .limit(10)

    return NextResponse.json(messages)
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
    if (!session || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, priority, expiresAt } = body

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
