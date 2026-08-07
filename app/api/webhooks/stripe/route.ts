import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    // Idempotency: record every processed event ID and skip if already seen.
    // Stripe retries webhooks on timeout/5xx, so handlers must be safe to
    // re-run with the same event. This read now lives inside the same
    // try/catch as the rest of the handler — previously it sat outside,
    // so a transient failure here bypassed the structured error logging
    // and the intentional "return 500 so Stripe retries" contract below.
    const eventRef = adminDb().collection("stripeWebhookEvents").doc(event.id);
    const alreadyProcessed = await eventRef.get();
    if (alreadyProcessed.exists) {
      return NextResponse.json({ received: true, deduped: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        if (orgId && session.subscription) {
          await adminDb()
            .collection("organizations")
            .doc(orgId)
            .update({
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: "active",
              plan: "enterprise",
            });
          await logAudit(orgId, "system", "subscription.checkout_completed", session.id);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const orgQuery = await adminDb()
          .collection("organizations")
          .where("stripeSubscriptionId", "==", subscription.id)
          .limit(1)
          .get();
        if (!orgQuery.empty) {
          const orgDoc = orgQuery.docs[0];
          await orgDoc.ref.update({
            subscriptionStatus: subscription.status,
            plan: subscription.status === "canceled" ? "trial" : "enterprise",
          });
          await logAudit(orgDoc.id, "system", `subscription.${event.type.split(".").pop()}`, subscription.id);
        }
        break;
      }
      default:
        break; // Other event types are intentionally ignored.
    }

    await eventRef.set({ processedAt: new Date().toISOString(), type: event.type });
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook handler failed", err);
    // Return 500 so Stripe retries — do NOT mark the event as processed above.
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}

async function logAudit(orgId: string, actorId: string, action: string, targetId: string) {
  await adminDb().collection("organizations").doc(orgId).collection("auditLog").add({
    orgId,
    actorId,
    action,
    targetType: "subscription",
    targetId,
    createdAt: new Date().toISOString(),
  });
}
