import { createAuthClient } from "better-auth/react"
import { adminClient, twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "",
  plugins: [
    adminClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/admin/2fa"
      },
    }),
  ],
})

export const { signIn, signOut, useSession } = authClient
