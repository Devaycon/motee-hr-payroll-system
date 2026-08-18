import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { PerformanceGoal } from "@/src/lib/types/performance";
import { GoalCard } from "./goal-card";

interface GoalsTabProps {
  goals: PerformanceGoal[];
  activeGoals: PerformanceGoal[];
  completedGoals: PerformanceGoal[];
  /** Set when a KPI card has drilled in — names the slice on show. */
  filterLabel?: string;
  onClearFilter?: () => void;
  onView: (g: PerformanceGoal) => void;
  onUpdateProgress: (g: PerformanceGoal) => void;
  onNewGoal: () => void;
}

export function GoalsTab({
  goals,
  activeGoals,
  completedGoals,
  filterLabel,
  onClearFilter,
  onView,
  onUpdateProgress,
  onNewGoal,
}: GoalsTabProps) {
  const shown = activeGoals.length + completedGoals.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {filterLabel ? (
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              {filterLabel} ({shown})
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={onClearFilter}
            >
              ← All goals
            </Button>
          </div>
        ) : (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            My Goals ({goals.length})
          </p>
        )}
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-[#4361ee] hover:bg-[#3451d1] text-white"
          onClick={onNewGoal}
        >
          <Plus className="w-3.5 h-3.5" /> Add Goal
        </Button>
      </div>

      {shown === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {filterLabel
            ? `No goals in ${filterLabel.toLowerCase()}.`
            : "No goals yet. Click “Add Goal” to set your first one."}
        </p>
      )}

      {activeGoals.length > 0 && (
        <div className="flex flex-col gap-3">
          {activeGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onView={onView}
              onUpdateProgress={onUpdateProgress}
            />
          ))}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 mt-2">
            Completed
          </p>
          <div className="flex flex-col gap-2">
            {completedGoals.map((g) => (
              <GoalCard key={g.id} goal={g} onView={onView} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

