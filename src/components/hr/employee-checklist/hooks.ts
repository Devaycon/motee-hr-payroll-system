"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  ChecklistItem,
  NewHire,
  ResponsibleParty,
} from "@/src/lib/types/employee-checklist";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawChecklistItem {
  id?: string;
  employeeId?: string;
  stage?: string;
  item?: string;
  owner?: string;
  status?: string;
}

function mapOwner(o?: string): ResponsibleParty {
  if (o === "hr" || o === "manager" || o === "it" || o === "employee" || o === "finance") {
    return o;
  }
  return "hr";
}

interface ChecklistData {
  items: ChecklistItem[];
  hires: NewHire[];
}

function buildChecklist(bundle: LocaleBundle): ChecklistData {
  const checklists = (bundle.employeeChecklists ?? []) as RawChecklistItem[];

  const uniqueItems = new Map<string, RawChecklistItem>();
  for (const c of checklists) {
    const key = `${c.item}-${c.owner}`;
    if (!uniqueItems.has(key)) uniqueItems.set(key, c);
  }

  const items: ChecklistItem[] = Array.from(uniqueItems.values())
    .slice(0, 25)
    .map((c, i) => ({
      id: c.id ?? `ci-${i + 1}`,
      title: c.item ?? "Onboarding task",
      taskName: c.item ?? "Onboarding task",
      description: c.item ?? "",
      category: c.stage ?? "joining",
      responsibleParty: mapOwner(c.owner),
      dueDateRule: "day_1",
      dueDateOffset: 0,
      isRequired: true,
      isActive: true,
      order: i + 1,
    }));

  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const byEmp = new Map<string, RawChecklistItem[]>();
  for (const c of checklists) {
    if (!c.employeeId) continue;
    const arr = byEmp.get(c.employeeId) ?? [];
    arr.push(c);
    byEmp.set(c.employeeId, arr);
  }

  const hires: NewHire[] = Array.from(byEmp.entries())
    .slice(0, 20)
    .map(([empId, list]) => {
      const emp = employeesById.get(empId);
      const completed = list.filter((c) => c.status === "completed").length;
      const total = list.length;
      const status =
        completed === total
          ? ("completed" as const)
          : completed > 0
            ? ("in_progress" as const)
            : ("pending" as const);
      return {
        id: empId,
        name: emp?.fullName ?? empId,
        initials: emp?.initials ?? "??",
        jobTitle: emp?.jobTitle ?? "",
        department: emp?.departmentName ?? "—",
        startDate: emp?.startDate ?? bundle.tenant.createdAt.slice(0, 10),
        status,
        progress: list.map((c) => ({
          itemId: c.id ?? "",
          completed: c.status === "completed",
        })),
        completedItems: completed,
        totalItems: total,
      };
    });

  return { items, hires };
}

export function useEmployeeChecklist() {
  return useLocaleSection<ChecklistData>(buildChecklist);
}
