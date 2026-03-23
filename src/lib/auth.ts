import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, twoFactor } from "better-auth/plugins"

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

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
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
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: false,
    },
  },
  rateLimit: {
    window: 60,
    max: 10,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  plugins: [admin(), twoFactor({
    issuer: "InfoBoard",
    backupCodesOptions: {
      amount: 10,
      length: 10,
    },
    totpOptions: {
      digits: 6,
      period: 30,
    },
    otpOptions: {
      period: 3,
      sendOTP: async ({ user, otp }, ctx) => {
        // TODO: Implement sending OTP to user (email/SMS)
      },
    },
    skipVerificationOnEnable: false,
  })],
  secret,
  baseURL,
  trustedOrigins: [baseURL],
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          try {
            const { log } = await import("@/lib/logger")
            void log({
              eventType: "login_success",
              ip: session.ipAddress ?? null,
              method: "POST",
              path: "/sign-in/email",
              statusCode: 200,
              userId: session.userId,
              userAgent: session.userAgent ?? null,
              details: { sessionId: session.id },
            })
          } catch {}
        },
      },
    },
  },
})