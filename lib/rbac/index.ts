import type { Role } from "@/lib/types";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export interface AuthContext {
  userId: string;
  email: string | undefined;
  orgId: string;
  role: Role;
}

const ROLE_RANK: Record<Role, number> = { member: 0, admin: 1, owner: 2 };

export function hasRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/**
 * Verifies the Firebase ID token on the request, resolves the caller's
 * membership for the org they're acting as, and enforces a minimum role.
 * Throws AuthError (never silently downgrades) on any failure. This is the
 * single server-side authorization choke point every tenant-scoped API
 * route must call — hiding a button client-side is never a substitute.
 */
export async function requireAuth(req: NextRequest, opts?: { minimumRole?: Role }): Promise<AuthContext> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!token) throw new AuthError("Missing bearer token.", 401);

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new AuthError("Invalid or expired token.", 401);
  }

  const orgId = req.headers.get("x-org-id");
  if (!orgId) throw new AuthError("Missing X-Org-Id header.", 400);

  // Membership is the true boundary — re-verified server-side on every
  // request, never trusted from a client-supplied claim alone.
  const membershipSnap = await adminDb()
    .collection("organizations")
    .doc(orgId)
    .collection("members")
    .doc(decoded.uid)
    .get();

  if (!membershipSnap.exists) {
    throw new AuthError("You are not a member of this organization.", 403);
  }

  const role = membershipSnap.data()?.role as Role | undefined;
  if (!role) throw new AuthError("Membership record is missing a role.", 403);

  if (opts?.minimumRole && !hasRole(role, opts.minimumRole)) {
    throw new AuthError(`Requires ${opts.minimumRole} role or higher.`, 403);
  }

  return { userId: decoded.uid, email: decoded.email, orgId, role };
}
