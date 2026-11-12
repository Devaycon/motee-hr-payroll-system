import type {
  ContractDuration as ApiContractDuration,
  EmploymentTypeDto,
  EmploymentTypeRequest,
  PayFrequency as ApiPayFrequency,
} from "@/src/types/employment-types";
import type {
  ContractDuration,
  EmploymentTypeRow,
  NewEmploymentType,
  PayFrequency,
} from "@/src/lib/types/employment-types";

/** The screens use snake_case codes; the API spells them in camelCase. */
const PAY_FROM_API: Record<ApiPayFrequency, PayFrequency> = {
  weekly: "weekly",
  biWeekly: "bi_weekly",
  semiMonthly: "semi_monthly",
  monthly: "monthly",
};

const CONTRACT_FROM_API: Record<ApiContractDuration, ContractDuration> = {
  permanent: "permanent",
  fixed1Year: "fixed_1y",
  fixed2Years: "fixed_2y",
  fixed3Years: "fixed_3y",
  contract3Months: "contract_3m",
  contract6Months: "contract_6m",
};

const invert = <K extends string, V extends string>(m: Record<K, V>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<V, K>;

const PAY_TO_API = invert(PAY_FROM_API);
const CONTRACT_TO_API = invert(CONTRACT_FROM_API);

/** "25 days/year", "25 days" or "25" → 25. Blank or wordy text → null. */
export function leaveDaysFrom(text: string): number | null {
  const match = /\d+(?:\.\d+)?/.exec(text ?? "");
  return match ? Number(match[0]) : null;
}

export function employmentTypeFromApi(dto: EmploymentTypeDto): EmploymentTypeRow {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    payFrequency: PAY_FROM_API[dto.payFrequency] ?? "monthly",
    contractDuration: CONTRACT_FROM_API[dto.contractDuration] ?? "permanent",
    leaveEntitlement:
      dto.defaultLeaveDays != null ? `${dto.defaultLeaveDays} days/year` : "",
    payrollInclusion: dto.payrollInclusion,
    workingHours: {
      enabled: dto.hoursPerWeek != null,
      hoursPerWeek: dto.hoursPerWeek ?? 0,
      flexibleHours: dto.flexibleHours,
    },
    probationPeriod: {
      enabled: dto.probationMonths > 0,
      durationMonths: dto.probationMonths,
      reviewRequired: dto.probationReviewRequired,
    },
    pensionContribution: {
      enabled:
        dto.pensionEmployeePercent != null || dto.pensionEmployerPercent != null,
      employeePercentage: dto.pensionEmployeePercent ?? 0,
      employerPercentage: dto.pensionEmployerPercent ?? 0,
    },
    benefits: {
      enabled: dto.eligibleForBenefits || dto.benefits.length > 0,
      available: dto.benefits,
    },
    statutoryDeductions: dto.statutoryDeductions,
    isActive: dto.isActive,
    employeeCount: dto.employeeCount,
    createdAt: dto.updatedAt.slice(0, 10),
  };
}

export function employmentTypeToApi(
  row: NewEmploymentType | EmploymentTypeRow,
  existing?: EmploymentTypeRow,
): EmploymentTypeRequest {
  const deductionsChanged =
    !existing ||
    existing.statutoryDeductions.join("|") !== row.statutoryDeductions.join("|");
  return {
    name: row.name.trim(),
    description: row.description?.trim() || null,
    payFrequency: PAY_TO_API[row.payFrequency] ?? "monthly",
    contractDuration: CONTRACT_TO_API[row.contractDuration] ?? "permanent",
    defaultLeaveDays: leaveDaysFrom(row.leaveEntitlement),
    probationMonths: row.probationPeriod.enabled
      ? row.probationPeriod.durationMonths
      : 0,
    probationReviewRequired:
      row.probationPeriod.enabled && row.probationPeriod.reviewRequired,
    hoursPerWeek: row.workingHours.enabled ? row.workingHours.hoursPerWeek : null,
    flexibleHours: row.workingHours.enabled && row.workingHours.flexibleHours,
    payrollInclusion: row.payrollInclusion,
    eligibleForBenefits: row.benefits.enabled,
    pensionEmployeePercent: row.pensionContribution.enabled
      ? row.pensionContribution.employeePercentage
      : null,
    pensionEmployerPercent: row.pensionContribution.enabled
      ? row.pensionContribution.employerPercentage
      : null,
    benefits: row.benefits.enabled ? row.benefits.available : [],
    // Only an edited list overrides the country's default deductions; an
    // empty list on a new type lets the server apply those defaults.
    statutoryDeductionOverrides:
      deductionsChanged && row.statutoryDeductions.length
        ? row.statutoryDeductions
        : null,
  };
}
