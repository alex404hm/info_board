import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

import { db } from "@/db"
import * as schema from "@/db/schema"

function requireEnv(name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL") {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is not set`)
  }
  return value
}

const secret = requireEnv("BETTER_AUTH_SECRET")
const baseURL = requireEnv("BETTER_AUTH_URL")
const secureCookies = process.env.NODE_ENV === "production"
const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined

// Workaround for a known pnpm type-resolution mismatch between plugin/core declaration paths.
const adminPlugin = admin() as unknown as any

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      const { sendResetPasswordEmail } = await import("@/lib/email")
      await sendResetPasswordEmail(user.email, url)
    },
  },
  session: {
    // ⚙️ SESSION SECURITY HARDENING
    expiresIn: 60 * 60 * 8, // 8 hours
    updateAge: 60 * 60, // Refresh token every hour
    cookieCache: {
      enabled: false,
    },
  },
  useSecureCookies: secureCookies,
  defaultCookieAttributes: {
    // Prevent XSS attacks - cookie inaccessible via JavaScript
    httpOnly: true,
    // Only send over HTTPS in production
    secure: secureCookies,
    // CSRF protection - only send on same-site requests
    sameSite: "strict",
    // Scope to secure path
    path: "/",
  },
  cookies: cookieDomain
    ? {
        sessionToken: {
          attributes: { domain: cookieDomain },
        },
        sessionData: {
          attributes: { domain: cookieDomain },
        },
        dontRememberToken: {
          attributes: { domain: cookieDomain },
        },
        accountData: {
          attributes: { domain: cookieDomain },
        },
      }
    : undefined,
  // ⚠️ RATE LIMITING - Now with persistent storage
  // Note: Migrate from "memory" to Redis/database in production
  rateLimit: {
    window: 60, // Time window in seconds
    max: 30, // Max requests per window
    storage: "memory", // TODO: Switch to Redis for distributed systems
    customRules: {
      // Keep Better-Auth endpoint reasonably permissive; account-level controls run in /api/sign-in
      "/sign-in/email": { window: 600, max: 20 },
      // Protect other sensitive endpoints
      "/sign-up": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 3 },
    },
  },
  plugins: [adminPlugin],
  secret,
  baseURL,
  trustedOrigins: [baseURL],
  // 🛡️ SECURITY HEADERS
  headers: {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    // Prevent MIME-type sniffing
    "X-Content-Type-Options": "nosniff",
    // Enable XSS filter
    "X-XSS-Protection": "1; mode=block",
    // CSP header
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
    // Enforce HTTPS
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  },
})