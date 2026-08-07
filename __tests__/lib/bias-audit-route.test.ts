/**
 * @jest-environment node
 */
jest.mock("@/lib/firebase/admin", () => {
  const membershipDoc = { exists: true, data: () => ({ role: "member" }) };
  const setMock = jest.fn().mockResolvedValue(undefined);
  const addMock = jest.fn().mockResolvedValue(undefined);
  const docRef = { id: "report-123", set: setMock };

  return {
    adminAuth: () => ({
      verifyIdToken: jest.fn(async (token: string) => {
        if (token !== "valid-token") throw new Error("invalid token");
        return { uid: "user-1", email: "user@example.com" };
      }),
    }),
    adminDb: () => ({
      collection: (name: string) => {
        if (name === "organizations") {
          return {
            doc: () => ({
              collection: () => ({
                doc: () => ({ get: async () => membershipDoc }),
                add: addMock,
              }),
            }),
          };
        }
        if (name === "fairnessReports") {
          return {
            doc: () => docRef,
            where: () => ({
              orderBy: () => ({
                limit: () => ({ get: async () => ({ docs: [] }) }),
              }),
            }),
          };
        }
        throw new Error(`unexpected collection ${name}`);
      },
    }),
    __mocks: { setMock, addMock },
  };
});

import { POST } from "@/app/api/bias-audit/route";
import { NextRequest } from "next/server";

function makeRequest(body: unknown, opts?: { token?: string; orgId?: string }) {
  const headers = new Headers();
  if (opts?.token !== null) headers.set("authorization", `Bearer ${opts?.token ?? "valid-token"}`);
  if (opts?.orgId !== null) headers.set("x-org-id", opts?.orgId ?? "org-1");
  return new NextRequest("http://localhost/api/bias-audit", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validCsv = [
  "predicted,group",
  ...Array.from({ length: 8 }, () => "1,A"),
  ...Array.from({ length: 2 }, () => "0,A"),
  ...Array.from({ length: 4 }, () => "1,B"),
  ...Array.from({ length: 6 }, () => "0,B"),
].join("\n");

describe("POST /api/bias-audit", () => {
  it("rejects requests with no bearer token", async () => {
    const res = await POST(makeRequest({ modelName: "m", csv: validCsv }, { token: null as unknown as string }));
    expect(res.status).toBe(401);
  });

  it("rejects requests with an invalid token", async () => {
    const res = await POST(makeRequest({ modelName: "m", csv: validCsv }, { token: "bad-token" }));
    expect(res.status).toBe(401);
  });

  it("rejects requests missing the org header", async () => {
    const res = await POST(makeRequest({ modelName: "m", csv: validCsv }, { orgId: null as unknown as string }));
    expect(res.status).toBe(400);
  });

  it("rejects malformed request bodies (mass-assignment / schema guard)", async () => {
    const res = await POST(makeRequest({ csv: validCsv })); // missing modelName
    expect(res.status).toBe(400);
  });

  it("rejects CSV with insufficient rows", async () => {
    const res = await POST(makeRequest({ modelName: "m", csv: "predicted,group\n1,A\n" }));
    expect(res.status).toBe(422);
  });

  it("computes and persists a report for a valid authenticated request", async () => {
    const res = await POST(makeRequest({ modelName: "Resume Screener v2", csv: validCsv }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.report.orgId).toBe("org-1");
    expect(json.report.modelName).toBe("Resume Screener v2");
    expect(json.report.fourFifthsViolations).toContain("B");
  });
});
