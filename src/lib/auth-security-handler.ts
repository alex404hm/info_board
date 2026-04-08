/**
 * Enhanced Authentication Handler
 * Security utilities for login flows
 * Note: To use with Better-Auth, call these functions from server actions or API routes
 */

import { db } from "@/db"
import * as schema from "@/db/schema"
import {
  recordLoginAttempt,
  isAccountLocked,
  lockUserAccount,
  resetFailedAttempts,
  LOGIN_SECURITY_CONFIG,
  generateDeviceFingerprint,
} from "@/lib/login-security"
import {
  queueSecurityEmail,
} from "@/lib/security-email-alerts"
import { logSecurityEvent } from "@/lib/login-security"
import { eq } from "drizzle-orm"

interface LoginCheckParams {
  email: string
  userId?: string
  ipAddress: string
  userAgent: string
  isSuccessful: boolean
}

interface LoginCheckResult {
  allowed: boolean
  requiresRateLimit: boolean
  rateLimitDelayMs: number
  lockoutMessage?: string
  reason?: string
}

/**
 * Check login permissions and enforce security policies
 * Call this from a server action after Better-Auth processes the login
 */
export async function checkLoginSecurityAsync(
  params: LoginCheckParams
): Promise<LoginCheckResult> {
  const {
    email,
    userId,
    ipAddress,
    userAgent,
    isSuccessful,
  } = params

  if (!email) {
    return {
      allowed: false,
      requiresRateLimit: false,
      rateLimitDelayMs: 0,
      reason: "Invalid email",
    }
  }

  // Get user from database
  let user = null
  if (userId) {
    const users = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
    user = users[0]
  } else {
    const users = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
    user = users[0]
  }

  if (!user) {
    await logSecurityEvent({
      eventType: "login_attempt_user_not_found",
      severity: "info",
      ipAddress,
      userAgent,
      details: { email },
    })
    return {
      allowed: false,
      requiresRateLimit: false,
      rateLimitDelayMs: 0,
      reason: "User not found",
    }
  }

  // Check if account is locked
  const { locked: isLocked, lockout } = await isAccountLocked(user.id)
  if (isLocked && lockout) {
    if (new Date() < lockout.lockedUntil) {
      await logSecurityEvent({
        userId: user.id,
        eventType: "login_attempt_account_locked",
        severity: "warning",
        ipAddress,
        userAgent,
        details: {
          lockedUntil: lockout.lockedUntil.toISOString(),
        },
      })

      return {
        allowed: false,
        requiresRateLimit: false,
        rateLimitDelayMs: 0,
        lockoutMessage: `Your account is locked until ${lockout.lockedUntil.toLocaleTimeString()}. Please try again later.`,
        reason: "account_locked",
      }
    }
  }

  if (!isSuccessful) {
    const { attemptCount } = await recordLoginAttempt({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      success: false,
      reason: "invalid_password",
    })

    if (attemptCount >= LOGIN_SECURITY_CONFIG.LOCKOUT_THRESHOLD) {
      await lockUserAccount(user.id, ipAddress, userAgent, "max_login_attempts")
      queueSecurityEmail("account_locked", {
        userEmail: user.email,
        userName: user.name,
        lockedUntil: new Date(
          Date.now() + LOGIN_SECURITY_CONFIG.LOCKOUT_DURATION * 60 * 1000
        ),
        ipAddress,
        attemptCount,
        supportEmail: process.env.SUPPORT_EMAIL || "support@example.com",
      })

      return {
        allowed: false,
        requiresRateLimit: false,
        rateLimitDelayMs: 0,
        lockoutMessage: `Too many failed attempts. Account locked for 30 minutes.`,
        reason: "account_locked_max_attempts",
      }
    }

    const rateLimitDelayMs =
      attemptCount >= LOGIN_SECURITY_CONFIG.RATE_LIMIT_THRESHOLD
        ? LOGIN_SECURITY_CONFIG.RATE_LIMIT_DELAY_MS *
          (attemptCount - LOGIN_SECURITY_CONFIG.RATE_LIMIT_THRESHOLD + 1)
        : 0

    return {
      allowed: false,
      requiresRateLimit: rateLimitDelayMs > 0,
      rateLimitDelayMs,
      reason: "invalid_password",
    }
  }

  // Successful login
  if (isSuccessful) {
    const fingerprint = await generateDeviceFingerprint(ipAddress, userAgent)
    const userDevices = await db
      .select()
      .from(schema.deviceFingerprint)
      .where(eq(schema.deviceFingerprint.userId, user.id))
    const deviceStatus = !userDevices.some((d) => d.fingerprint === fingerprint)

    await resetFailedAttempts(user.id)

    await recordLoginAttempt({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      success: true,
    })

    if (deviceStatus) {
      queueSecurityEmail("new_device_login", {
        userEmail: user.email,
        userName: user.name,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/security`,
      })
    }

    await logSecurityEvent({
      userId: user.id,
      eventType: "login_successful",
      severity: "info",
      ipAddress,
      userAgent,
      details: { email: user.email, newDevice: deviceStatus },
    })

    return {
      allowed: true,
      requiresRateLimit: false,
      rateLimitDelayMs: 0,
    }
  }

  return {
    allowed: true,
    requiresRateLimit: false,
    rateLimitDelayMs: 0,
  }
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(request: Request): string {
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

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(request: Request): string {
  return request.headers.get("user-agent") || ""
}
