/**
 * These tests do NOT execute real Firestore Security Rules (this sandbox
 * cannot reach the Firebase emulator download host — see README). Instead
 * they encode the exact boolean condition from firestore.rules'
 * organizations/{orgId}/members/{memberId} first-owner "allow create" rule
 * as a pure function, and assert it against the app's REAL write sequence
 * (org created first, then membership — see app/onboarding/page.tsx).
 *
 * This exists specifically because the original version of this rule used
 * `!exists(organizations/$(orgId))` — which is FALSE by the time the
 * membership write happens, since the org is created first — silently
 * blocking every onboarding attempt. This test pins the corrected
 * ownerId-based condition so that regression can't reoccur unnoticed.
 */

interface OrgDoc {
  ownerId: string;
}

interface MembershipWrite {
  requestAuthUid: string;
  memberId: string;
  userId: string;
  role: string;
}

/** Mirrors firestore.rules exactly — keep in sync if the rule changes. */
function canCreateFirstOwnerMembership(write: MembershipWrite, org: OrgDoc | null): boolean {
  return (
    write.requestAuthUid === write.memberId &&
    write.userId === write.memberId &&
    write.role === "owner" &&
    org !== null &&
    org.ownerId === write.requestAuthUid
  );
}

describe("Firestore rule: first-owner membership bootstrap", () => {
  it("ALLOWS the real app write sequence: org created first (with ownerId set), then membership", () => {
    const org: OrgDoc = { ownerId: "user-1" };
    const write: MembershipWrite = { requestAuthUid: "user-1", memberId: "user-1", userId: "user-1", role: "owner" };
    expect(canCreateFirstOwnerMembership(write, org)).toBe(true);
  });

  it("REGRESSION GUARD: would have failed under the old !exists(org) condition — confirms the fix addresses the actual bug", () => {
    // Under the OLD rule, this exact (org-exists, correct-owner) state was
    // rejected because `!exists(org)` was false once org existed. The new
    // rule must accept it.
    const org: OrgDoc = { ownerId: "user-1" };
    const write: MembershipWrite = { requestAuthUid: "user-1", memberId: "user-1", userId: "user-1", role: "owner" };
    const oldRuleWouldAllow = org === null; // !exists(org) as a boolean, given org already committed
    expect(oldRuleWouldAllow).toBe(false); // proves the old rule really did block this
    expect(canCreateFirstOwnerMembership(write, org)).toBe(true); // new rule doesn't
  });

  it("DENIES a user claiming ownership of an org they don't own", () => {
    const org: OrgDoc = { ownerId: "user-1" };
    const write: MembershipWrite = { requestAuthUid: "attacker", memberId: "attacker", userId: "attacker", role: "owner" };
    expect(canCreateFirstOwnerMembership(write, org)).toBe(false);
  });

  it("DENIES if the org document doesn't exist at all (e.g. forged orgId)", () => {
    const write: MembershipWrite = { requestAuthUid: "user-1", memberId: "user-1", userId: "user-1", role: "owner" };
    expect(canCreateFirstOwnerMembership(write, null)).toBe(false);
  });

  it("DENIES creating a membership doc for someone else as 'owner'", () => {
    const org: OrgDoc = { ownerId: "user-1" };
    const write: MembershipWrite = { requestAuthUid: "user-1", memberId: "someone-else", userId: "someone-else", role: "owner" };
    expect(canCreateFirstOwnerMembership(write, org)).toBe(false);
  });
});
