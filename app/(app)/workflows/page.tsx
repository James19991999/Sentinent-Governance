"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { createWorkflow, updateWorkflowStatus } from "@/lib/firestore/workflows";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineErrorBanner } from "@/components/ui/InlineErrorBanner";
import { firestoreErrorMessage } from "@/lib/firestore/errorMessage";
import type { Workflow, WorkflowEthicsStatus } from "@/lib/types";
import { Plus, ShieldCheck } from "lucide-react";

const statusTone: Record<WorkflowEthicsStatus, "success" | "warning" | "ai" | "error"> = {
  certified: "success",
  reviewing: "warning",
  "bias-filtered": "ai",
  blocked: "error",
};

const statusLabel: Record<WorkflowEthicsStatus, string> = {
  certified: "CERTIFIED",
  reviewing: "REVIEWING",
  "bias-filtered": "BIAS-FILTERED",
  blocked: "BLOCKED",
};

export default function WorkflowsPage() {
  const { activeOrgId, firebaseUser, activeRole } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [creating, setCreating] = useState(false);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const canCertify = activeRole === "admin" || activeRole === "owner";

  async function onCertify(workflowId: string) {
    setCertifyingId(workflowId);
    try {
      await updateWorkflowStatus(workflowId, "certified");
    } finally {
      setCertifyingId(null);
    }
  }

  useEffect(() => {
    if (!activeOrgId) return;
    return onSnapshot(
      query(collection(db, "workflows"), where("orgId", "==", activeOrgId)),
      (snap) => {
        setWorkflows(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workflow));
        setLoadError(null);
      },
      (err) => {
        console.error("Workflows query failed", err);
        setWorkflows([]);
        setLoadError(firestoreErrorMessage(err));
      }
    );
  }, [activeOrgId]);

  async function onCreate() {
    if (!activeOrgId || !firebaseUser || !name || !department) return;
    setCreating(true);
    try {
      await createWorkflow({ orgId: activeOrgId, userId: firebaseUser.uid, name, department });
      setName("");
      setDepartment("");
      setModalOpen(false);
    } finally {
      setCreating(false);
    }
  }

  const totalEfficiency =
    workflows && workflows.length > 0
      ? Math.round(workflows.reduce((s, w) => s + w.efficiencyGainPct, 0) / workflows.length)
      : null;

  return (
    <div className="space-y-6">
      {loadError && <InlineErrorBanner message={loadError} />}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-md">Automation Flow</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage and monitor business processes governed by your ethical AI framework.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Create New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-label-sm text-on-surface-variant">ACTIVE WORKFLOWS</p>
          <p className="text-headline-md">{workflows?.length ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-label-sm text-on-surface-variant">CERTIFIED</p>
          <p className="text-headline-md">{workflows?.filter((w) => w.ethicsStatus === "certified").length ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-label-sm text-on-surface-variant">AVG EFFICIENCY GAIN</p>
          <p className="text-headline-md">{totalEfficiency !== null ? `${totalEfficiency}%` : "—"}</p>
        </Card>
        <Card>
          <p className="text-label-sm text-on-surface-variant">NEEDS REVIEW</p>
          <p className="text-headline-md">{workflows?.filter((w) => w.ethicsStatus === "reviewing").length ?? "—"}</p>
        </Card>
      </div>

      {workflows === null ? (
        <Skeleton className="h-64 w-full" />
      ) : workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          description="Create your first automation workflow to bring it under ethical AI oversight."
          action={<Button onClick={() => setModalOpen(true)}>Create workflow</Button>}
        />
      ) : (
        <div className="space-y-4">
          {workflows.map((w) => (
            <Card key={w.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-sm text-on-surface-variant uppercase">{w.department}</span>
                <Chip tone={statusTone[w.ethicsStatus]}>{statusLabel[w.ethicsStatus]}</Chip>
              </div>
              <h4 className="font-medium text-body-lg mb-2">{w.name}</h4>
              <div className="h-2 rounded bg-surface-container-high overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: `${w.efficiencyGainPct}%` }} />
              </div>
              <p className="text-label-sm text-on-surface-variant mt-1">{w.efficiencyGainPct}% efficiency gain</p>
              {canCertify && w.ethicsStatus !== "certified" && (
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => onCertify(w.id)}
                  disabled={certifyingId === w.id}
                >
                  <ShieldCheck size={16} /> {certifyingId === w.id ? "Certifying..." : "Certify workflow"}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="Create Workflow" onClose={() => setModalOpen(false)} onConfirm={onCreate} confirmLabel={creating ? "Creating..." : "Create"}>
        <div className="space-y-3 text-left">
          <div>
            <label htmlFor="wfName" className="block text-label-sm mb-1">
              WORKFLOW NAME
            </label>
            <input
              id="wfName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-outline-variant px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="wfDept" className="block text-label-sm mb-1">
              DEPARTMENT
            </label>
            <input
              id="wfDept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded border border-outline-variant px-3 py-2"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
