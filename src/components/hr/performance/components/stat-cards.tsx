"use client";

import { ClipboardList, CheckCircle, Clock, Star } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { PerformanceReview, PerformanceGoal } from "../types";

/** The slice a KPI card drills into. */
export type PerformanceCardFilter =
  | "all"
  | "in_progress"
  | "rated"
  | "goals_on_track";

export const PERFORMANCE_CARD_FILTER_LABELS: Record<
  Exclude<PerformanceCardFilter, "all">,
  string
> = {
  in_progress: "Reviews in progress",
  rated: "Completed & rated",
  goals_on_track: "Goals on track",
};

export function matchesReviewCardFilter(
  review: PerformanceReview,
  filter: PerformanceCardFilter,
): boolean {
  switch (filter) {
    case "in_progress":
      return review.status === "in_progress";
    case "rated":
      return review.status === "completed" && Boolean(review.rating);
    default:
      return true;
  }
}

export function matchesGoalCardFilter(
  goal: PerformanceGoal,
  filter: PerformanceCardFilter,
): boolean {
  return filter === "goals_on_track"
    ? goal.status === "on_track" || goal.status === "completed"
    : true;
}

interface StatCardsProps {
  reviews: PerformanceReview[];
  goals: PerformanceGoal[];
  /** The card drill-down currently applied. */
  cardFilter: PerformanceCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: PerformanceCardFilter) => void;
}

export function StatCards({
  reviews,
  goals,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const completed = reviews.filter((r) => r.status === "completed").length;
  const inProgress = reviews.filter((r) =>
    matchesReviewCardFilter(r, "in_progress"),
  ).length;
  const overdue = reviews.filter((r) => r.status === "overdue").length;
  const completedWithRating = reviews.filter((r) =>
    matchesReviewCardFilter(r, "rated"),
  );
  const avgRating =
    completedWithRating.length > 0
      ? (
          completedWithRating.reduce((s, r) => s + (r.rating ?? 0), 0) /
          completedWithRating.length
        ).toFixed(1)
      : "—";

  const goalsOnTrack = goals.filter((g) =>
    matchesGoalCardFilter(g, "goals_on_track"),
  ).length;

  const card = (key: PerformanceCardFilter, tab: string) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to the full list.
    onClick: () => onDrillDown(tab, cardFilter === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Total Reviews",
      value: reviews.length,
      sub: `${completed} completed`,
      icon: ClipboardList,
      tone: "blue",
      active: cardFilter === "all",
      onClick: () => onDrillDown("reviews", "all"),
    },
    {
      label: "In Progress",
      value: inProgress,
      sub: `${overdue} overdue`,
      icon: Clock,
      tone: "amber",
      ...card("in_progress", "reviews"),
    },
    {
      label: "Avg. Rating",
      value: avgRating,
      sub: `Across ${completedWithRating.length} rated reviews`,
      icon: Star,
      tone: "violet",
      ...card("rated", "reviews"),
    },
    {
      label: "Goals On Track",
      value: goalsOnTrack,
      sub: `of ${goals.length} total goals`,
      icon: CheckCircle,
      tone: "emerald",
      ...card("goals_on_track", "goals"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
