"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useMyEmployeeRecord } from "@/src/components/employee/profile/hooks";
import { isoDateOf } from "@/src/lib/types/attendance";
import { resolveShiftForDate } from "@/src/lib/stores/shifts-selectors";
import type { ResolvedShift } from "@/src/lib/stores/shifts-selectors";

/** The logged-in employee's id, work pattern, and loading state. */
export function useMyShiftIdentity() {
  const { data, loading } = useMyEmployeeRecord();
  return {
    employeeId: data?.id ?? null,
    workPattern: data?.employee.workPattern,
    loading,
  };
}

export function useShiftTemplates() {
  return useAppSelector((s) => s.shifts.templates);
}

export function useShiftAssignments() {
  return useAppSelector((s) => s.shifts.assignments);
}

/** The resolved shift for the logged-in employee on a given ISO date. */
export function useMyShiftForDate(date: string): ResolvedShift | null {
  const { employeeId, workPattern } = useMyShiftIdentity();
  const templates = useShiftTemplates();
  const assignments = useShiftAssignments();
  return useMemo(() => {
    if (!employeeId) return null;
    return resolveShiftForDate(
      employeeId,
      date,
      workPattern,
      templates,
      assignments,
    );
  }, [employeeId, date, workPattern, templates, assignments]);
}

/** Today's shift for the logged-in employee, plus whether identity is still loading. */
export function useMyTodayShift() {
  const { loading } = useMyShiftIdentity();
  const todayIso = isoDateOf(new Date());
  const shift = useMyShiftForDate(todayIso);
  return { shift, todayIso, loading };
}
