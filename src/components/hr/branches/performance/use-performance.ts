"use client";

import { useMemo } from "react";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useEffectiveAccess } from "@/src/lib/permissions/use-can";
import { isOpenScope } from "@/src/lib/permissions/data-scope";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { PerfInput, PerfSickness } from "@/src/lib/branches/performance";
import { buildPerfInput } from "@/src/lib/branches/performance-input";
import { useBranches } from "../hooks";

/**
 * Everything the performance engine needs, built from the live bundle. The
 * role's data scope is already applied by `useLocaleSection`, so a manager
 * confined to their own branch only ever sees that branch's people — and
 * `visibleBranchIds` drops branches they have nobody in (role-based access).
 */
export function usePerformanceInput() {
  const { data: bundle, loading } = useUnscopedLocaleSection<LocaleBundle>((b) => b);
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  // Sickness absence comes from the Sickness & Absence module once it holds
  // records for this tenant; until then the bundle's sick leave stands in.
  const tenantId = bundle?.tenant.id;
  const sicknessRecords = useAppSelector((s) => s.sickness.records);
  const sickness = useMemo<PerfSickness[] | undefined>(() => {
    const mine = sicknessRecords.filter(
      (r) => r.tenantId === tenantId && r.approvalStatus !== "rejected" && r.approvalStatus !== "cancelled" && r.kind === "sickness",
    );
    if (mine.length === 0) return undefined;
    const today = new Date().toISOString().slice(0, 10);
    return mine.map((r) => ({ employeeId: r.employeeId, startDate: r.startDate, endDate: r.endDate ?? today }));
  }, [sicknessRecords, tenantId]);
  const { data: branches } = useBranches();
  const access = useEffectiveAccess();
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const settings = useAppSelector((s) => s.branchPerformance);

  const input = useMemo<PerfInput | null>(() => {
    if (!bundle || !branches) return null;
    return buildPerfInput(applyBundleOverrides(bundle, overrides), branches, sickness);
  }, [bundle, branches, overrides, sickness]);

  const restricted = !access.unresolved && !isOpenScope(access.dataScope);
  const visibleBranchIds = useMemo(() => {
    if (!input) return [];
    const all = input.branches.filter((b) => b.status === "active").map((b) => b.id);
    if (!restricted) return all;
    const staffed = new Set(input.employees.map((e) => e.branchId).filter(Boolean));
    return all.filter(
      (id) => staffed.has(id) || input.branches.find((b) => b.id === id)?.managerEmployeeId === me,
    );
  }, [input, restricted, me]);

  return { input, loading: loading && !input, visibleBranchIds, restricted, settings };
}
