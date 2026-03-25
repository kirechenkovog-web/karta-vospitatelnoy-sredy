import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "__Secure-authjs.session-token",
    // Fallback for non-secure environments
  }) ?? await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "authjs.session-token",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/map/:path*", "/stage2/:path*", "/stage3/:path*", "/result/:path*"],
};
