import type { ApiResponse } from "./api";

export interface LeaveBlackoutDto {
  id: string;
  name: string;
  reason?: string | null;
  startDate: string;
  endDate: string;
  leaveTypeIds: string[];
  leaveTypeNames: string[];
  departmentIds: string[];
  departmentNames: string[];
  isActive: boolean;
  appliesToEveryone?: boolean;
}

export interface LeaveBlackoutRequest {
  name: string;
  reason?: string | null;
  startDate: string;
  endDate: string;
  leaveTypeIds: string[];
  departmentIds?: string[];
  isActive?: boolean;
}

export interface LeavePolicyDto {
  id: string;
  description?: string | null;
  daysPerYear: number;
  minNoticeDays: number;
  maxConsecutiveDays: number;
  excludePublicHolidays: boolean;
  requiresMedicalCertificate: boolean;
  attachmentRequirement?: string | null;
  tracksBalance: boolean;
  carryOverAllowed: boolean;
  maxCarryOverDays: number;
  carryOverExpiryMonths: number;
  accruesMonthly: boolean;
  eligibility?: string | null;
  publicHolidayNote?: string | null;
  documentUrl?: string | null;
}

export interface LeavePolicyRequest {
  description?: string | null;
  daysPerYear: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  excludePublicHolidays?: boolean;
  requiresMedicalCertificate?: boolean;
  attachmentRequirement?: string | null;
  tracksBalance?: boolean;
  carryOverAllowed?: boolean;
  maxCarryOverDays?: number;
  carryOverExpiryMonths?: number;
  accruesMonthly?: boolean;
  eligibility?: string | null;
  publicHolidayNote?: string | null;
  documentUrl?: string | null;
}

export interface LeaveTypeDto {
  id: string;
  code?: string | null;
  name: string;
  isPaid: boolean;
  isActive: boolean;
  sequence: number;
  policy?: LeavePolicyDto;
  openRequests: number;
}

export interface LeaveTypeRequest {
  name: string;
  isPaid?: boolean;
  isActive?: boolean;
  policy: LeavePolicyRequest;
}

export interface PublicHolidayDto {
  id: string;
  date: string;
  name: string;
  countryCode?: string | null;
  /** False = a day of observance that does not close the business. */
  isNonWorking: boolean;
  excludedDepartmentIds: string[];
  excludedDepartmentNames: string[];
  /** Derived by the server: non-working and no departments excluded. */
  closesEveryone: boolean;
}

export interface PublicHolidayRequest {
  date: string;
  name: string;
  countryCode?: string | null;
  /** Defaults to true on the server. */
  isNonWorking?: boolean;
  /** Departments that keep working on the day. */
  excludedDepartmentIds?: string[];
}

export type GetLeaveTypesResponse = ApiResponse<LeaveTypeDto[]>;

export type CreateLeaveTypeResponse = ApiResponse<LeaveTypeDto>;

export type UpdateLeaveTypeResponse = ApiResponse<LeaveTypeDto>;

export interface UpdateLeaveTypeParams {
  id: string;
  body: LeaveTypeRequest;
}

export type DeleteLeaveTypeResponse = ApiResponse<null>;

export type GetPublicHolidaysResponse = ApiResponse<PublicHolidayDto[]>;

export interface GetPublicHolidaysParams {
  year?: number;
}

export type CreatePublicHolidayResponse = ApiResponse<PublicHolidayDto>;

export type GeneratePublicHolidaysResponse = ApiResponse<PublicHolidayDto[]>;

export type UpdatePublicHolidayResponse = ApiResponse<PublicHolidayDto>;

export type DeletePublicHolidayResponse = ApiResponse<null>;

export type GetLeaveBlackoutsResponse = ApiResponse<LeaveBlackoutDto[]>;

export type CreateLeaveBlackoutResponse = ApiResponse<LeaveBlackoutDto>;

export type UpdateLeaveBlackoutResponse = ApiResponse<LeaveBlackoutDto>;

export interface UpdateLeaveBlackoutParams {
  id: string;
  body: LeaveBlackoutRequest;
}

export type DeleteLeaveBlackoutResponse = ApiResponse<null>;
