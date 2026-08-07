"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FairnessReport, Workflow, CourseCompletion } from "@/lib/types";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { activeOrgId } = useAuth();
  const [reports, setReports] = useState<FairnessReport[] | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const [completions, setCompletions] = useState<CourseCompletion[] | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;
    const unsubReports = onSnapshot(
      query(collection(db, "fairnessReports"), where("orgId", "==", activeOrgId), orderBy("createdAt", "desc"), limit(10)),
      (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FairnessReport))
    );
    const unsubWorkflows = onSnapshot(
      query(collection(db, "workflows"), where("orgId", "==", activeOrgId)),
      (snap) => setWorkflows(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workflow))
    );
    const unsubCompletions = onSnapshot(
      query(collection(db, "courseCompletions"), where("orgId", "==", activeOrgId)),
      (snap) => setCompletions(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseCompletion))
    );
    return () => {
      unsubReports();
      unsubWorkflows();
      unsubCompletions();
    };
  }, [activeOrgId]);

  const loading = reports === null || workflows === null || completions === null;

  const avgFairnessIndex =
    reports && reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.fairnessIndex, 0) / reports.length) : null;

  const criticalAlerts = (reports ?? [])
    .filter((r) => r.fourFifthsViolations.length > 0)
    .slice(0, 3);

  const certifiedWorkflows = (workflows ?? []).filter((w) => w.ethicsStatus === "certified").length;
  const automationEfficiency =
    workflows && workflows.length > 0
      ? Math.round(workflows.reduce((s, w) => s + w.efficiencyGainPct, 0) / workflows.length)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md md:text-display-lg-mobile text-on-surface">Organizational Health</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Real-time oversight of AI deployment safety, bias mitigation, and workforce readiness.
        </p>
      </div>

      <Card title="Responsible AI Score">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : avgFairnessIndex === null ? (
          <EmptyState
            title="No fairness audits yet"
            description="Run your first bias audit to calculate your organization's Responsible AI Score."
            action={
              <Link href="/bias-audit" className="text-secondary font-medium inline-flex items-center gap-1">
                Run an audit <ArrowRight size={16} />
              </Link>
            }
          />
        ) : (
          <div className="flex items-center gap-8">
            <div className="text-display-lg text-on-surface" aria-label={`Responsible AI score: ${avgFairnessIndex} out of 100`}>
              {avgFairnessIndex}
            </div>
            <p className="text-body-md text-on-surface-variant">
              Calculated across {reports!.length} audited model{reports!.length === 1 ? "" : "s"}.
            </p>
          </div>
        )}
      </Card>

      <Card title="Critical Alerts" action={criticalAlerts.length > 0 && <Chip tone="error">{criticalAlerts.length} URGENT</Chip>}>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : criticalAlerts.length === 0 ? (
          <p className="text-body-md text-on-surface-variant flex items-center gap-2">
            <CheckCircle2 className="text-secondary" size={18} /> No open four-fifths-rule violations across audited models.
          </p>
        ) : (
          <ul className="space-y-3">
            {criticalAlerts.map((r) => (
              <li key={r.id} className="border-l-4 border-error pl-3 py-1 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-on-surface flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-error" /> Disparate impact detected: {r.modelName}
                  </p>
                  <p className="text-body-md text-on-surface-variant">
                    Groups below four-fifths threshold: {r.fourFifthsViolations.join(", ")}
                  </p>
                </div>
                <Link href="/bias-audit" className="text-secondary text-label-sm shrink-0">
                  ACT
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/guidelines">
          <Card>
            <p className="text-on-surface-variant text-body-md">Ethics</p>
            <p className="text-headline-md">Guidelines</p>
          </Card>
        </Link>
        <Link href="/bias-audit">
          <Card>
            <p className="text-on-surface-variant text-body-md">Bias</p>
            <p className="text-headline-md">{criticalAlerts.length > 0 ? "Critical disparity" : "Monitoring"}</p>
          </Card>
        </Link>
        <Link href="/workflows">
          <Card>
            <p className="text-on-surface-variant text-body-md">Workflows</p>
            <p className="text-headline-md">
              {automationEfficiency !== null ? `${automationEfficiency}% efficiency` : "No workflows"}
            </p>
          </Card>
        </Link>
        <Link href="/upskilling">
          <Card>
            <p className="text-on-surface-variant text-body-md">Upskill</p>
            <p className="text-headline-md">{completions?.length ?? 0} completions</p>
          </Card>
        </Link>
      </div>

      <Card title="Workflow Certification">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : workflows!.length === 0 ? (
          <EmptyState
            title="No workflows yet"
            description="Create your first automation workflow to see certification status here."
            action={
              <Link href="/workflows" className="text-secondary font-medium inline-flex items-center gap-1">
                Create workflow <ArrowRight size={16} />
              </Link>
            }
          />
        ) : (
          <p className="text-body-md text-on-surface-variant">
            {certifiedWorkflows} of {workflows!.length} workflows are ethics-certified.
          </p>
        )}
      </Card>
    </div>
  );
}
