import { NextRequest, NextResponse } from "next/server"

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
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
