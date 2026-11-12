import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface DiversityBreakdownDto {
  field: DiversityField;
  label: string;
  rows: DiversityTally[];
  suppressedCount: number;
  suppressedGroups: number;
  declared: number;
  fullySuppressed: boolean;
}

export interface DiversityCategoryDto {
  field: DiversityField;
  label: string;
  purpose: string;
  options: string[];
  answer?: string | null;
}

export type DiversityField =
  | "ethnicity"
  | "disability"
  | "religion"
  | "veteranStatus"
  | "caringResponsibilities";

export interface DiversityFormDto {
  categories: DiversityCategoryDto[];
  declaredAt?: string | null;
}

export interface DiversityReportDto {
  eligible: number;
  declared: number;
  declarationRatePercent: number;
  breakdowns: DiversityBreakdownDto[];
}

export interface DiversityRequest {
  ethnicity?: string | null;
  disability?: string | null;
  religion?: string | null;
  veteranStatus?: string | null;
  caringResponsibilities?: string | null;
}

export interface DiversityTally {
  label: string;
  count: number;
  percentage: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/diversity/me
export type GetMyDiversityResponse = ApiResponse<DiversityFormDto>;

// PUT /api/v1/diversity/me
export type UpdateMyDiversityResponse = ApiResponse<DiversityFormDto>;

// GET /api/v1/diversity/report
export type GetDiversityReportResponse = ApiResponse<DiversityReportDto>;

export interface GetDiversityReportParams {
  DepartmentId?: string;
  BranchId?: string;
  EmployeeIds?: string[];
}
