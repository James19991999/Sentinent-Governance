/**
 * @jest-environment jsdom
 */
const mockUser = { uid: "user-1", email: "a@b.com", displayName: "A B" };

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(async () => ({ user: mockUser })),
  signInWithEmailAndPassword: jest.fn(async () => ({ user: mockUser })),
  signOut: jest.fn(async () => undefined),
  sendEmailVerification: jest.fn(async () => undefined),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(async () => undefined),
}));

jest.mock("@/lib/firebase/client", () => ({ auth: {}, db: {} }));
jest.mock("@/lib/auth/authCookie", () => ({ setAuthCookie: jest.fn() }));

import { signIn, signUp, signOut } from "@/lib/auth/session";
import { setAuthCookie } from "@/lib/auth/authCookie";

const mockSetAuthCookie = setAuthCookie as jest.Mock;

describe("REGRESSION: every sign-in/sign-up/sign-out path calls setAuthCookie", () => {
  beforeEach(() => mockSetAuthCookie.mockClear());

  it("signIn sets the cookie to true, synchronously as part of the success path", async () => {
    await signIn("a@b.com", "password123");
    expect(mockSetAuthCookie).toHaveBeenCalledWith(true);
  });

  it("signUp sets the cookie to true", async () => {
    await signUp("a@b.com", "password123", "A B");
    expect(mockSetAuthCookie).toHaveBeenCalledWith(true);
  });

  it("signOut clears the cookie", async () => {
    await signOut();
    expect(mockSetAuthCookie).toHaveBeenCalledWith(false);
  });
});
