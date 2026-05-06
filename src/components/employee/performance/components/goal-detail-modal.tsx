import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  GOAL_CATEGORY_STYLES,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_STYLES,
  GOAL_STATUS_LABELS,
} from "@/src/data/performance-demo";
import type { PerformanceGoal } from "@/src/lib/types/performance";
import { ProgressBar, formatDate } from "./helpers";

interface GoalDetailModalProps {
  goal: PerformanceGoal | null;
  onClose: () => void;
  onUpdateProgress: (g: PerformanceGoal) => void;
}

export function GoalDetailModal({
  goal,
  onClose,
  onUpdateProgress,
}: GoalDetailModalProps) {
  return (
    <Dialog open={!!goal} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        {goal && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                      GOAL_CATEGORY_STYLES[goal.category],
                    )}
                  >
                    {GOAL_CATEGORY_LABELS[goal.category]}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                      GOAL_STATUS_STYLES[goal.status],
                    )}
                  >
                    {GOAL_STATUS_LABELS[goal.status]}
                  </span>
                </div>
              </div>
              <DialogTitle className="text-sm font-semibold mt-1">
                {goal.goalTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-1">
              {goal.description && (
                <p className="text-xs text-muted-foreground">
                  {goal.description}
                </p>
              )}
              <ProgressBar value={goal.progress} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Due date", value: formatDate(goal.dueDate) },
                  { label: "Created", value: formatDate(goal.createdAt) },
                  ...(goal.completedAt
                    ? [
                        {
                          label: "Completed",
                          value: formatDate(goal.completedAt),
                        },
                      ]
                    : []),
                ].map((r) => (
                  <div key={r.label} className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      {r.label}
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={onClose}
              >
                Close
              </Button>
              {goal.status !== "completed" && goal.status !== "cancelled" && (
                <Button
                  size="sm"
                  className="text-xs h-8 bg-[#4361ee] hover:bg-[#3451d1] text-white gap-1"
                  onClick={() => {
                    onUpdateProgress(goal);
                    onClose();
                  }}
                >
                  <Pencil className="w-3 h-3" /> Update Progress
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

