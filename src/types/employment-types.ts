import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type ContractDuration =
  | "permanent"
  | "fixed1Year"
  | "fixed2Years"
  | "fixed3Years"
  | "contract3Months"
  | "contract6Months";

export type EmploymentType =
  | "fullTime"
  | "partTime"
  | "temporary"
  | "contract"
  | "freelance"
  | "internship"
  | "apprenticeship"
  | "casual"
  | "seasonal"
  | "remote"
  | "fieldBased";

export interface EmploymentTypeDto {
  id: string;
  kind?: EmploymentType | null;
  name: string;
  description?: string | null;
  payFrequency: PayFrequency;
  contractDuration: ContractDuration;
  defaultLeaveDays?: number | null;
  probationMonths: number;
  probationReviewRequired: boolean;
  hoursPerWeek?: number | null;
  flexibleHours: boolean;
  payrollInclusion: boolean;
  eligibleForBenefits: boolean;
  pensionEmployeePercent?: number | null;
  pensionEmployerPercent?: number | null;
  benefits: string[];
  statutoryDeductions: string[];
  deductionsOverridden: boolean;
  isActive: boolean;
  employeeCount: number;
  canDelete: boolean;
  updatedAt: string;
}

export interface EmploymentTypeRequest {
  name: string;
  description?: string | null;
  payFrequency?: PayFrequency;
  contractDuration?: ContractDuration;
  defaultLeaveDays?: number | null;
  probationMonths?: number;
  probationReviewRequired?: boolean;
  hoursPerWeek?: number | null;
  flexibleHours?: boolean;
  payrollInclusion?: boolean;
  eligibleForBenefits?: boolean;
  pensionEmployeePercent?: number | null;
  pensionEmployerPercent?: number | null;
  benefits?: string[] | null;
  statutoryDeductionOverrides?: string[] | null;
}

export type PayFrequency = "weekly" | "biWeekly" | "semiMonthly" | "monthly";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/employment-types
export type GetEmploymentTypesResponse = ApiResponse<EmploymentTypeDto[]>;

export interface GetEmploymentTypesParams {
  activeOnly?: boolean;
}

// POST /api/v1/employment-types
export type CreateEmploymentTypeResponse = ApiResponse<EmploymentTypeDto>;

// GET /api/v1/employment-types/{id}
export type GetEmploymentTypeResponse = ApiResponse<EmploymentTypeDto>;

// PUT /api/v1/employment-types/{id}
export type UpdateEmploymentTypeResponse = ApiResponse<EmploymentTypeDto>;

// DELETE /api/v1/employment-types/{id}
export type DeleteEmploymentTypeResponse = ApiResponse<null>;

// POST /api/v1/employment-types/{id}/deactivate
export type DeactivateEmploymentTypeResponse = ApiResponse<EmploymentTypeDto>;

// POST /api/v1/employment-types/{id}/reactivate
export type ReactivateEmploymentTypeResponse = ApiResponse<EmploymentTypeDto>;
