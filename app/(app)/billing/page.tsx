"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const PLANS = [
  { name: "Starter", priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID ?? "", price: "$499/mo", blurb: "Up to 5 monitored models" },
  { name: "Enterprise", priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID ?? "", price: "$2,499/mo", blurb: "Unlimited models, SSO, audit log export" },
];

export default function BillingPage() {
  const { activeOrgId, activeRole, orgs, firebaseUser } = useAuth();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const org = orgs.find((o) => o.id === activeOrgId);
  const canManageBilling = activeRole === "owner" || activeRole === "admin";

  async function authedFetch(url: string, body: object) {
    if (!firebaseUser || !activeOrgId) return null;
    const token = await firebaseUser.getIdToken();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Org-Id": activeOrgId },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? "Request failed.");
    }
    return res.json();
  }

  async function startCheckout(priceId: string) {
    setError(null);
    setLoadingPriceId(priceId);
    try {
      const json = await authedFetch("/api/billing/checkout", { priceId });
      if (json?.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setLoadingPriceId(null);
    }
  }

  async function openPortal() {
    setError(null);
    setPortalLoading(true);
    try {
      const json = await authedFetch("/api/billing/portal", {});
      if (json?.url) window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (!canManageBilling) {
    return (
      <EmptyState
        title="Billing is managed by your organization's admins"
        description="Ask an owner or admin on your team to make changes to your subscription."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-headline-md">Billing</h1>

      <Card title="Current Plan">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-lg font-medium capitalize">{org?.plan ?? "trial"}</p>
            {org?.subscriptionStatus && (
              <Chip tone={org.subscriptionStatus === "active" ? "success" : "warning"}>{org.subscriptionStatus}</Chip>
            )}
          </div>
          {org?.stripeCustomerId && (
            <Button variant="secondary" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? "Opening..." : "Manage subscription"}
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <p role="alert" className="text-error text-body-md bg-error-container/30 rounded p-3">
          {error}
        </p>
      )}

      <Card title="Plans">
        <div className="grid md:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className="border border-outline-variant rounded-lg p-4">
              <h4 className="font-medium text-body-lg">{plan.name}</h4>
              <p className="text-headline-md my-1">{plan.price}</p>
              <p className="text-body-md text-on-surface-variant mb-4">{plan.blurb}</p>
              <Button
                className="w-full"
                onClick={() => startCheckout(plan.priceId)}
                disabled={!plan.priceId || loadingPriceId === plan.priceId}
              >
                {loadingPriceId === plan.priceId ? "Redirecting..." : "Choose plan"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
