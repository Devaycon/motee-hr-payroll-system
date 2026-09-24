"use client";

import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection, useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { addRecord, updateRecord } from "@/src/lib/stores/collection-edits-slice";
import { submitApproval } from "@/src/lib/stores/approvals-slice";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import type { LocaleBundle, LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import {
  LOAN_DOCUMENT_TYPE,
  loanTypeLabel,
  monthlyRepayment,
  outstandingBalance,
  withApproval,
} from "./loans";

export interface LoanRow extends LocaleLoan {
  employee?: Pick<LocaleEmployee, "id" | "fullName" | "initials" | "departmentName" | "jobTitle" | "gender">;
  approverName?: string;
  outstanding: number;
  /** The approval request raised for this loan, when it went through the chain. */
  request?: ApprovalRequest;
}

function buildRows(
  bundle: LocaleBundle,
  edits: Parameters<typeof applyCollection>[2],
  requests: ApprovalRequest[],
): LoanRow[] {
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const byDoc = new Map(
    requests.filter((r) => r.documentType === LOAN_DOCUMENT_TYPE).map((r) => [r.documentId, r]),
  );
  return applyCollection(bundle.loans ?? [], "loans", edits)
    .filter((l) => people.has(l.employeeId))
    .map((raw) => {
      const request = byDoc.get(raw.id);
      const l = withApproval(raw, request);
      const emp = people.get(l.employeeId);
      const approverName = l.approverId
        ? people.get(l.approverId)?.fullName
        : request?.status === "approved"
          ? request.steps[request.steps.length - 1]?.resolvedEmployeeName ?? undefined
          : undefined;
      return {
        ...l,
        employee: emp,
        approverName,
        outstanding: outstandingBalance(l),
        request,
      };
    })
    .sort((a, b) => (b.requestedAt ?? "").localeCompare(a.requestedAt ?? ""));
}

/** Every loan in the viewer's scope — the HR register. */
export function useLoans(): { rows: LoanRow[]; loading: boolean } {
  const edits = useAppSelector((s) => s.collectionEdits);
  const requests = useAppSelector((s) => s.approvals.requests);
  const { data: bundle, loading } = useLocaleSection<LocaleBundle>((b) => b);
  const rows = useMemo(
    () => (bundle ? buildRows(bundle, edits, requests) : []),
    [bundle, edits, requests],
  );
  return { rows, loading };
}

/** One employee's loans — for their profile and the self-service page. */
export function useEmployeeLoanRows(employeeId: string | undefined): { rows: LoanRow[]; loading: boolean } {
  const edits = useAppSelector((s) => s.collectionEdits);
  const requests = useAppSelector((s) => s.approvals.requests);
  const { data: bundle, loading } = useUnscopedLocaleSection<LocaleBundle>((b) => b);
  const rows = useMemo(
    () =>
      bundle && employeeId
        ? buildRows(bundle, edits, requests).filter((r) => r.employeeId === employeeId)
        : [],
    [bundle, edits, requests, employeeId],
  );
  return { rows, loading };
}

export interface NewLoanInput {
  employee: Pick<LocaleEmployee, "id" | "fullName" | "initials" | "departmentName">;
  loanType: string;
  amount: number;
  repaymentMonths: number;
  purpose: string;
  currency: string;
  /** Who is raising it — the employee themselves, or HR on their behalf. */
  submitter: { employeeId: string; name: string; initials: string; departmentName: string };
  signatureDataUrl?: string;
}

export function useLoanActions() {
  const dispatch = useAppDispatch();
  const actorId = useAppSelector((s) => s.auth.user?.employeeId);

  return {
    /**
     * Records the loan as pending and sends it down the `loan_request` chain.
     * The register reads the chain's outcome, so approving it in Submissions &
     * Approvals is what activates the loan.
     */
    request(input: NewLoanInput): string {
      const id = `LOAN-${Date.now()}`;
      const record: LocaleLoan = {
        id,
        employeeId: input.employee.id,
        loanType: input.loanType,
        amount: input.amount,
        currency: input.currency,
        purpose: input.purpose,
        repaymentMonths: input.repaymentMonths,
        monthlyRepayment: monthlyRepayment(input.amount, input.repaymentMonths),
        amountRepaid: 0,
        requestedAt: new Date().toISOString().slice(0, 10),
        issuedAt: null,
        status: "pending",
        approverId: null,
      };
      dispatch(addRecord({ key: "loans", record: { ...record } }));
      void dispatch(
        submitApproval({
          documentType: LOAN_DOCUMENT_TYPE,
          documentId: id,
          documentTitle: `${loanTypeLabel(input.loanType)} — ${input.employee.fullName}`,
          documentSummary: `${input.currency} ${input.amount.toLocaleString()} over ${input.repaymentMonths} month${input.repaymentMonths === 1 ? "" : "s"} · ${input.purpose}`,
          payloadSnapshot: {
            loanType: loanTypeLabel(input.loanType),
            amount: input.amount,
            repaymentMonths: input.repaymentMonths,
            monthlyRepayment: record.monthlyRepayment,
            purpose: input.purpose,
            employee: input.employee.fullName,
          },
          submitter: input.submitter,
          submitterSignatureDataUrl: input.signatureDataUrl,
        }),
      );
      return id;
    },

    /** Direct decision on a pending loan that has no approval request (e.g. imported). */
    decide(loan: LoanRow, approve: boolean) {
      dispatch(
        updateRecord({
          key: "loans",
          id: loan.id,
          patch: approve
            ? { status: "active", issuedAt: new Date().toISOString().slice(0, 10), approverId: actorId ?? null }
            : { status: "rejected", approverId: actorId ?? null },
        }),
      );
    },

    /** Record a repayment received outside payroll (cash, transfer). Closes the loan when cleared. */
    recordRepayment(loan: LoanRow, amount: number) {
      const repaid = Math.min(loan.amount, Math.round((loan.amountRepaid + amount) * 100) / 100);
      dispatch(
        updateRecord({
          key: "loans",
          id: loan.id,
          patch: {
            amountRepaid: repaid,
            // Pin the chain's outcome onto the record once money moves.
            status: repaid >= loan.amount ? "closed" : loan.status === "defaulted" ? "defaulted" : "active",
            issuedAt: loan.issuedAt,
          },
        }),
      );
    },

    setStatus(loan: LoanRow, status: LocaleLoan["status"]) {
      dispatch(updateRecord({ key: "loans", id: loan.id, patch: { status, issuedAt: loan.issuedAt } }));
    },
  };
}
