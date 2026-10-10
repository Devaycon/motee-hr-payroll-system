"use client";

import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { cn, getApiErrorMessage } from "@/src/lib/utils";
import { approvalDecisionSchema } from "@/src/lib/validations/approvals";
import {
  useCancelApprovalMutation,
  useDecideApprovalMutation,
  useReresolveApprovalMutation,
  useResubmitApprovalMutation,
} from "@/src/store/services/approvals";
import type {
  ApprovalDto,
  ApprovalStatus,
  ApprovalStepStatus,
  ApproverResolver,
} from "@/src/types/common";

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: "Draft",
  inProgress: "In progress",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<ApprovalStatus | ApprovalStepStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  inProgress: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  pending: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  approved:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  returned:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cancelled: "border-border bg-muted text-muted-foreground",
  skipped: "border-border bg-muted text-muted-foreground",
};

export const APPROVER_LABELS: Record<ApproverResolver, string> = {
  lineManager: "Line manager",
  departmentHead: "Department head",
  role: "Role",
};

/** `leaveRequest` → "Leave request". */
export function humanise(value: string): string {
  const spaced = value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function StatusBadge({
  status,
}: {
  status: ApprovalStatus | ApprovalStepStatus;
}) {
  const label =
    status in APPROVAL_STATUS_LABELS
      ? APPROVAL_STATUS_LABELS[status as ApprovalStatus]
      : humanise(status);
  return (
    <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[status])}>
      {label}
    </Badge>
  );
}

/** Every action an approval offers, each reporting its own outcome. */
export function useApprovalActions() {
  const [decideApproval, deciding] = useDecideApprovalMutation();
  const [resubmitApproval, resubmitting] = useResubmitApprovalMutation();
  const [reresolveApproval, reresolving] = useReresolveApprovalMutation();
  const [cancelApproval, cancelling] = useCancelApprovalMutation();

  async function decide(
    approval: ApprovalDto,
    decision: "approved" | "rejected" | "returned",
    note?: string,
  ): Promise<boolean> {
    const parsed = approvalDecisionSchema.safeParse({
      decision,
      note: note?.trim() || null,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return false;
    }
    try {
      await decideApproval({ id: approval.id, body: parsed.data }).unwrap();
      toast.success(
        decision === "approved"
          ? "Approved"
          : decision === "rejected"
            ? "Rejected"
            : "Returned to the requester",
      );
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not record the decision."));
      return false;
    }
  }

  async function resubmit(approval: ApprovalDto) {
    try {
      await resubmitApproval(approval.id).unwrap();
      toast.success("Resubmitted for approval");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not resubmit."));
    }
  }

  /** Works out the approvers again, e.g. after someone changed manager. */
  async function reresolve(approval: ApprovalDto) {
    try {
      await reresolveApproval(approval.id).unwrap();
      toast.success("Approvers refreshed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not refresh the approvers."));
    }
  }

  async function cancel(approval: ApprovalDto, reason?: string) {
    try {
      await cancelApproval({
        id: approval.id,
        body: { reason: reason?.trim() || null },
      }).unwrap();
      toast.success("Approval cancelled");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not cancel the approval."));
    }
  }

  return {
    decide,
    resubmit,
    reresolve,
    cancel,
    busy:
      deciding.isLoading ||
      resubmitting.isLoading ||
      reresolving.isLoading ||
      cancelling.isLoading,
  };
}
