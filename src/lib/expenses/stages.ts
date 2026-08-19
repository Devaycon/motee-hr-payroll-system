import type {
  ApprovalChainTemplate,
  ApproverResolver,
} from "@/src/lib/types/approvals";
import type {
  ExpenseClaim,
  ExpenseStatus,
} from "@/src/data/employee-expenses-demo";
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_STYLES,
} from "@/src/data/employee-expenses-demo";

/**
 * Maps the active `expense_claim` approval chain onto the claim status
 * machine. Rather than hard-coding "Submitted → Approved → Finance → Paid",
 * the stages come from whichever `ApprovalChainTemplate` HR has made active,
 * so the HR console, the employee's progress tracker and the Approval Chain
 * tab can never disagree about the process.
 *
 * Note this is keyed by **stage index**, not by status. The leave equivalent
 * (`src/lib/leave/stages.ts`) looks stages up by status, which silently makes
 * the third step of any three-step chain unreachable — expenses must not
 * inherit that, because a claim's chain can be any length.
 */
export interface ExpenseStage {
  /** 0-based position in the chain. */
  index: number;
  /** Template step id, carried onto decisions for traceability. */
  stepId: string;
  /** The task to be done, e.g. "Validate expense". */
  label: string;
  /** Raw resolver — `canActOnStep` needs this, not the display label. */
  approver: ApproverResolver;
  /** Resolved for display, e.g. "Line manager", "Finance". */
  approverLabel: string;
}

/** Used when no `expense_claim` template has been configured. */
export const DEFAULT_EXPENSE_STAGES: ExpenseStage[] = [
  {
    index: 0,
    stepId: "expense-stage-0",
    label: "Validate expense",
    approver: "LINE_MANAGER",
    approverLabel: "Line manager",
  },
  {
    index: 1,
    stepId: "expense-stage-1",
    label: "Reimburse claim",
    approver: "ROLE:ROLE-FIN",
    approverLabel: "Finance",
  },
];

/**
 * The status a claim sits in while waiting on stage `index` of a `total`-step
 * chain — the final step is the pay-out, so clearing it means reimbursed.
 *
 * The first-pending clause deliberately wins the tie at `total === 1`, where
 * stage 0 is both the first and the last: a one-step chain enters at
 * `submitted` and a single approval takes it straight to `reimbursed`. The
 * alternative would show "Approved" on a claim nobody has looked at yet.
 */
export function statusForStageIndex(
  index: number,
  total: number,
): ExpenseStatus {
  if (total <= 0) return "submitted";
  if (index < 0) return "draft";
  if (index >= total) return "reimbursed";
  if (index === 0) return "submitted";
  if (index === total - 1) return "approved";
  return "submitted";
}

/** Ordered stages a claim passes through, derived from the active template. */
export function expenseStagesForTemplate(
  template: ApprovalChainTemplate | undefined,
  approverLabel: (approver: ApproverResolver) => string,
): ExpenseStage[] {
  if (!template || template.steps.length === 0) return DEFAULT_EXPENSE_STAGES;
  return [...template.steps]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({
      index,
      stepId: step.id,
      label: step.label,
      approver: step.approver,
      approverLabel: approverLabel(step.approver),
    }));
}

/** True while the claim is still moving through the chain. */
export function isClaimOpen(status: ExpenseStatus): boolean {
  return status === "submitted" || status === "approved";
}

/**
 * Best-guess stage for a claim that predates the chain (seeded demo rows),
 * derived from the status it was stored with.
 */
export function inferStageIndexFromStatus(
  status: ExpenseStatus,
  total: number,
): number {
  switch (status) {
    case "draft":
      return -1;
    case "submitted":
      return 0;
    case "approved":
      return Math.max(0, total - 1);
    case "rejected":
      return 0;
    case "reimbursed":
      return total;
  }
}

/** The stage a claim currently awaits, or null if it isn't awaiting one. */
export function currentExpenseStage(
  claim: ExpenseClaim,
  stages: ExpenseStage[],
): ExpenseStage | null {
  if (stages.length === 0) return null;
  if (!isClaimOpen(claim.status) && claim.status !== "rejected") return null;
  const idx = claim.stageIndex ?? inferStageIndexFromStatus(claim.status, stages.length);
  if (idx < 0) return null;
  // HR can shrink the active template while claims are in flight, so a stored
  // index can point past the end — clamp rather than drop the stage.
  return stages[Math.min(idx, stages.length - 1)];
}

/** The status a claim moves into once the stage at `fromStageIndex` clears. */
export function nextExpenseStatus(
  fromStageIndex: number,
  stages: ExpenseStage[],
): ExpenseStatus {
  return statusForStageIndex(fromStageIndex + 1, stages.length);
}

/** True when the claim's chain was edited after it was filed. */
export function chainChangedSinceFiled(
  claim: ExpenseClaim,
  template: ApprovalChainTemplate | undefined,
): boolean {
  if (!claim.chainTemplateId || !template) return false;
  return claim.chainTemplateId !== template.id;
}

// ── status labelling ────────────────────────────────────────────────────────
// "Returned" is a derived sixth label over five stored statuses, so every
// exhaustive Record<ExpenseStatus, …> in the app stays valid.

export function expenseStatusLabel(claim: ExpenseClaim): string {
  if (claim.status === "draft" && claim.returned) return "Returned";
  return EXPENSE_STATUS_LABELS[claim.status];
}

export function expenseStatusStyle(claim: ExpenseClaim): string {
  if (claim.status === "draft" && claim.returned) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }
  return EXPENSE_STATUS_STYLES[claim.status];
}

// ── progress track ──────────────────────────────────────────────────────────

/** Track labels for the progress tracker: submission plus each chain stage. */
export function expenseTrackLabels(stages: ExpenseStage[]): string[] {
  return ["Submitted", ...stages.map((s) => s.label)];
}

/** What each track position means, said in the chain's own terms. */
export function expenseTrackBlurb(
  position: number,
  stages: ExpenseStage[],
): string {
  if (position === 0) return "Filed and queued for review";
  const stage = stages[position - 1];
  if (!stage) return "";
  return position === stages.length
    ? `Paid out by ${stage.approverLabel}`
    : `Awaiting ${stage.approverLabel}`;
}

/**
 * How many track positions the claim has cleared — position 0 is submission
 * itself, then one per chain stage cleared.
 */
export function claimStagesReached(
  claim: ExpenseClaim,
  stages: ExpenseStage[],
): number {
  const total = stages.length;
  if (claim.status === "draft") return 0;
  if (claim.status === "reimbursed") return total + 1;
  const idx =
    claim.stageIndex ?? inferStageIndexFromStatus(claim.status, total);
  return 1 + Math.max(0, Math.min(idx, total));
}
