import type { ApiResponse, PagedResult } from "./api";

export interface AssignWorkScheduleRequest {
  scheduleId?: string | null;
}

export interface AttendanceCorrectionDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  date: string;
  requestedClockInAt?: string | null;
  requestedClockOutAt?: string | null;
  reason: string;
  status: CorrectionStatus;
  requestedAt: string;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  resolutionNote?: string | null;
  originalClockInAt?: string | null;
  originalClockOutAt?: string | null;
}

export interface AttendanceDayDto {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  date: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  breaks: BreakIntervalDto[];
  breakMinutes: number;
  state: ClockState;
  status: AttendanceStatus;
  workedHours: number;
  scheduledHours: number;
  overtimeHours: number;
  breakShortfallMinutes: number;
  location: WorkLocation;
  locationName?: string | null;
  clockInCoordinates?: string | null;
  clockOutCoordinates?: string | null;
  source: PunchSource;
  note?: string | null;
  recordedByHand: boolean;
  scheduleName?: string | null;
}

export type AttendanceStatus =
  | "absent"
  | "present"
  | "late"
  | "earlyDeparture"
  | "onLeave"
  | "notClockedIn";

export interface AttendanceSummaryDto {
  from: string;
  to: string;
  totalHours: number;
  overtimeHours: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  daysOnLeave: number;
  punctualityRate: number;
}

export interface BreakIntervalDto {
  start: string;
  end?: string | null;
}

export interface ClockInRequest {
  location?: WorkLocation;
  locationName?: string | null;
  coordinates?: string | null;
  source?: PunchSource;
}

export interface ClockOutRequest {
  coordinates?: string | null;
  note?: string | null;
}

export type ClockState =
  | "notStarted"
  | "clockedIn"
  | "onBreak"
  | "clockedOut";

export type CorrectionStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface LogAttendanceRequest {
  employeeId: string;
  date: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  breakMinutes?: number;
  location?: WorkLocation;
  locationName?: string | null;
  note?: string | null;
}

export type PunchSource =
  | "web"
  | "mobile"
  | "biometric"
  | "manual";

export interface RejectTimesheetRequest {
  reason: string;
}

export interface RequestCorrectionRequest {
  date: string;
  clockInAt?: string | null;
  clockOutAt?: string | null;
  reason: string;
}

export interface ResolveCorrectionRequest {
  note?: string | null;
}

export interface SetWorkLocationRequest {
  location: WorkLocation;
  locationName?: string | null;
}

export interface SubmitTimesheetRequest {
  weekStart: string;
}

export interface TimesheetDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  weekStart: string;
  weekEnd: string;
  status: TimesheetStatus;
  totalHours: number;
  overtimeHours: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  days: AttendanceDayDto[];
  submittedAt?: string | null;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  rejectionReason?: string | null;
  approvedTotalHours?: number | null;
  approvedOvertimeHours?: number | null;
  changedSinceApproval: boolean;
}

export type TimesheetStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected";

export interface WorkingHoursDto {
  start: string;
  end: string;
}

export type WorkLocation =
  | "office"
  | "remote"
  | "clientSite";

export interface WorkScheduleDto {
  id: string;
  name: string;
  days: Record<string, WorkingHoursDto>;
  breakMinutes: number;
  graceMinutes: number;
  isDefault: boolean;
  isActive: boolean;
  weeklyHours: number;
  assignedCount: number;
}

export interface WorkScheduleRequest {
  name: string;
  days: Record<string, WorkingHoursDto>;
  breakMinutes?: number;
  graceMinutes?: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/attendance/mine
export type GetMyAttendanceDayResponse = ApiResponse<AttendanceDayDto>;

export interface GetMyAttendanceDayParams {
  date?: string;
}

// GET /api/v1/attendance/mine/days
export type GetMyAttendanceDaysResponse = ApiResponse<AttendanceDayDto[]>;

export interface GetMyAttendanceDaysParams {
  from?: string;
  to?: string;
}

// GET /api/v1/attendance/mine/summary
export type GetMyAttendanceSummaryResponse = ApiResponse<AttendanceSummaryDto>;

export interface GetMyAttendanceSummaryParams {
  from?: string;
  to?: string;
}

// POST /api/v1/attendance/mine/clock-in
export type ClockInResponse = ApiResponse<AttendanceDayDto>;

// POST /api/v1/attendance/mine/break/start
export type StartBreakResponse = ApiResponse<AttendanceDayDto>;

// POST /api/v1/attendance/mine/break/end
export type EndBreakResponse = ApiResponse<AttendanceDayDto>;

// POST /api/v1/attendance/mine/clock-out
export type ClockOutResponse = ApiResponse<AttendanceDayDto>;

// PUT /api/v1/attendance/mine/location
export type SetWorkLocationResponse = ApiResponse<AttendanceDayDto>;

// GET /api/v1/attendance
export type GetAttendanceResponse = ApiResponse<PagedResult<AttendanceDayDto>>;

export interface GetAttendanceParams {
  Date?: string;
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: AttendanceStatus;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/attendance/summary
export type GetAttendanceSummaryResponse = ApiResponse<AttendanceSummaryDto>;

export interface GetAttendanceSummaryParams {
  From?: string;
  To?: string;
  EmployeeId?: string;
  DepartmentId?: string;
}

// POST /api/v1/attendance/log
export type LogAttendanceResponse = ApiResponse<AttendanceDayDto>;

// GET /api/v1/attendance/corrections/mine
export type GetMyAttendanceCorrectionsResponse = ApiResponse<AttendanceCorrectionDto[]>;

// POST /api/v1/attendance/corrections/mine
export type RequestAttendanceCorrectionResponse = ApiResponse<AttendanceCorrectionDto>;

// GET /api/v1/attendance/corrections
export type GetAttendanceCorrectionsResponse = ApiResponse<PagedResult<AttendanceCorrectionDto>>;

export interface GetAttendanceCorrectionsParams {
  EmployeeId?: string;
  Status?: CorrectionStatus;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/attendance/corrections/{id}/approve
export type ApproveAttendanceCorrectionResponse = ApiResponse<AttendanceCorrectionDto>;

// POST /api/v1/attendance/corrections/{id}/reject
export type RejectAttendanceCorrectionResponse = ApiResponse<AttendanceCorrectionDto>;

// GET /api/v1/attendance/timesheets/mine
export type GetMyTimesheetResponse = ApiResponse<TimesheetDto>;

export interface GetMyTimesheetParams {
  weekStart?: string;
}

// POST /api/v1/attendance/timesheets/mine/submit
export type SubmitMyTimesheetResponse = ApiResponse<TimesheetDto>;

// GET /api/v1/attendance/timesheets
export type GetTimesheetsResponse = ApiResponse<PagedResult<TimesheetDto>>;

export interface GetTimesheetsParams {
  WeekStart?: string;
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: TimesheetStatus;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/attendance/timesheets/{id}
export type GetTimesheetResponse = ApiResponse<TimesheetDto>;

// POST /api/v1/attendance/timesheets/{id}/approve
export type ApproveTimesheetResponse = ApiResponse<TimesheetDto>;

// POST /api/v1/attendance/timesheets/{id}/reject
export type RejectTimesheetResponse = ApiResponse<TimesheetDto>;

// GET /api/v1/attendance/schedules
export type GetWorkSchedulesResponse = ApiResponse<WorkScheduleDto[]>;

// POST /api/v1/attendance/schedules
export type CreateWorkScheduleResponse = ApiResponse<WorkScheduleDto>;

// GET /api/v1/attendance/schedules/mine
export type GetMyWorkScheduleResponse = ApiResponse<WorkScheduleDto>;

// GET /api/v1/attendance/schedules/{id}
export type GetWorkScheduleResponse = ApiResponse<WorkScheduleDto>;

// PUT /api/v1/attendance/schedules/{id}
export type UpdateWorkScheduleResponse = ApiResponse<WorkScheduleDto>;

// DELETE /api/v1/attendance/schedules/{id}
export type DeleteWorkScheduleResponse = ApiResponse<null>;

// GET /api/v1/attendance/schedules/for/{employeeId}
export type GetEmployeeWorkScheduleResponse = ApiResponse<WorkScheduleDto>;

// POST /api/v1/attendance/schedules/{id}/default
export type SetDefaultWorkScheduleResponse = ApiResponse<null>;

// PUT /api/v1/attendance/schedules/employees/{employeeId}
export type AssignWorkScheduleResponse = ApiResponse<null>;
