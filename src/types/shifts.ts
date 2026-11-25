import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface RosterDay {
  date: string;
  assignmentId?: string | null;
  workScheduleId?: string | null;
  shiftName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number;
  paidHours?: number;
  note?: string | null;
  state?: ShiftState;
  isRostered?: boolean;
}

export interface RosterResult {
  from: string;
  to: string;
  rows: RosterRow[];
  refusal?: ShiftRefusal;
  succeeded?: boolean;
  unrosteredDays?: number;
}

export interface RosterRow {
  employeeId: string;
  employeeName: string;
  initials?: string | null;
  department?: string | null;
  days: RosterDay[];
  unrosteredDays?: number;
  rosteredHours?: number;
}

export interface ShiftAssignmentDto {
  id: string;
  employeeId: string;
  employeeName: string;
  workScheduleId: string;
  shiftName: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes: number;
  paidHours: number;
  state: ShiftState;
  cancelledOn?: string | null;
  note?: string | null;
}

export interface ShiftAssignmentRequest {
  employeeId: string;
  workScheduleId: string;
  date: string;
  note?: string | null;
}

export type ShiftRefusal =
  "none" | "employeeNotFound" | "scheduleNotFound" | "scheduleInactive" | "notAWorkingDay" | "dateInThePast" | "alreadyAssigned" | "rangeTooWide" | "rangeBackwards";

export type ShiftState =
  "scheduled" | "worked" | "missed" | "cancelled";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/shifts/roster
export type GetShiftRosterResponse = ApiResponse<RosterResult>;
export interface GetShiftRosterParams {
  From?: string;
  To?: string;
  DepartmentId?: string;
  BranchId?: string;
  EmployeeId?: string;
  WithGaps?: boolean;
}

// GET /api/v1/shifts/mine
export type GetMyShiftsResponse = ApiResponse<RosterResult>;
export interface GetMyShiftsParams {
  from?: string;
  to?: string;
}

// POST /api/v1/shifts/assignments
export type CreateShiftAssignmentResponse = ApiResponse<ShiftAssignmentDto>;

// POST /api/v1/shifts/assignments/{id}/cancel
export type CancelShiftAssignmentResponse = ApiResponse<ShiftAssignmentDto>;

// DELETE /api/v1/shifts/assignments/{id}
export type DeleteShiftAssignmentResponse = ApiResponse<unknown | null>;

