import { NextRequest, NextResponse } from "next/server"

/** Cookie names set by better-auth's twoFactor plugin */
const TWO_FACTOR_COOKIES = ["better-auth.two_factor", "__Secure-better-auth.two_factor"]

function hasTwoFactorPendingCookie(request: NextRequest): boolean {
  return TWO_FACTOR_COOKIES.some((name) => request.cookies.has(name))
}

export function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  // ── Redirect legacy /login → /admin ──────────────────────────────────────
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // ── Guard /admin/2fa ──────────────────────────────────────────────────────
  // Only reachable if better-auth set a pending two_factor cookie (i.e. the
  // user completed the password step but hasn't finished 2FA yet).
  // Direct navigation without that cookie is silently redirected to /admin.
  if (pathname === "/admin/2fa") {
    if (!hasTwoFactorPendingCookie(request)) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  // ── Forward pathname to server components via request header ──────────────
  // Must be on the *request* side so Next.js headers() can read it.
  const requestHeaders = new Headers(request.headers)
  // Always overwrite any client-supplied value so it can't be spoofed.
  requestHeaders.set("x-pathname", pathname)

  // ── Page-view logging (fire-and-forget) ───────────────────────────────────
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/logo") &&
    !pathname.startsWith("/weather") &&
    pathname !== "/favicon.ico"
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"

    fetch(`${origin}/api/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-log-secret": process.env.LOG_SECRET ?? "ib-internal-log",
      },
      body: JSON.stringify({
        eventType: "page_view",
        ip,
        method: request.method,
        path: pathname,
        userAgent: request.headers.get("user-agent"),
      }),
    }).catch(() => {})
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
