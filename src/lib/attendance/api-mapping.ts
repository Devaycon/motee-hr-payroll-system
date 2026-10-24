import type {
  AttendanceDayDto,
  AttendanceStatus as ApiAttendanceStatus,
  LogAttendanceRequest,
  TimesheetDto,
  WorkingHoursDto,
  WorkLocation as ApiWorkLocation,
  WorkScheduleDto,
  WorkScheduleRequest,
} from "@/src/types/attendance";
import {
  isoDateOf,
  parseIsoDate,
  workDayLabel,
  type AttendanceRecord,
  type AttendanceStatus,
  type DailyEntry,
  type NewAttendanceRecord,
  type NewWorkSchedule,
  type TimesheetRecord,
  type WorkDay,
  type WorkSchedule,
} from "@/src/lib/types/attendance";
import { formatTimeHHMM, timeOnDate } from "@/src/lib/utils/format-duration";

/**
 * The API sends punches as instants and enums in camelCase; the screens hold
 * "HH:MM" wall-clock times and snake_case statuses.
 */

const STATUS_FROM_API: Record<ApiAttendanceStatus, AttendanceStatus> = {
  present: "present",
  absent: "absent",
  late: "late",
  earlyDeparture: "early_departure",
  onLeave: "on_leave",
  notClockedIn: "not_clocked_in",
};

const LOCATION_LABEL: Record<ApiWorkLocation, string> = {
  office: "Office",
  remote: "Remote",
  clientSite: "Client site",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const wallClock = (iso?: string | null) =>
  iso ? formatTimeHHMM(new Date(iso)) : undefined;

/** "09:30" on a given day, as the instant the API expects. */
const instantOn = (date: string, time?: string) =>
  time ? timeOnDate(parseIsoDate(date), time).toISOString() : null;

export function todayIso(): string {
  return isoDateOf(new Date());
}

export function toAttendanceRecord(day: AttendanceDayDto): AttendanceRecord {
  return {
    id: day.id,
    employeeId: day.employeeId,
    employeeName: day.employeeName,
    employeeInitials: initialsOf(day.employeeName),
    department: day.departmentName ?? "—",
    jobTitle: day.jobTitle ?? "",
    date: day.date,
    clockIn: wallClock(day.clockInAt),
    clockOut: wallClock(day.clockOutAt),
    breakMinutes: day.breakMinutes,
    totalHours: day.workedHours,
    overtimeHours: day.overtimeHours,
    status: STATUS_FROM_API[day.status] ?? "not_clocked_in",
    notes: day.note ?? undefined,
    location: LOCATION_LABEL[day.location],
    locationAddress: day.locationName ?? undefined,
    locationCoords:
      day.clockInCoordinates ?? day.clockOutCoordinates ?? undefined,
  };
}

/**
 * A manual entry. The server works out the status from the punches, so the
 * status picked in the form is not sent.
 */
export function recordToLogRequest(
  record: NewAttendanceRecord & { employeeId: string },
): LogAttendanceRequest {
  return {
    employeeId: record.employeeId,
    date: record.date,
    clockInAt: instantOn(record.date, record.clockIn),
    clockOutAt: instantOn(record.date, record.clockOut),
    breakMinutes: record.breakMinutes,
    location: "office",
    locationName: record.location || null,
    note: record.notes || null,
  };
}

function toDailyEntry(day: AttendanceDayDto): DailyEntry {
  return {
    date: day.date,
    day: workDayLabel(day.date),
    clockIn: wallClock(day.clockInAt),
    clockOut: wallClock(day.clockOutAt),
    breakMinutes: day.breakMinutes,
    totalHours: day.workedHours,
    overtimeHours: day.overtimeHours,
    status: STATUS_FROM_API[day.status] ?? "not_clocked_in",
  };
}

export function toTimesheetRecord(sheet: TimesheetDto): TimesheetRecord {
  const approved = sheet.status === "approved";
  return {
    id: sheet.id,
    employeeName: sheet.employeeName,
    employeeInitials: initialsOf(sheet.employeeName),
    department: sheet.departmentName ?? "—",
    weekStart: sheet.weekStart,
    weekEnd: sheet.weekEnd,
    totalHours: sheet.approvedTotalHours ?? sheet.totalHours,
    overtimeHours: sheet.approvedOvertimeHours ?? sheet.overtimeHours,
    daysPresent: sheet.daysPresent,
    daysAbsent: sheet.daysAbsent,
    daysLate: sheet.daysLate,
    status: sheet.status,
    submittedAt: sheet.submittedAt ?? undefined,
    approvedAt: approved ? (sheet.resolvedAt ?? undefined) : undefined,
    approvedBy: approved ? (sheet.resolvedByName ?? undefined) : undefined,
    rejectionReason: sheet.rejectionReason ?? undefined,
    dailyEntries: sheet.days.map(toDailyEntry),
  };
}

// The spec types schedule days as a free-form map. Full lowercase names are
// sent; any spelling of the day is accepted back.
const DAY_KEYS: Record<WorkDay, string> = {
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
  Sat: "saturday",
  Sun: "sunday",
};
const WEEK: WorkDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function workDayOf(key: string): WorkDay | undefined {
  const prefix = key.slice(0, 3).toLowerCase();
  return WEEK.find((day) => day.toLowerCase() === prefix);
}

const hhmm = (time: string) => time.slice(0, 5);
const withSeconds = (time: string) => (time.length === 5 ? `${time}:00` : time);

export function toWorkSchedule(schedule: WorkScheduleDto): WorkSchedule {
  const days = Object.entries(schedule.days)
    .map(([key, hours]) => [workDayOf(key), hours] as const)
    .filter((entry): entry is [WorkDay, WorkingHoursDto] => !!entry[0])
    .sort(([a], [b]) => WEEK.indexOf(a) - WEEK.indexOf(b));
  const first = days[0]?.[1];
  return {
    id: schedule.id,
    name: schedule.name,
    workDays: days.map(([day]) => day),
    startTime: first ? hhmm(first.start) : "",
    endTime: first ? hhmm(first.end) : "",
    breakMinutes: schedule.breakMinutes,
    assignedCount: schedule.assignedCount,
    // The API does not date schedules.
    createdAt: "",
  };
}

export function scheduleToRequest(
  schedule: NewWorkSchedule,
  existing?: WorkScheduleDto,
): WorkScheduleRequest {
  const hours: WorkingHoursDto = {
    start: withSeconds(schedule.startTime),
    end: withSeconds(schedule.endTime),
  };
  return {
    name: schedule.name,
    days: Object.fromEntries(
      schedule.workDays.map((day) => [DAY_KEYS[day], hours]),
    ),
    breakMinutes: schedule.breakMinutes,
    graceMinutes: existing?.graceMinutes,
  };
}
