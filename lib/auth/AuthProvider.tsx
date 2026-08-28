"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collectionGroup, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { setAuthCookie } from "@/lib/auth/authCookie";
import type { GovernancePreferences, Organization, Role, UserProfile } from "@/lib/types";

const DEFAULT_PREFERENCES: GovernancePreferences = {
  biasMonitoring: true,
  ethicsAlerts: true,
  autoReporting: false,
  smartNotifications: true,
};

interface AuthState {
  loading: boolean;
  firebaseUser: User | null;
  profile: UserProfile | null;
  orgs: Organization[];
  activeOrgId: string | null;
  activeRole: Role | null;
  activePreferences: GovernancePreferences;
  emailVerified: boolean;
  membershipError: string | null;
  refreshEmailVerification: () => Promise<boolean>;
  setActiveOrgId: (orgId: string) => void;
  updatePreferences: (patch: Partial<GovernancePreferences>) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<Record<string, { role: Role; preferences?: GovernancePreferences }>>(
    {}
  );
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      setEmailVerified(u?.emailVerified ?? false);
      // Lightweight, non-sensitive presence cookie for middleware.ts to do a
      // real server-side redirect instead of always serving the app shell to
      // anonymous requests. This is a UX/defense-in-depth improvement only —
      // it grants no access; the actual boundary is requireAuth() on API
      // routes and firestore.rules on direct client reads/writes.
      // Belt-and-braces: the sign-in/sign-up functions in lib/auth/session.ts
      // already set this cookie synchronously before router.push runs (see
      // that file's comments for why relying on this listener ALONE created
      // a deadlock). This call keeps the cookie in sync for cases those
      // functions don't cover directly — session restore on page load,
      // sign-out from any tab, token expiry, etc.
      setAuthCookie(Boolean(u));
      if (!u) {
        setProfile(null);
        setOrgs([]);
        setActiveOrgIdState(null);
        setLoading(false);
        return;
      }
      const profileSnap = await getDoc(doc(db, "users", u.uid));
      setProfile(profileSnap.exists() ? (profileSnap.data() as UserProfile) : null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    // Every org this user belongs to, resolved via a collectionGroup query
    // over organizations/{orgId}/members — never trusted from a client claim.
    const membershipsQuery = query(
      collectionGroup(db, "members"),
      where("userId", "==", firebaseUser.uid)
    );
    const unsub = onSnapshot(
      membershipsQuery,
      async (snap) => {
        const byOrg: Record<string, { role: Role; preferences?: GovernancePreferences }> = {};
        const orgIds: string[] = [];
        snap.forEach((d) => {
          const orgId = d.ref.parent.parent?.id;
          if (!orgId) return;
          orgIds.push(orgId);
          const data = d.data();
          byOrg[orgId] = { role: data.role as Role, preferences: data.preferences as GovernancePreferences | undefined };
        });
        setMemberships(byOrg);

        const orgDocs = await Promise.all(orgIds.map((id) => getDoc(doc(db, "organizations", id))));
        const resolvedOrgs = orgDocs
          .filter((d) => d.exists())
          .map((d) => ({ id: d.id, ...d.data() }) as Organization);
        setOrgs(resolvedOrgs);
        setActiveOrgIdState((prev) => prev ?? resolvedOrgs[0]?.id ?? null);
        setMembershipError(null);
        setLoading(false);
      },
      (err) => {
        // Without this, a failed query (missing composite index, rules not
        // yet deployed, offline, etc.) would leave `loading` true forever —
        // the app would sit on a blank/skeleton screen with no visible error
        // and no way out. This turns that into a real, actionable message.
        console.error("Membership query failed", err);
        setMembershipError(
          err.code === "failed-precondition"
            ? "This Firestore query needs an index that hasn't been created yet. Deploy indexes with `firebase deploy --only firestore:indexes`, then wait a few minutes for it to finish building."
            : err.code === "permission-denied"
              ? "Firestore denied this request. If you just deployed, security rules can take a moment to propagate — try refreshing. Otherwise, run `firebase deploy --only firestore:rules`."
              : `Couldn't load your account data (${err.code}). Check your connection and try refreshing.`
        );
        setLoading(false);
      }
    );
    return unsub;
  }, [firebaseUser]);

  const setActiveOrgId = useCallback((orgId: string) => {
    setActiveOrgIdState(orgId);
    if (typeof window !== "undefined") window.localStorage.setItem("activeOrgId", orgId);
  }, []);

  const updatePreferences = useCallback(
    async (patch: Partial<GovernancePreferences>) => {
      if (!firebaseUser || !activeOrgId) return;
      const current = memberships[activeOrgId]?.preferences ?? DEFAULT_PREFERENCES;
      const next = { ...current, ...patch };
      // Rules restrict this write to exactly the `preferences` field on the
      // caller's own membership doc — see firestore.rules self-service rule.
      await updateDoc(doc(db, "organizations", activeOrgId, "members", firebaseUser.uid), {
        preferences: next,
      });
    },
    [firebaseUser, activeOrgId, memberships]
  );

  const refreshEmailVerification = useCallback(async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    return verified;
  }, []);

  const value: AuthState = {
    loading,
    firebaseUser,
    profile,
    orgs,
    activeOrgId,
    activeRole: activeOrgId ? memberships[activeOrgId]?.role ?? null : null,
    activePreferences: (activeOrgId ? memberships[activeOrgId]?.preferences : undefined) ?? DEFAULT_PREFERENCES,
    emailVerified,
    membershipError,
    refreshEmailVerification,
    setActiveOrgId,
    updatePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

