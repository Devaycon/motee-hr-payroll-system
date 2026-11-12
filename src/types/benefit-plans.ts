import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type BenefitCategory =
  | "health"
  | "retirement"
  | "insurance"
  | "leave"
  | "financial"
  | "wellness"
  | "perks"
  | "development";

export interface BenefitCategoryCount {
  category: BenefitCategory;
  count: number;
}

export interface BenefitCoverageLevelDto {
  id: string;
  name: string;
  sequence: number;
  planCount: number;
}

export type BenefitEnrollment = "core" | "optional";

export type BenefitEntitlementState = "entitled" | "waiting" | "unknownStart";

export interface BenefitPlanDto {
  id: string;
  seedKey?: string | null;
  name: string;
  category: BenefitCategory;
  description: string;
  provider?: string | null;
  coverageLevelId?: string | null;
  coverage?: string | null;
  coverageDetails?: string | null;
  employerContributionPercent?: number | null;
  employeeContributionPercent?: number | null;
  costNote?: string | null;
  waitingPeriodDays?: number | null;
  scope: BenefitScope;
  employmentTypes: EmploymentType[];
  status: BenefitPlanStatus;
  enrollment: BenefitEnrollment;
  country?: string | null;
  canDelete: boolean;
  eligibleEmployees: number;
  updatedAt: string;
}

export interface BenefitPlanListDto {
  plans: PagedResult<BenefitPlanDto>;
  categoryCounts: BenefitCategoryCount[];
}

export interface BenefitPlanRequest {
  name: string;
  category?: BenefitCategory;
  description: string;
  provider?: string | null;
  coverage?: string | null;
  coverageDetails?: string | null;
  employerContributionPercent?: number | null;
  employeeContributionPercent?: number | null;
  costNote?: string | null;
  waitingPeriodDays?: number | null;
  scope?: BenefitScope;
  employmentTypes?: EmploymentType[] | null;
  status?: BenefitPlanStatus;
  enrollment?: BenefitEnrollment;
  country?: string | null;
}

export type BenefitPlanStatus = "draft" | "active" | "archived";

export interface BenefitPlanStatusRequest {
  status: BenefitPlanStatus;
}

export type BenefitScope = "everyone" | "employmentTypes";

export interface BenefitSummaryDto {
  plans: number;
  active: number;
  draft: number;
  archived: number;
  coreBenefits: number;
  optionalBenefits: number;
  employees: number;
  employeesWithoutEmploymentType: number;
  coveredEmployees: number;
  employeesWithoutCoreCover: number;
  averagePlansPerEmployee: number;
  byCategory: BenefitCategoryCount[];
}

export interface CoverageLevelRequest {
  name: string;
}

export interface EmployeeBenefitDto {
  plan: BenefitPlanDto;
  state: BenefitEntitlementState;
  effectiveFrom?: string | null;
}

export interface EmployeeBenefitsDto {
  employeeId: string;
  employmentType?: EmploymentType | null;
  core: EmployeeBenefitDto[];
  optional: EmployeeBenefitDto[];
}

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

// ── Per-endpoint request/response shapes ──

// GET /api/v1/benefit-plans
export type GetBenefitPlansResponse = ApiResponse<BenefitPlanListDto>;

export interface GetBenefitPlansParams {
  Status?: BenefitPlanStatus;
  Category?: BenefitCategory;
  Enrollment?: BenefitEnrollment;
  CoverageLevelId?: string;
  WithoutCoverageLevel?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/benefit-plans
export type CreateBenefitPlanResponse = ApiResponse<BenefitPlanDto>;

// GET /api/v1/benefit-plans/summary
export type GetBenefitPlansSummaryResponse = ApiResponse<BenefitSummaryDto>;

// GET /api/v1/benefit-plans/coverage-levels
export type GetCoverageLevelsResponse = ApiResponse<BenefitCoverageLevelDto[]>;

// POST /api/v1/benefit-plans/coverage-levels
export type CreateCoverageLevelResponse = ApiResponse<BenefitCoverageLevelDto>;

// PUT /api/v1/benefit-plans/coverage-levels/{id}
export type UpdateCoverageLevelResponse = ApiResponse<BenefitCoverageLevelDto>;

// DELETE /api/v1/benefit-plans/coverage-levels/{id}
export type DeleteCoverageLevelResponse = ApiResponse<null>;

// GET /api/v1/benefit-plans/employees/{employeeId}
export type GetEmployeeBenefitsResponse = ApiResponse<EmployeeBenefitsDto>;

// GET /api/v1/benefit-plans/{id}
export type GetBenefitPlanResponse = ApiResponse<BenefitPlanDto>;

// PUT /api/v1/benefit-plans/{id}
export type UpdateBenefitPlanResponse = ApiResponse<BenefitPlanDto>;

// DELETE /api/v1/benefit-plans/{id}
export type DeleteBenefitPlanResponse = ApiResponse<null>;

// POST /api/v1/benefit-plans/{id}/duplicate
export type DuplicateBenefitPlanResponse = ApiResponse<BenefitPlanDto>;

// POST /api/v1/benefit-plans/{id}/status
export type SetBenefitPlanStatusResponse = ApiResponse<BenefitPlanDto>;
