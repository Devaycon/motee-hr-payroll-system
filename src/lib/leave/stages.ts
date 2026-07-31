import type { ApprovalChainStep, ApprovalChainTemplate } from "@/src/lib/types/approvals";
import type { LeaveStatus } from "@/src/lib/types/leave";

/**
 * Maps the active approval chain for `leave_request` onto the leave status
 * machine (client feedback round 2, §F4). Rather than hard-coding
 * "Pending → Manager → HR → Approved", the stages come from whichever
 * `ApprovalChainTemplate` HR has made active, so the console and the Approval
 * Chain tab can never disagree about the process.
 */
export interface LeaveStage {
  /** Status a request sits in while waiting for this step. */
  status: LeaveStatus;
  /** Step label from the chain, e.g. "Manager review". */
  label: string;
  /** Who has to act, already resolved to a display string. */
  approverLabel: string;
}

/** Fallback chain used when no template has been configured. */
const DEFAULT_STAGES: LeaveStage[] = [
  { status: "awaiting_manager", label: "Manager review", approverLabel: "Line manager" },
  { status: "awaiting_hr", label: "HR review", approverLabel: "HR" },
];

function statusForStep(step: ApprovalChainStep, index: number): LeaveStatus {
  const approver = step.approver;
  if (approver === "LINE_MANAGER" || approver === "DEPARTMENT_HEAD") {
    return "awaiting_manager";
  }
  // Everything else (role-based steps — HR, payroll, …) waits on HR.
  return index === 0 ? "awaiting_manager" : "awaiting_hr";
}

/**
 * Ordered stages a request passes through, derived from the template.
 * Optional steps are included — skipping them is an approver decision, not a
 * modelling one.
 */
export function stagesForTemplate(
  template: ApprovalChainTemplate | undefined,
  approverLabel: (approver: ApprovalChainStep["approver"]) => string,
): LeaveStage[] {
  if (!template || template.steps.length === 0) return DEFAULT_STAGES;
  const ordered = [...template.steps].sort((a, b) => a.order - b.order);
  const stages = ordered.map((step, i) => ({
    status: statusForStep(step, i),
    label: step.label,
    approverLabel: approverLabel(step.approver),
  }));

  // Collapse consecutive stages that resolve to the same status — two manager
  // steps in a row are one "awaiting manager" state as far as the row is
  // concerned, but keep the labels so the stepper still shows both.
  return stages;
}

/** The full status path including the terminal state, for the stepper UI. */
export function statusPath(stages: LeaveStage[]): LeaveStatus[] {
  return ["pending", ...stages.map((s) => s.status), "approved"];
}

/**
 * The status a request moves into when the current stage is approved.
 * Returns "approved" once every stage has been cleared.
 */
export function nextStatus(current: LeaveStatus, stages: LeaveStage[]): LeaveStatus {
  const path = statusPath(stages);
  const i = path.indexOf(current);
  if (i === -1 || i >= path.length - 1) return "approved";
  // De-duplicate: skip forward past any repeat of the current status.
  let next = i + 1;
  while (next < path.length - 1 && path[next] === current) next++;
  return path[next];
}

/** Human label for a status, used in tables, filters and history entries. */
export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  awaiting_manager: "Awaiting Manager",
  awaiting_hr: "Awaiting HR",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  awaiting_manager: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  awaiting_hr: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-500",
};

/** The stage a request is currently sitting at, if it's still open. */
export function currentStage(
  status: LeaveStatus,
  stages: LeaveStage[],
): LeaveStage | null {
  return stages.find((s) => s.status === status) ?? null;
}
