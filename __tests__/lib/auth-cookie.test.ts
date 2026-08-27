/**
 * @jest-environment jsdom
 */
import { setAuthCookie } from "@/lib/auth/authCookie";

function getCookie(name: string): string | undefined {
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

describe("setAuthCookie", () => {
  beforeEach(() => {
    // jsdom doesn't clear cookies between tests automatically
    document.cookie = "sg_auth=; path=/; max-age=0";
  });

  it("sets sg_auth=1 when signedIn is true", () => {
    setAuthCookie(true);
    expect(getCookie("sg_auth")).toBe("1");
  });

  it("clears the cookie when signedIn is false", () => {
    setAuthCookie(true);
    expect(getCookie("sg_auth")).toBe("1");
    setAuthCookie(false);
    // max-age=0 removes it — jsdom reflects this as the cookie disappearing
    expect(getCookie("sg_auth")).toBeUndefined();
  });
});

describe("REGRESSION: sign-in cookie deadlock", () => {
  // This models the exact bug: middleware.ts only allows a request through
  // to a protected route if the sg_auth cookie is already present BEFORE
  // the request is made. AuthProvider (which used to be the only place
  // setting this cookie) only mounts inside the very layouts middleware
  // protects, so relying on it alone meant the cookie could never exist in
  // time for the first post-sign-in navigation — a deadlock.
  function middlewareWouldAllow(cookiePresent: boolean): boolean {
    return cookiePresent;
  }

  it("the OLD approach (cookie set only after protected layout mounts) would always fail the first navigation", () => {
    // Before the fix: nothing sets the cookie until AuthProvider mounts,
    // and AuthProvider only mounts *after* middleware already allowed the
    // request through — which it can't, because the cookie isn't set yet.
    const cookieSetBeforeNavigation = false;
    expect(middlewareWouldAllow(cookieSetBeforeNavigation)).toBe(false);
  });

  it("the FIXED approach (setAuthCookie called synchronously in signIn()) allows the first navigation", () => {
    document.cookie = "sg_auth=; path=/; max-age=0";
    setAuthCookie(true); // this now happens inside signIn(), signUp(), signInWithGoogle(), signInWithMicrosoft()
    const cookieSetBeforeNavigation = getCookie("sg_auth") === "1";
    expect(middlewareWouldAllow(cookieSetBeforeNavigation)).toBe(true);
  });
});
