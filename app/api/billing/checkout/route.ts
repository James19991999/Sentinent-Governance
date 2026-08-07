import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthError } from "@/lib/rbac";
import { adminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/client";
import { checkRateLimit, identifierFromRequest } from "@/lib/rate-limit";

const bodySchema = z.object({ priceId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const limit = await checkRateLimit(`billing:checkout:${identifierFromRequest(req, "unknown")}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const auth = await requireAuth(req, { minimumRole: "admin" });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

    const orgSnap = await adminDb().collection("organizations").doc(auth.orgId).get();
    if (!orgSnap.exists) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    const org = orgSnap.data()!;

    let customerId = org.stripeCustomerId as string | undefined;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: auth.email,
        metadata: { orgId: auth.orgId },
      });
      customerId = customer.id;
      await adminDb().collection("organizations").doc(auth.orgId).update({ stripeCustomerId: customerId });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: parsed.data.priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?checkout=success`,
      cancel_url: `${appUrl}/billing?checkout=canceled`,
      client_reference_id: auth.orgId,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("checkout session creation failed", err);
    return NextResponse.json({ error: "Failed to start checkout." }, { status: 500 });
  }
}
