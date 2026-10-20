import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Logged-in users should not access the login page
  if (pathname === "/login" && accessToken) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login/:path*"],
};