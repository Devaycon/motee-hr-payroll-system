"use client";

import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
// Self-service shows one person their own record, so it is never narrowed
// by the admin shell's branch switcher.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { addRecord, updateRecord } from "@/src/lib/stores/collection-edits-slice";
import { useMyEmployeeRecord } from "@/src/components/employee/profile/hooks";
import type {
  LocaleBundle,
  LocaleLocationBooking,
} from "@/src/lib/types/locale";
import type { AttendanceStatus, DailyEntry } from "@/src/lib/types/attendance";
import {
  isoDateOf,
  parseIsoDate,
  scheduleForDay,
  weekStartOf,
  workDayLabel,
} from "@/src/lib/types/attendance";

/**
 * The shape stored attendance actually has in the locale bundle and in the
 * `attendance` collection. It mirrors the private `RawAttendance` on the
 * employee-detail hooks and the field list in `lib/profile/collections.ts`, so
 * rows written from the clock are editable by the profile's own inline editor.
 */
export interface TimeLogRow {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  hoursWorked?: number;
  status: string;
  location?: string;
  source?: string;
}

/** The employee whose clock this is, plus their contracted pattern. */
export function useMyAttendanceIdentity() {
  const { data, loading } = useMyEmployeeRecord();
  return {
    employeeId: data?.id ?? null,
    employee: data?.employee ?? null,
    workPattern: data?.employee.workPattern,
    loading,
  };
}

/**
 * Every attendance row for the logged-in employee, with session edits merged
 * over the bundle — the same read path the profile's Time Logs tab uses, so the
 * two screens can never disagree.
 */
export function useMyTimeLogs(employeeId: string | null) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<TimeLogRow[] | null>(() => {
    if (!bundle || !employeeId) return null;
    return applyCollection(
      (bundle.attendance as unknown as TimeLogRow[]) ?? [],
      "attendance",
      edits,
    )
      .filter((r) => r.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [bundle, edits, employeeId]);
  return { data, loading, error };
}

/**
 * Location bookings for the logged-in employee, session edits merged in.
 *
 * Read through the same `applyCollection` path as `useEmployeeBookings` so a
 * desk booked from the clock widget shows up on the profile's Location Bookings
 * tab without any further plumbing.
 */
export function useMyBookings(employeeId: string | null) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<LocaleLocationBooking[] | null>(() => {
    if (!bundle || !employeeId) return null;
    return applyCollection(
      bundle.locationBookings ?? [],
      "locationBookings",
      edits,
    )
      .filter((b) => b.employeeId === employeeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [bundle, edits, employeeId]);
  return { data, loading, error };
}

/**
 * Today's *usable* bookings — confirmed, dated today, and somewhere you could
 * actually work from (a parking bay is a booking, but not a place to sit).
 *
 * The demo fixtures are dated mid-2026, so this is routinely empty; the clock
 * widget treats that as the normal case and falls back to the plain location
 * toggle rather than blocking.
 */
export function useTodayBookings(
  employeeId: string | null,
  isoToday: string,
): LocaleLocationBooking[] {
  const { data } = useMyBookings(employeeId);
  return useMemo(
    () =>
      (data ?? []).filter(
        (b) =>
          b.date === isoToday &&
          b.status === "confirmed" &&
          b.locationType !== "parking",
      ),
    [data, isoToday],
  );
}

/**
 * Writes into the shared `attendance` collection.
 *
 * A day is opened on clock-in (so an in-progress day is visible on the profile
 * straight away) and patched on clock-out, rather than only being written when
 * the day closes — someone still working is a fact worth showing.
 */
export function useTimeLogWriter() {
  const dispatch = useAppDispatch();

  const openDay = useCallback(
    (row: Omit<TimeLogRow, "id"> & { id?: string }): string => {
      const id = row.id ?? `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      dispatch(addRecord({ key: "attendance", record: { ...row, id } }));
      return id;
    },
    [dispatch],
  );

  const closeDay = useCallback(
    (id: string, patch: Partial<TimeLogRow>) => {
      dispatch(updateRecord({ key: "attendance", id, patch }));
    },
    [dispatch],
  );

  return { openDay, closeDay };
}

/** Creates a location booking that the profile's Bookings tab will pick up. */
export function useBookingWriter() {
  const dispatch = useAppDispatch();
  return useCallback(
    (booking: Omit<LocaleLocationBooking, "id">) => {
      const id = `LB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      dispatch(
        addRecord({ key: "locationBookings", record: { ...booking, id } }),
      );
      return id;
    },
    [dispatch],
  );
}

// ── week assembly ───────────────────────────────────────────────────────────

export interface WeekView {
  weekStart: string;
  weekEnd: string;
  label: string;
  entries: DailyEntry[];
}

const KNOWN_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "early_departure",
  "on_leave",
  "not_clocked_in",
];

/** Locale rows say "remote"; the UI vocabulary calls that a present day. */
function toAttendanceStatus(raw: string): AttendanceStatus {
  if (raw === "remote") return "present";
  return (KNOWN_STATUSES as string[]).includes(raw)
    ? (raw as AttendanceStatus)
    : "present";
}

function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + n);
  return isoDateOf(d);
}

/**
 * Build a Monday–Sunday week from real time logs, filling non-logged working
 * days with a `not_clocked_in` placeholder so the grid always has five rows and
 * a gap reads as a gap rather than as missing data.
 */
export function buildWeek(
  logs: TimeLogRow[],
  weekStart: string,
  pattern: Parameters<typeof scheduleForDay>[0],
): WeekView {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const entries: DailyEntry[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const schedule = scheduleForDay(pattern, date);
    const log = byDate.get(date);
    // Skip non-working days unless something was actually logged on them.
    if (!schedule && !log) continue;
    entries.push({
      date,
      day: workDayLabel(date),
      clockIn: log?.clockIn ? toHHMM(log.clockIn) : undefined,
      clockOut: log?.clockOut ? toHHMM(log.clockOut) : undefined,
      breakMinutes: schedule?.breakMinutes ?? 0,
      totalHours: log?.hoursWorked,
      status: log ? toAttendanceStatus(log.status) : "not_clocked_in",
    });
  }

  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    label: `${weekStart} – ${addDays(weekStart, 6)}`,
    entries,
  };
}

/**
 * Stored clock times are inconsistent in the fixtures — some rows hold a full
 * ISO timestamp, others a bare "HH:MM". Normalise for display either way.
 */
export function toHHMM(value: string): string {
  if (value.includes("T")) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`;
    }
  }
  return value.slice(0, 5);
}

/** The most recent `count` week-starts, newest first, ending with `isoToday`. */
export function recentWeekStarts(isoToday: string, count: number): string[] {
  const current = weekStartOf(isoToday);
  return Array.from({ length: count }, (_, i) => addDays(current, -7 * i));
}
