"use client";

// Self-service shows one person their own record, so it is never narrowed
// by the admin shell's branch switcher.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  GoalCategory,
  GoalStatus,
  PerformanceGoal,
} from "@/src/lib/types/performance";

interface RawGoal {
  id?: string;
  employeeId?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  progress?: number;
  dueDate?: string;
  createdAt?: string;
}

function mapCat(c?: string): GoalCategory {
  if (
    c === "technical" ||
    c === "leadership" ||
    c === "communication" ||
    c === "growth" ||
    c === "operational"
  )
    return c;
  return "growth";
}

function mapStatus(s?: string): GoalStatus {
  if (s === "at_risk" || s === "completed" || s === "cancelled" || s === "overdue") return s;
  return "on_track";
}

export function useMyGoals() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const employeeName = useAppSelector((s) => s.auth.user?.name);
  return useLocaleSection<PerformanceGoal[]>((bundle) => {
    if (!employeeId) return [];
    const perf = bundle.performance as { goals?: RawGoal[] };
    return (perf.goals ?? [])
      .filter((g) => g.employeeId === employeeId)
      .map((g, i) => {
        const emp = bundle.employees.find((e) => e.id === employeeId);
        return {
          id: g.id ?? `pg-me-${i}`,
          employeeName: emp?.fullName ?? employeeName ?? "",
          employeeInitials: emp?.initials,
          department: emp?.departmentName ?? "",
          goalTitle: g.title ?? "Goal",
          description: g.description,
          category: mapCat(g.category),
          status: mapStatus(g.status),
          progress: g.progress ?? 0,
          dueDate: g.dueDate ?? bundle.tenant.createdAt.slice(0, 10),
          createdAt: g.createdAt ?? bundle.tenant.createdAt.slice(0, 10),
        };
      });
  });
}
