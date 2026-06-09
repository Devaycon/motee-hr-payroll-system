"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "@/src/lib/types/attendance";
import type {
  LocaleAttendanceEntry,
  LocaleBundle,
} from "@/src/lib/types/locale";

function mapStatus(s: string): AttendanceStatus {
  if (s === "present" || s === "absent" || s === "late" || s === "on_leave") {
    return s;
  }
  if (s === "early_departure") return "early_departure";
  return "not_clocked_in";
}

function toRecord(
  entry: LocaleAttendanceEntry,
  bundle: LocaleBundle,
  employeesById: Map<string, LocaleBundle["employees"][number]>,
): AttendanceRecord {
  const emp = employeesById.get(entry.employeeId);
  const hours = entry.hoursWorked ?? 0;
  return {
    id: `${entry.employeeId}-${entry.date}`,
    employeeName: emp?.fullName ?? entry.employeeId,
    employeeInitials: emp?.initials ?? "??",
    department: emp?.departmentName ?? "—",
    jobTitle: emp?.jobTitle ?? "",
    date: entry.date,
    clockIn: entry.clockIn ?? undefined,
    clockOut: entry.clockOut ?? undefined,
    breakMinutes: 60,
    totalHours: hours,
    overtimeHours: hours > 8 ? Math.round((hours - 8) * 10) / 10 : 0,
    status: mapStatus(entry.status),
    location: emp?.workLocation,
    notes: bundle.tenant.timezone,
  };
}

export function useAttendanceRecords() {
  return useLocaleSection<AttendanceRecord[]>((bundle) => {
    const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
    const refDate =
      bundle._meta.referenceDate ?? new Date().toISOString().slice(0, 10);
    return bundle.attendance
      .filter((r) => r.date === refDate)
      .map((r) => toRecord(r, bundle, employeesById));
  });
}
