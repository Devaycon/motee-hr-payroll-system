"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";

interface EmployeeAssignedTask {
  id: string;
  label: string;
  done: boolean;
  priority: string;
  due: string;
  category: string;
  notes?: string;
}

interface RawTask {
  id?: string;
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  linkedTo?: string;
}

export function useMyAssignedTasks() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  return useLocaleSection<EmployeeAssignedTask[]>((bundle) => {
    if (!employeeId) return [];
    return ((bundle.tasks ?? []) as RawTask[])
      .filter((t) => t.assigneeId === employeeId)
      .map((t, i) => ({
        id: t.id ?? `at-${i + 1}`,
        label: t.title ?? "Task",
        done: t.status === "done" || t.status === "completed",
        priority: t.priority ?? "medium",
        due: t.dueDate ?? bundle.tenant.createdAt.slice(0, 10),
        category: t.linkedTo ?? "general",
        notes: t.description,
      }));
  });
}
