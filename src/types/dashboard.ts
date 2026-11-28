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
export interface LifecycleStageDto {
  /** Stage key; the values are not listed in the spec. */
  key: string;
  count: number;
}

export interface LifecycleDashboardDto {
  asOf: string;
  stages: LifecycleStageDto[];
}

export type HrActionSeverity = "critical" | "warning" | "info";

export interface HrActionDto {
  id: string;
  title: string;
  detail?: string | null;
  severity: HrActionSeverity;
  href?: string | null;
  dueInDays?: number | null;
  employeeId?: string | null;
}

export interface HrActionCategoryDto {
  /** Underscored keys, matching the alerts file (e.g. right_to_work). */
  key: string;
  count: number;
  actions: HrActionDto[];
}

export interface HrActionsDashboardDto {
  asOf: string;
  total: number;
  critical: number;
  warning: number;
  info: number;
  categories: HrActionCategoryDto[];
}

export interface UntakenLeaveRowDto {
  employeeId: string;
  employeeName: string;
  department?: string | null;
  remaining: number;
  atRiskDays: number;
}

export interface UntakenLeaveDashboardDto {
  asOf: string;
  leaveYearEnds?: string | null;
  atRisk: UntakenLeaveRowDto[];
}

export type ClockState = "notStarted" | "clockedIn" | "onBreak" | "clockedOut";

export interface MyDayDto {
  clock: ClockState;
  clockedInAt?: string | null;
  workedHours: number;
  onLeave?: string | null;
  tasksOutstanding: number;
  tasksOverdue: number;
  pendingActions: number;
}

export interface MyPendingItemDto {
  kind: string;
  label: string;
  detail?: string | null;
  href?: string | null;
  urgent: boolean;
}

export interface TeamLeaveDto {
  employeeId: string;
  name: string;
  leaveType: string;
  returnsOn?: string | null;
}

export interface MyDashboardDto {
  asOf: string;
  today: MyDayDto;
  pending: MyPendingItemDto[];
  teamOnLeave: TeamLeaveDto[];
}

// GET /api/v1/dashboard/hr-actions
export type GetHrActionsDashboardResponse = ApiResponse<HrActionsDashboardDto>;

// GET /api/v1/dashboard/untaken-leave
export type GetUntakenLeaveDashboardResponse = ApiResponse<UntakenLeaveDashboardDto>;

// GET /api/v1/dashboard/mine
export type GetMyDashboardResponse = ApiResponse<MyDashboardDto>;

// GET /api/v1/dashboard/lifecycle
export type GetLifecycleDashboardResponse = ApiResponse<LifecycleDashboardDto>;

export type GetPeopleDashboardResponse = ApiResponse<PeopleDashboardDto>;

// GET /api/v1/dashboard/attendance
export type GetAttendanceDashboardResponse = ApiResponse<AttendanceDashboardDto>;
