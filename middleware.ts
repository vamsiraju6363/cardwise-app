import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

/** Routes that unauthenticated users may visit freely. */
const PUBLIC_PATHS = new Set(["/login", "/register"]);

export default auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl;

  const isAuthenticated = !!req.auth?.user;
  const isPublicPath    = PUBLIC_PATHS.has(pathname);

  // Authenticated users visiting /login or /register → redirect to dashboard
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Unauthenticated users visiting a protected route → redirect to /login
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
