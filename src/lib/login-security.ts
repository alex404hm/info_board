/**
 * Login Security Service
 * Handles failed login tracking, account lockout, device fingerprinting,
 * and progressive rate limiting for brute-force protection
 */

import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and, gt, lt, desc, or, isNull, sql } from "drizzle-orm"

// Helper function to generate UUIDs without Node crypto module
function generateId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  // Fallback: simple UUID-like string
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getNumericEnvValue(name: string, fallbackValue: number): number {
  const value = process.env[name]
  if (!value) {
    return fallbackValue
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallbackValue
  }

  return parsed
}

// Configuration for progressiverate limiting
export const LOGIN_SECURITY_CONFIG = {
  // Failed attempt thresholds
  RATE_LIMIT_THRESHOLD: 1, // Attempts 1-6: Enforce lightweight progressive delay
  LOCKOUT_THRESHOLD: getNumericEnvValue("LOGIN_LOCKOUT_THRESHOLD", 5), // Attempts 5+: Lock account

  // Lockout durations (in minutes)
  LOCKOUT_DURATION: getNumericEnvValue("LOGIN_LOCKOUT_DURATION", 30),
  RATE_LIMIT_DELAY_MS: getNumericEnvValue("LOGIN_RATE_LIMIT_DELAY_MS", 150), // base delay per failed attempt

  // Time windows (in minutes)
  ATTEMPT_WINDOW: getNumericEnvValue("LOGIN_ATTEMPT_WINDOW", 30), // Failed-attempt rolling window
  RATE_LIMIT_WINDOW_MINUTES: getNumericEnvValue("LOGIN_RATE_LIMIT_WINDOW_MINUTES", 30),
  IP_RATE_LIMIT_MAX_ATTEMPTS: getNumericEnvValue("LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS", 20),
  DEVICE_RATE_LIMIT_MAX_ATTEMPTS: getNumericEnvValue("LOGIN_DEVICE_RATE_LIMIT_MAX_ATTEMPTS", 15),

  // Email notification
  NOTIFY_ON_LOCKOUT: true,
  NOTIFY_ON_SUSPICIOUS_LOGIN: true,
  SUSPICIOUS_LOGIN_NEW_DEVICE_ATTEMPTS: 3,
}

/**
 * Generate a device fingerprint from IP + User-Agent
 * Uses SubtleCrypto API for edge runtime compatibility
 */
export async function generateDeviceFingerprint(
  ipAddress: string,
  userAgent: string
): Promise<string> {
  const combined = `${ipAddress}::${userAgent}`
  
  // Use Web Crypto API (available in edge runtime)
  const encoder = new TextEncoder()
  const data = encoder.encode(combined)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

type RateLimitKeyType = "ip" | "deviceFingerprint"

export type IpDeviceRateLimitResult = {
  limited: boolean
  limitedBy?: RateLimitKeyType
  retryAfterSeconds: number
  blockedUntil?: Date
}

async function getRateLimitBucket(keyType: RateLimitKeyType, keyValue: string) {
  const rows = await db
    .select()
    .from(schema.authRateLimit)
    .where(
      and(
        eq(schema.authRateLimit.keyType, keyType),
        eq(schema.authRateLimit.keyValue, keyValue)
      )
    )
    .limit(1)

  return rows[0]
}

async function upsertRateLimitFailure(
  keyType: RateLimitKeyType,
  keyValue: string,
  maxAttempts: number
) {
  const now = new Date()
  const windowCutoff = new Date(
    now.getTime() - LOGIN_SECURITY_CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  )

  const existing = await getRateLimitBucket(keyType, keyValue)

  if (!existing) {
    await db.insert(schema.authRateLimit).values({
      id: generateId(),
      keyType,
      keyValue,
      attemptCount: 1,
      windowStartedAt: now,
      lastAttemptAt: now,
      blockedUntil: null,
      createdAt: now,
      updatedAt: now,
    })

    return {
      blockedUntil: null as Date | null,
      attemptCount: 1,
    }
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    await db
      .update(schema.authRateLimit)
      .set({
        lastAttemptAt: now,
        updatedAt: now,
      })
      .where(eq(schema.authRateLimit.id, existing.id))

    return {
      blockedUntil: existing.blockedUntil,
      attemptCount: existing.attemptCount,
    }
  }

  const isWindowExpired = existing.windowStartedAt < windowCutoff
  const nextAttemptCount = isWindowExpired ? 1 : existing.attemptCount + 1
  const nextWindowStartedAt = isWindowExpired ? now : existing.windowStartedAt
  const nextBlockedUntil =
    nextAttemptCount >= maxAttempts
      ? new Date(now.getTime() + LOGIN_SECURITY_CONFIG.LOCKOUT_DURATION * 60 * 1000)
      : null

  await db
    .update(schema.authRateLimit)
    .set({
      attemptCount: nextAttemptCount,
      windowStartedAt: nextWindowStartedAt,
      lastAttemptAt: now,
      blockedUntil: nextBlockedUntil,
      updatedAt: now,
    })
    .where(eq(schema.authRateLimit.id, existing.id))

  return {
    blockedUntil: nextBlockedUntil,
    attemptCount: nextAttemptCount,
  }
}

export async function checkIpAndDeviceRateLimit(
  ipAddress: string,
  deviceFingerprint: string
): Promise<IpDeviceRateLimitResult> {
  const now = new Date()

  const [ipBucket, deviceBucket] = await Promise.all([
    getRateLimitBucket("ip", ipAddress),
    getRateLimitBucket("deviceFingerprint", deviceFingerprint),
  ])

  if (ipBucket?.blockedUntil && ipBucket.blockedUntil > now) {
    return {
      limited: true,
      limitedBy: "ip",
      retryAfterSeconds: Math.ceil((ipBucket.blockedUntil.getTime() - now.getTime()) / 1000),
      blockedUntil: ipBucket.blockedUntil,
    }
  }

  if (deviceBucket?.blockedUntil && deviceBucket.blockedUntil > now) {
    return {
      limited: true,
      limitedBy: "deviceFingerprint",
      retryAfterSeconds: Math.ceil((deviceBucket.blockedUntil.getTime() - now.getTime()) / 1000),
      blockedUntil: deviceBucket.blockedUntil,
    }
  }

  return {
    limited: false,
    retryAfterSeconds: 0,
  }
}

export async function registerFailedIpAndDeviceAttempt(
  ipAddress: string,
  deviceFingerprint: string
): Promise<IpDeviceRateLimitResult> {
  const [ipUpdate, deviceUpdate] = await Promise.all([
    upsertRateLimitFailure(
      "ip",
      ipAddress,
      LOGIN_SECURITY_CONFIG.IP_RATE_LIMIT_MAX_ATTEMPTS
    ),
    upsertRateLimitFailure(
      "deviceFingerprint",
      deviceFingerprint,
      LOGIN_SECURITY_CONFIG.DEVICE_RATE_LIMIT_MAX_ATTEMPTS
    ),
  ])

  const now = new Date()

  if (ipUpdate.blockedUntil && ipUpdate.blockedUntil > now) {
    return {
      limited: true,
      limitedBy: "ip",
      retryAfterSeconds: Math.ceil((ipUpdate.blockedUntil.getTime() - now.getTime()) / 1000),
      blockedUntil: ipUpdate.blockedUntil,
    }
  }

  if (deviceUpdate.blockedUntil && deviceUpdate.blockedUntil > now) {
    return {
      limited: true,
      limitedBy: "deviceFingerprint",
      retryAfterSeconds: Math.ceil((deviceUpdate.blockedUntil.getTime() - now.getTime()) / 1000),
      blockedUntil: deviceUpdate.blockedUntil,
    }
  }

  return {
    limited: false,
    retryAfterSeconds: 0,
  }
}

export async function resetIpAndDeviceRateLimit(
  ipAddress: string,
  deviceFingerprint: string
) {
  await db
    .delete(schema.authRateLimit)
    .where(
      or(
        and(
          eq(schema.authRateLimit.keyType, "ip"),
          eq(schema.authRateLimit.keyValue, ipAddress)
        ),
        and(
          eq(schema.authRateLimit.keyType, "deviceFingerprint"),
          eq(schema.authRateLimit.keyValue, deviceFingerprint)
        )
      )
    )
}

/**
 * Get or create a device fingerprint record
 */
export async function getOrCreateDeviceFingerprint(
  userId: string,
  ipAddress: string,
  userAgent: string
) {
  const fingerprint = await generateDeviceFingerprint(ipAddress, userAgent)

  const existing = await db
    .select()
    .from(schema.deviceFingerprint)
    .where(eq(schema.deviceFingerprint.fingerprint, fingerprint))
    .limit(1)

  if (existing.length > 0) {
    // Update last seen
    await db
      .update(schema.deviceFingerprint)
      .set({
        lastSeenAt: new Date(),
        isFirstSeen: false,
      })
      .where(eq(schema.deviceFingerprint.id, existing[0].id))
    return existing[0]
  }

  // Create new device fingerprint
  const newFingerprint = {
    id: generateId(),
    userId,
    fingerprint,
    ipAddress,
    userAgent,
    createdAt: new Date(),
    lastSeenAt: new Date(),
  }

  await db.insert(schema.deviceFingerprint).values(newFingerprint)
  return newFingerprint
}

/**
 * Get recent failed login attempts for a user
 */
export async function getRecentFailedAttempts(userId: string) {
  const cutoffTime = new Date(Date.now() - LOGIN_SECURITY_CONFIG.ATTEMPT_WINDOW * 60 * 1000)

  return await db
    .select()
    .from(schema.loginAttempt)
    .where(
      and(
        eq(schema.loginAttempt.userId, userId),
        eq(schema.loginAttempt.success, false),
        gt(schema.loginAttempt.createdAt, cutoffTime)
      )
    )
    .orderBy(desc(schema.loginAttempt.createdAt))
}

/**
 * Count recent failed login attempts for a user
 */
export async function countRecentFailedAttempts(userId: string): Promise<number> {
  const cutoffTime = new Date(Date.now() - LOGIN_SECURITY_CONFIG.ATTEMPT_WINDOW * 60 * 1000)

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.loginAttempt)
    .where(
      and(
        eq(schema.loginAttempt.userId, userId),
        eq(schema.loginAttempt.success, false),
        gt(schema.loginAttempt.createdAt, cutoffTime)
      )
    )

  return Number(result[0]?.count ?? 0)
}

/**
 * Check if user is currently locked out
 */
export async function isAccountLocked(userId: string): Promise<{
  locked: boolean
  lockout?: typeof schema.accountLockout.$inferSelect
}> {
  const lockout = await db
    .select()
    .from(schema.accountLockout)
    .where(
      and(
        eq(schema.accountLockout.userId, userId),
        lt(schema.accountLockout.lockedAt, new Date()),
        gt(schema.accountLockout.lockedUntil, new Date()),
        // Only return active lockouts
        or(
          isNull(schema.accountLockout.unlockedAt),
          lt(schema.accountLockout.unlockedAt, schema.accountLockout.lockedUntil)
        )
      )
    )
    .orderBy(desc(schema.accountLockout.lockedAt))
    .limit(1)

  if (lockout.length === 0) {
    return { locked: false }
  }

  return { locked: true, lockout: lockout[0] }
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt({
  userId,
  email,
  ipAddress,
  userAgent,
  success,
  reason,
}: {
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  success: boolean
  reason?: string
}) {
  const failureCount = await countRecentFailedAttempts(userId)
  const attemptCount = success ? failureCount : failureCount + 1

  const deviceFingerprint = await getOrCreateDeviceFingerprint(
    userId,
    ipAddress,
    userAgent
  )

  await db.insert(schema.loginAttempt).values({
    id: generateId(),
    userId,
    email,
    ipAddress,
    userAgent,
    deviceFingerprint: deviceFingerprint.fingerprint,
    success,
    reason,
    attemptCount,
    createdAt: new Date(),
  })

  return {
    attemptCount,
    deviceFingerprint,
  }
}

/**
 * Check if device is new/suspicious for user
 */
export async function isNewDevice(userId: string, fingerprint: string): Promise<boolean> {
  const userDevices = await db
    .select()
    .from(schema.deviceFingerprint)
    .where(eq(schema.deviceFingerprint.userId, userId))

  return !userDevices.some((d) => d.fingerprint === fingerprint)
}

/**
 * Lock user account temporarily
 */
export async function lockUserAccount(
  userId: string,
  ipAddress: string,
  userAgent: string,
  reason = "max_login_attempts"
) {
  const lockedUntil = new Date(Date.now() + LOGIN_SECURITY_CONFIG.LOCKOUT_DURATION * 60 * 1000)

  const lockoutRecord = {
    id: generateId(),
    userId,
    reason,
    lockedAt: new Date(),
    lockedUntil,
    ipAddress,
    userAgent,
  }

  await db.insert(schema.accountLockout).values(lockoutRecord)

  // Log security event
  await logSecurityEvent({
    userId,
    eventType: "account_locked",
    severity: "warning",
    ipAddress,
    userAgent,
    details: {
      reason,
      lockedUntil: lockedUntil.toISOString(),
    },
  })

  return lockoutRecord
}

/**
 * Unlock user account (manual unlock)
 */
export async function unlockUserAccount(userId: string) {
  const lockout = await db
    .select()
    .from(schema.accountLockout)
    .where(
      and(
        eq(schema.accountLockout.userId, userId),
        gt(schema.accountLockout.lockedUntil, new Date()),
        isNull(schema.accountLockout.unlockedAt)
      )
    )
    .orderBy(desc(schema.accountLockout.lockedAt))
    .limit(1)

  if (lockout.length === 0) {
    return false
  }

  await db
    .update(schema.accountLockout)
    .set({
      unlockedAt: new Date(),
    })
    .where(eq(schema.accountLockout.id, lockout[0].id))

  return true
}

/**
 * Reset failed login counter for user
 */
export async function resetFailedAttempts(userId: string) {
  // Clear recent failed-attempt records immediately after a successful login.
  // This ensures the next login starts from a clean state.
  await db
    .delete(schema.loginAttempt)
    .where(
      and(
        eq(schema.loginAttempt.userId, userId),
        eq(schema.loginAttempt.success, false)
      )
    )
}

/**
 * Log security event for audit trail
 */
export async function logSecurityEvent({
  userId,
  eventType,
  severity,
  ipAddress,
  userAgent,
  details = {},
}: {
  userId?: string
  eventType: string
  severity: "info" | "warning" | "critical"
  ipAddress?: string
  userAgent?: string
  details?: Record<string, any>
}) {
  await db.insert(schema.securityAuditLog).values({
    id: generateId(),
    userId,
    eventType,
    severity,
    ipAddress,
    userAgent,
    details,
    createdAt: new Date(),
  })
}

/**
 * Get login security status for user
 */
export async function getLoginSecurityStatus(userId: string) {
  const failedAttempts = await getRecentFailedAttempts(userId)
  const { locked: isLocked, lockout } = await isAccountLocked(userId)
  const allDevices = await db
    .select()
    .from(schema.deviceFingerprint)
    .where(eq(schema.deviceFingerprint.userId, userId))

  const attemptCount = failedAttempts.length

  return {
    isLocked,
    lockout,
    failedAttemptCount: attemptCount,
    requiresRateLimit: attemptCount >= LOGIN_SECURITY_CONFIG.RATE_LIMIT_THRESHOLD - 1,
    shouldLock: attemptCount >= LOGIN_SECURITY_CONFIG.LOCKOUT_THRESHOLD - 1,
    knownDeviceCount: allDevices.length,
    lastFailedAttempt: failedAttempts[0]?.createdAt,
  }
}
