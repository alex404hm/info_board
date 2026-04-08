import { NextRequest, NextResponse } from "next/server"

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  )
  response.headers.set("X-Powered-By", "Secured")
  response.headers.delete("Server")
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  )

  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Redirect legacy /login → /admin ──────────────────────────────────────
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // ── Forward pathname to server components via request header ──────────────
  // Must be on the *request* side so Next.js headers() can read it.
  const requestHeaders = new Headers(request.headers)
  // Always overwrite any client-supplied value so it can't be spoofed.
  requestHeaders.set("x-pathname", pathname)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  
  // Apply security headers
  return applySecurityHeaders(response)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
