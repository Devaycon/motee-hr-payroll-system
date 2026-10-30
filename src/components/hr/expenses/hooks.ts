"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import {
  useExpenseStages,
  useExpenseTemplate,
} from "@/src/lib/expenses/use-expense-stages";
import { isOnMyDesk } from "@/src/lib/expenses/desk";
import { isClaimOpen, type ExpenseStage } from "@/src/lib/expenses/stages";
import {
  stagesForClaim,
  toExpenseClaim,
} from "@/src/lib/expenses/api-mapping";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import type { ApprovalChainTemplate } from "@/src/lib/types/approvals";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useDecideApprovalMutation } from "@/src/store/services/approvals";
import {
  collectionsApi,
  useGetAllExpenseClaimsQuery,
} from "@/src/store/services/collections";
import {
  useReimburseExpenseClaimMutation,
  useReturnExpenseClaimMutation,
} from "@/src/store/services/expenses";

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
 * Everything the HR expense screens read, from the API. The stages follow the
 * chain of the most recently submitted claim (its approval steps plus the
 * pay-out); the configured template is the fallback before any claim exists.
 */
export function useHrExpenseClaims(): HrExpenseContext {
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const query = useGetAllExpenseClaimsQuery(undefined, { skip });
  const claims = useMemo(
    () =>
      (query.data ?? [])
        .map(toExpenseClaim)
        .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted)),
    [query.data],
  );
  const ready = !!query.data;
  const user = useAppSelector((s) => s.auth.user);
  const templateStages = useExpenseStages();
  const stages = useMemo(() => {
    const latest = [...(query.data ?? [])]
      .filter((c) => c.review?.steps.length)
      .sort((a, b) =>
        (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt),
      )[0];
    return latest ? stagesForClaim(latest) : templateStages;
  }, [query.data, templateStages]);
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

/**
 * Decisions on a claim. Approve and reject go to the claim's server approval;
 * once that has cleared, approving again is the pay-out. Each resolves true
 * once the server has accepted it.
 */
export function useExpenseDecisions() {
  const { data } = collectionsApi.endpoints.getAllExpenseClaims.useQueryState();
  const [decide] = useDecideApprovalMutation();
  const [reimburse] = useReimburseExpenseClaimMutation();
  const [sendBack] = useReturnExpenseClaimMutation();

  return useMemo(() => {
    const byId = new Map((data ?? []).map((c) => [c.id, c]));
    const attempt = async (run: () => Promise<unknown>, fallback: string) => {
      try {
        await run();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };
    const decideOn = (
      id: string,
      decision: "approved" | "rejected",
      note: string | undefined,
      fallback: string,
    ) => {
      const approvalId = byId.get(id)?.review?.id;
      if (!approvalId) {
        toast.error("This claim has no approval to decide.");
        return Promise.resolve(false);
      }
      return attempt(
        () =>
          decide({ id: approvalId, body: { decision, note: note || null } }).unwrap(),
        fallback,
      );
    };

    return {
      approve(claim: ExpenseClaim, note?: string) {
        if (claim.status === "approved") {
          return attempt(
            () => reimburse(claim.id).unwrap(),
            "Could not reimburse the claim.",
          );
        }
        return decideOn(claim.id, "approved", note, "Could not approve the claim.");
      },
      reject(claim: ExpenseClaim, reason: string) {
        return decideOn(claim.id, "rejected", reason, "Could not reject the claim.");
      },
      sendBack(claim: ExpenseClaim, reason: string) {
        return attempt(
          () => sendBack({ id: claim.id, body: { reason } }).unwrap(),
          "Could not return the claim.",
        );
      },
    };
  }, [data, decide, reimburse, sendBack]);
}
