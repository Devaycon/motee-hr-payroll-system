import { Target, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";

/** The slice a KPI card drills the My Goals tab down to. */
export type GoalCardFilter = "all" | "active" | "completed" | "at_risk";

export const GOAL_CARD_FILTER_LABELS: Record<
  Exclude<GoalCardFilter, "all">,
  string
> = {
  active: "Active goals",
  completed: "Completed goals",
  at_risk: "At risk / overdue",
};

interface PerformanceStatCardsProps {
  activeGoals: number;
  completedGoals: number;
  avgProgress: number;
  atRiskGoals: number;
  /** The card drill-down currently applied. */
  goalFilter: GoalCardFilter;
  /** Drill-down: opens My Goals showing the goals behind the number. */
  onDrillDown: (filter: GoalCardFilter) => void;
}

export function PerformanceStatCards({
  activeGoals,
  completedGoals,
  avgProgress,
  atRiskGoals,
  goalFilter,
  onDrillDown,
}: PerformanceStatCardsProps) {
  const card = (key: GoalCardFilter) => ({
    active: goalFilter === key,
    onClick: () => onDrillDown(key),
  });

  const stats: HrStatCardItem[] = [
    {
      label: "Active Goals",
      value: activeGoals,
      sub: "In flight right now",
      icon: Target,
      tone: "blue",
      ...card("active"),
    },
    {
      label: "Goals Completed",
      value: completedGoals,
      sub: "Signed off",
      icon: CheckCircle2,
      tone: "emerald",
      ...card("completed"),
    },
    {
      label: "Avg. Goal Progress",
      value: `${avgProgress}%`,
      sub: "Across every goal",
      icon: TrendingUp,
      tone: "violet",
      ...card("all"),
    },
    {
      label: "At Risk / Overdue",
      value: atRiskGoals,
      sub: "Need attention",
      icon: AlertCircle,
      tone: "red",
      ...card("at_risk"),
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
