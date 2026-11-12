import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AssignPositionRequest {
  employeeId: string;
}

export interface PositionDto {
  id: string;
  title: string;
  departmentId?: string | null;
  departmentName?: string | null;
  grade?: string | null;
  description?: string | null;
  headcount: number;
  assigned: number;
  openingsLeft: number;
  recruiting: number;
  status: PositionStatus;
  isActive: boolean;
  holders: PositionHolderDto[];
  updatedAt: string;
}

export interface PositionHolderDto {
  employeeId: string;
  name: string;
  jobTitle?: string | null;
}

export interface PositionRequest {
  title: string;
  departmentId?: string | null;
  grade?: string | null;
  description?: string | null;
  headcount?: number;
}

export type PositionStatus = "filled" | "recruiting" | "vacant" | "inactive";

export interface PositionSummaryDto {
  positions: number;
  establishment: number;
  filled: number;
  openingsLeft: number;
  recruiting: number;
  vacant: number;
  retired: number;
  unassignedEmployees: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/positions
export type GetPositionsResponse = ApiResponse<PositionDto[]>;

export interface GetPositionsParams {
  DepartmentId?: string;
  Status?: PositionStatus;
  IncludeInactive?: boolean;
  Search?: string;
}

// POST /api/v1/positions
export type CreatePositionResponse = ApiResponse<PositionDto>;

// GET /api/v1/positions/summary
export type GetPositionsSummaryResponse = ApiResponse<PositionSummaryDto>;

// GET /api/v1/positions/{id}
export type GetPositionResponse = ApiResponse<PositionDto>;

// PUT /api/v1/positions/{id}
export type UpdatePositionResponse = ApiResponse<PositionDto>;

// DELETE /api/v1/positions/{id}
export type DeletePositionResponse = ApiResponse<null>;

// POST /api/v1/positions/{id}/assign
export type AssignPositionResponse = ApiResponse<PositionDto>;

// POST /api/v1/positions/unassign
export type UnassignPositionResponse = ApiResponse<PositionDto>;

// POST /api/v1/positions/{id}/retire
export type RetirePositionResponse = ApiResponse<PositionDto>;

// POST /api/v1/positions/{id}/restore
export type RestorePositionResponse = ApiResponse<PositionDto>;
