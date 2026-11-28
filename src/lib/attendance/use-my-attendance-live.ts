"use client";

import { useMemo } from "react";
import { useIsLive } from "@/src/lib/live/use-is-live";
import {
  attendanceStatusFromApi,
  toTimesheetRecord,
  workLocationLabel,
} from "@/src/lib/attendance/api-mapping";
import {
  useGetMyAttendanceCorrectionsQuery,
  useGetMyAttendanceDaysQuery,
  useGetMyAttendanceSummaryQuery,
  useGetMyTimesheetQuery,
  useGetMyWorkScheduleQuery,
} from "@/src/store/services/attendance";
import type { TimeLogRow } from "@/src/components/employee/attendance/hooks";
import type { TimesheetRecord } from "@/src/lib/types/attendance";
import type { LocaleWorkPattern } from "@/src/lib/types/locale";
import type {
  AttendanceSummaryDto,
  CorrectionStatus,
  WorkScheduleDto,
} from "@/src/types/attendance";

const PATTERN_KEYS: Record<string, string> = {
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat",
  sun: "sun",
};

const hhmm = (time: string) => time.slice(0, 5);

/**
 * The employee's assigned work schedule laid over their contract's pattern:
 * the schedule decides the days, hours and break; the contract keeps its
 * holiday terms.
 */
export function workPatternFromSchedule(
  schedule: WorkScheduleDto,
  base: LocaleWorkPattern | undefined,
): LocaleWorkPattern {
  const days: LocaleWorkPattern["schedule"] = {};
  for (const [key, hours] of Object.entries(schedule.days)) {
    const day = PATTERN_KEYS[key.slice(0, 3).toLowerCase()];
    if (day && hours) days[day] = { start: hhmm(hours.start), end: hhmm(hours.end) };
  }
  return {
    holidayEntitlementDays: 0,
    publicHolidayDays: 0,
    contractType: "full_time",
    ...base,
    weeklyHours: schedule.weeklyHours,
    daysPerWeek: Object.keys(days).length,
    schedule: days,
    breakMinutes: schedule.breakMinutes,
  };
}

/**
 * Signed in, the employee's own attendance from the API, for My Attendance:
 *
 * - days        ← GET /attendance/mine/days?from&to   (history for the weeks shown)
 * - summary     ← GET /attendance/mine/summary         (this week's totals)
 * - timesheet   ← GET /attendance/timesheets/mine?weekStart
 * - corrections ← GET /attendance/corrections/mine     (status per day)
 * - schedule    ← GET /attendance/schedules/mine       (their working hours)
 *
 * Everything is null/undefined signed out, so the page keeps its demo data.
 */
export function useMyAttendanceLive(args: {
  employeeId: string | null;
  from: string;
  to: string;
  thisWeekStart: string;
  activeWeekStart: string;
  basePattern: LocaleWorkPattern | undefined;
}) {
  const live = useIsLive() && !!args.employeeId;
  const skip = { skip: !live };
  const days = useGetMyAttendanceDaysQuery({ from: args.from, to: args.to }, skip);
  const summary = useGetMyAttendanceSummaryQuery(
    { from: args.thisWeekStart, to: args.to },
    skip,
  );
  const timesheet = useGetMyTimesheetQuery({ weekStart: args.activeWeekStart }, skip);
  const corrections = useGetMyAttendanceCorrectionsQuery(undefined, skip);
  const schedule = useGetMyWorkScheduleQuery(undefined, skip);

  const logs = useMemo<TimeLogRow[] | null>(
    () =>
      live && days.data
        ? days.data.data.map((d) => ({
            id: d.id,
            employeeId: d.employeeId,
            date: d.date.slice(0, 10),
            clockIn: d.clockInAt ?? null,
            clockOut: d.clockOutAt ?? null,
            hoursWorked: d.workedHours,
            status: attendanceStatusFromApi(d.status),
            location: workLocationLabel(d),
            source: d.source,
            clockInCoords: d.clockInCoordinates ?? undefined,
            clockOutCoords: d.clockOutCoordinates ?? undefined,
          }))
        : null,
    [live, days.data],
  );

  const sheet = useMemo<TimesheetRecord | null>(() => {
    const dto = timesheet.data?.data;
    // A week nobody has submitted yet is still the employee's to fill in.
    return live && dto && dto.status !== "pending" ? toTimesheetRecord(dto) : null;
  }, [live, timesheet.data]);

  const correctionsByDate = useMemo<Record<string, CorrectionStatus>>(() => {
    const out: Record<string, CorrectionStatus> = {};
    // Newest request for a day wins.
    const list = [...(corrections.data?.data ?? [])].sort((a, b) =>
      a.requestedAt.localeCompare(b.requestedAt),
    );
    for (const c of list) out[c.date.slice(0, 10)] = c.status;
    return out;
  }, [corrections.data]);

  const workPattern = useMemo(
    () =>
      live && schedule.data?.data
        ? workPatternFromSchedule(schedule.data.data, args.basePattern)
        : undefined,
    [live, schedule.data, args.basePattern],
  );

  return {
    live,
    logs,
    summary: (live ? summary.data?.data : undefined) as AttendanceSummaryDto | undefined,
    timesheet: sheet,
    timesheetLoaded: live && !!timesheet.data,
    correctionsByDate,
    workPattern,
    graceMinutes: live ? schedule.data?.data.graceMinutes : undefined,
  };
}
