"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setSubmitting(true);
    setError(null);
    try {
      const orgRef = doc(collection(db, "organizations"));
      await setDoc(orgRef, {
        id: orgRef.id,
        name: orgName,
        createdAt: new Date().toISOString(),
        ownerId: firebaseUser.uid,
        plan: "trial",
      });
      await setDoc(doc(db, "organizations", orgRef.id, "members", firebaseUser.uid), {
        userId: firebaseUser.uid,
        role: "owner",
        joinedAt: new Date().toISOString(),
      });
      router.push("/dashboard");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(
        code === "permission-denied"
          ? "Firestore denied this request. If you just deployed security rules, they can take a moment to propagate — try again in a minute. Otherwise, run `firebase deploy --only firestore:rules`."
          : code
            ? `Couldn't create your organization (${code}). Please try again.`
            : "Couldn't create your organization. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md card">
        <h1 className="text-headline-md mb-2">Create your organization</h1>
        <p className="text-body-md text-on-surface-variant mb-6">
          This becomes the tenant boundary for every model, workflow, and audit you manage.
        </p>
        {error && (
          <p role="alert" className="text-error text-body-md bg-error-container/30 rounded p-3 mb-4">
            {error}
          </p>
        )}
        <label htmlFor="orgName" className="block text-label-sm mb-1.5">
          ORGANIZATION NAME
        </label>
        <input
          id="orgName"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 mb-6 focus:border-2 focus:border-secondary focus:outline-none"
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating..." : "Create organization"}
        </Button>
      </form>
    </main>
  );
}
