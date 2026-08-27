/**
 * Sets or clears the lightweight, non-sensitive `sg_auth` presence cookie
 * that middleware.ts checks before allowing a request through to a
 * protected route. This is NOT the security boundary (see middleware.ts
 * and lib/rbac.ts for that) — it exists purely so an unauthenticated
 * request gets a real redirect instead of a 200 + loading skeleton.
 *
 * IMPORTANT: this must be called directly from every sign-in/sign-up
 * success path in lib/auth/session.ts, synchronously before the caller's
 * router.push("/dashboard") runs. It is NOT enough to rely solely on
 * AuthProvider's onAuthStateChanged listener to set this cookie, because
 * AuthProvider is only ever mounted *inside* the very layouts middleware
 * protects (app/(app)/layout.tsx, app/onboarding/layout.tsx) — it never
 * mounts on /sign-in. Relying on it alone creates a deadlock: the first
 * post-sign-in navigation to /dashboard always fails the cookie check,
 * because the only code that would set the cookie hasn't had a chance to
 * mount yet. (This was a real, 100%-reproducible bug — sign-in would
 * silently bounce back to /sign-in and look like nothing happened.)
 */
export function setAuthCookie(signedIn: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = signedIn ? "sg_auth=1; path=/; max-age=2592000; SameSite=Lax" : "sg_auth=; path=/; max-age=0";
}
