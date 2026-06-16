import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/test") {
    return NextResponse.redirect(new URL("/test/dashboard", request.url));
  }

  if (!pathname.startsWith("/test/")) {
    return NextResponse.next();
  }

  const inner = pathname.slice("/test".length) || "/dashboard";
  if (inner === "/matters/new") {
    return NextResponse.redirect(new URL("/test/matters", request.url));
  }

  const url = request.nextUrl.clone();
  url.pathname = inner;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/test", "/test/:path*"],
};
