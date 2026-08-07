"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { FairnessReport } from "@/lib/types";
import { Play, Upload } from "lucide-react";

export default function BiasAuditPage() {
  const { activeOrgId, firebaseUser } = useAuth();
  const [reports, setReports] = useState<FairnessReport[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;
    return onSnapshot(
      query(collection(db, "fairnessReports"), where("orgId", "==", activeOrgId), orderBy("createdAt", "desc"), limit(20)),
      (snap) => setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FairnessReport)),
      () => setReports([])
    );
  }, [activeOrgId]);

  const runAudit = useCallback(async () => {
    if (!file || !modelName || !firebaseUser || !activeOrgId) return;
    setRunning(true);
    setRunError(null);
    try {
      const csv = await file.text();
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/bias-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Org-Id": activeOrgId,
        },
        body: JSON.stringify({ modelName, csv }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Audit failed.");
      }
      setFile(null);
      setModelName("");
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setRunning(false);
    }
  }, [file, modelName, firebaseUser, activeOrgId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-sm text-secondary">ACTIVE MONITORING</p>
          <h1 className="text-headline-md">Technical Bias Audit</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Upload real model predictions to compute demographic parity, disparate impact, and equal-opportunity metrics.
          </p>
        </div>
      </div>

      <Card title="Run Audit">
        <div className="space-y-4">
          <div>
            <label htmlFor="modelName" className="block text-label-sm mb-1.5">
              MODEL NAME
            </label>
            <input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. Resume Screener v2.1"
              className="w-full rounded border border-outline-variant bg-surface-container-low px-3 py-2.5 focus:border-2 focus:border-secondary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="predictionsFile" className="block text-label-sm mb-1.5">
              PREDICTIONS CSV (columns: predicted, actual [optional], group)
            </label>
            <input
              id="predictionsFile"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-body-md"
            />
          </div>
          {runError && (
            <p role="alert" className="text-error text-body-md bg-error-container/30 rounded p-3">
              {runError}
            </p>
          )}
          <Button onClick={runAudit} disabled={!file || !modelName || running}>
            <Play size={16} /> {running ? "Computing..." : "Run Audit"}
          </Button>
        </div>
      </Card>

      <Card title="Audit History">
        {reports === null ? (
          <Skeleton className="h-40 w-full" />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No audits yet"
            description="Run your first audit above — real fairness metrics will appear here, computed from your uploaded predictions."
            action={
              <span className="inline-flex items-center gap-1 text-on-surface-variant">
                <Upload size={16} /> Upload a CSV to get started
              </span>
            }
          />
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r.id} className="border border-outline-variant rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{r.modelName}</h4>
                  <Chip tone={r.complianceRisk === "Low" ? "success" : r.complianceRisk === "Medium" ? "warning" : "error"}>
                    {r.complianceRisk} risk
                  </Chip>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mb-3">
                  <div>
                    <p className="text-headline-md">{r.fairnessIndex}/100</p>
                    <p className="text-label-sm text-on-surface-variant">Fairness Index</p>
                  </div>
                  <div>
                    <p className="text-headline-md">{r.rowCount}</p>
                    <p className="text-label-sm text-on-surface-variant">Records Audited</p>
                  </div>
                  <div>
                    <p className="text-headline-md">{r.referenceGroup}</p>
                    <p className="text-label-sm text-on-surface-variant">Reference Group</p>
                  </div>
                </div>
                <table className="w-full text-body-md">
                  <caption className="sr-only">Disparate impact ratio by group, relative to {r.referenceGroup}</caption>
                  <thead>
                    <tr className="text-left text-label-sm text-on-surface-variant">
                      <th scope="col">Group</th>
                      <th scope="col">Selection Rate</th>
                      <th scope="col">DI Ratio vs {r.referenceGroup}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.results.map((res) => (
                      <tr key={res.group} className="border-t border-outline-variant">
                        <td className="py-1.5">{res.group}</td>
                        <td>{(res.selectionRate * 100).toFixed(1)}%</td>
                        <td className={r.fourFifthsViolations.includes(res.group) ? "text-error font-medium" : ""}>
                          {res.group === r.referenceGroup ? "—" : r.disparateImpactRatio[res.group]?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
