import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface HiringRowDto {
  departmentId: string;
  departmentName: string;
  openRequisitions: number;
  openVacancies: number;
  averageDaysToFill?: number | null;
  offersExtended: number;
  offersAccepted: number;
  acceptanceRatePercent?: number | null;
  filledThisQuarter: number;
  staleVacancies: number;
  longestOpenDays: number;
}

export interface TurnoverRowDto {
  period: string;
  departmentId?: string | null;
  departmentName?: string | null;
  averageHeadcount: number;
  leavers: number;
  voluntary: number;
  involuntary: number;
  unclassified: number;
  ratePercent?: number | null;
}

export interface WorkforceOverviewDto {
  asOf: string;
  headcount: number;
  averageTenureYears: number;
  openVacancies: number;
  turnoverRatePercent?: number | null;
  leaversLastTwelveMonths: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/workforce/overview
export type GetWorkforceOverviewResponse = ApiResponse<WorkforceOverviewDto>;

// GET /api/v1/workforce/turnover
export type GetWorkforceTurnoverResponse = ApiResponse<TurnoverRowDto[]>;

export interface GetWorkforceTurnoverParams {
  Year?: number;
  DepartmentId?: string;
}

// GET /api/v1/workforce/hiring
export type GetWorkforceHiringResponse = ApiResponse<HiringRowDto[]>;

export interface GetWorkforceHiringParams {
  DepartmentId?: string;
  Months?: number;
}
