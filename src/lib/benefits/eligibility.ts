import {
  employmentTypeFromName,
  type EmploymentType,
} from "@/src/lib/constants/employment-types";
import type { BenefitPlan, BenefitScope } from "@/src/lib/types/benefits";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

/**
 * An employee's `employmentTypeId` is a raw id local to the active locale
 * bundle. Benefit plans scope by the canonical {@link EmploymentType} instead
 * so a seeded plan resolves the same way regardless of which bundle (NG, UK,
 * ...) is active — normalising through the type's name is the same trick
 * `employmentTypeFromName` exists for elsewhere in the app.
 */
export function resolveEmployeeEmploymentType(
  employee: Pick<LocaleEmployee, "employmentTypeId">,
  bundle: Pick<LocaleBundle, "employmentTypes">,
): EmploymentType {
  const row = bundle.employmentTypes.find(
    (t) => t.id === employee.employmentTypeId,
  );
  return employmentTypeFromName(row?.name);
}

export function scopeIncludesType(
  scope: BenefitScope,
  type: EmploymentType,
): boolean {
  return scope.kind === "all" || scope.types.includes(type);
}

export function isEligibleForPlan(
  plan: BenefitPlan,
  employee: Pick<LocaleEmployee, "employmentTypeId">,
  bundle: Pick<LocaleBundle, "employmentTypes">,
): boolean {
  if (plan.status !== "active") return false;
  return scopeIncludesType(
    plan.scope,
    resolveEmployeeEmploymentType(employee, bundle),
  );
}

/** Active plans a single employee is entitled to, for the profile view. */
export function eligiblePlansFor(
  plans: BenefitPlan[],
  employee: Pick<LocaleEmployee, "employmentTypeId">,
  bundle: Pick<LocaleBundle, "employmentTypes">,
): BenefitPlan[] {
  return plans.filter((p) => isEligibleForPlan(p, employee, bundle));
}

/** How many employees a plan currently covers, for the admin hub's stats. */
export function countEligibleEmployees(
  plan: BenefitPlan,
  employees: Array<Pick<LocaleEmployee, "employmentTypeId">>,
  bundle: Pick<LocaleBundle, "employmentTypes">,
): number {
  return employees.filter((e) => isEligibleForPlan(plan, e, bundle)).length;
}
