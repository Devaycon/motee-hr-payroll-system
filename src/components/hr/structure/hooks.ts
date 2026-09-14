"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import type {
  HierarchyNode,
  HierarchyNodeStatus,
} from "@/src/lib/types/structure";
import type { LocaleBundle } from "@/src/lib/types/locale";

function mapStatus(s: string): HierarchyNodeStatus {
  if (s === "on_leave") return "on_leave";
  return "active";
}

function buildHierarchy(bundle: LocaleBundle): HierarchyNode[] {
  const directReports = new Map<string, number>();
  for (const e of bundle.employees) {
    if (e.managerId) {
      directReports.set(e.managerId, (directReports.get(e.managerId) ?? 0) + 1);
    }
  }
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const branchNameById = new Map(
    (bundle.branches ?? []).map((b) => [b.id, b.name]),
  );
  return bundle.employees.map((e) => {
    const manager = e.managerId ? employeesById.get(e.managerId) : null;
    return {
      id: e.id,
      employeeNumber: e.employeeNumber,
      name: e.fullName,
      initials: e.initials,
      gender: e.gender,
      jobTitle: e.jobTitle,
      department: e.departmentName,
      branchName: e.branchId ? branchNameById.get(e.branchId) : undefined,
      managerId: e.managerId,
      managerName: manager?.fullName,
      status: mapStatus(e.status),
      level: e.level ?? (manager ? 2 : 1),
      directReports: directReports.get(e.id) ?? 0,
    };
  });
}

export function useHierarchy() {
  const overrides = useAppSelector((s) => s.profileEdits.overrides);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo(
    () => (bundle ? buildHierarchy(applyBundleOverrides(bundle, overrides)) : null),
    [bundle, overrides],
  );
  return { data, loading, error };
}
