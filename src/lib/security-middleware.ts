/**
 * Security Utilities for Session Validation
 * Validates session integrity, IP consistency, and User-Agent matching
 * Can be used in server actions or API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { logSecurityEvent } from "@/lib/login-security"

export interface ValidatedRequest extends NextRequest {
  userId?: string
  sessionId?: string
  ipAddress: string
  userAgent: string
}

function extractIpAddress(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for")
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim()
  }

  const xRealIp = request.headers.get("x-real-ip")
  if (xRealIp) {
    return xRealIp
  }

  return "127.0.0.1"
}

function extractUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || ""
}

async function generateRequestFingerprint(
  ipAddress: string,
  userAgent: string
): Promise<string> {
  const combined = `${ipAddress}::${userAgent}`
  const encoder = new TextEncoder()
  const data = encoder.encode(combined)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Validate session security (IP, User-Agent consistency)
 * Returns user ID if valid, null if invalid/hijacked
 */
export async function validateSessionSecurity(
  request: NextRequest
): Promise<{ valid: boolean; userId?: string; reason?: string }> {
  try {
    // Extract request metadata
    const ipAddress = extractIpAddress(request)
    const userAgent = extractUserAgent(request)

    // Get session from cookie
    const sessionToken = request.cookies.get("better-auth.session_token")?.value
    if (!sessionToken) {
      return { valid: false, reason: "no_session_token" }
    }

    // Validate session in database
    const sessions = await db
      .select()
      .from(schema.session)
      .where(eq(schema.session.token, sessionToken))
      .limit(1)

    if (sessions.length === 0) {
      await logSecurityEvent({
        eventType: "session_validation_failed",
        severity: "warning",
        ipAddress,
        userAgent,
        details: { reason: "session_not_found" },
      })
      return { valid: false, reason: "session_not_found" }
    }

    const session = sessions[0]

    if (session.ipAddress && session.userAgent) {
      const [sessionFingerprint, currentFingerprint] = await Promise.all([
        generateRequestFingerprint(session.ipAddress, session.userAgent),
        generateRequestFingerprint(ipAddress, userAgent),
      ])

      if (sessionFingerprint !== currentFingerprint) {
        await logSecurityEvent({
          userId: session.userId,
          eventType: "session_device_fingerprint_mismatch",
          severity: "warning",
          ipAddress,
          userAgent,
          details: {
            possibleHijack: true,
          },
        })

        if (isHighRiskRoute(request.nextUrl.pathname)) {
          return { valid: false, reason: "fingerprint_mismatch_high_risk" }
        }
      }
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await logSecurityEvent({
        userId: session.userId,
        eventType: "session_expired",
        severity: "info",
        ipAddress,
        userAgent,
      })
      return { valid: false, reason: "session_expired" }
    }

    // 🔒 SECURITY CHECK 1: IP Validation
    // If IP changed significantly, flag as suspicious
    if (session.ipAddress && session.ipAddress !== ipAddress) {
      // Some tolerance for dynamic IPs in same subnet
      const sessionSubnet = session.ipAddress.split(".").slice(0, 3).join(".")
      const currentSubnet = ipAddress.split(".").slice(0, 3).join(".")

      if (sessionSubnet !== currentSubnet) {
        await logSecurityEvent({
          userId: session.userId,
          eventType: "session_ip_mismatch",
          severity: "warning",
          ipAddress,
          userAgent,
          details: {
            originalIp: session.ipAddress,
            currentIp: ipAddress,
            possibleHijack: true,
          },
        })

        // For highly sensitive routes, reject immediately
        if (isHighRiskRoute(request.nextUrl.pathname)) {
          return { valid: false, reason: "ip_mismatch_high_risk" }
        }

        // For other routes, allow but flag (can implement step-up auth later)
        console.warn(
          `[SECURITY] IP mismatch for user ${session.userId}: ${session.ipAddress} -> ${ipAddress}`
        )
      }
    }

    // 🔒 SECURITY CHECK 2: User-Agent Validation
    if (session.userAgent && session.userAgent !== userAgent) {
      // Some browsers may slightly change User-Agent
      // Check if major browser changed (Chrome -> Firefox)
      const sessionBrowser = extractBrowser(session.userAgent)
      const currentBrowser = extractBrowser(userAgent)

      if (sessionBrowser !== currentBrowser && sessionBrowser && currentBrowser) {
        await logSecurityEvent({
          userId: session.userId,
          eventType: "session_useragent_mismatch",
          severity: "warning",
          ipAddress,
          userAgent,
          details: {
            originalBrowser: sessionBrowser,
            currentBrowser: currentBrowser,
            possibleHijack: true,
          },
        })

        if (isHighRiskRoute(request.nextUrl.pathname)) {
          return { valid: false, reason: "useragent_mismatch_high_risk" }
        }

        console.warn(
          `[SECURITY] User-Agent mismatch for user ${session.userId}`
        )
      }
    }

    // ✅ Session is valid
    return { valid: true, userId: session.userId }
  } catch (error) {
    console.error("[Security Middleware] Validation error:", error)
    return { valid: false, reason: "validation_error" }
  }
}

/**
 * Extract browser from User-Agent string
 */
function extractBrowser(userAgent: string): string | null {
  if (userAgent.includes("Chrome")) return "chrome"
  if (userAgent.includes("Firefox")) return "firefox"
  if (userAgent.includes("Safari")) return "safari"
  if (userAgent.includes("Edge")) return "edge"
  if (userAgent.includes("Opera")) return "opera"
  return null
}

/**
 * Determine if route is high-risk (requires strict security)
 */
function isHighRiskRoute(pathname: string): boolean {
  const highRiskPaths = [
    "/admin",
    "/settings",
    "/api/admin",
    "/api/user",
    "/security",
    "/account",
  ]

  return highRiskPaths.some((path) => pathname.startsWith(path))
}

export default function applySecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeadersUtil(response)
}

/**
 * Apply additional security headers to all responses
 */
export function applySecurityHeadersUtil(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevent MIME-type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Enable XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Enforce HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  )

  // Prevent info leakage
  response.headers.set("X-Powered-By", "Secured")
  response.headers.delete("Server")

  // Disable caching for sensitive data
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  )
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  )

  return response
}

/**
 * Rate limit by IP address
 * In production, use Redis for this
 */
export async function checkIpRateLimit(
  ipAddress: string,
  windowSeconds: number = 60,
  maxRequests: number = 100
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
}> {
  // This is a placeholder - implement Redis integration for production
  return {
    allowed: true,
    remaining: maxRequests,
    resetTime: new Date(Date.now() + windowSeconds * 1000),
  }
}
