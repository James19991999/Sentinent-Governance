"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await requestPasswordReset(email);
      setStatus("sent");
    } catch {
      // Deliberately vague — never confirm/deny whether an email exists.
      setStatus("sent");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-headline-md mb-2">Reset your password</h1>
        <p className="text-body-md text-on-surface-variant mb-6">
          Enter your work email and we&apos;ll send a link to reset your password.
        </p>

        {status === "sent" ? (
          <div className="card" role="status">
            <p className="text-body-md">
              If an account exists for <strong>{email}</strong>, a reset link is on its way.
            </p>
            <Link href="/sign-in" className="text-secondary font-medium mt-4 inline-block">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4">
            <div>
              <label htmlFor="email" className="block text-label-sm mb-1.5">
                WORK EMAIL
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 focus:border-2 focus:border-secondary focus:outline-none"
              />
            </div>
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : "Send reset link"}
            </Button>
            <Link href="/sign-in" className="text-secondary text-body-md inline-block">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
