import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { ComplianceReportSnapshot, FairnessReport, Workflow, ComplianceItem } from "@/lib/types";

/**
 * Scheduled job (see vercel.json "crons") that generates a compliance
 * report snapshot for every org whose OWNER has enabled "Automated
 * Compliance Reporting" in Settings.
 *
 * Design note on scope: `autoReporting` is stored per-member (see
 * lib/auth/AuthProvider.tsx preferences), because that's how the original
 * Stitch export presented it — a personal Settings toggle. For a
 * *scheduled org-wide report*, the meaningful decision-maker is the org
 * owner, so this job checks the owner's preference as the org-level
 * signal, rather than restructuring the data model. Worth revisiting if
 * you want this to be an explicit org-level setting instead.
 *
 * What it does NOT do yet: actually email/export the report anywhere.
 * That requires picking an email provider (Resend, SendGrid, etc.) — a
 * business decision, not something to guess at. What it DOES do for real:
 * compute and persist a genuine snapshot from live data (fairness reports,
 * workflow certification stats, compliance checklist completion), so the
 * "export" step has real data to send once you wire a provider — see
 * README "Automated compliance reporting" section for the exact next step.
 *
 * Auth: protected by CRON_SECRET, the standard Vercel Cron pattern
 * (Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` for
 * scheduled invocations). Also safe to call manually with the same header
 * for testing.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured on the server." }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = adminDb();

  // Find every org whose owner has autoReporting enabled. There's no
  // Firestore query for "collectionGroup members where role == owner AND
  // preferences.autoReporting == true" combined with a join back to the
  // org cheaply, so this walks orgs and checks their owner's membership
  // doc directly — fine at the scale a cron job runs at (not a hot path).
  const orgsSnap = await db.collection("organizations").get();
  const results: { orgId: string; generated: boolean; reason?: string }[] = [];

  for (const orgDoc of orgsSnap.docs) {
    const org = orgDoc.data();
    const ownerId: string | undefined = org.ownerId;
    if (!ownerId) {
      results.push({ orgId: orgDoc.id, generated: false, reason: "no ownerId on org" });
      continue;
    }

    const ownerMemberSnap = await db.collection("organizations").doc(orgDoc.id).collection("members").doc(ownerId).get();
    const autoReportingEnabled = ownerMemberSnap.exists && ownerMemberSnap.data()?.preferences?.autoReporting === true;
    if (!autoReportingEnabled) {
      results.push({ orgId: orgDoc.id, generated: false, reason: "autoReporting disabled" });
      continue;
    }

    const snapshot = await generateSnapshotForOrg(orgDoc.id);
    results.push({ orgId: orgDoc.id, generated: true });
    void snapshot; // written inside generateSnapshotForOrg
  }

  return NextResponse.json({
    processedOrgs: orgsSnap.size,
    generatedReports: results.filter((r) => r.generated).length,
    results,
  });
}

async function generateSnapshotForOrg(orgId: string): Promise<ComplianceReportSnapshot> {
  const db = adminDb();

  const [fairnessSnap, workflowsSnap, complianceSnap] = await Promise.all([
    db.collection("fairnessReports").where("orgId", "==", orgId).get(),
    db.collection("workflows").where("orgId", "==", orgId).get(),
    db.collection("complianceItems").where("orgId", "==", orgId).get(),
  ]);

  const fairnessReports = fairnessSnap.docs.map((d) => d.data() as FairnessReport);
  const workflows = workflowsSnap.docs.map((d) => d.data() as Workflow);
  const complianceItems = complianceSnap.docs.map((d) => d.data() as ComplianceItem);

  const averageFairnessIndex =
    fairnessReports.length > 0
      ? Math.round(fairnessReports.reduce((sum, r) => sum + r.fairnessIndex, 0) / fairnessReports.length)
      : null;
  const highRiskModelCount = fairnessReports.filter((r) => r.complianceRisk === "High").length;
  const certifiedWorkflowCount = workflows.filter((w) => w.ethicsStatus === "certified").length;
  const compliancePercent =
    complianceItems.length > 0
      ? Math.round((complianceItems.filter((i) => i.completed).length / complianceItems.length) * 100)
      : 0;

  const docRef = db.collection("organizations").doc(orgId).collection("complianceReportSnapshots").doc();
  const snapshot: ComplianceReportSnapshot = {
    id: docRef.id,
    orgId,
    generatedAt: new Date().toISOString(),
    compliancePercent,
    auditedModelCount: fairnessReports.length,
    averageFairnessIndex,
    highRiskModelCount,
    certifiedWorkflowCount,
    totalWorkflowCount: workflows.length,
  };
  await docRef.set(snapshot);

  await db.collection("organizations").doc(orgId).collection("auditLog").add({
    orgId,
    actorId: "system:cron",
    action: "compliance_report.generated",
    targetType: "complianceReportSnapshot",
    targetId: docRef.id,
    createdAt: new Date().toISOString(),
    metadata: { compliancePercent, auditedModelCount: fairnessReports.length },
  });

  return snapshot;
}
