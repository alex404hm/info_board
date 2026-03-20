import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  // Redirect old /login route to /admin
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Log page views (skip API, static assets, and the log endpoint itself)
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

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
