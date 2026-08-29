/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

type SnapshotErrorHandler = (err: { code: string; message: string }) => void;
const errorHandlers: SnapshotErrorHandler[] = [];

jest.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({ activeOrgId: "org-1" }),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: (
    _query: unknown,
    _onNext: (snap: unknown) => void,
    onError?: SnapshotErrorHandler
  ) => {
    if (onError) errorHandlers.push(onError);
    return () => {};
  },
}));

jest.mock("@/lib/firebase/client", () => ({ db: {} }));

import DashboardPage from "@/app/(app)/dashboard/page";

describe("REGRESSION: dashboard no longer hangs forever on a Firestore query failure", () => {
  beforeEach(() => {
    errorHandlers.length = 0;
  });

  it("registers an error handler on all three listeners (previously: none)", async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(errorHandlers.length).toBe(3));
  });

  it("shows a real error message (not an infinite skeleton) when a listener fails", async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(errorHandlers.length).toBe(3));

    act(() => errorHandlers[0]({ code: "failed-precondition", message: "index required" }));

    await waitFor(() => expect(screen.getByText(/index/i)).toBeInTheDocument());
    // The loading skeleton must be gone -- this is the exact bug: previously
    // `loading` stayed true forever because nothing ever set reports/
    // workflows/completions away from null on a query failure.
    expect(screen.queryByText(/Organizational Health/i)).not.toBeInTheDocument();
  });

  it("offers a retry action in the error state", async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(errorHandlers.length).toBe(3));
    act(() => errorHandlers[0]({ code: "permission-denied", message: "denied" }));
    await waitFor(() => expect(screen.getByText("Try again")).toBeInTheDocument());
  });
});
