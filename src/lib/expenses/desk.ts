import type {
  ApprovalChainStep,
  ApprovalSubmitter,
} from "@/src/lib/types/approvals";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import {
  canActOnStep,
  resolveStepWithOnLeave,
} from "@/src/lib/permissions/approver-resolution";
import { currentExpenseStage, isClaimOpen, type ExpenseStage } from "./stages";

export interface ExpenseDesk {
  /** Stage the claim now awaits; `stages.length` means fully cleared. */
  stageIndex: number;
  approverEmployeeId: string | null;
  approverName: string | null;
  /** Stages walked past because nobody could be resolved for them. */
  skipped: ExpenseStage[];
}

/**
 * Resolves who a claim sits with from `startIndex` onward, walking past any
 * stage that resolves to nobody (an on-leave approver with a "skip" fallback,
 * or a role with no linked employee). Without the walk a claim can park on an
 * empty desk where `canActOnStep` returns false for everyone and it is stuck
 * forever — the leave module has that hole; don't inherit it.
 *
 * Called at submission (`startIndex` 0) and after each approval.
 */
export function resolveDeskFrom(
  startIndex: number,
  stages: ExpenseStage[],
  templateSteps: ApprovalChainStep[],
  submitter: ApprovalSubmitter,
  bundle: LocaleBundle | null,
): ExpenseDesk {
  const skipped: ExpenseStage[] = [];
  const ordered = [...templateSteps].sort((a, b) => a.order - b.order);

  for (let i = Math.max(0, startIndex); i < stages.length; i++) {
    const stage = stages[i];
    const step =
      ordered.find((s) => s.id === stage.stepId) ??
      // No template (default stages) — synthesise a step so the resolver can
      // still do its job, defaulting to the same fallback the seeds use.
      ({
        id: stage.stepId,
        order: i + 1,
        label: stage.label,
        approver: stage.approver,
        required: true,
        onLeaveAction: { kind: "skip" },
      } satisfies ApprovalChainStep);

    const resolved = resolveStepWithOnLeave(step, submitter, bundle);
    if (resolved.approverEmployeeId || !resolved.skipped) {
      return {
        stageIndex: i,
        approverEmployeeId: resolved.approverEmployeeId,
        approverName: resolved.approverName,
        skipped,
      };
    }
    skipped.push(stage);
  }

  return {
    stageIndex: stages.length,
    approverEmployeeId: null,
    approverName: null,
    skipped,
  };
}

/**
 * Is this claim waiting on *me*? Mirrors `isCurrentApprover` in the approvals
 * hub: the resolved approver is checked against the live template step, so the
 * `ROLE:` branch still lets any Finance user clear a Finance stage.
 */
export function isOnMyDesk(
  claim: ExpenseClaim,
  stages: ExpenseStage[],
  userEmployeeId: string | undefined,
  userRoleId: string | undefined,
): boolean {
  if (!isClaimOpen(claim.status)) return false;
  const stage = currentExpenseStage(claim, stages);
  if (!stage) return false;
  return canActOnStep(
    stage.approver,
    claim.currentApproverEmployeeId ?? null,
    userEmployeeId,
    userRoleId,
  );
}

/**
 * True when the resolved approver can't actually act — terminated, or never
 * resolved at all. `isOnLeave` only covers `on_leave`, so without this a claim
 * can sit on a departed employee's desk indefinitely. Surfaced in the UI so HR
 * knows an override is needed rather than the claim looking merely slow.
 */
export function approverUnavailable(
  claim: ExpenseClaim,
  bundle: LocaleBundle | null,
): boolean {
  if (!isClaimOpen(claim.status)) return false;
  const id = claim.currentApproverEmployeeId;
  if (!id) return true;
  if (!bundle) return false;
  const employee = bundle.employees.find((e) => e.id === id);
  return !employee || employee.status !== "active";
}
