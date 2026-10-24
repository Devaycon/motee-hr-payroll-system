"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useCan, useEffectiveAccess } from "@/src/lib/permissions/use-can";
import { seedTenant } from "@/src/lib/stores/sickness-slice";
import {
  DEFAULT_SICKNESS_SETTINGS,
  defaultSchemes,
  seedEnrolments,
  seedSicknessRecords,
} from "@/src/lib/sickness/seeds";
import { calculateBradford, type BradfordResult } from "@/src/lib/sickness/bradford";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import type { SchemeEnrolment, SicknessScheme } from "@/src/lib/types/sickness";
import type { PayEmployee } from "@/src/lib/sickness/sick-pay";

export const SICKNESS_BASE = "/time-payroll/sickness";

export function sicknessToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Seeds the tenant's sickness data from the bundle once, the way Leave seeds
 * from it — this is where historic sick leave moves into the new module.
 */
export function useSicknessSeed() {
  const dispatch = useAppDispatch();
  const bundle = useAppSelector((s) => s.locale.data);
  const country = useAppSelector((s) => s.locale.country);
  const seeded = useAppSelector((s) => s.sickness.seededTenants);
  useEffect(() => {
    if (!bundle || seeded.includes(bundle.tenant.id)) return;
    const schemes = defaultSchemes(bundle.tenant.id, country);
    dispatch(
      seedTenant({
        tenantId: bundle.tenant.id,
        records: seedSicknessRecords(bundle, sicknessToday()),
        schemes,
        enrolments: seedEnrolments(bundle, schemes, country),
      }),
    );
  }, [bundle, country, seeded, dispatch]);
}

/**
 * Medical detail (the employee's own words, fit notes) is for HR and OH only.
 * Keyed off data scope like Occupational Health: line managers see that
 * someone is off and the broad category, never the clinical detail.
 */
export function useCanViewMedical(): boolean {
  const access = useEffectiveAccess();
  const canEdit = useCan("time-payroll.sickness", "edit");
  if (access.unresolved) return true;
  return canEdit && access.dataScope.kind !== "direct_reports" && access.dataScope.kind !== "self";
}

export function useCanManageSickness(): boolean {
  return useCan("time-payroll.sickness", "edit");
}

export function useSicknessActor(): string {
  return useAppSelector((s) => s.auth.user?.name) ?? "HR";
}

/** Everything a sickness screen needs, scoped to the tenant and the viewer's data scope. */
export function useSickness() {
  useSicknessSeed();
  const { data: bundle, loading } = useLocaleSection<LocaleBundle>((b) => b);
  const tenantId = useAppSelector((s) => s.locale.data?.tenant.id) ?? "";
  const state = useAppSelector((s) => s.sickness);
  const asOf = sicknessToday();

  const employees = useMemo(() => bundle?.employees ?? [], [bundle]);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const holidays = useMemo(
    () => (bundle?.events ?? []).filter((e) => e.type === "holiday").map((e) => e.start.slice(0, 10)),
    [bundle],
  );

  // The bundle is already narrowed to the people this role may see; records
  // follow it so a manager only sees their own reports' absences.
  const records = useMemo(
    () => state.records.filter((r) => r.tenantId === tenantId && byId.has(r.employeeId)),
    [state.records, tenantId, byId],
  );
  const schemes = useMemo(() => state.schemes.filter((s) => s.tenantId === tenantId), [state.schemes, tenantId]);
  const enrolments = useMemo(() => state.enrolments.filter((e) => e.tenantId === tenantId), [state.enrolments, tenantId]);
  const reviewCases = useMemo(
    () => state.reviewCases.filter((c) => c.tenantId === tenantId && byId.has(c.employeeId)),
    [state.reviewCases, tenantId, byId],
  );
  const snapshots = useMemo(() => state.snapshots.filter((s) => s.tenantId === tenantId), [state.snapshots, tenantId]);
  const audit = useMemo(() => state.audit.filter((a) => a.tenantId === tenantId), [state.audit, tenantId]);
  const settings = state.settings[tenantId] ?? DEFAULT_SICKNESS_SETTINGS;

  const bradfordFor = useCallback(
    (employeeId: string): BradfordResult =>
      calculateBradford({
        employeeId,
        records,
        asOf,
        settings: settings.bradford,
        schedule: byId.get(employeeId)?.workPattern?.schedule,
        holidays,
      }),
    [records, asOf, settings.bradford, byId, holidays],
  );

  const schemeFor = useCallback(
    (employeeId: string, on = asOf): { scheme: SicknessScheme | null; enrolment: SchemeEnrolment | null } => {
      const enrolment =
        enrolments
          .filter((e) => e.employeeId === employeeId && e.effectiveFrom <= on && (!e.effectiveTo || e.effectiveTo >= on))
          .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
      return { enrolment, scheme: enrolment ? schemes.find((s) => s.id === enrolment.schemeId) ?? null : null };
    },
    [enrolments, schemes, asOf],
  );

  return {
    loading: loading && !bundle,
    bundle,
    tenantId,
    asOf,
    employees,
    byId,
    holidays,
    records,
    schemes,
    enrolments,
    reviewCases,
    snapshots,
    audit,
    ohCases: state.ohCases,
    settings,
    bradfordFor,
    schemeFor,
  };
}

/** The pay facts the sick-pay engine needs about one employee. */
export function payEmployee(e: LocaleEmployee): PayEmployee {
  const amount = e.salary?.amount ?? 0;
  const period = (e.salary?.period ?? "annual").toLowerCase();
  const weekly = period.startsWith("month") ? (amount * 12) / 52 : period.startsWith("week") ? amount : amount / 52;
  return {
    id: e.id,
    startDate: e.startDate,
    employmentTypeId: e.employmentTypeId,
    weeklyEarnings: Math.round(weekly * 100) / 100,
    daysPerWeek: e.workPattern?.daysPerWeek ?? 5,
    weeklyHours: e.workPattern?.weeklyHours ?? 37.5,
    onProbation: e.status === "probation",
    schedule: e.workPattern?.schedule,
  };
}

/** Daily cost of a day off — for absence cost reporting. */
export function dailyCost(e: LocaleEmployee | undefined): number {
  if (!e) return 0;
  const p = payEmployee(e);
  return p.weeklyEarnings / Math.max(1, p.daysPerWeek);
}
