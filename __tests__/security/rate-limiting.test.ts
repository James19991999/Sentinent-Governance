/**
 * @jest-environment node
 */
jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: () => ({ verifyIdToken: jest.fn(async () => ({ uid: "user-1", email: "u@example.com" })) }),
  adminDb: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({ role: "member" }) }) }) }),
      }),
    }),
  }),
}));

import { POST } from "@/app/api/bias-audit/route";
import { _resetRateLimitStateForTests } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

function makeRequest(ip: string) {
  const headers = new Headers();
  headers.set("authorization", "Bearer valid-token");
  headers.set("x-org-id", "org-1");
  headers.set("x-forwarded-for", ip);
  headers.set("Content-Type", "application/json");
  return new NextRequest("http://localhost/api/bias-audit", {
    method: "POST",
    headers,
    body: JSON.stringify({ modelName: "x", csv: "predicted,group\n1,A" }), // will fail validation, that's fine — rate limit fires first
  });
}

describe("Rate limiting on /api/bias-audit POST", () => {
  beforeEach(() => {
    _resetRateLimitStateForTests();
  });

  it("allows the first 10 requests from one IP within the window", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeRequest("9.9.9.9"));
      expect(res.status).not.toBe(429);
    }
  });

  it("returns 429 with a Retry-After header on the 11th request from the same IP", async () => {
    for (let i = 0; i < 10; i++) await POST(makeRequest("9.9.9.9"));
    const eleventh = await POST(makeRequest("9.9.9.9"));
    expect(eleventh.status).toBe(429);
    expect(eleventh.headers.get("Retry-After")).toBeTruthy();
  });

  it("does not rate-limit a different IP once the first is exhausted", async () => {
    for (let i = 0; i < 10; i++) await POST(makeRequest("9.9.9.9"));
    const otherIp = await POST(makeRequest("1.1.1.1"));
    expect(otherIp.status).not.toBe(429);
  });
});
