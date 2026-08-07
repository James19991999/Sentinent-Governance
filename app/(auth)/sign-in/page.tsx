"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { signIn, signUp, signInWithGoogle, signInWithMicrosoft } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";

type Tab = "sign-in" | "create-account";

export default function SignInPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<"google" | "microsoft" | null>(null);

  async function onSso(provider: "google" | "microsoft") {
    setError(null);
    setSsoProvider(provider);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithMicrosoft();
      router.push("/dashboard");
    } catch (err) {
      // auth/popup-closed-by-user is a normal cancel, not an error worth showing
      if (err instanceof Error && err.message.includes("auth/popup-closed-by-user")) return;
      setError(err instanceof Error ? humanizeAuthError(err.message) : "Something went wrong.");
    } finally {
      setSsoProvider(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === "sign-in") {
        await signIn(email, password);
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        await signUp(email, password, name || email.split("@")[0]);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? humanizeAuthError(err.message) : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary-container/20 to-surface p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary text-on-primary flex items-center justify-center mb-4">
            <ShieldCheck size={28} aria-hidden="true" />
          </div>
          <h1 className="text-headline-md text-on-surface">Sentient Governance</h1>
          <p className="text-body-md text-on-surface-variant">Responsible AI Oversight &amp; Integrity</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
          <div role="tablist" aria-label="Authentication" className="flex border-b border-outline-variant">
            <button
              role="tab"
              aria-selected={tab === "sign-in"}
              className={`flex-1 py-4 text-label-sm font-semibold tracking-wide ${
                tab === "sign-in" ? "border-b-2 border-primary text-on-surface" : "text-on-surface-variant"
              }`}
              onClick={() => setTab("sign-in")}
            >
              SIGN IN
            </button>
            <button
              role="tab"
              aria-selected={tab === "create-account"}
              className={`flex-1 py-4 text-label-sm font-semibold tracking-wide ${
                tab === "create-account" ? "border-b-2 border-primary text-on-surface" : "text-on-surface-variant"
              }`}
              onClick={() => setTab("create-account")}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {error && (
              <p role="alert" className="text-error text-body-md bg-error-container/30 rounded p-3">
                {error}
              </p>
            )}

            {tab === "create-account" && (
              <div>
                <label htmlFor="name" className="block text-label-sm mb-1.5">
                  FULL NAME
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 focus:border-2 focus:border-secondary focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-label-sm mb-1.5">
                WORK EMAIL
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 focus:border-2 focus:border-secondary focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-label-sm mb-1.5">
                  PASSWORD
                </label>
                {tab === "sign-in" && (
                  <Link href="/sign-in/forgot-password" className="text-secondary text-label-sm">
                    FORGOT PASSWORD?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={tab === "create-account" ? 8 : undefined}
                  autoComplete={tab === "sign-in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 pr-10 focus:border-2 focus:border-secondary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : tab === "sign-in" ? "SIGN IN" : "CREATE ACCOUNT"}
            </Button>
          </form>

          <div className="px-6 pb-6 text-center text-label-sm text-on-surface-variant" aria-hidden="true">
            — ENTERPRISE SSO —
          </div>
          <div className="px-6 pb-6 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => onSso("google")}
              disabled={ssoProvider !== null}
            >
              {ssoProvider === "google" ? "Opening..." : "Google"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => onSso("microsoft")}
              disabled={ssoProvider !== null}
            >
              {ssoProvider === "microsoft" ? "Opening..." : "Azure AD"}
            </Button>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6 text-label-sm text-on-surface-variant">
          <Link href="/contact">Contact IT Support</Link>
          <Link href="/legal/terms">Legal Terms</Link>
          <Link href="/legal/privacy">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}

function humanizeAuthError(message: string): string {
  if (message.includes("auth/email-already-in-use")) return "An account with this email already exists.";
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password"))
    return "Incorrect email or password.";
  if (message.includes("auth/weak-password")) return "Password is too weak — use at least 8 characters.";
  if (message.includes("auth/user-not-found")) return "No account found with this email.";
  if (message.includes("auth/operation-not-allowed"))
    return "This sign-in method isn't enabled yet — an admin needs to turn it on in the Firebase console (Authentication → Sign-in method).";
  if (message.includes("auth/account-exists-with-different-credential"))
    return "An account already exists with this email using a different sign-in method.";
  if (message.includes("auth/popup-blocked")) return "Your browser blocked the sign-in popup — please allow popups and try again.";
  return message;
}
