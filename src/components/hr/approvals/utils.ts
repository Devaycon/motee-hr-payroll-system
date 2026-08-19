import type {
  ApprovalRequest,
  ApprovalStepStatus,
} from "@/src/lib/types/approvals";
import { canActOnStep } from "@/src/lib/permissions/approver-resolution";

export function isCurrentApprover(
  req: ApprovalRequest,
  userEmployeeId: string | undefined,
  userRoleId: string | undefined,
): boolean {
  if (req.status !== "in_progress") return false;
  const step = req.steps[req.currentStepIndex];
  if (!step) return false;
  return canActOnStep(
    step.approver,
    step.resolvedEmployeeId,
    userEmployeeId,
    userRoleId,
  );
}

export function isSubmitter(
  req: ApprovalRequest,
  userEmployeeId: string | undefined,
): boolean {
  if (!userEmployeeId) return false;
  return req.submittedBy.employeeId === userEmployeeId;
}

export function isHistoricalApprover(
  req: ApprovalRequest,
  userEmployeeId: string | undefined,
  userRoleId: string | undefined,
): boolean {
  if (!userEmployeeId) return false;
  return req.steps.some((s) =>
    canActOnStep(s.approver, s.resolvedEmployeeId, userEmployeeId, userRoleId),
  );
}

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const diffMs = Date.now() - then.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Who the request is sitting with right now, or null once it has closed. */
export function currentApproverName(req: ApprovalRequest): string | null {
  if (req.status !== "in_progress") return null;
  return req.steps[req.currentStepIndex]?.resolvedEmployeeName ?? null;
}

/** Whole days the request has been open. Closed requests stop the clock. */
export function daysWaiting(req: ApprovalRequest, nowMs = Date.now()): number {
  const submitted = new Date(req.submittedAt).getTime();
  if (Number.isNaN(submitted)) return 0;
  const end =
    req.status === "in_progress"
      ? nowMs
      : new Date(lastUpdatedAt(req)).getTime() || nowMs;
  return Math.max(0, Math.floor((end - submitted) / 86_400_000));
}

/** Timestamp of the most recent event, falling back to submission time. */
export function lastUpdatedAt(req: ApprovalRequest): string {
  let latest = req.submittedAt;
  for (const event of req.history) {
    if (new Date(event.at).getTime() > new Date(latest).getTime()) {
      latest = event.at;
    }
  }
  return latest;
}

export const STEP_STATUS_STYLES: Record<ApprovalStepStatus, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  returned: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  skipped: "bg-muted text-muted-foreground border-border",
};
