import type { ApprovalRequest } from "@/src/lib/types/approvals";
import type { CountryKey, LocaleLoan } from "@/src/lib/types/locale";

/**
 * Staff Loan Register — record-keeping and tracking only (Core HR). No payroll
 * deductions happen here; once Payroll Phase 2 lands, payroll will post
 * repayments against these same records and the module becomes shared.
 */

export const LOAN_DOCUMENT_TYPE = "loan_request";
export const LOANS_HREF = "/organization/loans";

export type LoanStatus = LocaleLoan["status"];

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  pending: "Pending approval",
  active: "Active",
  closed: "Closed",
  defaulted: "Defaulted",
  rejected: "Rejected",
};

export const LOAN_STATUS_STYLES: Record<LoanStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  active: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  closed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  defaulted: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  rejected: "border-slate-400/30 bg-slate-400/10 text-slate-500",
};

export const LOAN_TYPE_LABELS: Record<string, string> = {
  staff_loan: "Staff Loan",
  salary_advance: "Salary Advance",
  cooperative_loan: "Cooperative Loan",
  emergency_loan: "Emergency Loan",
  season_ticket_loan: "Season Ticket Loan",
  employee_loan: "Employee Loan",
};

/** The loan products each country offers, in the order the form lists them. */
export const LOAN_TYPES_BY_COUNTRY: Record<CountryKey, string[]> = {
  ng: ["staff_loan", "salary_advance", "cooperative_loan", "emergency_loan"],
  uk: ["employee_loan", "season_ticket_loan", "salary_advance"],
};

export const loanTypeLabel = (t: string) => LOAN_TYPE_LABELS[t] ?? t;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Equal monthly instalments; the last absorbs rounding so the total is exact. */
export function monthlyRepayment(amount: number, months: number): number {
  return months > 0 ? round2(amount / months) : amount;
}

export function outstandingBalance(loan: Pick<LocaleLoan, "amount" | "amountRepaid" | "status">): number {
  if (loan.status === "pending" || loan.status === "rejected") return 0;
  return Math.max(0, round2(loan.amount - loan.amountRepaid));
}

export type InstalmentStatus = "paid" | "due" | "overdue" | "upcoming";

export interface Instalment {
  number: number;
  dueDate: string;
  amount: number;
  /** Balance still owed after this instalment is paid. */
  balanceAfter: number;
  status: InstalmentStatus;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function addMonthsUTC(iso: string, n: number): Date {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

/**
 * The repayment schedule: first instalment one month after issue. Instalments
 * are marked paid in order until the amount repaid runs out; an unpaid one
 * whose date has passed is overdue, and the one in the current month is due.
 */
export function repaymentSchedule(loan: LocaleLoan, today: Date = new Date()): Instalment[] {
  if (!loan.issuedAt || loan.status === "pending" || loan.status === "rejected") return [];
  const months = Math.max(1, loan.repaymentMonths);
  const each = monthlyRepayment(loan.amount, months);
  const todayIso = isoDate(today);
  const monthKey = todayIso.slice(0, 7);
  let paidBudget = loan.amountRepaid;
  let balance = loan.amount;
  const out: Instalment[] = [];
  for (let i = 1; i <= months; i++) {
    const amount = i === months ? round2(balance) : each;
    const dueDate = isoDate(addMonthsUTC(loan.issuedAt, i));
    balance = round2(balance - amount);
    const paid = paidBudget + 0.005 >= amount;
    if (paid) paidBudget = round2(paidBudget - amount);
    const status: InstalmentStatus = paid
      ? "paid"
      : dueDate.slice(0, 7) === monthKey
        ? "due"
        : dueDate < todayIso
          ? "overdue"
          : "upcoming";
    out.push({ number: i, dueDate, amount, balanceAfter: Math.max(0, balance), status });
  }
  return out;
}

/** The next unpaid instalment, if any. */
export function nextInstalment(loan: LocaleLoan, today: Date = new Date()): Instalment | null {
  return repaymentSchedule(loan, today).find((i) => i.status !== "paid") ?? null;
}

/**
 * A loan's effective record once its approval request is taken into account.
 * Loans raised through the app go through the `loan_request` chain; the chain's
 * outcome is the source of truth for whether the money was approved, and the
 * final approval date becomes the issue date.
 */
export function withApproval(loan: LocaleLoan, request?: ApprovalRequest): LocaleLoan {
  if (!request || loan.status !== "pending") return loan;
  if (request.status === "approved") {
    const approvedAt =
      [...request.history].reverse().find((h) => h.type === "approved")?.at ?? request.submittedAt;
    return { ...loan, status: "active", issuedAt: loan.issuedAt ?? approvedAt.slice(0, 10) };
  }
  if (request.status === "rejected" || request.status === "cancelled") {
    return { ...loan, status: "rejected" };
  }
  return loan;
}

export interface LoanSummary {
  activeLoans: number;
  /** Total principal of active and defaulted loans. */
  loanValue: number;
  outstanding: number;
  dueThisMonth: number;
  pending: number;
  defaulted: number;
  /** Principal repaid across every disbursed loan, 0–100. */
  recoveryRate: number;
}

export function summariseLoans(loans: LocaleLoan[], today: Date = new Date()): LoanSummary {
  const live = loans.filter((l) => l.status === "active" || l.status === "defaulted");
  const disbursed = loans.filter((l) => l.status !== "pending" && l.status !== "rejected");
  const principal = disbursed.reduce((s, l) => s + l.amount, 0);
  const repaid = disbursed.reduce((s, l) => s + Math.min(l.amount, l.amountRepaid), 0);
  return {
    activeLoans: loans.filter((l) => l.status === "active").length,
    loanValue: round2(live.reduce((s, l) => s + l.amount, 0)),
    outstanding: round2(live.reduce((s, l) => s + outstandingBalance(l), 0)),
    dueThisMonth: loans.filter(
      (l) => l.status === "active" && repaymentSchedule(l, today).some((i) => i.status === "due"),
    ).length,
    pending: loans.filter((l) => l.status === "pending").length,
    defaulted: loans.filter((l) => l.status === "defaulted").length,
    recoveryRate: principal ? Math.round((repaid / principal) * 100) : 100,
  };
}

export interface LoanTypeBreakdown {
  loanType: string;
  count: number;
  value: number;
  outstanding: number;
}

export function breakdownByType(loans: LocaleLoan[]): LoanTypeBreakdown[] {
  const m = new Map<string, LoanTypeBreakdown>();
  for (const l of loans) {
    if (l.status === "rejected") continue;
    const row = m.get(l.loanType) ?? { loanType: l.loanType, count: 0, value: 0, outstanding: 0 };
    row.count += 1;
    row.value = round2(row.value + l.amount);
    row.outstanding = round2(row.outstanding + outstandingBalance(l));
    m.set(l.loanType, row);
  }
  return [...m.values()].sort((a, b) => b.value - a.value);
}
