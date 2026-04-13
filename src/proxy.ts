/**
 * Next.js Proxy — security headers + request metadata.
 */

import { NextRequest, NextResponse } from "next/server"

// ─── Security headers ─────────────────────────────────────────────────────────

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  )
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()",
  )
  response.headers.delete("X-Powered-By")
  response.headers.delete("Server")
  return response
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Inject x-pathname for server-component reads ──────────────────────────
  if (!pathname.startsWith("/api/")) {
    const reqHeaders = new Headers(request.headers)
    reqHeaders.set("x-pathname", pathname)
    return applySecurityHeaders(NextResponse.next({ request: { headers: reqHeaders } }))
  }

  // All API routes are handled by their route-level auth/authorization logic.
  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
