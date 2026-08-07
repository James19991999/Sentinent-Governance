/**
 * @jest-environment node
 */
// AUDIT TEST — not part of the original delivery. Simulates a user who is
// a legitimate member of org-A attempting to access org-B's data purely by
// changing the client-supplied X-Org-Id header, without any membership
// record in org-B.
const membershipStore: Record<string, { userId: string; role: string } | null> = {
  "org-A:user-1": { userId: "user-1", role: "member" },
  "org-B:user-1": null, // user-1 has NO membership in org-B
};

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: () => ({
    verifyIdToken: jest.fn(async (token: string) => {
      if (token !== "valid-token") throw new Error("invalid token");
      return { uid: "user-1", email: "attacker@example.com" };
    }),
  }),
  adminDb: () => ({
    collection: (name: string) => {
      if (name === "organizations") {
        return {
          doc: (orgId: string) => ({
            collection: (sub: string) => ({
              doc: (uid: string) => ({
                get: async () => {
                  const key = `${orgId}:${uid}`;
                  const record = membershipStore[key];
                  return { exists: !!record, data: () => record };
                },
              }),
            }),
          }),
        };
      }
      if (name === "fairnessReports") {
        return {
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                get: async () => ({
                  // Simulates a data store that (correctly) has org-B's
                  // secret report — the question is whether our auth layer
                  // ever lets user-1 reach this query with orgId=org-B.
                  docs: [{ data: () => ({ id: "secret-report", orgId: "org-B", modelName: "Org B Secret Model" }) }],
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  }),
}));

import { GET } from "@/app/api/bias-audit/route";
import { NextRequest } from "next/server";

function makeGetRequest(orgId: string) {
  const headers = new Headers();
  headers.set("authorization", "Bearer valid-token");
  headers.set("x-org-id", orgId);
  return new NextRequest("http://localhost/api/bias-audit", { method: "GET", headers });
}

describe("ADVERSARIAL: cross-tenant access via forged X-Org-Id header", () => {
  it("BLOCKS user-1 from reading org-B's fairness reports despite a well-formed request", async () => {
    const res = await GET(makeGetRequest("org-B"));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(JSON.stringify(body)).not.toContain("Org B Secret Model");
  });

  it("ALLOWS user-1 to read their own org-A's reports (control case — proves the block above isn't a blanket failure)", async () => {
    // org-A has no reports collection stubbed with data in this mock beyond
    // the membership check succeeding; we only assert it does NOT 403.
    const res = await GET(makeGetRequest("org-A"));
    expect(res.status).not.toBe(403);
  });
});
