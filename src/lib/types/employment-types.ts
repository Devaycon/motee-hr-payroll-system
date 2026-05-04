export type PayFrequency = "weekly" | "bi_weekly" | "monthly" | "semi_monthly";

export type ContractDuration = "permanent" | "fixed_1y" | "fixed_2y" | "fixed_3y" | "contract_3m" | "contract_6m";

export interface WorkingHoursConfig {
  enabled: boolean;
  hoursPerWeek: number;
  flexibleHours: boolean;
}

export interface ProbationPeriodConfig {
  enabled: boolean;
  durationMonths: number;
  reviewRequired: boolean;
}

export interface PensionContribution {
  enabled: boolean;
  employeePercentage: number;
  employerPercentage: number;
}

export interface BenefitsConfig {
  enabled: boolean;
  available: string[];
}

export interface EmploymentTypeRow {
  id: string;
  name: string;
  description: string;
  payFrequency: PayFrequency;
  contractDuration: ContractDuration;
  leaveEntitlement: string;
  payrollInclusion: boolean;
  workingHours: WorkingHoursConfig;
  probationPeriod: ProbationPeriodConfig;
  pensionContribution: PensionContribution;
  benefits: BenefitsConfig;
  statutoryDeductions: string[];
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface NewEmploymentType {
  name: string;
  description: string;
  payFrequency: PayFrequency;
  contractDuration: ContractDuration;
  leaveEntitlement: string;
  payrollInclusion: boolean;
  workingHours: WorkingHoursConfig;
  probationPeriod: ProbationPeriodConfig;
  pensionContribution: PensionContribution;
  benefits: BenefitsConfig;
  statutoryDeductions: string[];
}

