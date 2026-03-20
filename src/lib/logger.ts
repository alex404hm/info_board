import { db } from "@/db"
import { requestLog } from "@/db/schema"

export type LogEvent = {
  eventType: string
  ip?: string | null
  method?: string
  path?: string
  statusCode?: number | null
  userId?: string | null
  userEmail?: string | null
  userAgent?: string | null
  details?: Record<string, unknown>
}

/** Fire-and-forget — never throws, never blocks the calling code. */
export async function log(event: LogEvent): Promise<void> {
  try {
    await db.insert(requestLog).values({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      eventType: event.eventType,
      ip: event.ip ?? null,
      method: event.method ?? "GET",
      path: event.path ?? "/",
      statusCode: event.statusCode ?? null,
      userId: event.userId ?? null,
      userEmail: event.userEmail ?? null,
      userAgent: event.userAgent ?? null,
      details: event.details ?? {},
    })
  } catch {
    // Never let logging break the app
  }
}
