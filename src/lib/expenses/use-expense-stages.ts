"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  ApprovalChainTemplate,
  ApproverResolver,
} from "@/src/lib/types/approvals";
import { expenseStagesForTemplate, type ExpenseStage } from "./stages";

const DOCUMENT_TYPE = "expense_claim";

/** The chain HR has made active for expense claims. */
export function useExpenseTemplate(): ApprovalChainTemplate | undefined {
  const templates = useAppSelector((s) => s.approvals.templates);
  return useMemo(() => {
    const forExpenses = templates.filter(
      (t) => t.documentType === DOCUMENT_TYPE,
    );
    return forExpenses.find((t) => t.isDefault) ?? forExpenses[0];
  }, [templates]);
}

/**
 * The active chain as ordered stages. Both portals use this — the employee's
 * progress tracker and the HR queue read the same chain, so they cannot
 * disagree about where a claim is.
 */
export function useExpenseStages(): ExpenseStage[] {
  const template = useExpenseTemplate();
  // Role steps resolve against the locale roles (`ROLE:ROLE-FIN`), not access
  // levels — those are a different id space and would render the raw id.
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);

  return useMemo(() => {
    const label = (approver: ApproverResolver): string => {
      if (approver === "LINE_MANAGER") return "Line manager";
      if (approver === "DEPARTMENT_HEAD") return "Department head";
      const roleId = approver.startsWith("ROLE:") ? approver.slice(5) : approver;
      return roles.find((r) => r.id === roleId)?.name ?? roleId;
    };
    return expenseStagesForTemplate(template, label);
  }, [template, roles]);
}
