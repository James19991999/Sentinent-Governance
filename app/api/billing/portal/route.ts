import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/rbac";
import { adminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/client";
import { checkRateLimit, identifierFromRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = await checkRateLimit(`billing:portal:${identifierFromRequest(req, "unknown")}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const auth = await requireAuth(req, { minimumRole: "admin" });
    const orgSnap = await adminDb().collection("organizations").doc(auth.orgId).get();
    const customerId = orgSnap.data()?.stripeCustomerId as string | undefined;
    if (!customerId) return NextResponse.json({ error: "No billing account found for this organization." }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("billing portal session failed", err);
    return NextResponse.json({ error: "Failed to open billing portal." }, { status: 500 });
  }
}
