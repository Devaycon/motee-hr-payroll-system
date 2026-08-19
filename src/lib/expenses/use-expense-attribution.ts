"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { attributeSeed } from "@/src/lib/stores/expenses-slice";
import type { ApprovalSubmitter } from "@/src/lib/types/approvals";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import { buildExpenseExtras } from "./demo-extras";
import { resolveDeskFrom } from "./desk";
import { isClaimOpen } from "./stages";
import { useExpenseStages, useExpenseTemplate } from "./use-expense-stages";

/**
 * Fills the submitter and chain position in on claims that predate the HR
 * review flow — the seeded demo rows, and anything already in a user's
 * localStorage. Runs once per tenant; the slice ignores repeat dispatches.
 *
 * This can't live in `employee-expenses-demo.ts`: the owner has to be a real
 * employee id from the active locale bundle (`NG-EMP-*` vs `GB-EMP-*`) or the
 * `LINE_MANAGER` step has nothing to resolve against, and the demo array is
 * shared by both tenants.
 */
export function useExpenseAttribution(): void {
  const dispatch = useAppDispatch();
  const bundle = useAppSelector((s) => s.locale.data);
  const user = useAppSelector((s) => s.auth.user);
  const ready = useAppSelector((s) => s.expenses.status === "ready");
  const attributedFor = useAppSelector((s) => s.expenses.seedAttributedFor);
  const claims = useAppSelector((s) => s.expenses.claims);
  const stages = useExpenseStages();
  const template = useExpenseTemplate();

  useEffect(() => {
    if (!ready || !bundle || !user?.employeeId) return;
    const tenantId = bundle.tenant.id;
    if (attributedFor === tenantId) return;

    const owner = {
      employeeId: user.employeeId,
      name: user.name,
      initials: user.initials,
      department: user.departmentName,
    };
    const steps = template?.steps ?? [];

    const deskFor = (claim: ExpenseClaim, submitter: ApprovalSubmitter) => {
      const desk = resolveDeskFrom(
        Math.max(0, claim.stageIndex ?? 0),
        stages,
        steps,
        submitter,
        bundle,
      );
      return { employeeId: desk.approverEmployeeId, name: desk.approverName };
    };

    const extras = buildExpenseExtras(bundle, owner.employeeId, stages.length).map(
      (claim) => {
        if (!isClaimOpen(claim.status)) return claim;
        const desk = deskFor(claim, {
          employeeId: claim.employeeId ?? owner.employeeId,
          name: claim.employeeName ?? owner.name,
          initials: claim.employeeInitials ?? "",
          departmentName: claim.department ?? "",
        });
        return {
          ...claim,
          chainTemplateId: template?.id,
          currentApproverEmployeeId: desk.employeeId,
          currentApproverName: desk.name,
        };
      },
    );

    // Claims already in the store belong to the signed-in employee, so they
    // all resolve against the same submitter.
    const submitter: ApprovalSubmitter = {
      employeeId: owner.employeeId,
      name: owner.name,
      initials: owner.initials,
      departmentName: owner.department,
    };
    const approvers: Record<
      string,
      { employeeId: string | null; name: string | null }
    > = {};
    for (const claim of claims) {
      if (isClaimOpen(claim.status)) approvers[claim.id] = deskFor(claim, submitter);
    }

    dispatch(
      attributeSeed({
        tenantId,
        owner,
        extras,
        stageCount: stages.length,
        approvers,
      }),
    );
  }, [ready, bundle, user, attributedFor, claims, stages, template, dispatch]);
}
