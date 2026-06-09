"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { Department } from "@/src/lib/types/departments";
import type { LocaleBundle } from "@/src/lib/types/locale";

function buildDepartments(bundle: LocaleBundle): Department[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return bundle.departments.map((d) => {
    const head = d.headEmployeeId ? employeesById.get(d.headEmployeeId) : null;
    const employeeCount = bundle.employees.filter(
      (e) => e.departmentId === d.id,
    ).length;
    const openPositions = Math.max(0, (d.headcountTarget ?? 0) - employeeCount);
    return {
      id: d.id,
      name: d.name,
      code: d.code,
      head: head?.fullName ?? null,
      headInitials: head?.initials,
      description: `${d.name} department`,
      employeeCount,
      openPositions,
      status: "active",
      createdAt: bundle.tenant.createdAt,
    };
  });
}

export function useDepartments() {
  return useLocaleSection<Department[]>(buildDepartments);
}
