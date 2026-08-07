"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resendVerificationEmail } from "@/lib/auth/session";
import { MailWarning } from "lucide-react";

/**
 * Nudge, not a hard gate: unverified users can still use the app (blocking
 * them entirely risks locking out someone who just hasn't checked their
 * inbox yet, and nothing in this app's data model currently depends on
 * verified-email trust). This banner is deliberately dismissible-by-action
 * only (resend or confirm), not by an X button, so it stays visible until
 * actually resolved.
 */
export function EmailVerificationBanner() {
  const { firebaseUser, emailVerified, refreshEmailVerification } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "checking" | "error">("idle");

  if (!firebaseUser || emailVerified) return null;
  // OAuth sign-ins (Google/Microsoft) come through already verified by the
  // provider — Firebase sets emailVerified true for those automatically,
  // so if we're here it's an unverified email/password account.

  async function onResend() {
    setStatus("sending");
    try {
      await resendVerificationEmail();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  async function onCheckAgain() {
    setStatus("checking");
    const verified = await refreshEmailVerification();
    setStatus(verified ? "idle" : "error");
  }

  return (
    <div role="status" className="bg-tertiary-container/10 border-b border-tertiary/20 px-4 md:px-6 py-2.5">
      <div className="max-w-container mx-auto flex items-center justify-between gap-4 flex-wrap text-body-md">
        <span className="flex items-center gap-2 text-on-surface">
          <MailWarning size={16} className="text-tertiary shrink-0" />
          {status === "sent"
            ? `Verification email sent to ${firebaseUser.email}.`
            : "Please verify your email address to secure your account."}
        </span>
        <span className="flex items-center gap-3 text-label-sm">
          <button type="button" onClick={onResend} disabled={status === "sending"} className="text-secondary font-medium">
            {status === "sending" ? "Sending..." : "Resend email"}
          </button>
          <button type="button" onClick={onCheckAgain} disabled={status === "checking"} className="text-secondary font-medium">
            {status === "checking" ? "Checking..." : "I've verified"}
          </button>
        </span>
      </div>
    </div>
  );
}
