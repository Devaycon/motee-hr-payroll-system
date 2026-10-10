import type { ApiResponse, PagedResult } from "./api";
import type { ApprovalDto } from "./common";

export interface CancelLeaveRequest {
  reason?: string | null;
}

export interface LeaveNonWorkingDayDto {
  date: string;
  reason: string;
}

export interface LeaveQuoteDto {
  totalDays: number;
  availableBefore: number;
  availableAfter: number;
  nonWorkingDays: LeaveNonWorkingDayDto[];
  problems: LeaveRequestOutcome[];
  message?: string | null;
}

export interface LeaveQuoteRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: string | null;
  status: LeaveRequestStatus;
  reason?: string | null;
  notes?: string | null;
  reliefEmployeeId?: string | null;
  reliefEmployeeName?: string | null;
  approval?: ApprovalDto;
  submittedAt: string;
  decidedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export type LeaveRequestOutcome =
  | "succeeded"
  | "notFound"
  | "unknownLeaveType"
  | "noPolicy"
  | "invalidDates"
  | "noWorkingDays"
  | "insufficientNotice"
  | "tooLong"
  | "insufficientBalance"
  | "overlaps"
  | "blackout"
  | "notCancellable";

export type LeaveRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface LeaveRequestSubmission {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDayPeriod?: string | null;
  reason?: string | null;
  notes?: string | null;
  reliefEmployeeId?: string | null;
  fileIds?: string[];
}

export type GetLeaveRequestsResponse = ApiResponse<PagedResult<LeaveRequestDto>>;

export interface GetLeaveRequestsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  LeaveTypeId?: string;
  Status?: LeaveRequestStatus;
  From?: string;
  To?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type CreateLeaveRequestResponse = ApiResponse<LeaveRequestDto>;

export type GetMyLeaveRequestsResponse = ApiResponse<PagedResult<LeaveRequestDto>>;

export interface GetMyLeaveRequestsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  LeaveTypeId?: string;
  Status?: LeaveRequestStatus;
  From?: string;
  To?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type GetLeaveRequestResponse = ApiResponse<LeaveRequestDto>;

export type QuoteLeaveRequestResponse = ApiResponse<LeaveQuoteDto>;

export type CancelLeaveRequestResponse = ApiResponse<LeaveRequestDto>;

export interface CancelLeaveRequestParams {
  id: string;
  body?: CancelLeaveRequest;
}
