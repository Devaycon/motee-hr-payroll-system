/**
 * Employer of Record (EOR) domain types.
 *
 * EOR = a third-party provider that becomes the legal employer of a worker in
 * the worker's country, handling local payroll, taxes, statutory benefits and
 * compliance on the company's behalf. These types model the workers engaged
 * through EOR providers, the providers themselves, their compliance status and
 * the monthly invoices.
 */

export type EorProviderStatus = "active" | "inactive";

export type EorWorkerStatus =
  | "active"
  | "onboarding"
  | "offboarding"
  | "ended";

export type EorComplianceKey =
  | "contract"
  | "work_permit"
  | "tax_registration"
  | "statutory_benefits"
  | "local_id";

export type EorComplianceStatus =
  | "complete"
  | "pending"
  | "action_required"
  | "not_applicable";

export type EorInvoiceStatus = "paid" | "pending" | "overdue";

export interface EorProvider {
  id: string;
  name: string;
  initials: string;
  status: EorProviderStatus;
  /** Country names the provider can legally employ in. */
  countriesCovered: string[];
  workerCount: number;
  /** Provider management fee as a percentage of gross pay. */
  managementFeePct: number;
  /** Year the partnership started (ISO date). */
  since: string;
  website?: string;
}

export interface EorComplianceItem {
  key: EorComplianceKey;
  label: string;
  status: EorComplianceStatus;
  note?: string;
}

export interface EorWorker {
  id: string;
  /** Display name (preferred name, or legal first + last). */
  name: string;
  initials: string;
  // ── Personal ──
  title: string;
  legalFirstName: string;
  legalLastName: string;
  middleName?: string;
  preferredName?: string;
  maidenName?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  // ── Contact ──
  email: string;
  personalEmail?: string;
  phone: string;
  role: string;
  department: string;
  country: string;
  countryCode: string;
  providerId: string;
  providerName: string;
  status: EorWorkerStatus;
  startDate: string;
  endDate?: string;
  /** ISO currency code of the worker's local pay (e.g. "USD", "EUR"). */
  currency: string;
  /** Symbol for the local currency (e.g. "$", "€"). */
  currencySymbol: string;
  /** Monthly gross salary in the worker's local currency. */
  grossSalaryMonthly: number;
  /** Employer statutory costs in the worker's local currency (monthly). */
  employerCost: number;
  /** EOR provider management fee in the worker's local currency (monthly). */
  managementFee: number;
  /** Total monthly cost normalized to USD, used for aggregation/stat totals. */
  monthlyCostUsd: number;
  payFrequency: "monthly" | "bi_weekly" | "weekly";
  compliance: EorComplianceItem[];
}

export interface EorInvoice {
  id: string;
  providerId: string;
  providerName: string;
  /** Billing period label, e.g. "January 2026". */
  period: string;
  workerCount: number;
  /** All amounts are in USD. */
  grossPay: number;
  employerCosts: number;
  managementFee: number;
  total: number;
  status: EorInvoiceStatus;
  issuedAt: string;
  dueAt: string;
}
