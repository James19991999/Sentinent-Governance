import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, AuthError } from "@/lib/rbac";
import { adminDb } from "@/lib/firebase/admin";
import { computeFairnessReport, parsePredictionsCsv, InsufficientDataError } from "@/lib/fairness/engine";
import { checkRateLimit, identifierFromRequest } from "@/lib/rate-limit";

const bodySchema = z.object({
  modelName: z.string().min(1).max(200),
  csv: z.string().min(1).max(2_000_000), // ~2MB of CSV text
  referenceGroup: z.string().max(200).optional(),
});

function rateLimited(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(req: NextRequest) {
  // Compute+write route: stricter limit. Keyed by IP pre-auth, since an
  // unauthenticated/invalid-token flood shouldn't even reach requireAuth.
  const limit = await checkRateLimit(`bias-audit:post:${identifierFromRequest(req, "unknown")}`, 10, 60_000);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  try {
    const auth = await requireAuth(req, { minimumRole: "member" });

    // Mass-assignment guard: parse with zod, then below we build the
    // Firestore doc from named fields only — never a raw spread of body.
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body.", details: parsed.error.flatten() }, { status: 400 });
    }
    const { modelName, csv, referenceGroup } = parsed.data;

    const rows = parsePredictionsCsv(csv);
    const computed = computeFairnessReport({
      orgId: auth.orgId,
      modelName,
      createdBy: auth.userId,
      rows,
      referenceGroup,
    });

    const docRef = adminDb().collection("fairnessReports").doc();
    const report = { id: docRef.id, createdAt: new Date().toISOString(), ...computed };
    await docRef.set(report);

    await adminDb().collection("organizations").doc(auth.orgId).collection("auditLog").add({
      orgId: auth.orgId,
      actorId: auth.userId,
      action: "fairness_report.created",
      targetType: "fairnessReport",
      targetId: docRef.id,
      createdAt: new Date().toISOString(),
      metadata: { modelName, fairnessIndex: computed.fairnessIndex, complianceRisk: computed.complianceRisk },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof InsufficientDataError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("bias-audit POST failed", err);
    return NextResponse.json({ error: "Failed to compute fairness report." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const limit = await checkRateLimit(`bias-audit:get:${identifierFromRequest(req, "unknown")}`, 60, 60_000);
  if (!limit.allowed) return rateLimited(limit.retryAfterSeconds);

  try {
    const auth = await requireAuth(req, { minimumRole: "member" });
    // GET responses are filtered per-role at the query level: every report
    // fetched is scoped to the caller's own org, never a broader collection scan.
    const snap = await adminDb()
      .collection("fairnessReports")
      .where("orgId", "==", auth.orgId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const reports = snap.docs.map((d) => d.data());
    return NextResponse.json({ reports });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("bias-audit GET failed", err);
    return NextResponse.json({ error: "Failed to load fairness reports." }, { status: 500 });
  }
}
