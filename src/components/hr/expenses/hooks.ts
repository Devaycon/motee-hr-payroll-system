"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { useExpenseAttribution } from "@/src/lib/expenses/use-expense-attribution";
import {
  useExpenseStages,
  useExpenseTemplate,
} from "@/src/lib/expenses/use-expense-stages";
import { isOnMyDesk } from "@/src/lib/expenses/desk";
import { isClaimOpen, type ExpenseStage } from "@/src/lib/expenses/stages";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import type { ApprovalChainTemplate } from "@/src/lib/types/approvals";

export interface HrExpenseContext {
  claims: ExpenseClaim[];
  stages: ExpenseStage[];
  template: ApprovalChainTemplate | undefined;
  ready: boolean;
  /** Open claims whose current stage resolves to the signed-in user. */
  onMyDesk: ExpenseClaim[];
  /** True when this user may record a decision at all. */
  canApprove: boolean;
  /**
   * True when this user may decide a claim that isn't on their desk. Needed
   * because a chain can resolve to someone who has left or is unavailable, and
   * without an override the claim would be stuck with nobody able to move it.
   */
  canOverride: boolean;
  actor: { name: string; employeeId?: string };
}

/**
 * Everything the HR expense screens read. Deliberately the same
 * `s.expenses.claims` the employee portal writes to — the whole point of the
 * dedicated screen is that there is one copy of a claim, not a mirrored one.
 */
export function useHrExpenseClaims(): HrExpenseContext {
  useExpenseAttribution();
  const claims = useAppSelector((s) => s.expenses.claims);
  const ready = useAppSelector((s) => s.expenses.status === "ready");
  const user = useAppSelector((s) => s.auth.user);
  const stages = useExpenseStages();
  const template = useExpenseTemplate();
  const canApprove = useCan("time-payroll.expenses", "approve");
  const canOverride = useCan("time-payroll.expenses", "administer");

  const onMyDesk = useMemo(
    () =>
      claims.filter((c) => isOnMyDesk(c, stages, user?.employeeId, user?.roleId)),
    [claims, stages, user?.employeeId, user?.roleId],
  );

  return {
    claims,
    stages,
    template,
    ready,
    onMyDesk,
    canApprove,
    canOverride,
    actor: { name: user?.name ?? "HR", employeeId: user?.employeeId },
  };
}

/** Claims still moving through the chain, whoever they sit with. */
export function openClaims(claims: ExpenseClaim[]): ExpenseClaim[] {
  return claims.filter((c) => isClaimOpen(c.status));
}
