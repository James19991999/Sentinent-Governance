export type Role = "owner" | "admin" | "member";

export interface GovernancePreferences {
  biasMonitoring: boolean;
  ethicsAlerts: boolean;
  autoReporting: boolean;
  smartNotifications: boolean;
}

export interface OrgMembership {
  orgId: string;
  role: Role;
  userId: string;
  preferences?: GovernancePreferences;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
  plan: "trial" | "starter" | "enterprise";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?:
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "unpaid";
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// --- Bias Detection Audit -------------------------------------------------

/** One row of a customer-supplied model prediction dataset used for a real audit run. */
export interface PredictionRecord {
  predictedPositive: boolean;
  actualPositive?: boolean;
  group: string;
}

export interface FairnessResult {
  group: string;
  n: number;
  selectionRate: number; // P(predicted positive | group)
  truePositiveRate?: number; // recall, only if actualPositive present
  falsePositiveRate?: number;
}

export interface FairnessReport {
  id: string;
  orgId: string;
  modelName: string;
  createdAt: string;
  createdBy: string;
  rowCount: number;
  referenceGroup: string;
  results: FairnessResult[];
  disparateImpactRatio: Record<string, number>; // group -> DI ratio vs reference
  statisticalParityDifference: Record<string, number>;
  equalOpportunityDifference: Record<string, number> | null;
  fourFifthsViolations: string[]; // groups with DI ratio < 0.8 or > 1.25
  fairnessIndex: number; // 0-100 composite score, deterministically derived below
  complianceRisk: "Low" | "Medium" | "High";
}

// --- Automation Workflows --------------------------------------------------

export type WorkflowEthicsStatus = "certified" | "reviewing" | "bias-filtered" | "blocked";

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  department: string;
  ethicsStatus: WorkflowEthicsStatus;
  efficiencyGainPct: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// --- Employee Upskilling Hub ------------------------------------------------

export interface Course {
  id: string;
  title: string;
  category: string;
  durationHours: number;
  /** Present only for org-added courses (Firestore); absent for the built-in global catalog. */
  orgId?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CourseCompletion {
  id: string;
  orgId: string;
  userId: string;
  courseId: string;
  completedAt: string;
  score?: number;
}

// --- Ethical AI Guidelines --------------------------------------------------

export interface ComplianceItem {
  id: string;
  orgId: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

/** A point-in-time snapshot produced by the scheduled compliance-report job. */
export interface ComplianceReportSnapshot {
  id: string;
  orgId: string;
  generatedAt: string;
  compliancePercent: number; // % of complianceItems marked completed at snapshot time
  auditedModelCount: number;
  averageFairnessIndex: number | null;
  highRiskModelCount: number;
  certifiedWorkflowCount: number;
  totalWorkflowCount: number;
}

// --- Audit log ---------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
