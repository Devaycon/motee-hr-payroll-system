"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
// Self-service shows one person their own record, so it is never narrowed
// by the admin shell's branch switcher.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { departmentSizesFrom } from "@/src/lib/leave/conflicts";
import { toIso } from "@/src/lib/leave/planning";
import {
  LEAVE_REQUESTS,
  LEAVE_POLICIES,
} from "@/src/data/leave-demo";
import {
  PUBLIC_HOLIDAYS_2026,
  COMPANY_SHUTDOWNS,
} from "@/src/data/leave-calendar-demo";
import type { LeaveRequest } from "@/src/lib/types/leave";

/**
 * Everything the planning engine needs about *this* employee's team, resolved
 * once so the insights panel and the request form can't disagree about who is
 * away or how big the team is.
 */
export interface LeavePlanningContext {
  today: string;
  employeeName?: string;
  department: string;
  teamSize: number;
  allRequests: readonly LeaveRequest[];
  holidays: typeof PUBLIC_HOLIDAYS_2026;
  shutdowns: typeof COMPANY_SHUTDOWNS;
  /** Days of annual leave that may be carried into next year. */
  annualCarryCap: number;
}

/**
 * Defaults to the logged-in user, but HR viewing someone else's profile passes
 * that employee in — otherwise the coverage figures would describe the wrong
 * team entirely.
 *
 * A department with no headcount in the bundle would make every coverage figure
 * read "0 of 0", which is worse than saying nothing — callers check
 * `teamSize > 0` before showing coverage.
 */
export function useLeavePlanningContext(subject?: {
  name?: string;
  department?: string;
}): LeavePlanningContext {
  const user = useAppSelector((s) => s.auth.user);
  const storeRequests = useAppSelector((s) => s.leave.requests);
  const { data: departmentSizes } = useLocaleSection((b) =>
    departmentSizesFrom(b.employees),
  );

  const subjectName = subject?.name ?? user?.name;
  const department = subject?.department ?? user?.departmentName ?? "";

  // The store is authoritative once seeded; the demo fixtures keep the employee
  // portal working before HR's leave data has loaded.
  const allRequests = storeRequests.length ? storeRequests : LEAVE_REQUESTS;

  return useMemo(
    () => ({
      today: toIso(new Date()),
      employeeName: subjectName,
      department,
      teamSize: departmentSizes?.get(department) ?? 0,
      allRequests,
      holidays: PUBLIC_HOLIDAYS_2026,
      shutdowns: COMPANY_SHUTDOWNS,
      annualCarryCap:
        LEAVE_POLICIES.find((p) => p.leaveType === "annual")?.maxCarryOverDays ?? 0,
    }),
    [subjectName, department, departmentSizes, allRequests],
  );
}
