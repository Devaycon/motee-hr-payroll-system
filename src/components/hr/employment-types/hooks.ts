"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  EmploymentTypeRow,
  PayFrequency,
  ContractDuration,
} from "@/src/lib/types/employment-types";
import type { LocaleBundle } from "@/src/lib/types/locale";

/**
 * Statutory deductions applied to an employment type, by country.
 *
 * Nigeria (per client's payroll spec): PAYE and NHF are employee deductions;
 * Pension is employee + employer; NSITF and ITF are employer-only and apply to
 * qualifying organisations. The full set attaches to benefit-eligible (permanent)
 * staff; non-permanent types keep PAYE only (adjustable per type in the admin).
 */
function statutoryDeductionsFor(country: string, eligible: boolean): string[] {
  if (country === "ng") {
    return eligible ? ["PAYE", "Pension", "NHF", "NSITF", "ITF"] : ["PAYE"];
  }
  return eligible ? ["PAYE", "Pension"] : ["PAYE"];
}

function inferContractDuration(name: string): ContractDuration {
  const lower = name.toLowerCase();
  if (lower.includes("part-time")) return "permanent";
  if (lower.includes("contract")) return "contract_6m";
  if (lower.includes("intern")) return "contract_3m";
  if (lower.includes("nysc")) return "fixed_1y";
  return "permanent";
}

function inferPayFrequency(name: string): PayFrequency {
  const lower = name.toLowerCase();
  if (lower.includes("contract") || lower.includes("intern")) return "bi_weekly";
  return "monthly";
}

function buildEmploymentTypes(
  bundle: LocaleBundle,
  country: string,
): EmploymentTypeRow[] {
  const counts = new Map<string, number>();
  for (const e of bundle.employees) {
    counts.set(e.employmentTypeId, (counts.get(e.employmentTypeId) ?? 0) + 1);
  }
  return bundle.employmentTypes.map((t) => ({
    id: t.id,
    name: t.name,
    description: `${t.name} employment classification`,
    payFrequency: inferPayFrequency(t.name),
    contractDuration: inferContractDuration(t.name),
    leaveEntitlement: `${t.defaultLeaveDays} days/year`,
    payrollInclusion: true,
    workingHours: {
      enabled: true,
      hoursPerWeek: t.name.includes("Part-time") ? 20 : 40,
      flexibleHours: false,
    },
    probationPeriod: {
      enabled: t.probationMonths > 0,
      durationMonths: t.probationMonths,
      reviewRequired: t.probationMonths > 0,
    },
    pensionContribution: {
      enabled: t.eligibleForBenefits,
      employeePercentage: t.eligibleForBenefits ? 8 : 0,
      employerPercentage: t.eligibleForBenefits ? 10 : 0,
    },
    benefits: {
      enabled: t.eligibleForBenefits,
      available: t.eligibleForBenefits
        ? ["Health insurance", "Pension", "Annual leave"]
        : [],
    },
    statutoryDeductions: statutoryDeductionsFor(country, t.eligibleForBenefits),
    isActive: true,
    employeeCount: counts.get(t.id) ?? 0,
    createdAt: bundle.tenant.createdAt.slice(0, 10),
  }));
}

export function useEmploymentTypes() {
  const country = useAppSelector((s) => s.locale.country);
  return useLocaleSection<EmploymentTypeRow[]>((bundle) =>
    buildEmploymentTypes(bundle, country),
  );
}
