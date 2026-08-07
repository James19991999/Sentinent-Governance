"use client";

import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { WorkflowEthicsStatus } from "@/lib/types";

export async function createWorkflow(params: { orgId: string; userId: string; name: string; department: string }) {
  const now = new Date().toISOString();
  return addDoc(collection(db, "workflows"), {
    orgId: params.orgId,
    name: params.name,
    department: params.department,
    ethicsStatus: "reviewing" as WorkflowEthicsStatus,
    efficiencyGainPct: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: params.userId,
  });
}

export async function updateWorkflowStatus(workflowId: string, ethicsStatus: WorkflowEthicsStatus) {
  return updateDoc(doc(db, "workflows", workflowId), { ethicsStatus, updatedAt: new Date().toISOString() });
}
