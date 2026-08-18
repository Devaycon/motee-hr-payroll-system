import {
  BookOpen,
  Circle,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { MyEnrollment } from "./data";

/** The slice a KPI card drills My Learning down to. */
export type TrainingCardFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "overdue";

export const TRAINING_CARD_FILTER_LABELS: Record<
  Exclude<TrainingCardFilter, "all">,
  string
> = {
  not_started: "Not started",
  in_progress: "In progress",
  overdue: "Overdue",
};

function isOverdue(enrollment: MyEnrollment, now: Date): boolean {
  if (!enrollment.dueDate) return false;
  return (
    Math.ceil((new Date(enrollment.dueDate).getTime() - now.getTime()) / 86400000) <
    0
  );
}

/**
 * Single source of truth for what each card counts and My Learning then shows.
 * Every slice is scoped to active enrollments — completed courses live on the
 * Learning History tab.
 */
export function matchesTrainingCardFilter(
  enrollment: MyEnrollment,
  filter: TrainingCardFilter,
  now: Date,
): boolean {
  switch (filter) {
    case "not_started":
      return enrollment.status === "enrolled";
    case "in_progress":
      return enrollment.status === "in_progress";
    case "overdue":
      return (
        (enrollment.status === "enrolled" ||
          enrollment.status === "in_progress") &&
        isOverdue(enrollment, now)
      );
    default:
      return true;
  }
}

interface TrainingStatCardsProps {
  enrollments: MyEnrollment[];
  /** The tab currently open. */
  activeTab: string;
  /** The card drill-down currently applied. */
  cardFilter: TrainingCardFilter;
  /** Drill-down: opens the tab holding these courses and filters to them. */
  onDrillDown: (tab: string, filter: TrainingCardFilter) => void;
}

export function TrainingStatCards({
  enrollments,
  activeTab,
  cardFilter,
  onDrillDown,
}: TrainingStatCardsProps) {
  const now = new Date();
  const activeCourses = enrollments.filter(
    (e) => e.status === "enrolled" || e.status === "in_progress",
  );
  const completedCourses = enrollments.filter((e) => e.status === "completed");
  const count = (filter: TrainingCardFilter) =>
    activeCourses.filter((e) => matchesTrainingCardFilter(e, filter, now))
      .length;

  const card = (key: TrainingCardFilter) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to everything assigned.
    onClick: () =>
      onDrillDown("my-learning", cardFilter === key ? "all" : key),
  });

  const stats: HrStatCardItem[] = [
    {
      label: "Assigned",
      value: activeCourses.length,
      sub: "Courses on your plate",
      icon: BookOpen,
      tone: "blue",
      active: activeTab === "my-learning" && cardFilter === "all",
      onClick: () => onDrillDown("my-learning", "all"),
    },
    {
      label: "Not Started",
      value: count("not_started"),
      sub: "Yet to begin",
      icon: Circle,
      tone: "violet",
      ...card("not_started"),
    },
    {
      label: "In Progress",
      value: count("in_progress"),
      sub: "Underway",
      icon: PlayCircle,
      tone: "amber",
      ...card("in_progress"),
    },
    {
      // Completions live on the history tab, not in My Learning.
      label: "Completed",
      value: completedCourses.length,
      sub: "Finished courses",
      icon: CheckCircle2,
      tone: "emerald",
      active: activeTab === "history",
      onClick: () => onDrillDown("history", "all"),
    },
    {
      label: "Overdue",
      value: count("overdue"),
      sub: "Past their due date",
      icon: AlertTriangle,
      tone: "red",
      ...card("overdue"),
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={5} />;
}
