import type { ApprovalStepDto, ApproverResolver as ApiResolver } from "@/src/types/common";
import type { ExpenseClaimDto } from "@/src/types/expenses";
import type {
  ExpenseClaim,
  ExpenseDecision,
  ExpenseHistoryEntry,
} from "@/src/data/employee-expenses-demo";
import type { ApproverResolver } from "@/src/lib/types/approvals";
import { getInitials } from "@/src/lib/types/dashboard";
import type { ExpenseStage } from "./stages";

/**
 * On the API a claim's review is a server-side approval, and reimbursement is
 * a separate call once that approval clears. The screens model both as one
 * chain whose last stage is the pay-out, so the live stages are the approval
 * steps plus a closing "Reimburse claim" stage.
 */

export const REIMBURSE_STEP_ID = "reimburse";

function resolverFor(step: ApprovalStepDto): ApproverResolver {
  const kind: ApiResolver = step.approver;
  if (kind === "role" && step.resolvedRoleId) return `ROLE:${step.resolvedRoleId}`;
  if (kind === "departmentHead") return "DEPARTMENT_HEAD";
  return "LINE_MANAGER";
}

const sortedSteps = (dto: ExpenseClaimDto) =>
  [...(dto.review?.steps ?? [])].sort((a, b) => a.sequence - b.sequence);

/** The chain a claim runs on, as the stages the screens draw. */
export function stagesForClaim(dto: ExpenseClaimDto): ExpenseStage[] {
  const steps = sortedSteps(dto);
  return [
    ...steps.map((step, index) => ({
      index,
      stepId: step.id,
      label: step.label,
      approver: resolverFor(step),
      approverLabel: step.resolvedName || step.label,
    })),
    {
      index: steps.length,
      stepId: REIMBURSE_STEP_ID,
      label: "Reimburse claim",
      // Nobody is resolved for the pay-out, so only someone with override
      // rights (expense administration) can clear it.
      approver: "ROLE:finance",
      approverLabel: "Finance",
    },
  ];
}

/** Where the claim sits: -1 not submitted, steps + 1 fully reimbursed. */
function stageIndexFor(dto: ExpenseClaimDto): number {
  const steps = sortedSteps(dto);
  switch (dto.status) {
    case "draft":
      return -1;
    case "approved":
      return steps.length;
    case "reimbursed":
      return steps.length + 1;
    default: {
      const current = dto.review?.currentStep;
      const at = current ? steps.findIndex((s) => s.id === current.id) : -1;
      if (at >= 0) return at;
      const firstOpen = steps.findIndex((s) => s.status === "pending");
      return firstOpen >= 0 ? firstOpen : 0;
    }
  }
}

function decisionsFor(dto: ExpenseClaimDto): ExpenseDecision[] {
  return sortedSteps(dto).flatMap((step, index) =>
    step.status === "approved" ||
    step.status === "rejected" ||
    step.status === "returned"
      ? [
          {
            id: step.id,
            stageIndex: index,
            stepId: step.id,
            stageLabel: step.label,
            decision: step.status,
            actorName: step.resolvedName || step.label,
            actorEmployeeId: step.resolvedEmployeeId ?? undefined,
            at: step.decidedAt ?? dto.submittedAt ?? dto.createdAt,
            note: step.note ?? undefined,
          },
        ]
      : [],
  );
}

const EVENT_LABELS: Record<string, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned",
  resubmitted: "Resubmitted",
  cancelled: "Withdrawn",
};

function historyFor(dto: ExpenseClaimDto): ExpenseHistoryEntry[] {
  const events: ExpenseHistoryEntry[] = (dto.review?.history ?? []).map(
    (event) => ({
      id: event.id,
      at: event.at,
      action:
        EVENT_LABELS[event.type.toLowerCase()] ??
        event.type.charAt(0).toUpperCase() + event.type.slice(1),
      actor: event.actorName ?? undefined,
      note: event.note ?? undefined,
    }),
  );
  if (dto.reimbursedAt) {
    events.push({
      id: `${dto.id}-reimbursed`,
      at: dto.reimbursedAt,
      action: "Reimbursed",
      actor: "Finance",
      toStatus: "reimbursed",
    });
  }
  return events;
}

export function toExpenseClaim(dto: ExpenseClaimDto): ExpenseClaim {
  const current = dto.review?.currentStep;
  const open = dto.status === "submitted";
  return {
    id: dto.id,
    title: dto.title,
    category: dto.category,
    amount: dto.amount,
    currency: dto.currency,
    dateSubmitted: (dto.submittedAt ?? dto.createdAt).slice(0, 10),
    status: dto.status,
    merchant: dto.merchant,
    notes: dto.notes ?? undefined,
    // Receipts are stored files; the screen lists them, but their bytes are
    // only reachable through the authenticated download endpoint.
    attachments: dto.receiptFileIds.map((id, i) => ({
      id,
      name: `Receipt ${i + 1}`,
      mimeType: "application/octet-stream",
      sizeBytes: 0,
      dataUrl: "",
      uploadedAt: dto.submittedAt ?? dto.createdAt,
    })),
    reference: dto.reference ?? undefined,
    reviewer: current?.resolvedName ?? undefined,
    history: historyFor(dto),
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    employeeInitials: getInitials(dto.employeeName),
    department: dto.departmentName ?? undefined,
    stageIndex: stageIndexFor(dto),
    currentApproverEmployeeId: open ? (current?.resolvedEmployeeId ?? null) : null,
    currentApproverName: open
      ? (current?.resolvedName ?? null)
      : dto.status === "approved"
        ? "Finance"
        : null,
    decisions: decisionsFor(dto),
    returned: dto.returned,
    returnedReason: dto.returnedReason ?? undefined,
  };
}
