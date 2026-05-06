import { CalendarDays, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  GOAL_CATEGORY_STYLES,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_STYLES,
  GOAL_STATUS_LABELS,
} from "@/src/data/performance-demo";
import type { PerformanceGoal, GoalStatus } from "@/src/lib/types/performance";
import { ProgressBar, formatDate, daysUntil } from "./helpers";

const STATUS_COLORS: Record<GoalStatus, string> = {
  on_track: "#1D9E75",
  at_risk: "#F59E0B",
  completed: "#2563EB",
  overdue: "#EF4444",
  cancelled: "#6B7280",
};

interface GoalCardProps {
  goal: PerformanceGoal;
  onView: (g: PerformanceGoal) => void;
  onUpdateProgress?: (g: PerformanceGoal) => void;
}

export function GoalCard({ goal, onView, onUpdateProgress }: GoalCardProps) {
  const due = daysUntil(goal.dueDate);

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-sm",
        goal.status === "completed" && "opacity-75",
      )}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                  GOAL_CATEGORY_STYLES[goal.category],
                )}
              >
                {GOAL_CATEGORY_LABELS[goal.category]}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug">
              {goal.goalTitle}
            </p>
            {goal.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0",
              GOAL_STATUS_STYLES[goal.status],
            )}
          >
            {GOAL_STATUS_LABELS[goal.status]}
          </span>
        </div>

        <ProgressBar value={goal.progress} color={STATUS_COLORS[goal.status]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px]">
            <CalendarDays className="w-3 h-3 text-muted-foreground" />
            <span
              className={cn(
                due < 0
                  ? "text-red-500 font-semibold"
                  : due <= 7
                    ? "text-amber-600 font-semibold"
                    : "text-muted-foreground",
              )}
            >
              {goal.status === "completed" && goal.completedAt
                ? `Completed ${formatDate(goal.completedAt)}`
                : due < 0
                  ? `${Math.abs(due)} days overdue`
                  : `Due in ${due} days`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] px-2 text-muted-foreground"
              onClick={() => onView(goal)}
            >
              Details
            </Button>
            {onUpdateProgress &&
              goal.status !== "completed" &&
              goal.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2 border-[#4361ee]/30 text-[#4361ee] hover:bg-[#4361ee]/10"
                  onClick={() => onUpdateProgress(goal)}
                >
                  <TrendingUp className="w-3 h-3 mr-1" /> Update
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

