import { NextRequest, NextResponse } from "next/server"
import { and, eq, ne } from "drizzle-orm"

import { db } from "@/db"
import * as schema from "@/db/schema"
import {
  extractIpAddress,
  extractUserAgent,
} from "@/lib/auth-security-handler"
import {
  LOGIN_SECURITY_CONFIG,
  checkIpAndDeviceRateLimit,
  countRecentFailedAttempts,
  generateDeviceFingerprint,
  isAccountLocked,
  lockUserAccount,
  logSecurityEvent,
  registerFailedIpAndDeviceAttempt,
  recordLoginAttempt,
  resetIpAndDeviceRateLimit,
  resetFailedAttempts,
} from "@/lib/login-security"
import { queueSecurityEmail } from "@/lib/security-email-alerts"

type LoginPayload = {
  email?: string
  password?: string
}

const GENERIC_LOGIN_ERROR = "Forkert e-mail eller adgangskode."

function normalizeEmail(email: string): string {
  return email
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitizePasswordInput(password: string): string {
  return password.replace(/[\u0000-\u001F\u007F]/g, "")
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (!origin) {
    return true
  }

  const allowedOrigins = new Set<string>([request.nextUrl.origin])
  if (process.env.BETTER_AUTH_URL) {
    allowedOrigins.add(process.env.BETTER_AUTH_URL)
  }

  return allowedOrigins.has(origin)
}

function getProgressiveDelayMs(failedAttemptCount: number): number {
  if (failedAttemptCount <= 0) return 0
  if (failedAttemptCount >= LOGIN_SECURITY_CONFIG.LOCKOUT_THRESHOLD) return 0

  // Attempts 1-6 get lightweight delays to slow brute-force traffic
  const bounded = Math.min(failedAttemptCount, LOGIN_SECURITY_CONFIG.LOCKOUT_THRESHOLD - 1)
  return bounded * LOGIN_SECURITY_CONFIG.RATE_LIMIT_DELAY_MS
}

function applyResponseCookies(source: Response, target: NextResponse) {
  const setCookie = source.headers.get("set-cookie")
  if (setCookie) {
    target.headers.set("set-cookie", setCookie)
  }
}

async function forwardToBetterAuthSignIn(
  request: NextRequest,
  payload: { email: string; password: string }
): Promise<Response> {
  const authUrl = new URL("/api/auth/sign-in/email", request.url)
  const ipAddress = extractIpAddress(request)
  const userAgent = extractUserAgent(request)

  return fetch(authUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": userAgent,
      "x-forwarded-for": ipAddress,
      cookie: request.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Forbidden origin." },
      { status: 403 }
    )
  }

  const contentType = request.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    return NextResponse.json(
      { success: false, message: "Unsupported content type." },
      { status: 415 }
    )
  }

  const ipAddress = extractIpAddress(request)
  const userAgent = extractUserAgent(request)
  const deviceFingerprint = await generateDeviceFingerprint(ipAddress, userAgent)

  let body: LoginPayload
  try {
    body = (await request.json()) as LoginPayload
  } catch {
    return NextResponse.json(
      { success: false, message: "Ugyldig forespørgsel." },
      { status: 400 }
    )
  }

  const email = normalizeEmail(body.email ?? "")
  const password = sanitizePasswordInput(body.password ?? "")

  if (!isValidEmail(email) || password.length < 1 || password.length > 256) {
    return NextResponse.json(
      { success: false, message: "Ugyldig e-mail eller adgangskode." },
      { status: 400 }
    )
  }

  const ipDeviceLimitStatus = await checkIpAndDeviceRateLimit(
    ipAddress,
    deviceFingerprint
  )

  if (ipDeviceLimitStatus.limited && ipDeviceLimitStatus.blockedUntil) {
    return NextResponse.json(
      {
        success: false,
        message: "For mange loginforsøg fra denne enhed eller IP. Prøv igen senere.",
        reason: "ip_device_rate_limited",
        limitedBy: ipDeviceLimitStatus.limitedBy,
        retryAfterSeconds: ipDeviceLimitStatus.retryAfterSeconds,
        blockedUntil: ipDeviceLimitStatus.blockedUntil.toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipDeviceLimitStatus.retryAfterSeconds),
        },
      }
    )
  }

  const users = await db
    .select({ id: schema.user.id, email: schema.user.email, name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1)

  const user = users[0]

  if (user) {
    const lockStatus = await isAccountLocked(user.id)
    if (lockStatus.locked && lockStatus.lockout) {
      return NextResponse.json(
        {
          success: false,
          message: "Kontoen er midlertidigt låst. Prøv igen senere.",
          reason: "account_locked",
          lockedUntil: lockStatus.lockout.lockedUntil.toISOString(),
        },
        { status: 423 }
      )
    }

    const failedAttemptCount = await countRecentFailedAttempts(user.id)
    const delayMs = getProgressiveDelayMs(failedAttemptCount)
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  const betterAuthResponse = await forwardToBetterAuthSignIn(request, {
    email,
    password,
  })

  const betterAuthPayload = await betterAuthResponse.json().catch(() => null)
  const signInSucceeded = betterAuthResponse.ok && !betterAuthPayload?.error

  if (!user) {
    const rateLimitStatus = await registerFailedIpAndDeviceAttempt(
      ipAddress,
      deviceFingerprint
    )

    await logSecurityEvent({
      eventType: "login_attempt_user_not_found",
      severity: "info",
      ipAddress,
      userAgent,
      details: {
        email,
        deviceFingerprint,
      },
    })

    if (rateLimitStatus.limited && rateLimitStatus.blockedUntil) {
      return NextResponse.json(
        {
          success: false,
          message: "For mange loginforsøg fra denne enhed eller IP. Prøv igen senere.",
          reason: "ip_device_rate_limited",
          limitedBy: rateLimitStatus.limitedBy,
          retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
          blockedUntil: rateLimitStatus.blockedUntil.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitStatus.retryAfterSeconds),
          },
        }
      )
    }

    return NextResponse.json(
      { success: false, message: GENERIC_LOGIN_ERROR },
      { status: 401 }
    )
  }

  if (signInSucceeded) {
    await resetIpAndDeviceRateLimit(ipAddress, deviceFingerprint)
    await resetFailedAttempts(user.id)

    const recorded = await recordLoginAttempt({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      success: true,
      reason: "login_success",
    })

    const currentSessionToken = betterAuthResponse.headers
      .get("set-cookie")
      ?.match(/better-auth\.session_token=([^;]+)/)?.[1]

    if (currentSessionToken) {
      await db
        .delete(schema.session)
        .where(
          and(
            eq(schema.session.userId, user.id),
            ne(schema.session.token, currentSessionToken)
          )
        )
    }

    await logSecurityEvent({
      userId: user.id,
      eventType: "login_successful",
      severity: "info",
      ipAddress,
      userAgent,
      details: {
        email,
        attemptCount: recorded.attemptCount,
        deviceFingerprint,
      },
    })

    const response = NextResponse.json(
      { success: true, message: "Login successful" },
      { status: 200 }
    )
    applyResponseCookies(betterAuthResponse, response)
    response.headers.set("Cache-Control", "no-store")
    return response
  }

  const failedRecord = await recordLoginAttempt({
    userId: user.id,
    email: user.email,
    ipAddress,
    userAgent,
    success: false,
    reason: "invalid_password",
  })

  const rateLimitStatus = await registerFailedIpAndDeviceAttempt(
    ipAddress,
    deviceFingerprint
  )

  if (failedRecord.attemptCount >= LOGIN_SECURITY_CONFIG.LOCKOUT_THRESHOLD) {
    const lockout = await lockUserAccount(user.id, ipAddress, userAgent, "max_login_attempts")

    queueSecurityEmail("account_locked", {
      userEmail: user.email,
      userName: user.name,
      lockedUntil: lockout.lockedUntil,
      ipAddress,
      attemptCount: failedRecord.attemptCount,
      supportEmail: process.env.SUPPORT_EMAIL || "support@example.com",
    })

    return NextResponse.json(
      {
        success: false,
        message: "Kontoen er midlertidigt låst. Prøv igen senere.",
        reason: "account_locked",
        lockedUntil: lockout.lockedUntil.toISOString(),
      },
      { status: 423 }
    )
  }

  if (rateLimitStatus.limited && rateLimitStatus.blockedUntil) {
    return NextResponse.json(
      {
        success: false,
        message: "For mange loginforsøg fra denne enhed eller IP. Prøv igen senere.",
        reason: "ip_device_rate_limited",
        limitedBy: rateLimitStatus.limitedBy,
        retryAfterSeconds: rateLimitStatus.retryAfterSeconds,
        blockedUntil: rateLimitStatus.blockedUntil.toISOString(),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds),
        },
      }
    )
  }

  const delayMs = getProgressiveDelayMs(failedRecord.attemptCount)

  await logSecurityEvent({
    userId: user.id,
    eventType: "login_failed",
    severity: "warning",
    ipAddress,
    userAgent,
    details: {
      email,
      attemptCount: failedRecord.attemptCount,
      delayMs,
      deviceFingerprint,
    },
  })

  return NextResponse.json(
    {
      success: false,
      message: GENERIC_LOGIN_ERROR,
      reason: "invalid_credentials",
      attemptCount: failedRecord.attemptCount,
      delayMs,
    },
    { status: 401 }
  )
}
