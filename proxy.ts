import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware runs on Edge Runtime, so we can't use Prisma
// We'll check session using NextAuth session token
export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token")

  // Redirect to dashboard if logged in user tries to access auth pages
  if ((request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/") && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protected routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/api/gemini")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/auth/:path*",
    "/dashboard/:path*",
    "/api/gemini/:path*",
  ],
}
