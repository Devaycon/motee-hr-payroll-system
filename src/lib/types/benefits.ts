/**
 * Standalone benefits model. HR defines a catalogue of benefit plans — some
 * granted to every employee, some restricted to specific employment types
 * (e.g. HMO for full-time staff only) — and each employee's profile resolves
 * which active plans they're entitled to from their employment type.
 */

import type { EmploymentType } from "@/src/lib/constants/employment-types";
import type { CountryKey } from "@/src/lib/types/locale";

export type BenefitCategory =
  | "health"
  | "retirement"
  | "insurance"
  | "leave"
  | "financial"
  | "wellness"
  | "perks"
  | "development";

export const BENEFIT_CATEGORY_LABELS: Record<BenefitCategory, string> = {
  health: "Health & Medical",
  retirement: "Retirement & Pension",
  insurance: "Insurance",
  leave: "Leave & Time Off",
  financial: "Financial & Allowances",
  wellness: "Wellness",
  perks: "Perks",
  development: "Learning & Development",
};

/** Tailwind badge classes per category (bg/text/border), dark-mode aware. */
export const BENEFIT_CATEGORY_STYLES: Record<BenefitCategory, string> = {
  health: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  retirement: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  insurance: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  leave: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  financial: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  wellness: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  perks: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  development: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

/** Solid dot/accent colour per category — used for the compact list accents. */
export const BENEFIT_CATEGORY_DOT: Record<BenefitCategory, string> = {
  health: "bg-rose-500",
  retirement: "bg-blue-500",
  insurance: "bg-indigo-500",
  leave: "bg-violet-500",
  financial: "bg-emerald-500",
  wellness: "bg-teal-500",
  perks: "bg-amber-500",
  development: "bg-sky-500",
};

export const BENEFIT_CATEGORY_OPTIONS: BenefitCategory[] = [
  "health",
  "retirement",
  "insurance",
  "leave",
  "financial",
  "wellness",
  "perks",
  "development",
];

/** Who a plan applies to. Restricted plans list every eligible employment type. */
export type BenefitScope =
  | { kind: "all" }
  | { kind: "employmentType"; types: EmploymentType[] };

export type BenefitPlanStatus = "draft" | "active" | "archived";

/**
 * core: every eligible employee gets it automatically (pension, HMO, NHF…).
 * optional: eligible employees opt in (staff loans, cycle-to-work…).
 */
export type BenefitEnrollment = "core" | "optional";

export const BENEFIT_ENROLLMENT_LABELS: Record<BenefitEnrollment, string> = {
  core: "Core — automatic",
  optional: "Optional — employee opts in",
};

export const BENEFIT_PLAN_STATUS_LABELS: Record<BenefitPlanStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const BENEFIT_PLAN_STATUS_STYLES: Record<BenefitPlanStatus, string> = {
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "border-border bg-muted text-muted-foreground",
};

export interface BenefitPlan {
  id: string;
  name: string;
  category: BenefitCategory;
  description: string;
  /** Insurer / administrator / scheme name, e.g. "AXA Mansard HMO". */
  provider?: string;
  /** Free text on what's covered, e.g. "Employee + spouse + 4 children". */
  coverageDetails?: string;
  /** For contributory benefits (pension, some insurance). */
  employerContributionPct?: number;
  employeeContributionPct?: number;
  /** How it's funded/paid when contribution % doesn't apply, e.g. "Fully employer-funded". */
  costNote?: string;
  /** Days of service/probation before the benefit kicks in. */
  waitingPeriodDays?: number;
  scope: BenefitScope;
  status: BenefitPlanStatus;
  /** Core (automatic) or optional (opt-in). Absent = core. */
  enrollment?: BenefitEnrollment;
  /**
   * The tenant country the plan belongs to — a Nigerian HMO means nothing to a
   * UK tenant. Absent = offered in every country.
   */
  country?: CountryKey;
  /** system = pre-made seed plan (editable, but can't be permanently deleted). */
  kind: "system" | "custom";
  lastModifiedBy: string;
  lastModifiedAt: string;
  createdAt: string;
}

export type NewBenefitPlan = Pick<
  BenefitPlan,
  | "name"
  | "category"
  | "description"
  | "provider"
  | "coverageDetails"
  | "employerContributionPct"
  | "employeeContributionPct"
  | "costNote"
  | "waitingPeriodDays"
  | "scope"
  | "status"
  | "enrollment"
  | "country"
>;

/** Plans offered in a tenant country (country-less plans apply everywhere). */
export function plansForCountry<T extends Pick<BenefitPlan, "country">>(
  plans: T[],
  country: CountryKey,
): T[] {
  return plans.filter((p) => !p.country || p.country === country);
}
