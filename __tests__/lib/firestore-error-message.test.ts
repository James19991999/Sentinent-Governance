import { firestoreErrorMessage } from "@/lib/firestore/errorMessage";

describe("firestoreErrorMessage", () => {
  it("gives an index-specific message for failed-precondition", () => {
    expect(firestoreErrorMessage({ code: "failed-precondition" })).toMatch(/index/i);
  });

  it("gives a rules-specific message for permission-denied", () => {
    expect(firestoreErrorMessage({ code: "permission-denied" })).toMatch(/security rules/i);
  });

  it("includes the error code for unrecognized codes", () => {
    expect(firestoreErrorMessage({ code: "unavailable" })).toContain("unavailable");
  });

  it("still returns a usable message with no code at all", () => {
    expect(firestoreErrorMessage({})).toBeTruthy();
  });
});
