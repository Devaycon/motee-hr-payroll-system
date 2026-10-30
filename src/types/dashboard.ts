import type { ApiResponse } from "./api";

export interface AttendanceDashboardDto {
  asOf: string;
  today: AttendanceTodayDto;
  absent: AttendancePersonDto[];
  late: AttendancePersonDto[];
  onLeave: AttendancePersonDto[];
  daily: AttendancePointDto[];
  weekly: WeeklyAttendancePointDto[];
  leave: LeaveBreakdownDto;
}

export interface AttendancePersonDto {
  employeeId: string;
  name: string;
  department?: string | null;
  clockInAt?: string | null;
}

export interface AttendancePointDto {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface AttendanceTodayDto {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  notClockedIn: number;
  total: number;
}

export interface BirthdayDto {
  employeeId: string;
  name: string;
  date: string;
  daysUntil: number;
}

export interface CategoryCountDto {
  label: string;
  count: number;
}

export interface HeadcountDto {
  total: number;
  newHiresThisMonth: number;
  leaversThisMonth: number;
  remote: number;
}

export interface HeadcountPointDto {
  month: string;
  headcount: number;
  joiners: number;
  leavers: number;
  net?: number;
}

export interface LeaveBreakdownDto {
  annual: LeaveKindDto;
  sick: LeaveKindDto;
  other: LeaveKindDto;
}

export interface LeaveKindDto {
  requests: number;
  days: number;
  pending: number;
}

export interface PeopleDashboardDto {
  asOf: string;
  headcount: HeadcountDto;
  upcomingBirthdays: BirthdayDto[];
  byDepartment: CategoryCountDto[];
  byEmploymentType: CategoryCountDto[];
  byGender: CategoryCountDto[];
  headcountTrend: HeadcountPointDto[];
  turnover: TurnoverDto;
}

export interface TurnoverDto {
  rate: number;
  delta: number;
  voluntary: number;
  involuntary: number;
  unclassified: number;
}

export interface WeeklyAttendancePointDto {
  weekStart: string;
  present: number;
  late: number;
  absent: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/dashboard/people
export type GetPeopleDashboardResponse = ApiResponse<PeopleDashboardDto>;

// GET /api/v1/dashboard/attendance
export type GetAttendanceDashboardResponse = ApiResponse<AttendanceDashboardDto>;
