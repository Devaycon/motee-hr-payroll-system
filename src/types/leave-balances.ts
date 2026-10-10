import type { ApiResponse, PagedResult } from "./api";

export interface LeaveAdjustmentRequest {
  employeeId: string;
  leaveTypeId: string;
  days: number;
  reason: string;
  asAt?: string | null;
}

export interface LeaveBalanceDto {
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  leaveTypeId: string;
  leaveTypeName: string;
  entitlement: number;
  accrued: number;
  carriedOver: number;
  carriedOverAvailable: number;
  carryOverExpiresOn?: string | null;
  used: number;
  pending: number;
  adjustments: number;
  available: number;
  leaveYearLabel: string;
  leaveYearStart: string;
}

export interface LeaveCarryOverDto {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  available: number;
  carried: number;
  lapsed: number;
  expiresOn?: string | null;
}

export interface LeaveYearEndResult {
  closedYearLabel: string;
  closedYearStart: string;
  nextYearStart: string;
  carriedOver: LeaveCarryOverDto[];
  daysLapsed: number;
  alreadyClosed: boolean;
  applied: boolean;
}

export type GetLeaveBalancesResponse = ApiResponse<PagedResult<LeaveBalanceDto>>;

export interface GetLeaveBalancesParams {
  DepartmentId?: string;
  LeaveTypeId?: string;
  Search?: string;
  AsAt?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type GetMyLeaveBalancesResponse = ApiResponse<LeaveBalanceDto[]>;

export interface GetMyLeaveBalancesParams {
  asAt?: string;
}

export type GetEmployeeLeaveBalancesResponse = ApiResponse<LeaveBalanceDto[]>;

export interface GetEmployeeLeaveBalancesParams {
  employeeId: string;
  asAt?: string;
}

export type AdjustLeaveBalanceResponse = ApiResponse<LeaveBalanceDto>;

export type PreviewLeaveYearEndResponse = ApiResponse<LeaveYearEndResult>;

export interface PreviewLeaveYearEndParams {
  yearContaining?: string;
}

export type CloseLeaveYearResponse = ApiResponse<LeaveYearEndResult>;

export interface CloseLeaveYearParams {
  yearContaining?: string;
}
