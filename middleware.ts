import { NextResponse, type NextRequest } from "next/server";

// Paths that require the lightweight `sg_auth` presence cookie (see
// lib/auth/AuthProvider.tsx). This is NOT the real security boundary — it's
// a defense-in-depth UX improvement so anonymous requests get a proper
// redirect instead of a 200 + loading skeleton. The actual boundary is
// requireAuth() on every API route (lib/rbac.ts) and firestore.rules on
// every direct client Firestore read/write. A forged/stale cookie here
// grants zero data access on its own.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/bias-audit",
  "/workflows",
  "/upskilling",
  "/guidelines",
  "/settings",
  "/billing",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const hasAuthCookie = request.cookies.get("sg_auth")?.value === "1";
  if (hasAuthCookie) return NextResponse.next();

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(signInUrl);
}

// Explicit, narrow matcher — deliberately NOT a broad catch-all — per
// current Next.js middleware security guidance (CVE-2025-29927 concerned
// matcher/header-normalization edge cases on overly permissive patterns).
export const config = {
  matcher: ["/dashboard/:path*", "/bias-audit/:path*", "/workflows/:path*", "/upskilling/:path*", "/guidelines/:path*", "/settings/:path*", "/billing/:path*"],
};
