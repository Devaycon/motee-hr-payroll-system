import {
  employmentTypeFromApi,
  employmentTypeToApi,
} from "@/src/lib/employees/api-mapping";
import type { BenefitPlan, NewBenefitPlan } from "@/src/lib/types/benefits";
import type { CountryKey } from "@/src/lib/types/locale";
import type { BenefitPlanDto, BenefitPlanRequest } from "@/src/types/benefit-plans";

/** The API keeps ISO country codes; the screens key countries "ng" and "uk". */
function countryFromApi(code?: string | null): CountryKey | undefined {
  const c = code?.toLowerCase();
  if (!c) return undefined;
  if (c === "ng") return "ng";
  if (c === "uk" || c === "gb") return "uk";
  return undefined;
}

function countryToApi(country?: CountryKey): string | null {
  if (country === "ng") return "NG";
  if (country === "uk") return "GB";
  return null;
}

export function benefitPlanFromApi(dto: BenefitPlanDto): BenefitPlan {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    description: dto.description,
    provider: dto.provider ?? undefined,
    coverage: dto.coverage ?? undefined,
    coverageDetails: dto.coverageDetails ?? undefined,
    employerContributionPct: dto.employerContributionPercent ?? undefined,
    employeeContributionPct: dto.employeeContributionPercent ?? undefined,
    costNote: dto.costNote ?? undefined,
    waitingPeriodDays: dto.waitingPeriodDays ?? undefined,
    scope:
      dto.scope === "employmentTypes"
        ? {
            kind: "employmentType",
            types: dto.employmentTypes.map(employmentTypeFromApi),
          }
        : { kind: "all" },
    status: dto.status,
    enrollment: dto.enrollment,
    country: countryFromApi(dto.country),
    // Seeded plans can be edited or archived, but the server will not delete them.
    kind: dto.seedKey || !dto.canDelete ? "system" : "custom",
    lastModifiedBy: "—",
    lastModifiedAt: dto.updatedAt.slice(0, 10),
    createdAt: dto.updatedAt.slice(0, 10),
  };
}

export function benefitPlanToApi(
  plan: NewBenefitPlan,
  fallbackCountry?: CountryKey,
): BenefitPlanRequest {
  const restricted = plan.scope.kind === "employmentType";
  return {
    name: plan.name.trim(),
    category: plan.category,
    description: plan.description.trim(),
    provider: plan.provider?.trim() || null,
    coverage: plan.coverage || null,
    coverageDetails: plan.coverageDetails?.trim() || null,
    employerContributionPercent: plan.employerContributionPct ?? null,
    employeeContributionPercent: plan.employeeContributionPct ?? null,
    costNote: plan.costNote?.trim() || null,
    waitingPeriodDays: plan.waitingPeriodDays ?? null,
    scope: restricted ? "employmentTypes" : "everyone",
    employmentTypes:
      plan.scope.kind === "employmentType"
        ? plan.scope.types.map(employmentTypeToApi)
        : null,
    status: plan.status,
    enrollment: plan.enrollment ?? "core",
    country: countryToApi(plan.country ?? fallbackCountry),
  };
}
