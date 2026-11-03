/**
 * Workforce Risk & Action Management (client feedback, Oct 2026).
 *
 * A risk is *detected*, never typed in: the rule engine derives it from the
 * Core HR data every time it is read, so it can never drift from the records
 * it describes. What HR does about it — the edited recommendation, the action
 * plan, the outcome — lives in a `RiskRecord`, keyed by the risk's
 * deterministic id. The action plan itself is a `WorkflowRun`, so assignment,
 * due dates and verification reuse the run engine rather than a second task
 * register.
 */
import type { WorkflowTaskPriority } from "./workflows";

/**
 * The three kinds the client asked MOTEE to tell apart, so HR is not handed a
 * wall of identical warnings.
 */
export type RiskKind = "existing_problem" | "emerging_risk" | "improvement";

export const RISK_KIND_LABELS: Record<RiskKind, string> = {
  existing_problem: "Existing problem",
  emerging_risk: "Emerging risk",
  improvement: "Improvement opportunity",
};

export const RISK_KIND_HINTS: Record<RiskKind, string> = {
  existing_problem: "Something has already gone wrong.",
  emerging_risk: "Current evidence suggests a problem may occur or worsen.",
  improvement: "Below target or could be better, with no immediate risk.",
};

export const RISK_KIND_STYLES: Record<RiskKind, string> = {
  existing_problem: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  emerging_risk: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  improvement: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export const RISK_KINDS: RiskKind[] = ["existing_problem", "emerging_risk", "improvement"];

/**
 * Governance: a finding read straight off the records is never shown the same
 * way as a projection from a trend.
 */
export type RiskBasis = "actual" | "forecast";

export const RISK_BASIS_LABELS: Record<RiskBasis, string> = {
  actual: "Actual finding",
  forecast: "Forecast",
};

export type RiskCategory =
  | "compliance"
  | "absence"
  | "attendance"
  | "performance"
  | "learning"
  | "staffing"
  | "workload";

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  compliance: "Compliance",
  absence: "Sickness absence",
  attendance: "Attendance",
  performance: "Performance",
  learning: "Learning",
  staffing: "Staffing",
  workload: "Workload",
};

export interface RiskEvidence {
  label: string;
  value: string;
}

export interface RiskAffected {
  scope: "employee" | "branch" | "org";
  /** Employee or branch ids, depending on scope. */
  ids: string[];
  /** "Arjun Taylor" or "Manchester branch". */
  label: string;
  /** People affected. */
  count: number;
  branchId?: string;
  branchName?: string;
  departmentName?: string;
  /** Named people behind the risk, for the "open the records" links. */
  people?: { id: string; name: string }[];
}

/** One detection, rebuilt from the data each time it is read. */
export interface WorkforceRisk {
  /** `${ruleId}:${scopeId}` — stable, so re-detection matches its record. */
  id: string;
  ruleId: string;
  kind: RiskKind;
  basis: RiskBasis;
  category: RiskCategory;
  priority: WorkflowTaskPriority;
  title: string;
  evidence: RiskEvidence[];
  affected: RiskAffected;
  /** What could happen if nothing is done. */
  impact: string;
  /** Why it sits at this priority. */
  priorityReason: string;
  /** The suggested next step. HR may amend it; nothing acts on it unaided. */
  recommendedAction: string;
  /** How many days the engine suggests allowing for the action. */
  suggestedDueDays: number;
  /** Where the underlying records live. */
  sourceHref: string;
  sourceLabel: string;
  /**
   * The measured value behind the risk, when there is one — read again at
   * closure so "improvements achieved" is a before/after, not a claim.
   */
  metric?: { label: string; value: number; target?: number; unit: "pct" | "count" | "score" };
  /**
   * Summarises the evidence. When it changes after a risk was closed, the
   * problem has come back in a new form and the risk reopens.
   */
  fingerprint: string;
  detectedOn: string;
}

// ── What HR has done about it ────────────────────────────────────────────────

export type RiskOutcome = "resolved" | "partly_resolved" | "not_resolved";

export const RISK_OUTCOME_LABELS: Record<RiskOutcome, string> = {
  resolved: "Resolved",
  partly_resolved: "Partly resolved",
  not_resolved: "Not resolved",
};

export type RiskHistoryAction =
  | "acknowledged"
  | "recommendation_edited"
  | "recommendation_approved"
  | "action_plan_created"
  | "reminder_sent"
  | "escalated"
  | "closed"
  | "dismissed"
  | "reopened";

export interface RiskHistoryEntry {
  at: string;
  by: string;
  action: RiskHistoryAction;
  note?: string;
}

export interface RiskRecord {
  /** `${tenantId}::${riskId}`. */
  key: string;
  tenantId: string;
  riskId: string;
  /** The detection as it stood when HR first acted, kept for the audit trail. */
  snapshot: WorkforceRisk;
  recommendation?: string;
  recommendationApprovedBy?: string;
  /** The current action plan, in `workflowRuns.byCountry[country]`. */
  runId?: string;
  /** Every plan ever started for it, oldest first. */
  pastRunIds: string[];
  country?: string;
  dismissed?: { by: string; at: string; reason: string };
  closure?: {
    by: string;
    at: string;
    outcome: RiskOutcome;
    evidence: string;
    /** `metric.value` when it was closed, for the before/after report. */
    metricAtClose?: number;
    fingerprint: string;
  };
  /** Times it came back after being closed. */
  recurrenceCount: number;
  history: RiskHistoryEntry[];
}

/**
 * Where a risk has got to, derived from its record and its action plan:
 * - `new`: detected, nobody has acted
 * - `acknowledged`: seen and the recommendation is being worked on
 * - `in_action`: an action plan is running
 * - `awaiting_closure`: every action is done and verified; an authorised
 *   person still has to record the outcome and evidence
 * - `closed` / `dismissed`: finished
 * - `reopened`: closed or dismissed, then detected again with new evidence
 */
export type RiskStatus =
  | "new"
  | "acknowledged"
  | "in_action"
  | "awaiting_closure"
  | "closed"
  | "dismissed"
  | "reopened";

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  in_action: "In action",
  awaiting_closure: "Awaiting closure",
  closed: "Closed",
  dismissed: "Dismissed",
  reopened: "Reopened",
};

export const RISK_STATUS_STYLES: Record<RiskStatus, string> = {
  new: "border-border bg-muted text-muted-foreground",
  acknowledged: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  in_action: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  awaiting_closure: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  closed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  dismissed: "border-dashed border-border bg-transparent text-muted-foreground",
  reopened: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/** Statuses that still need someone to do something. */
export function isRiskOpen(status: RiskStatus): boolean {
  return status !== "closed" && status !== "dismissed";
}

export const RISK_PRIORITY_RANK: Record<WorkflowTaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * A risk's nth action plan. Numbered because a reopened risk gets a fresh plan,
 * and `startRun` ignores an id it has already seen.
 */
export function riskRunId(riskKey: string, attempt: number): string {
  return `RUN-RISK-${riskKey}-${attempt}`;
}
