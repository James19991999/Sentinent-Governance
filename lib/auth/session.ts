"use client";

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/auth/authCookie";

export async function signUp(email: string, password: string, displayName: string) {
  const { sendEmailVerification } = await import("firebase/auth");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    id: cred.user.uid,
    email,
    displayName,
    createdAt: new Date().toISOString(),
  });
  setAuthCookie(true);
  // Best-effort: a slow/failed verification email shouldn't block account
  // creation — the banner in the app shell offers a resend anyway.
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.error("Failed to send verification email on sign-up", err);
  }
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  setAuthCookie(true);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
  setAuthCookie(false);
}

export async function requestPasswordReset(email: string) {
  const { sendPasswordResetEmail } = await import("firebase/auth");
  await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle() {
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureUserProfile(cred.user, doc, getDoc, setDoc);
  setAuthCookie(true);
  return cred.user;
}

export async function signInWithMicrosoft() {
  const { OAuthProvider, signInWithPopup } = await import("firebase/auth");
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const provider = new OAuthProvider("microsoft.com");
  const cred = await signInWithPopup(auth, provider);
  await ensureUserProfile(cred.user, doc, getDoc, setDoc);
  setAuthCookie(true);
  return cred.user;
}

// OAuth sign-in can be a brand-new user or a returning one — unlike email/
// password sign-up, there's no separate "create account" step, so we create
// the users/{uid} profile doc here on first sign-in if it doesn't exist yet.
async function ensureUserProfile(
  user: import("firebase/auth").User,
  doc: typeof import("firebase/firestore").doc,
  getDoc: typeof import("firebase/firestore").getDoc,
  setDoc: typeof import("firebase/firestore").setDoc
) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      id: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "User",
      createdAt: new Date().toISOString(),
    });
  }
}

export async function resendVerificationEmail() {
  const { sendEmailVerification } = await import("firebase/auth");
  if (!auth.currentUser) throw new Error("Not signed in.");
  await sendEmailVerification(auth.currentUser);
}
