"use client";

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  ONBOARDING_STAGE_LABELS,
  ONBOARDING_STAGE_STYLES,
  ONBOARDING_STATUS_STYLES,
  ONBOARDING_STATUS_LABELS,
  ASSIGNEE_LABELS,
  ASSIGNEE_STYLES,
  TASK_STATUS_STYLES,
} from "../data";
import type { OnboardingRecord, OnboardingTaskStatus } from "../types";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  viewingRecord: OnboardingRecord | null;
  onToggleTask: (recordId: string, taskId: string) => void;
}

const TASK_STATUS_ICON = {
  completed: CheckCircle2,
  overdue: AlertCircle,
  pending: Circle,
};

export function OnboardingModal({
  open,
  onClose,
  viewingRecord,
  onToggleTask,
}: OnboardingModalProps) {
  if (!viewingRecord) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            {viewingRecord.employeeName} — Onboarding Tasks
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                ONBOARDING_STAGE_STYLES[viewingRecord.stage],
              )}
            >
              {ONBOARDING_STAGE_LABELS[viewingRecord.stage]}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                ONBOARDING_STATUS_STYLES[viewingRecord.status],
              )}
            >
              {ONBOARDING_STATUS_LABELS[viewingRecord.status]}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {viewingRecord.completedTasks}/{viewingRecord.totalTasks} tasks
              complete
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4 flex flex-col gap-2">
            {viewingRecord.tasks.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No tasks assigned to this record.
              </p>
            )}
            {viewingRecord.tasks.map((task) => {
              const Icon = TASK_STATUS_ICON[task.status];
              const dueDayText =
                task.dueDay < 0
                  ? `${Math.abs(task.dueDay)} day${Math.abs(task.dueDay) !== 1 ? "s" : ""} before start`
                  : task.dueDay === 0
                    ? "On start date"
                    : `Day ${task.dueDay}`;

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0"
                    onClick={() => onToggleTask(viewingRecord.id, task.id)}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        TASK_STATUS_STYLES[task.status as OnboardingTaskStatus],
                      )}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-none",
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {task.taskName}
                      {task.isRequired && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                          ASSIGNEE_STYLES[task.assignee],
                        )}
                      >
                        {ASSIGNEE_LABELS[task.assignee]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {dueDayText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
