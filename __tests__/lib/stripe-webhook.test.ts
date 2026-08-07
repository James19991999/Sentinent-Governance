/**
 * @jest-environment node
 */
const constructEventMock = jest.fn();
const orgUpdateMock = jest.fn().mockResolvedValue(undefined);
const eventDocSetMock = jest.fn().mockResolvedValue(undefined);
let eventExists = false;

jest.mock("@/lib/stripe/client", () => ({
  stripe: () => ({ webhooks: { constructEvent: constructEventMock } }),
}));

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: () => ({
    collection: (name: string) => {
      if (name === "stripeWebhookEvents") {
        return {
          doc: () => ({
            get: async () => ({ exists: eventExists }),
            set: eventDocSetMock,
          }),
        };
      }
      if (name === "organizations") {
        return {
          doc: () => ({
            update: orgUpdateMock,
            collection: () => ({ add: jest.fn().mockResolvedValue(undefined) }),
          }),
          where: () => ({ limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) }),
        };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  }),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { NextRequest } from "next/server";

function makeRequest(hasSignature = true) {
  const headers = new Headers();
  if (hasSignature) headers.set("stripe-signature", "sig_test");
  return new NextRequest("http://localhost/api/webhooks/stripe", { method: "POST", headers, body: "{}" });
}

describe("POST /api/webhooks/stripe", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });
  afterAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });
  beforeEach(() => {
    eventExists = false;
    constructEventMock.mockReset();
    orgUpdateMock.mockClear();
    eventDocSetMock.mockClear();
  });

  it("rejects requests with no signature header", async () => {
    const res = await POST(makeRequest(false));
    expect(res.status).toBe(400);
  });

  it("rejects requests whose signature fails verification", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it("processes a checkout.session.completed event and records it as processed", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "org-1", subscription: "sub_1", id: "cs_1" } },
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(orgUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ stripeSubscriptionId: "sub_1", subscriptionStatus: "active" })
    );
    expect(eventDocSetMock).toHaveBeenCalledTimes(1);
  });

  it("is idempotent — does not reprocess an already-seen event", async () => {
    eventExists = true;
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: "org-1", subscription: "sub_1", id: "cs_1" } },
    });
    const res = await POST(makeRequest());
    const json = await res.json();
    expect(json.deduped).toBe(true);
    expect(orgUpdateMock).not.toHaveBeenCalled();
  });
});
