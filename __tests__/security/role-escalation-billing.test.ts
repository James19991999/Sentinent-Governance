/**
 * @jest-environment node
 */
// AUDIT TEST — checks whether a low-privilege 'member' user can bypass the
// client-side billing UI gate (BillingPage hides the button for non-admins)
// by calling the API route directly.

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: () => ({
    verifyIdToken: jest.fn(async (token: string) => {
      if (token !== "member-token") throw new Error("invalid");
      return { uid: "member-user", email: "member@example.com" };
    }),
  }),
  adminDb: () => ({
    collection: (name: string) => {
      if (name === "organizations") {
        return {
          doc: () => ({
            collection: () => ({
              doc: () => ({ get: async () => ({ exists: true, data: () => ({ role: "member" }) }) }),
            }),
            get: async () => ({ exists: true, data: () => ({ stripeCustomerId: undefined }) }),
          }),
        };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  }),
}));

jest.mock("@/lib/stripe/client", () => ({
  stripe: () => ({ customers: { create: jest.fn() }, checkout: { sessions: { create: jest.fn() } } }),
}));

import { POST } from "@/app/api/billing/checkout/route";
import { NextRequest } from "next/server";

function makeRequest() {
  const headers = new Headers();
  headers.set("authorization", "Bearer member-token");
  headers.set("x-org-id", "org-1");
  headers.set("Content-Type", "application/json");
  return new NextRequest("http://localhost/api/billing/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify({ priceId: "price_fake" }),
  });
}

describe("ADVERSARIAL: role escalation on admin-gated billing route", () => {
  it("BLOCKS a 'member'-role user from starting checkout even though they hold a valid token", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
  });
});
