/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

let membershipErrorCallback: ((err: { code: string; message: string }) => void) | null = null;

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (auth: unknown, cb: (u: unknown) => void) => {
    cb({ uid: "user-1", email: "a@b.com", emailVerified: true });
    return () => {};
  },
}));

jest.mock("firebase/firestore", () => ({
  collectionGroup: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(async () => ({ exists: () => false })),
  updateDoc: jest.fn(async () => undefined),
  onSnapshot: (
    _query: unknown,
    _onNext: (snap: unknown) => void,
    onError?: (err: { code: string; message: string }) => void
  ) => {
    // Only the membership listener in this codebase passes an onError —
    // capture it so the test can trigger the failure path directly.
    if (onError) membershipErrorCallback = onError;
    return () => {};
  },
}));

jest.mock("@/lib/firebase/client", () => ({ auth: {}, db: {} }));

import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";

function Consumer() {
  const { loading, membershipError } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{membershipError ?? "none"}</span>
    </div>
  );
}

describe("REGRESSION: membership query failure surfaces as an error instead of hanging loading forever", () => {
  beforeEach(() => {
    membershipErrorCallback = null;
  });

  it("resolves loading=false and sets a helpful message on failed-precondition (missing index)", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(membershipErrorCallback).not.toBeNull());
    act(() => membershipErrorCallback!({ code: "failed-precondition", message: "index required" }));

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("error").textContent).toMatch(/index/i);
  });

  it("gives a rules-specific message on permission-denied", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(membershipErrorCallback).not.toBeNull());
    act(() => membershipErrorCallback!({ code: "permission-denied", message: "denied" }));

    await waitFor(() => expect(screen.getByTestId("error").textContent).toMatch(/security rules/i));
  });
});
