"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signOut } from "@/lib/auth/session";
import { useTheme } from "@/lib/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { LogOut, HelpCircle, FileText, ShieldCheck, ChevronRight, FileBarChart } from "lucide-react";
import type { GovernancePreferences, ComplianceReportSnapshot } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, activeOrgId, activeRole, orgs, activePreferences, updatePreferences } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [savingKey, setSavingKey] = useState<keyof GovernancePreferences | null>(null);
  const [reports, setReports] = useState<ComplianceReportSnapshot[] | null>(null);
  const canViewReports = activeRole === "admin" || activeRole === "owner";

  useEffect(() => {
    if (!activeOrgId || !canViewReports) return;
    return onSnapshot(
      query(
        collection(db, "organizations", activeOrgId, "complianceReportSnapshots"),
        orderBy("generatedAt", "desc"),
        limit(6)
      ),
      (snap) => setReports(snap.docs.map((d) => d.data() as ComplianceReportSnapshot)),
      () => setReports([])
    );
  }, [activeOrgId, canViewReports]);

  const org = orgs.find((o) => o.id === activeOrgId);

  async function onSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/sign-in");
  }

  async function onToggle(key: keyof GovernancePreferences, value: boolean) {
    setSavingKey(key);
    try {
      await updatePreferences({ [key]: value });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-headline-md">Settings</h1>

      <Card>
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center text-headline-md">
            {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div>
            <p className="font-medium text-body-lg">{profile?.displayName ?? "—"}</p>
            <p className="text-body-md text-on-surface-variant">{profile?.email}</p>
            {activeRole && <Chip tone="ai">{activeRole.toUpperCase()}</Chip>}
          </div>
        </div>
      </Card>

      <Card title="Organization">
        <p className="text-body-md">
          <span className="text-on-surface-variant">Name: </span>
          {org?.name ?? "—"}
        </p>
        <p className="text-body-md mt-1">
          <span className="text-on-surface-variant">Plan: </span>
          {org?.plan ?? "trial"}
        </p>
      </Card>

      <Card title="Governance Preferences">
        <div className="space-y-4">
          <PreferenceToggle
            label="Real-time Bias Monitoring"
            description="Continuously audit model outputs for protected-class discrepancies and gender skew."
            checked={activePreferences.biasMonitoring}
            saving={savingKey === "biasMonitoring"}
            onChange={(v) => onToggle("biasMonitoring", v)}
          />
          <PreferenceToggle
            label="Ethical Logic Alerts"
            description="Trigger intervention if AI logic paths diverge from the established ethical framework."
            checked={activePreferences.ethicsAlerts}
            saving={savingKey === "ethicsAlerts"}
            onChange={(v) => onToggle("ethicsAlerts", v)}
          />
          <PreferenceToggle
            label="Automated Compliance Reporting"
            description="Export quarterly transparency reports to relevant regulatory bodies automatically."
            checked={activePreferences.autoReporting}
            saving={savingKey === "autoReporting"}
            onChange={(v) => onToggle("autoReporting", v)}
          />
        </div>
        <p className="text-label-sm text-on-surface-variant mt-4">
          These preferences are saved to your account and persist across sessions. Note: no backend job currently
          acts on them (e.g. this build doesn&apos;t run scheduled bias scans or automated report exports) — see the
          README for what&apos;s wired end-to-end today.
        </p>
      </Card>

      {canViewReports && (
        <Card title="Compliance Report History">
          {reports === null ? (
            <Skeleton className="h-24 w-full" />
          ) : reports.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">
              No reports generated yet. When &quot;Automated Compliance Reporting&quot; is on, a snapshot is
              generated on the schedule configured in <code className="text-label-sm">vercel.json</code> (monthly by
              default).
            </p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center justify-between border-b border-outline-variant last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2">
                    <FileBarChart size={18} className="text-on-surface-variant" />
                    <div>
                      <p className="text-body-md">{new Date(r.generatedAt).toLocaleDateString()}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {r.compliancePercent}% compliant · {r.auditedModelCount} model(s) audited ·{" "}
                        {r.certifiedWorkflowCount}/{r.totalWorkflowCount} workflows certified
                      </p>
                    </div>
                  </div>
                  {r.highRiskModelCount > 0 && <Chip tone="error">{r.highRiskModelCount} high-risk</Chip>}
                </li>
              ))}
            </ul>
          )}
          <p className="text-label-sm text-on-surface-variant mt-4">
            This is real computed data from your fairness audits, workflows, and compliance checklist — not a
            preview. Emailing/exporting these off-platform isn&apos;t wired yet; see README.
          </p>
        </Card>
      )}

      <Card title="General App Settings">
        <div className="space-y-4">
          <PreferenceToggle
            label="Dark Mode"
            description="Switch the interface to a dark theme. Applies instantly and remembers your choice on this device."
            checked={theme === "dark"}
            saving={false}
            onChange={toggleTheme}
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-body-md">Language</p>
              <p className="text-body-md text-on-surface-variant">
                Additional languages aren&apos;t available yet — this needs a real translation pass, not a guess.
              </p>
            </div>
            <span className="shrink-0 text-body-md text-on-surface-variant border border-outline-variant rounded px-3 py-1.5">
              English (UK)
            </span>
          </div>
          <PreferenceToggle
            label="Smart Notifications"
            description="Get notified about critical alerts and audit results relevant to your role."
            checked={activePreferences.smartNotifications}
            saving={savingKey === "smartNotifications"}
            onChange={(v) => onToggle("smartNotifications", v)}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant space-y-1">
          <SettingsLink href="/help-center" icon={HelpCircle} label="Help Center" />
          <SettingsLink href="/legal/terms" icon={FileText} label="Terms of Service" />
          <SettingsLink href="/legal/privacy" icon={ShieldCheck} label="Privacy Policy" />
        </div>
      </Card>

      <Card>
        <Button variant="danger" onClick={onSignOut} disabled={signingOut}>
          <LogOut size={16} /> {signingOut ? "Signing out..." : "Sign out"}
        </Button>
      </Card>
    </div>
  );
}

function SettingsLink({ href, icon: Icon, label }: { href: string; icon: typeof HelpCircle; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-2.5 text-body-md text-on-surface hover:text-secondary"
    >
      <span className="flex items-center gap-2">
        <Icon size={18} className="text-on-surface-variant" /> {label}
      </span>
      <ChevronRight size={16} className="text-on-surface-variant" />
    </Link>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  saving,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-body-md">{label}</p>
        <p className="text-body-md text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={saving}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative disabled:opacity-60 ${
          checked ? "bg-secondary" : "bg-outline-variant"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
