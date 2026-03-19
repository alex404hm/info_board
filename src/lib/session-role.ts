export function getUserRole(session: unknown) {
  if (!session || typeof session !== "object" || !("user" in session)) return undefined

  const user = (session as { user?: unknown }).user
  if (!user || typeof user !== "object" || !("role" in user)) return undefined

  const role = (user as { role?: unknown }).role
  return typeof role === "string" ? role : undefined
}
