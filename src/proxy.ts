import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old /login route to /admin
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login"],
}
