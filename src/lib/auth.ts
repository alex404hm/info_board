import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"

import { db } from "@/db"
import * as schema from "@/db/schema"

function requireEnv(name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL") {
  const value = process.env[name]
  if (!value) throw new Error(`${name} environment variable is not set`)
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
    expiresIn: 60 * 60 * 8,  // 8 hours
    updateAge: 60 * 60,       // refresh token every hour
    // Cache session in a signed cookie — avoids a DB hit on every request
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  useSecureCookies: secureCookies,
  defaultCookieAttributes: {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "strict",
    path: "/",
  },
  cookies: cookieDomain
    ? {
        sessionToken: { attributes: { domain: cookieDomain } },
        sessionData:  { attributes: { domain: cookieDomain } },
        dontRememberToken: { attributes: { domain: cookieDomain } },
        accountData:  { attributes: { domain: cookieDomain } },
      }
    : undefined,
  // Keep better-auth's own rate limiting light — real protection is in /api/sign-in
  rateLimit: {
    window: 60,
    max: 100,
    storage: "memory",
  },
  plugins: [adminPlugin],
  secret,
  baseURL,
  trustedOrigins: [baseURL],
})
