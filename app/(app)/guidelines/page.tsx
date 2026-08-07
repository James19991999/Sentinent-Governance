"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { FRAMEWORK_LIBRARY, DEFAULT_COMPLIANCE_ITEMS } from "@/lib/data/frameworks";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ComplianceItem } from "@/lib/types";

export default function GuidelinesPage() {
  const { activeOrgId, firebaseUser } = useAuth();
  const [items, setItems] = useState<ComplianceItem[] | null>(null);

  useEffect(() => {
    if (!activeOrgId) return;
    return onSnapshot(
      query(collection(db, "complianceItems"), where("orgId", "==", activeOrgId)),
      (snap) => {
        const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ComplianceItem);
        if (existing.length === 0) {
          setItems(
            DEFAULT_COMPLIANCE_ITEMS.map((label, i) => ({
              id: `seed-${i}`,
              orgId: activeOrgId,
              label,
              completed: false,
            }))
          );
        } else {
          setItems(existing);
        }
      },
      () => setItems([])
    );
  }, [activeOrgId]);

  const completedCount = items?.filter((i) => i.completed).length ?? 0;

  async function toggle(item: ComplianceItem) {
    if (!activeOrgId || !firebaseUser) return;
    const id = item.id.startsWith("seed-") ? crypto.randomUUID() : item.id;
    await setDoc(doc(db, "complianceItems", id), {
      orgId: activeOrgId,
      label: item.label,
      completed: !item.completed,
      completedAt: !item.completed ? new Date().toISOString() : null,
      completedBy: !item.completed ? firebaseUser.uid : null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md">Ethical AI Standards &amp; Oversight</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Implementing high-stakes governance through transparency, fairness, and systematic accountability frameworks.
        </p>
      </div>

      <Card title="Ethical Framework Library">
        <ul className="space-y-3">
          {FRAMEWORK_LIBRARY.map((fw) => (
            <li key={fw.id} className="border border-outline-variant rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium">{fw.name}</h4>
                <Chip tone={fw.status === "critical" ? "error" : fw.status === "active" ? "success" : "neutral"}>
                  {fw.status.toUpperCase()}
                </Chip>
              </div>
              <p className="text-body-md text-on-surface-variant mb-2">{fw.description}</p>
              <span className="text-label-sm text-secondary">{fw.metric}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Project Compliance" action={items && <span className="text-body-md text-on-surface-variant">{completedCount}/{items.length}</span>}>
        {items === null ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <label className="flex items-center gap-3 text-body-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggle(item)}
                    className="w-4 h-4 accent-secondary"
                  />
                  <span className={item.completed ? "line-through text-on-surface-variant" : ""}>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
