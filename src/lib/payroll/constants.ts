import type { PayrollRunStatus } from "./types";

export const PAYROLL_DOCUMENT_TYPE = "payroll_run";
export const PAYROLL_HREF = "/time-payroll/payroll";
export const PAYROLL_MODULE = "time-payroll.payroll";
export const PAYROLL_SETTINGS_MODULE = "time-payroll.payroll-settings";
export const ESS_PAYSLIPS_HREF = "/employee/payslips";

export const RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: "Draft",
  in_review: "Awaiting approval",
  approved: "Approved",
  finalized: "Finalized",
  disbursed: "Paid",
};

export const RUN_STATUS_STYLES: Record<PayrollRunStatus, string> = {
  draft: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  in_review: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  approved: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  finalized: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  disbursed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
};

/** The pipeline every run walks, in order. */
export const RUN_PIPELINE: { status: PayrollRunStatus; label: string }[] = [
  { status: "draft", label: "Prepare & validate" },
  { status: "in_review", label: "Approval" },
  { status: "approved", label: "Approved" },
  { status: "finalized", label: "Finalized & payslips issued" },
  { status: "disbursed", label: "Paid" },
];

export function hrPayslipHref(employeeId: string, payslipId: string): string {
  return `/organization/employees/${employeeId}/payslips/${encodeURIComponent(payslipId)}`;
}

export function essPayslipHref(payslipId: string): string {
  return `${ESS_PAYSLIPS_HREF}/${encodeURIComponent(payslipId)}`;
}

export function verifyHref(code: string): string {
  return `/verify/payslip/${code}`;
}
