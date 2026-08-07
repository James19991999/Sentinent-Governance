/**
 * @jest-environment node
 */
const orgsData = [
  { id: "org-reporting-on", ownerId: "owner-1" },
  { id: "org-reporting-off", ownerId: "owner-2" },
];

const membershipData: Record<string, Record<string, unknown>> = {
  "org-reporting-on:owner-1": { preferences: { autoReporting: true } },
  "org-reporting-off:owner-2": { preferences: { autoReporting: false } },
};

const fairnessReportsData = [
  { orgId: "org-reporting-on", fairnessIndex: 90, complianceRisk: "Low" },
  { orgId: "org-reporting-on", fairnessIndex: 60, complianceRisk: "High" },
];
const workflowsData = [
  { orgId: "org-reporting-on", ethicsStatus: "certified" },
  { orgId: "org-reporting-on", ethicsStatus: "reviewing" },
];
const complianceItemsData = [
  { orgId: "org-reporting-on", completed: true },
  { orgId: "org-reporting-on", completed: true },
  { orgId: "org-reporting-on", completed: false },
  { orgId: "org-reporting-on", completed: false },
];

const snapshotSetMock = jest.fn().mockResolvedValue(undefined);
const auditLogAddMock = jest.fn().mockResolvedValue(undefined);

function makeQuerySnap(rows: Record<string, unknown>[]) {
  return { size: rows.length, docs: rows.map((r) => ({ data: () => r, id: (r.id as string) ?? "doc-id" })) };
}

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: () => ({
    collection: (name: string) => {
      if (name === "organizations") {
        return {
          get: async () => makeQuerySnap(orgsData),
          doc: (orgId: string) => ({
            collection: (sub: string) => {
              if (sub === "members") {
                return {
                  doc: (uid: string) => ({
                    get: async () => {
                      const key = `${orgId}:${uid}`;
                      const data = membershipData[key];
                      return { exists: !!data, data: () => data };
                    },
                  }),
                };
              }
              if (sub === "complianceReportSnapshots") {
                return { doc: () => ({ id: "snap-1", set: snapshotSetMock }) };
              }
              if (sub === "auditLog") {
                return { add: auditLogAddMock };
              }
              throw new Error(`unexpected subcollection ${sub}`);
            },
          }),
        };
      }
      if (name === "fairnessReports") {
        return { where: () => ({ get: async () => makeQuerySnap(fairnessReportsData.filter((r) => true)) }) };
      }
      if (name === "workflows") {
        return { where: () => ({ get: async () => makeQuerySnap(workflowsData) }) };
      }
      if (name === "complianceItems") {
        return { where: () => ({ get: async () => makeQuerySnap(complianceItemsData) }) };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  }),
}));

import { GET } from "@/app/api/cron/compliance-reports/route";
import { NextRequest } from "next/server";

function makeRequest(secret?: string) {
  const headers = new Headers();
  if (secret) headers.set("authorization", `Bearer ${secret}`);
  return new NextRequest("http://localhost/api/cron/compliance-reports", { headers });
}

describe("GET /api/cron/compliance-reports", () => {
  const originalSecret = process.env.CRON_SECRET;
  beforeAll(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });
  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
  });
  beforeEach(() => {
    snapshotSetMock.mockClear();
    auditLogAddMock.mockClear();
  });

  it("rejects requests with no auth header", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("rejects requests with the wrong secret", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("processes only the org with autoReporting enabled, and computes real aggregates", async () => {
    const res = await GET(makeRequest("test-cron-secret"));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.processedOrgs).toBe(2);
    expect(json.generatedReports).toBe(1);
    expect(json.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: "org-reporting-on", generated: true }),
        expect.objectContaining({ orgId: "org-reporting-off", generated: false, reason: "autoReporting disabled" }),
      ])
    );

    // Real computed snapshot, not fabricated numbers:
    // averageFairnessIndex = (90+60)/2 = 75, highRiskModelCount = 1 (the 60 one),
    // certifiedWorkflowCount = 1 of 2, compliancePercent = 2 of 4 completed = 50%
    expect(snapshotSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-reporting-on",
        averageFairnessIndex: 75,
        highRiskModelCount: 1,
        certifiedWorkflowCount: 1,
        totalWorkflowCount: 2,
        compliancePercent: 50,
        auditedModelCount: 2,
      })
    );
    expect(auditLogAddMock).toHaveBeenCalledTimes(1);
  });
});
