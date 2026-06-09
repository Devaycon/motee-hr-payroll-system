"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  GoalCategory,
  GoalStatus,
  PerformanceGoal,
  PerformanceRating,
  PerformanceReview,
  ReviewStatus,
  ReviewType,
} from "@/src/lib/types/performance";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawReview {
  id?: string;
  employeeId?: string;
  cycleId?: string;
  cycle?: string;
  reviewerId?: string;
  reviewer?: string;
  rating?: number;
  status?: string;
  dueDate?: string;
  completedDate?: string;
  type?: string;
  strengths?: string;
  improvements?: string;
  comments?: string;
}

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

function mapReviewType(t?: string): ReviewType {
  if (t === "annual" || t === "probation" || t === "pip" || t === "360") return t;
  if (t === "mid_year" || t === "midyear") return "mid_year";
  return "annual";
}

function mapReviewStatus(s?: string): ReviewStatus {
  if (s === "in_progress" || s === "completed" || s === "overdue") return s;
  return "not_started";
}

function mapGoalCategory(c?: string): GoalCategory {
  if (
    c === "technical" ||
    c === "leadership" ||
    c === "communication" ||
    c === "growth" ||
    c === "operational"
  ) {
    return c;
  }
  return "growth";
}

function mapGoalStatus(s?: string): GoalStatus {
  if (
    s === "at_risk" ||
    s === "completed" ||
    s === "cancelled" ||
    s === "overdue"
  ) {
    return s;
  }
  return "on_track";
}

function clampRating(r?: number): PerformanceRating | undefined {
  if (typeof r !== "number") return undefined;
  const n = Math.max(1, Math.min(5, Math.round(r)));
  return n as PerformanceRating;
}

interface PerformanceData {
  reviews: PerformanceReview[];
  goals: PerformanceGoal[];
}

function buildPerformance(bundle: LocaleBundle): PerformanceData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const perf = bundle.performance as {
    reviews?: RawReview[];
    goals?: RawGoal[];
    cycles?: { id?: string; name?: string }[];
  };
  const cycleNames = new Map(
    (perf.cycles ?? []).map((c) => [c.id ?? "", c.name ?? "Annual"]),
  );

  const reviews: PerformanceReview[] = (perf.reviews ?? []).map((r, i) => {
    const emp = r.employeeId ? employeesById.get(r.employeeId) : null;
    const reviewer = r.reviewerId ? employeesById.get(r.reviewerId) : null;
    const period =
      r.cycle ?? (r.cycleId ? cycleNames.get(r.cycleId) ?? "Annual" : "Annual");
    return {
      id: r.id ?? `pr-${i + 1}`,
      employeeName: emp?.fullName ?? r.employeeId ?? "Unknown",
      employeeInitials: emp?.initials,
      jobTitle: emp?.jobTitle,
      department: emp?.departmentName ?? "—",
      reviewType: mapReviewType(r.type),
      period,
      status: mapReviewStatus(r.status),
      reviewer: reviewer?.fullName ?? r.reviewer ?? "—",
      rating: clampRating(r.rating),
      strengths: r.strengths,
      improvements: r.improvements,
      comments: r.comments,
      dueDate: r.dueDate ?? bundle.tenant.createdAt.slice(0, 10),
      completedDate: r.completedDate,
    };
  });

  const goals: PerformanceGoal[] = (perf.goals ?? []).map((g, i) => {
    const emp = g.employeeId ? employeesById.get(g.employeeId) : null;
    return {
      id: g.id ?? `pg-${i + 1}`,
      employeeName: emp?.fullName ?? g.employeeId ?? "Unknown",
      employeeInitials: emp?.initials,
      department: emp?.departmentName ?? "—",
      goalTitle: g.title ?? "Goal",
      description: g.description,
      category: mapGoalCategory(g.category),
      status: mapGoalStatus(g.status),
      progress: g.progress ?? 0,
      dueDate: g.dueDate ?? bundle.tenant.createdAt.slice(0, 10),
      createdAt: g.createdAt ?? bundle.tenant.createdAt.slice(0, 10),
    };
  });

  return { reviews, goals };
}

export function usePerformance() {
  return useLocaleSection<PerformanceData>(buildPerformance);
}
