import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { setting } from "@/db/schema"
import { auth } from "@/lib/auth"
import { getUserRole } from "@/lib/session-role"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { DEFAULT_TILE_CONFIG, TILES_SETTING_KEY, type TileConfig } from "@/lib/tiles-config"

export async function GET() {
  try {
    const result = await db
      .select()
      .from(setting)
      .where(eq(setting.key, TILES_SETTING_KEY))
      .limit(1)

    if (!result.length) {
      return NextResponse.json(DEFAULT_TILE_CONFIG)
    }

    const parsed = JSON.parse(result[0].value) as TileConfig[]
    
    // Ensure all current definitions are present in the returned config
    // This handles cases where new tiles were added to TILE_DEFINITIONS
    const merged = DEFAULT_TILE_CONFIG.map(def => {
      const existing = parsed.find(p => p.id === def.id)
      return existing ? existing : def
    })

    return NextResponse.json(merged)
  } catch {
    return NextResponse.json(DEFAULT_TILE_CONFIG)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || getUserRole(session) !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await request.json()
    if (!Array.isArray(config)) {
      return NextResponse.json({ error: "Invalid config" }, { status: 400 })
    }

    const value = JSON.stringify(config)
    const now = new Date()

    const existing = await db
      .select()
      .from(setting)
      .where(eq(setting.key, TILES_SETTING_KEY))
      .limit(1)

    if (existing.length) {
      await db
        .update(setting)
        .set({ value, updatedAt: now })
        .where(eq(setting.key, TILES_SETTING_KEY))
    } else {
      await db.insert(setting).values({ key: TILES_SETTING_KEY, value, updatedAt: now })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
