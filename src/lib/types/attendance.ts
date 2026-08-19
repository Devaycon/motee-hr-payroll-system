/**
 * Time & attendance.
 *
 * The shapes at the top of this file describe *stored* attendance — days that
 * have already happened. The clock-session shapes and the functions below
 * describe *today*, while it is still being worked.
 *
 * Two rules hold the domain together and are worth stating because both were
 * previously fudged with constants:
 *
 *  1. **The schedule comes from the employee's contract**, never from a module
 *     default. Someone on a 4-day week or a 09:00–17:30 pattern with a 60-minute
 *     break must not be judged against a hardcoded 9-to-5. Everything here takes
 *     a `LocaleWorkPattern` and derives the day from it.
 *  2. **Elapsed time is derived, never stored.** A session records the instants
 *     it was told about (clock-in, break starts and ends, clock-out) and every
 *     duration is recomputed from those against "now". Storing a running total
 *     would drift the moment a tab sleeps or the page reloads.
 */

import type { LocaleWorkPattern } from "./locale";
import { minutesFromTime, timeOnDate } from "@/src/lib/utils/format-duration";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "early_departure"
  | "on_leave"
  | "not_clocked_in";

export type TimesheetStatus = "pending" | "submitted" | "approved" | "rejected";

export type WorkDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface DailyEntry {
  date: string;
  day: WorkDay;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  location?: string;
}

export interface NewAttendanceRecord {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
  location?: string;
}

export interface TimesheetRecord {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  overtimeHours: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  status: TimesheetStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  dailyEntries: DailyEntry[];
}

export interface WorkSchedule {
  id: string;
  name: string;
  workDays: WorkDay[];
  startTime: string;
  endTime: string;
  breakMinutes: number;
  assignedCount: number;
  createdAt: string;
}

export interface NewWorkSchedule {
  name: string;
  workDays: WorkDay[];
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

// ── live clock session ──────────────────────────────────────────────────────

export type ClockState = "idle" | "clocked_in" | "on_break" | "clocked_out";

export type WorkLocation = "office" | "remote" | "client_site";

/** How the punch reached us. Matches the `source` field on stored attendance. */
export type PunchSource = "web" | "mobile" | "biometric";

/**
 * Instants are ISO strings rather than `Date` because sessions are persisted to
 * localStorage and must survive a JSON round-trip unchanged.
 */
export interface BreakInterval {
  start: string;
  end?: string;
}

export interface ClockSession {
  employeeId: string;
  /** ISO date (YYYY-MM-DD) this session belongs to. */
  date: string;
  state: ClockState;
  clockInAt?: string;
  clockOutAt?: string;
  breaks: BreakInterval[];
  location: WorkLocation;
  /** Free-text place — a booked desk name, or the office/remote label. */
  locationName?: string;
  /** Set when the employee clocked in against a confirmed location booking. */
  bookingId?: string;
  source: PunchSource;
  note?: string;
  /**
   * Id of the row this session writes into the shared `attendance` collection,
   * so clocking out can patch the same row it created on clock-in.
   */
  logId?: string;
}

/** A request to amend a punch that has already been recorded. */
export interface CorrectionRequest {
  id: string;
  employeeId: string;
  /** The attendance row being corrected. */
  logId: string;
  date: string;
  requestedClockIn?: string;
  requestedClockOut?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface DaySchedule {
  start: string;
  end: string;
  breakMinutes: number;
}

export interface BreakComplianceResult {
  compliant: boolean;
  requiredMinutes: number;
  takenMinutes: number;
  shortfallMinutes: number;
}

// ── derivation ──────────────────────────────────────────────────────────────

/** Indexed by `Date.getDay()`, matching the keys in `LocaleWorkPattern.schedule`. */
const PATTERN_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Indexed by `Date.getDay()`, matching the `WorkDay` labels on `DailyEntry`. */
const WORK_DAY_LABELS: WorkDay[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/**
 * Parse "YYYY-MM-DD" as a *local* date.
 *
 * `new Date("2026-08-16")` is parsed as UTC midnight, which lands on the 15th
 * for anyone west of Greenwich and would silently shift the weekday. Attendance
 * is a local-calendar concept, so the components are applied by hand.
 */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isoDateOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function workDayLabel(iso: string): WorkDay {
  return WORK_DAY_LABELS[parseIsoDate(iso).getDay()];
}

/**
 * The contracted hours for one calendar day, or `null` when it is not a working
 * day for this employee (weekend, or a non-working weekday on a compressed week).
 */
export function scheduleForDay(
  pattern: LocaleWorkPattern | undefined,
  iso: string,
): DaySchedule | null {
  if (!pattern) return null;
  const key = PATTERN_DAY_KEYS[parseIsoDate(iso).getDay()];
  const day = pattern.schedule?.[key];
  if (!day) return null;
  return {
    start: day.start,
    end: day.end,
    breakMinutes: pattern.breakMinutes ?? 0,
  };
}

/** Paid hours in a scheduled day — the span minus the unpaid break. */
export function scheduledHours(schedule: DaySchedule | null): number {
  if (!schedule) return 0;
  const span = minutesFromTime(schedule.end) - minutesFromTime(schedule.start);
  return Math.max(0, (span - schedule.breakMinutes) / 60);
}

/**
 * Whether a clock-in counts as late.
 *
 * The grace period exists so a 30-second overrun is not a disciplinary data
 * point; it is applied to the scheduled start, not subtracted from the arrival.
 */
export function punchStatus(
  clockInAt: Date,
  scheduledStart: string,
  graceMinutes = 10,
): Extract<AttendanceStatus, "present" | "late"> {
  const cutoff = timeOnDate(clockInAt, scheduledStart);
  cutoff.setMinutes(cutoff.getMinutes() + graceMinutes);
  return clockInAt > cutoff ? "late" : "present";
}

/**
 * Total break seconds in a session. An open break (no `end`) is counted up to
 * `now`, or up to clock-out if the day is already closed — otherwise a session
 * that ended on a break would keep accruing break time forever.
 */
export function breakSeconds(session: ClockSession, now: Date): number {
  const ceiling =
    session.state === "clocked_out" && session.clockOutAt
      ? new Date(session.clockOutAt)
      : now;
  return session.breaks.reduce((acc, b) => {
    const start = new Date(b.start);
    const end = b.end ? new Date(b.end) : ceiling;
    return acc + Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  }, 0);
}

/** Worked seconds: elapsed since clock-in, less every break taken. */
export function workedSeconds(session: ClockSession, now: Date): number {
  if (!session.clockInAt) return 0;
  const start = new Date(session.clockInAt);
  const end =
    session.state === "clocked_out" && session.clockOutAt
      ? new Date(session.clockOutAt)
      : now;
  const elapsed = Math.floor((end.getTime() - start.getTime()) / 1000);
  return Math.max(0, elapsed - breakSeconds(session, now));
}

/** Hours beyond the contracted figure. Never negative — undertime is not overtime. */
export function overtimeHours(worked: number, contracted: number): number {
  return Math.max(0, round2(worked - contracted));
}

/**
 * Statutory-break check.
 *
 * A zero requirement is always compliant, which matters because
 * `breakMinutes` is optional on the work pattern and defaults to none.
 */
export function breakCompliance(
  takenMinutes: number,
  requiredMinutes: number,
): BreakComplianceResult {
  const shortfall = Math.max(0, Math.round(requiredMinutes - takenMinutes));
  return {
    compliant: shortfall === 0,
    requiredMinutes,
    takenMinutes: Math.round(takenMinutes),
    shortfallMinutes: shortfall,
  };
}

/** Contracted hours for a whole week, from the pattern's own schedule. */
export function contractedWeeklyHours(
  pattern: LocaleWorkPattern | undefined,
): number {
  if (!pattern) return 0;
  if (pattern.weeklyHours) return pattern.weeklyHours;
  return round2(
    Object.values(pattern.schedule ?? {}).reduce((acc, day) => {
      if (!day) return acc;
      const span = minutesFromTime(day.end) - minutesFromTime(day.start);
      return acc + Math.max(0, (span - (pattern.breakMinutes ?? 0)) / 60);
    }, 0),
  );
}

export interface WeeklyTotals {
  totalHours: number;
  overtimeHours: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
}

/** Roll a week of daily entries into the figures a timesheet header shows. */
export function weeklyTotals(
  entries: DailyEntry[],
  contractedHours: number,
): WeeklyTotals {
  const totalHours = round2(
    entries.reduce((acc, e) => acc + (e.totalHours ?? 0), 0),
  );
  return {
    totalHours,
    overtimeHours: overtimeHours(totalHours, contractedHours),
    daysPresent: entries.filter(
      (e) => e.status === "present" || e.status === "late",
    ).length,
    daysLate: entries.filter((e) => e.status === "late").length,
    daysAbsent: entries.filter((e) => e.status === "absent").length,
  };
}

/** Share of days arrived on time, as a whole percentage. 100 when nothing counts. */
export function punctualityRate(entries: DailyEntry[]): number {
  const counted = entries.filter(
    (e) => e.status === "present" || e.status === "late",
  );
  if (!counted.length) return 100;
  const onTime = counted.filter((e) => e.status === "present").length;
  return Math.round((onTime / counted.length) * 100);
}

/** Monday-anchored start of the week containing `iso`. */
export function weekStartOf(iso: string): string {
  const d = parseIsoDate(iso);
  // getDay() is Sunday-based; shift so Monday is the anchor.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return isoDateOf(d);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
