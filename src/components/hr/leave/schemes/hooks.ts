"use client";

import { useCallback, useEffect, useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { seedLeaveSchemes } from "@/src/lib/stores/leave-schemes-slice";
import { defaultLeaveEnrolments, defaultLeaveSchemes } from "@/src/lib/leave/scheme-seeds";
import { calculateEntitlements, type EntitlementResult, type SchemeEmployee, type TakenLeave } from "@/src/lib/leave/schemes";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { LeaveScheme, LeaveSchemeEnrolment } from "@/src/lib/types/leave-schemes";

export const LEAVE_SCHEMES_BASE = "/time-payroll/leave/schemes";

export function schemeEmployee(e: LocaleEmployee): SchemeEmployee {
  return {
    startDate: e.startDate,
    employmentTypeId: e.employmentTypeId,
    daysPerWeek: e.workPattern?.daysPerWeek ?? 5,
    weeklyHours: e.workPattern?.weeklyHours ?? 37.5,
  };
}

/** Leave schemes for the signed-in tenant, seeded from defaults on first use. */
export function useLeaveSchemes() {
  const dispatch = useAppDispatch();
  const bundle = useAppSelector((s) => s.locale.data);
  const country = useAppSelector((s) => s.locale.country);
  const state = useAppSelector((s) => s.leaveSchemes);
  const leave = useAppSelector((s) => s.leave.requests);
  const tenantId = bundle?.tenant.id ?? "";

  useEffect(() => {
    if (!bundle || state.seededTenants.includes(bundle.tenant.id)) return;
    const schemes = defaultLeaveSchemes(bundle.tenant.id, country);
    dispatch(seedLeaveSchemes({ tenantId: bundle.tenant.id, schemes, enrolments: defaultLeaveEnrolments(bundle, schemes) }));
  }, [bundle, country, state.seededTenants, dispatch]);

  const schemes = useMemo(() => state.schemes.filter((s) => s.tenantId === tenantId), [state.schemes, tenantId]);
  const enrolments = useMemo(() => state.enrolments.filter((e) => e.tenantId === tenantId), [state.enrolments, tenantId]);
  const asOf = new Date().toISOString().slice(0, 10);

  const schemeFor = useCallback(
    (employeeId: string, on = asOf): { scheme: LeaveScheme | null; enrolment: LeaveSchemeEnrolment | null } => {
      const enrolment =
        enrolments
          .filter((e) => e.employeeId === employeeId && e.effectiveFrom <= on && (!e.effectiveTo || e.effectiveTo >= on))
          .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
      return { enrolment, scheme: enrolment ? schemes.find((s) => s.id === enrolment.schemeId) ?? null : null };
    },
    [enrolments, schemes, asOf],
  );

  /** This leave year's entitlement, with last year's unused days carried in. */
  const entitlementFor = useCallback(
    (employee: LocaleEmployee): EntitlementResult | null => {
      const { scheme } = schemeFor(employee.id);
      if (!scheme) return null;
      const taken: TakenLeave[] = leave
        .filter((r) => r.employeeId === employee.id && (r.status === "approved" || r.status === "pending" || r.status === "awaiting_manager" || r.status === "awaiting_hr"))
        .map((r) => ({ leaveType: r.leaveType, startDate: r.startDate, totalDays: r.totalDays, status: r.status === "approved" ? "approved" : "pending" }));
      const emp = schemeEmployee(employee);
      const thisYear = calculateEntitlements({ scheme, employee: emp, leave: taken, asOf });
      const lastYearEnd = format(subDays(parseISO(thisYear.yearStart), 1), "yyyy-MM-dd");
      const lastYear = emp.startDate <= lastYearEnd ? calculateEntitlements({ scheme, employee: emp, leave: taken, asOf: lastYearEnd }) : null;
      const lastYearRemaining = Object.fromEntries((lastYear?.lines ?? []).map((l) => [l.leaveType, l.remaining]));
      return calculateEntitlements({ scheme, employee: emp, leave: taken, asOf, lastYearRemaining });
    },
    [schemeFor, leave, asOf],
  );

  return { ready: !!bundle, tenantId, schemes, enrolments, schemeFor, entitlementFor, employees: bundle?.employees ?? [], asOf };
}
