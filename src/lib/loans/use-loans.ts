"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import type { LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetAllLoansQuery } from "@/src/store/services/collections";
import {
  useApproveLoanMutation,
  useCreateLoanMutation,
  useDefaultLoanMutation,
  useDeleteLoanRepaymentMutation,
  useGetEmployeeLoansQuery,
  useGetLoanBookQuery,
  useGetLoanQuery,
  useGetMyLoansQuery,
  useRecordLoanRepaymentMutation,
  useReinstateLoanMutation,
  useRejectLoanMutation,
} from "@/src/store/services/loans";
import type {
  Instalment as ApiInstalment,
  LoanDto,
  LoanRepaymentDto,
  LoanType as ApiLoanType,
} from "@/src/types/loans";
import { outstandingBalance, type Instalment, type LoanSummary } from "./loans";

export interface LoanRow extends LocaleLoan {
  employee?: Pick<LocaleEmployee, "id" | "fullName" | "initials" | "departmentName" | "jobTitle" | "gender">;
  approverName?: string;
  outstanding: number;
  /** The approval request raised for this loan, when it went through the chain. */
  request?: ApprovalRequest;
  /** The server's schedule, when the loan was read on its own. */
  schedule?: Instalment[];
  repayments?: LoanRepaymentDto[];
  reference?: string;
}

/** The screens key loan products in snake_case; the API in camelCase. */
const TYPE_FROM_API: Record<ApiLoanType, string> = {
  staffLoan: "staff_loan",
  salaryAdvance: "salary_advance",
  cooperativeLoan: "cooperative_loan",
  emergencyLoan: "emergency_loan",
  seasonTicketLoan: "season_ticket_loan",
  employeeLoan: "employee_loan",
};
const TYPE_TO_API = Object.fromEntries(
  Object.entries(TYPE_FROM_API).map(([k, v]) => [v, k]),
) as Record<string, ApiLoanType>;

function instalmentFromApi(i: ApiInstalment): Instalment {
  return {
    number: i.number,
    dueDate: i.dueOn,
    amount: i.amount,
    balanceAfter: i.balanceAfter,
    status: i.status,
  };
}

type People = Map<string, LocaleEmployee>;

function rowFromApi(dto: LoanDto, people: People): LoanRow {
  const emp = people.get(dto.employeeId);
  const loan: LocaleLoan = {
    id: dto.id,
    employeeId: dto.employeeId,
    loanType: TYPE_FROM_API[dto.loanType] ?? dto.loanType,
    amount: dto.amount,
    currency: dto.currency,
    purpose: dto.purpose,
    repaymentMonths: dto.repaymentMonths,
    monthlyRepayment: dto.monthlyRepayment,
    amountRepaid: dto.amountRepaid,
    requestedAt: dto.requestedOn,
    issuedAt: dto.issuedOn ?? null,
    status: dto.status,
    approverId: null,
    interestRatePct: dto.interestRatePercent ?? undefined,
  };
  return {
    ...loan,
    reference: dto.reference,
    employee: emp ?? {
      id: dto.employeeId,
      fullName: dto.employeeName ?? "Unknown",
      initials: (dto.employeeName ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      departmentName: dto.departmentName ?? "—",
      jobTitle: "",
      gender: undefined as unknown as LocaleEmployee["gender"],
    },
    outstanding: dto.outstanding ?? outstandingBalance(loan),
  };
}

function usePeople(): People {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  return useMemo(() => new Map((employees ?? []).map((e) => [e.id, e])), [employees]);
}

const byNewest = (a: LoanRow, b: LoanRow) =>
  (b.requestedAt ?? "").localeCompare(a.requestedAt ?? "");

/** Every loan in the viewer's scope — the HR register. */
export function useLoans(): { rows: LoanRow[]; loading: boolean } {
  const people = usePeople();
  const { data, isLoading } = useGetAllLoansQuery();
  const rows = useMemo(
    () => (data ?? []).map((d) => rowFromApi(d, people)).sort(byNewest),
    [data, people],
  );
  return { rows, loading: isLoading };
}

/** The loan book totals for the KPI cards, as the server works them out. */
export function useLoanBook(): LoanSummary | null {
  return useGetLoanBookQuery().data?.data?.totals ?? null;
}

/**
 * One employee's loans — for their profile and the self-service page. The
 * signed-in employee reads their own through `/loans/me`.
 */
export function useEmployeeLoanRows(employeeId: string | undefined): { rows: LoanRow[]; loading: boolean } {
  const people = usePeople();
  const myId = useAppSelector((s) => s.auth.user?.employeeId);
  const self = !!employeeId && employeeId === myId;
  const mine = useGetMyLoansQuery(undefined, { skip: !self });
  const theirs = useGetEmployeeLoansQuery(employeeId ?? "", { skip: !employeeId || self });
  const query = self ? mine : theirs;
  const rows = useMemo(
    () => (query.data?.data ?? []).map((d) => rowFromApi(d, people)).sort(byNewest),
    [query.data, people],
  );
  return { rows, loading: query.isLoading };
}

/** One loan with the server's repayment schedule and repayment history. */
export function useLoanRow(loanId: string): { loan: LoanRow | undefined; loading: boolean } {
  const people = usePeople();
  const { data, isLoading } = useGetLoanQuery(loanId);
  const loan = useMemo(() => {
    const detail = data?.data;
    if (!detail) return undefined;
    return {
      ...rowFromApi(detail.loan, people),
      schedule: detail.schedule.map(instalmentFromApi),
      repayments: detail.repayments,
    };
  }, [data, people]);
  return { loan, loading: isLoading };
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

/** Each action resolves true once the server has accepted it. */
export function useLoanActions() {
  const [createLoan] = useCreateLoanMutation();
  const [approveLoan] = useApproveLoanMutation();
  const [rejectLoan] = useRejectLoanMutation();
  const [recordRepaymentMutation] = useRecordLoanRepaymentMutation();
  const [deleteRepayment] = useDeleteLoanRepaymentMutation();
  const [defaultLoan] = useDefaultLoanMutation();
  const [reinstateLoan] = useReinstateLoanMutation();

  const run = useCallback(async (call: () => Promise<unknown>, failure: string) => {
    try {
      await call();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, failure));
      return false;
    }
  }, []);

  return {
    /**
     * Records the loan as pending; the server sends it down the loan approval
     * chain, and approving it there is what activates the loan.
     */
    request: useCallback(
      (input: NewLoanInput) =>
        run(
          () =>
            createLoan({
              // Left out for the employee's own request: the server uses theirs.
              employeeId:
                input.submitter.employeeId === input.employee.id ? null : input.employee.id,
              loanType: TYPE_TO_API[input.loanType] ?? "staffLoan",
              amount: input.amount,
              repaymentMonths: input.repaymentMonths,
              purpose: input.purpose,
            }).unwrap(),
          "Could not submit the loan request.",
        ),
      [run, createLoan],
    ),

    /** Direct decision on a pending loan. */
    decide: useCallback(
      (loan: LoanRow, approve: boolean) =>
        run(
          () =>
            approve
              ? approveLoan({
                  id: loan.id,
                  body: { issuedOn: new Date().toISOString().slice(0, 10) },
                }).unwrap()
              : rejectLoan(loan.id).unwrap(),
          approve ? "Could not approve the loan." : "Could not reject the loan.",
        ),
      [run, approveLoan, rejectLoan],
    ),

    /** Record a repayment received outside payroll (cash, transfer). The server closes the loan when cleared. */
    recordRepayment: useCallback(
      (loan: LoanRow, amount: number) =>
        run(
          () =>
            recordRepaymentMutation({
              id: loan.id,
              body: {
                amount,
                paidOn: new Date().toISOString().slice(0, 10),
                method: "bankTransfer",
              },
            }).unwrap(),
          "Could not record the repayment.",
        ),
      [run, recordRepaymentMutation],
    ),

    /** Not on the approved screen yet; kept for when it is. */
    removeRepayment: useCallback(
      (loan: LoanRow, repaymentId: string) =>
        run(
          () => deleteRepayment({ id: loan.id, repaymentId }).unwrap(),
          "Could not remove the repayment.",
        ),
      [run, deleteRepayment],
    ),

    /** Defaulting, and reinstating a defaulted loan, are the two status moves the API allows. */
    setStatus: useCallback(
      (loan: LoanRow, status: LocaleLoan["status"]) =>
        run(
          () =>
            status === "defaulted"
              ? defaultLoan(loan.id).unwrap()
              : reinstateLoan(loan.id).unwrap(),
          "Could not change the loan status.",
        ),
      [run, defaultLoan, reinstateLoan],
    ),
  };
}
