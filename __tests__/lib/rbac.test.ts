jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: () => ({ verifyIdToken: jest.fn() }),
  adminDb: () => ({}),
}));

import { hasRole } from "@/lib/rbac";

describe("hasRole", () => {
  it("allows a role equal to the minimum", () => {
    expect(hasRole("admin", "admin")).toBe(true);
  });
  it("allows a role above the minimum", () => {
    expect(hasRole("owner", "member")).toBe(true);
    expect(hasRole("owner", "admin")).toBe(true);
  });
  it("denies a role below the minimum", () => {
    expect(hasRole("member", "admin")).toBe(false);
    expect(hasRole("admin", "owner")).toBe(false);
    expect(hasRole("member", "owner")).toBe(false);
  });
});
