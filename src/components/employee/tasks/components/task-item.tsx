"use client";

import Link from "next/link";
import { AlertCircle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { cn } from "@/src/lib/utils";
import {
  CATEGORY_STYLES,
  PRIORITY_STYLES,
  getDueStatus,
  formatDue,
} from "@/src/components/employee/tasks/components/task-utils";

export interface TaskItemData {
  id: string;
  label: string;
  done: boolean;
  priority: string;
  due: string;
  category?: string;
  notes?: string;
  link?: string;
}

interface TaskItemProps {
  task: TaskItemData;
  onToggle?: (id: string, done: boolean) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const status = getDueStatus(task.due, task.done);

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3 px-3 rounded-lg border transition-colors",
        status === "overdue" && !task.done
          ? "border-red-200 dark:border-red-900 bg-red-500/5"
          : status === "soon" && !task.done
            ? "border-amber-200 dark:border-amber-900 bg-amber-500/5"
            : "border-transparent hover:bg-muted/40",
      )}
    >
      <Checkbox
        checked={task.done}
        disabled={!onToggle}
        onCheckedChange={
          onToggle ? (checked) => onToggle(task.id, !!checked) : undefined
        }
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-relaxed",
            task.done
              ? "line-through text-muted-foreground"
              : "text-foreground",
          )}
        >
          {task.label}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              PRIORITY_STYLES[task.priority],
            )}
          >
            {task.priority}
          </Badge>
          {task.category && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                CATEGORY_STYLES[task.category] ??
                  "bg-slate-500/10 text-slate-600",
              )}
            >
              {task.category}
            </Badge>
          )}
          {!task.done && status === "overdue" && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400 font-medium">
              <AlertCircle className="h-3 w-3" />
              Overdue · {formatDue(task.due)}
            </span>
          )}
          {!task.done && status === "soon" && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="h-3 w-3" />
              Due {formatDue(task.due)}
            </span>
          )}
          {!task.done && status === "ok" && (
            <span className="text-[10px] text-muted-foreground">
              Due {formatDue(task.due)}
            </span>
          )}
          {task.notes && (
            <span className="text-[10px] text-muted-foreground italic">
              {task.notes}
            </span>
          )}
        </div>
      </div>
      {task.link && (
        <Link href={task.link}>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground shrink-0"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
