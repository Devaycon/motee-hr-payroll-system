"use client";

import { BookOpen, Users, Award, TrendingUp } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { Course, Enrollment } from "../types";

/** The slice a KPI card drills into. */
export type LearningCardFilter =
  | "all"
  | "active_courses"
  | "active_enrollments"
  | "completed";

export const LEARNING_CARD_FILTER_LABELS: Record<
  Exclude<LearningCardFilter, "all">,
  string
> = {
  active_courses: "Active courses",
  active_enrollments: "Active enrollments",
  completed: "Completed enrollments",
};

export function matchesCourseCardFilter(
  course: Course,
  filter: LearningCardFilter,
): boolean {
  return filter === "active_courses" ? course.status === "active" : true;
}

export function matchesEnrollmentCardFilter(
  enrollment: Enrollment,
  filter: LearningCardFilter,
): boolean {
  switch (filter) {
    case "active_enrollments":
      return (
        enrollment.status === "enrolled" || enrollment.status === "in_progress"
      );
    case "completed":
      return enrollment.status === "completed";
    default:
      return true;
  }
}

interface StatCardsProps {
  courses: Course[];
  enrollments: Enrollment[];
  /** The card drill-down currently applied. */
  cardFilter: LearningCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: LearningCardFilter) => void;
}

export function StatCards({
  courses,
  enrollments,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const activeCourses = courses.filter((c) => c.status === "active").length;
  const activeEnrollments = enrollments.filter((e) =>
    matchesEnrollmentCardFilter(e, "active_enrollments"),
  ).length;
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed",
  ).length;
  const completionRate =
    enrollments.length > 0
      ? Math.round((completedEnrollments / enrollments.length) * 100)
      : 0;

  const card = (key: LearningCardFilter, tab: string) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to the full list.
    onClick: () => onDrillDown(tab, cardFilter === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Active Courses",
      value: activeCourses,
      sub: `${courses.length} total in catalog`,
      icon: BookOpen,
      tone: "blue",
      ...card("active_courses", "courses"),
    },
    {
      label: "Active Enrollments",
      value: activeEnrollments,
      sub: "Currently learning",
      icon: Users,
      tone: "violet",
      ...card("active_enrollments", "enrollments"),
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      sub: `${completedEnrollments} completions`,
      icon: TrendingUp,
      tone: "emerald",
      ...card("completed", "enrollments"),
    },
    {
      // Certifications come out of the results view, which is where the
      // completions and scores are recorded.
      label: "Certifications",
      value: completedEnrollments,
      sub: "Courses completed",
      icon: Award,
      tone: "amber",
      active: false,
      onClick: () => onDrillDown("results", "all"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
