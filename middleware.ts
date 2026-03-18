import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production" 
      ? "__Secure-authjs.session-token" 
      : "authjs.session-token",
  });

  const { pathname } = req.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};