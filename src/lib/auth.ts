import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"
import { db } from "@/db"
import * as schema from "@/db/schema"

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is not set")
}

if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL environment variable is not set")
}

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
    expiresIn: 60 * 60 * 8,         // 8 hours (was 7 days — shorter is safer for a kiosk system)
    updateAge: 60 * 60,              // refresh session token every hour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,               // cache session for 5 minutes to reduce DB lookups
    },
  },
  rateLimit: {
    window: 60,    // per 60-second window
    max: 10,       // max 10 requests (auth endpoints) per window
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 }, // stricter for login: 5 attempts per minute
    },
  },
  plugins: [admin()],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
  ],
})
