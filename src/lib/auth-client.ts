import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

function pickFirstValidUrl(value: string | undefined) {
  if (!value) return ""

  const parts = value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

  for (const part of parts) {
    try {
      new URL(part)
      return part
    } catch {
      continue
    }
  }

  return ""
}

export const authClient = createAuthClient({
  baseURL: pickFirstValidUrl(process.env.NEXT_PUBLIC_BETTER_AUTH_URL),
  plugins: [
    adminClient(),
  ],
})

export const { signOut, useSession } = authClient
