import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname.startsWith("/api/auth")
  const isRegisterRoute = pathname === "/api/register"
  const isSignupPage = pathname === "/signup"
  const isInvitationPage = pathname.startsWith("/invitations")
  const isInvitationApiRoute = pathname.startsWith("/api/invitations")

  if (isAuthRoute || isRegisterRoute || isSignupPage || isInvitationPage || isInvitationApiRoute) {
    return NextResponse.next()
  }

  const sessionCookie =
    request.cookies.get("__Secure-next-auth.session-token") ??
    request.cookies.get("next-auth.session-token") ??
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token")

  const isLoggedIn = !!sessionCookie?.value
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
