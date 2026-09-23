import type { ApprovalRequest } from "@/src/lib/types/approvals";
import { daysWaiting } from "@/src/components/hr/approvals/utils";
import type { RaciPerson } from "@/src/components/shared/raci-strip";

export interface ApprovalRaci {
  people: RaciPerson[];
  waitingOn: { name: string; days: number } | null;
}

/**
 * The people on an approval-gated record: who raised it, and whose desk it is
 * sitting on right now.
 *
 * `daysWaiting` already existed and was only ever rendered on the Submissions
 * screen - so "this has been with Finance for six days" was true, computed,
 * and invisible from the record it described.
 */
export function raciFromApproval(
  approval: ApprovalRequest | undefined,
  submittedByName: string,
): ApprovalRaci {
  const people: RaciPerson[] = [
    { slot: "Requester", name: submittedByName },
  ];

  if (!approval) return { people, waitingOn: null };

  const step = approval.steps[approval.currentStepIndex];
  const approverName =
    step?.resolvedEmployeeName ?? step?.label ?? "Pending assignment";

  if (approval.status === "in_progress" && step) {
    people.push({
      slot: "Approver",
      name: approverName,
      employeeId: step.resolvedEmployeeId ?? undefined,
      note: step.label,
    });
    return {
      people,
      waitingOn: { name: approverName, days: daysWaiting(approval) },
    };
  }

  // Closed chains name whoever last acted, so the record still says who
  // decided it rather than going blank the moment it is approved.
  const decided = [...approval.steps]
    .reverse()
    .find((s) => s.status === "approved" || s.status === "rejected");
  if (decided?.resolvedEmployeeName) {
    people.push({
      slot: "Approver",
      name: decided.resolvedEmployeeName,
      employeeId: decided.resolvedEmployeeId ?? undefined,
      note: decided.label,
    });
  }
  return { people, waitingOn: null };
}
