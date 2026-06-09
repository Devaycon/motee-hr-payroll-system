"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useEmployees } from "@/src/components/hr/employees/hooks";

/**
 * The logged-in user's direct reports (employees whose manager is the user).
 * Drives the employee-portal "My Team" view (read-only).
 */
export function useDirectReports() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const { data, loading } = useEmployees();
  const reports = useMemo(
    () =>
      data && employeeId
        ? data.filter((e) => e.managerId === employeeId)
        : [],
    [data, employeeId],
  );
  return { reports, loading };
}

/** Whether the logged-in user manages anyone (has at least one direct report). */
export function useHasDirectReports(): boolean {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  if (!employeeId) return false;
  return employees.some((e) => e.managerId === employeeId);
}
