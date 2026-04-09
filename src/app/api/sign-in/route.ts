import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import * as schema from "@/db/schema"

// ── Config ────────────────────────────────────────────────────────────────────
const IP_MAX_FAILURES  = 5            // failures before IP block
const IP_WINDOW_MIN    = 15           // rolling window in minutes
const IP_BLOCK_MIN     = 15           // how long to block the IP
const EMAIL_MAX_FAILURES = 5          // per-email max attempts
const EMAIL_WINDOW_MIN = 1440         // per-email window in minutes (24 hours)

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeEmail(s: string) {
  return s.replace(/[\u0000-\u001F\u007F]/g, "").trim().toLowerCase()
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

function sanitize(s: string) {
  return s.replace(/[\u0000-\u001F\u007F]/g, "")
}

/** Best-effort client IP — works behind most proxies. */
function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "127.0.0.1"
  )
}

/**
 * Forward every Set-Cookie header from the better-auth response to our response.
 * headers.get("set-cookie") merges multiple cookies with ", " which breaks
 * cookie parsing — getSetCookie() returns them individually.
 */
function forwardCookies(src: Response, dst: NextResponse) {
  const cookies =
    (src.headers as Headers & { getSetCookie?(): string[] }).getSetCookie?.() ??
    (src.headers.get("set-cookie") ? [src.headers.get("set-cookie")!] : [])
  for (const c of cookies) dst.headers.append("set-cookie", c)
}

// ── IP rate limiting ──────────────────────────────────────────────────────────

async function getIpBucket(ip: string) {
  const [row] = await db
    .select()
    .from(schema.authRateLimit)
    .where(and(eq(schema.authRateLimit.keyType, "ip"), eq(schema.authRateLimit.keyValue, ip)))
    .limit(1)
  return row ?? null
}

async function isIpBlocked(ip: string): Promise<{ blocked: boolean; retryAfterSeconds: number; blockedUntil?: Date }> {
  const bucket = await getIpBucket(ip)
  if (!bucket) return { blocked: false, retryAfterSeconds: 0 }
  const now = new Date()
  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil.getTime() - now.getTime()) / 1000),
      blockedUntil: bucket.blockedUntil,
    }
  }
  return { blocked: false, retryAfterSeconds: 0 }
}

async function recordIpFailure(ip: string): Promise<{ nowBlocked: boolean; blockedUntil?: Date }> {
  const now    = new Date()
  const cutoff = new Date(now.getTime() - IP_WINDOW_MIN * 60_000)
  const bucket = await getIpBucket(ip)

  if (!bucket) {
    await db.insert(schema.authRateLimit).values({
      id: crypto.randomUUID(),
      keyType: "ip",
      keyValue: ip,
      attemptCount: 1,
      windowStartedAt: now,
      lastAttemptAt: now,
      blockedUntil: null,
      createdAt: now,
      updatedAt: now,
    })
    return { nowBlocked: false }
  }

  // If already blocked, just touch the timestamp
  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    await db.update(schema.authRateLimit)
      .set({ lastAttemptAt: now, updatedAt: now })
      .where(eq(schema.authRateLimit.id, bucket.id))
    return { nowBlocked: true, blockedUntil: bucket.blockedUntil }
  }

  const windowExpired = bucket.windowStartedAt < cutoff
  const nextCount     = windowExpired ? 1 : bucket.attemptCount + 1
  const blockedUntil  = nextCount >= IP_MAX_FAILURES
    ? new Date(now.getTime() + IP_BLOCK_MIN * 60_000)
    : null

  await db.update(schema.authRateLimit).set({
    attemptCount: nextCount,
    windowStartedAt: windowExpired ? now : bucket.windowStartedAt,
    lastAttemptAt: now,
    blockedUntil,
    updatedAt: now,
  }).where(eq(schema.authRateLimit.id, bucket.id))

  return { nowBlocked: !!blockedUntil, blockedUntil: blockedUntil ?? undefined }
}

async function resetIpFailures(ip: string) {
  await db.delete(schema.authRateLimit)
    .where(and(eq(schema.authRateLimit.keyType, "ip"), eq(schema.authRateLimit.keyValue, ip)))
}

// ── Email rate limiting ───────────────────────────────────────────────────────

async function getEmailBucket(email: string) {
  const [row] = await db
    .select()
    .from(schema.authRateLimit)
    .where(and(eq(schema.authRateLimit.keyType, "email"), eq(schema.authRateLimit.keyValue, email)))
    .limit(1)
  return row ?? null
}

async function isEmailBlocked(email: string): Promise<{ blocked: boolean; attemptsRemaining: number }> {
  const bucket = await getEmailBucket(email)
  if (!bucket) return { blocked: false, attemptsRemaining: EMAIL_MAX_FAILURES }
  const now = new Date()
  const cutoff = new Date(now.getTime() - EMAIL_WINDOW_MIN * 60_000)

  // If window expired, reset
  if (bucket.windowStartedAt < cutoff) {
    return { blocked: false, attemptsRemaining: EMAIL_MAX_FAILURES }
  }

  const attemptsRemaining = Math.max(0, EMAIL_MAX_FAILURES - bucket.attemptCount)
  return { blocked: bucket.attemptCount >= EMAIL_MAX_FAILURES, attemptsRemaining }
}

async function recordEmailFailure(email: string): Promise<{ blocked: boolean; attemptsRemaining: number }> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - EMAIL_WINDOW_MIN * 60_000)
  const bucket = await getEmailBucket(email)

  if (!bucket) {
    await db.insert(schema.authRateLimit).values({
      id: crypto.randomUUID(),
      keyType: "email",
      keyValue: email,
      attemptCount: 1,
      windowStartedAt: now,
      lastAttemptAt: now,
      blockedUntil: null,
      createdAt: now,
      updatedAt: now,
    })
    return { blocked: false, attemptsRemaining: EMAIL_MAX_FAILURES - 1 }
  }

  // If window expired, reset
  if (bucket.windowStartedAt < cutoff) {
    await db.update(schema.authRateLimit)
      .set({
        attemptCount: 1,
        windowStartedAt: now,
        lastAttemptAt: now,
        updatedAt: now,
      })
      .where(eq(schema.authRateLimit.id, bucket.id))
    return { blocked: false, attemptsRemaining: EMAIL_MAX_FAILURES - 1 }
  }

  const nextCount = bucket.attemptCount + 1
  const blocked = nextCount >= EMAIL_MAX_FAILURES

  await db.update(schema.authRateLimit)
    .set({
      attemptCount: nextCount,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .where(eq(schema.authRateLimit.id, bucket.id))

  return { blocked, attemptsRemaining: Math.max(0, EMAIL_MAX_FAILURES - nextCount) }
}

async function resetEmailFailures(email: string) {
  await db.delete(schema.authRateLimit)
    .where(and(eq(schema.authRateLimit.keyType, "email"), eq(schema.authRateLimit.keyValue, email)))
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // CORS guard
  const origin = req.headers.get("origin")
  if (origin && origin !== req.nextUrl.origin && origin !== process.env.BETTER_AUTH_URL) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 })
  }

  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ success: false, message: "Unsupported content type." }, { status: 415 })
  }

  const ip = clientIp(req)

  // ── IP block check ─────────────────────────────────────────────────────────
  const ipStatus = await isIpBlocked(ip)
  if (ipStatus.blocked && ipStatus.blockedUntil) {
    return NextResponse.json(
      {
        success: false,
        message: "For mange loginforsøg. Prøv igen om lidt.",
        blockedUntil: ipStatus.blockedUntil.toISOString(),
      },
      { status: 429, headers: { "Retry-After": String(ipStatus.retryAfterSeconds) } }
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let rawEmail = "", rawPassword = ""
  try {
    const body = await req.json()
    rawEmail    = String(body.email    ?? "")
    rawPassword = String(body.password ?? "")
  } catch {
    return NextResponse.json({ success: false, message: "Ugyldig forespørgsel." }, { status: 400 })
  }

  const email    = normalizeEmail(rawEmail)
  const password = sanitize(rawPassword)

  if (!isValidEmail(email) || password.length < 1 || password.length > 256) {
    return NextResponse.json(
      { success: false, message: "Ugyldig e-mail eller adgangskode." },
      { status: 400 }
    )
  }

  // ── Email rate limit check ─────────────────────────────────────────────────
  const emailStatus = await isEmailBlocked(email)
  if (emailStatus.blocked) {
    return NextResponse.json(
      {
        success: false,
        message: "For mange mislykkede forsøg. Prøv igen i morgen.",
        attemptsRemaining: 0,
      },
      { status: 429 }
    )
  }

  // ── Call better-auth directly (in-process — no HTTP self-fetch) ────────────
  let authOk = false

  try {
    const baseUrl = process.env.BETTER_AUTH_URL ?? req.nextUrl.origin
    const authResp = await auth.handler(
      new Request(new URL("/api/auth/sign-in/email", baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "origin": baseUrl,
          cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ email, password }),
      })
    )

    authOk = authResp.ok

    if (authOk) {
      // ── Success ─────────────────────────────────────────────────────────────
      resetIpFailures(ip).catch(() => {})            // fire-and-forget
      resetEmailFailures(email).catch(() => {})      // fire-and-forget

      const response = NextResponse.json({ success: true }, { status: 200 })
      forwardCookies(authResp, response)
      response.headers.set("Cache-Control", "no-store, private")
      return response
    }
  } catch (err) {
    console.error("[sign-in] auth.handler error:", err)
    return NextResponse.json(
      { success: false, message: "Intern fejl. Prøv igen." },
      { status: 500 }
    )
  }

  // ── Failure — record against IP and email ──────────────────────────────────
  const { nowBlocked: ipNowBlocked, blockedUntil } = await recordIpFailure(ip)
  const { blocked: emailBlocked, attemptsRemaining } = await recordEmailFailure(email)

  if (ipNowBlocked && blockedUntil) {
    return NextResponse.json(
      {
        success: false,
        message: "For mange mislykkede forsøg. Din IP er blokeret i 15 minutter.",
        blockedUntil: blockedUntil.toISOString(),
        attemptsRemaining: 0,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((blockedUntil.getTime() - Date.now()) / 1000)),
        },
      }
    )
  }

  if (emailBlocked) {
    return NextResponse.json(
      {
        success: false,
        message: "For mange mislykkede forsøg. Prøv igen i morgen.",
        attemptsRemaining: 0,
      },
      { status: 429 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      message: `Forkert e-mail eller adgangskode. ${attemptsRemaining} forsøg tilbage.`,
      attemptsRemaining,
    },
    { status: 401 }
  )
}
