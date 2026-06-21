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

/**
 * The logged-in user's team context: who they report to (manager), their peers
 * (same manager), and their own direct reports. Drives the "My Team" view for
 * every employee — not just line managers. Falls back to a real employee in the
 * demo data when the session has no linked employee record.
 */
export function useMyTeam() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const { data, loading } = useEmployees();
  return useMemo(() => {
    if (!data || data.length === 0) {
      return { me: null, manager: null, peers: [], reports: [], loading };
    }
    // Employees who manage at least one person (mirrors the line-manager /
    // structure module, which builds the org chart from reporting lines).
    const managerIds = new Set(
      data.map((e) => e.managerId).filter((id): id is string => !!id),
    );
    const me =
      // 1) the logged-in employee, when the session is linked to one
      (employeeId ? data.find((e) => e.id === employeeId) : null) ??
      // 2) otherwise a real line manager, so the organogram is populated
      data.find((e) => managerIds.has(e.id)) ??
      // 3) fall back to anyone with a manager, then the first employee
      data.find((e) => e.managerId) ??
      data[0] ??
      null;
    if (!me) {
      return { me: null, manager: null, peers: [], reports: [], loading };
    }
    const manager = me.managerId
      ? data.find((e) => e.id === me.managerId) ?? null
      : null;
    const reports = data.filter((e) => e.managerId === me.id);
    const peers = me.managerId
      ? data.filter((e) => e.managerId === me.managerId && e.id !== me.id)
      : [];
    return { me, manager, peers, reports, loading };
  }, [data, employeeId, loading]);
}

/** Whether the logged-in user manages anyone (has at least one direct report). */
export function useHasDirectReports(): boolean {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  if (!employeeId) return false;
  return employees.some((e) => e.managerId === employeeId);
}
