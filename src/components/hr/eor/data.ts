import type {
  EorWorkerStatus,
  EorProviderStatus,
  EorComplianceStatus,
  EorComplianceKey,
  EorInvoiceStatus,
} from "./types";
import { NATIONALITIES } from "@/src/config/system-data";

export { EOR_PROVIDERS, EOR_WORKERS, EOR_INVOICES } from "@/src/data/eor-demo";

export const EOR_WORKER_STATUS_LABELS: Record<EorWorkerStatus, string> = {
  active: "Active",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  ended: "Ended",
};

export const EOR_WORKER_STATUS_STYLES: Record<EorWorkerStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  onboarding: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  offboarding: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  ended: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const EOR_PROVIDER_STATUS_LABELS: Record<EorProviderStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const EOR_PROVIDER_STATUS_STYLES: Record<EorProviderStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const EOR_COMPLIANCE_LABELS: Record<EorComplianceStatus, string> = {
  complete: "Complete",
  pending: "Pending",
  action_required: "Action required",
  not_applicable: "N/A",
};

export const EOR_COMPLIANCE_STYLES: Record<EorComplianceStatus, string> = {
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  action_required: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  not_applicable: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export const EOR_INVOICE_STATUS_LABELS: Record<EorInvoiceStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
};

export const EOR_INVOICE_STATUS_STYLES: Record<EorInvoiceStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
};

export const EOR_WORKER_STATUS_OPTIONS: { value: EorWorkerStatus; label: string }[] =
  (Object.keys(EOR_WORKER_STATUS_LABELS) as EorWorkerStatus[]).map((value) => ({
    value,
    label: EOR_WORKER_STATUS_LABELS[value],
  }));

/** Common pay currencies for EOR workers (code → symbol). */
export const EOR_CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "USD — US Dollar" },
  { code: "GBP", symbol: "£", label: "GBP — British Pound" },
  { code: "EUR", symbol: "€", label: "EUR — Euro" },
  { code: "CAD", symbol: "C$", label: "CAD — Canadian Dollar" },
  { code: "INR", symbol: "₹", label: "INR — Indian Rupee" },
  { code: "KES", symbol: "KSh", label: "KES — Kenyan Shilling" },
  { code: "PHP", symbol: "₱", label: "PHP — Philippine Peso" },
  { code: "BRL", symbol: "R$", label: "BRL — Brazilian Real" },
  { code: "NGN", symbol: "₦", label: "NGN — Nigerian Naira" },
];

export function currencySymbolFor(code: string): string {
  return EOR_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

// ── Personal field options (mirrors the employee profile) ──
export const TITLE_OPTIONS = ["Dr", "Mr", "Mrs", "Miss", "Ms"];
export const GENDER_OPTIONS = ["male", "female", "other", "prefer not to say"];
export const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Separated",
  "Widowed",
];
export const NATIONALITY_OPTIONS = NATIONALITIES;
export const PAY_FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "bi_weekly", label: "Bi-weekly" },
  { value: "weekly", label: "Weekly" },
];

export const EOR_COMPLIANCE_FIELDS: { key: EorComplianceKey; label: string }[] = [
  { key: "contract", label: "Employment contract" },
  { key: "work_permit", label: "Work permit / right to work" },
  { key: "tax_registration", label: "Local tax registration" },
  { key: "statutory_benefits", label: "Statutory benefits enrolment" },
  { key: "local_id", label: "Local ID / verification" },
];

export const EOR_COMPLIANCE_STATUS_OPTIONS: {
  value: EorComplianceStatus;
  label: string;
}[] = (Object.keys(EOR_COMPLIANCE_LABELS) as EorComplianceStatus[]).map(
  (value) => ({ value, label: EOR_COMPLIANCE_LABELS[value] }),
);

/** Format a USD amount with thousands separators (EOR billing currency). */
export function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}
