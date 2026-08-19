"use client";

import {
  ChevronRight,
  Clock,
  GitBranch,
  Hand,
  Link2,
  Pencil,
  Play,
  Power,
  PowerOff,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import {
  TRIGGER_MODE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_STYLES,
  WORKFLOW_CONDITION_LABELS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_STYLES,
} from "@/src/lib/types/workflows";
import type {
  Workflow as WorkflowType,
  WorkflowStatus,
} from "@/src/lib/types/workflows";
import type {
  LocaleDepartment,
  LocaleEmployee,
  LocaleRole,
} from "@/src/lib/types/locale";
import { cn } from "@/src/lib/utils";
import {
  assigneeLabel,
  reviewerLabel,
  scheduleLabel,
  scopeLabel,
  summaryLabel,
} from "../helpers";

interface WorkflowCardProps {
  workflow: WorkflowType;
  roles: LocaleRole[];
  employees: LocaleEmployee[];
  departments: LocaleDepartment[];
  /** Expansion is owned by the hub so "Expand all" can drive every card. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRun: () => void;
  onStatusChange: (next: WorkflowStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * One workflow in the hub. The task list is collapsed by default — a 14-step
 * workflow renders ~70 badges, and three of them on a page is a wall of text
 * before the reader has picked anything to look at. The header keeps
 * everything needed to choose (title, status, trigger, scope) plus a summary
 * line standing in for the hidden steps, and the actions stay reachable
 * without expanding.
 */
export function WorkflowCard({
  workflow: wf,
  roles,
  employees,
  departments,
  open,
  onOpenChange,
  onRun,
  onStatusChange,
  onEdit,
  onDelete,
}: WorkflowCardProps) {
  const status = wf.status ?? "draft";
  const isActive = status === "active";
  const schedule = scheduleLabel(wf.schedule);

  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <div className="flex items-start justify-between gap-4">
            {/* Only the descriptive block is the trigger — the action buttons
                sit outside it, so clicking Run doesn't also toggle the card. */}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group flex flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{wf.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {wf.kind}
                    </Badge>
                    {/* §11.13 — status, version and effective date, so it's
                        clear which workflow is actually live. */}
                    {wf.status && (
                      <Badge
                        variant="outline"
                        className={cn(WORKFLOW_STATUS_STYLES[wf.status])}
                      >
                        {WORKFLOW_STATUS_LABELS[wf.status]}
                      </Badge>
                    )}
                    {wf.version !== undefined && (
                      <Badge variant="outline" className="text-muted-foreground">
                        v{wf.version}
                        {wf.effectiveDate ? ` · from ${wf.effectiveDate}` : ""}
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1">
                      {wf.triggerMode === "automatic" ? (
                        <Zap className="w-3 h-3" />
                      ) : (
                        <Hand className="w-3 h-3" />
                      )}
                      {TRIGGER_MODE_LABELS[wf.triggerMode]}
                    </Badge>
                    <Badge variant="outline">
                      {scopeLabel(wf.scope, departments)}
                    </Badge>
                    {wf.triggerMode === "automatic" && schedule && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {schedule}
                      </Badge>
                    )}
                  </div>
                  {wf.description && (
                    <p className="text-xs text-muted-foreground">
                      {wf.description}
                    </p>
                  )}
                  {/* Stands in for the collapsed task list. */}
                  <p className="text-xs text-muted-foreground/80">
                    {summaryLabel(wf)}
                  </p>
                </div>
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* §11.12 — only an active workflow can be run; a draft being
                  runnable is how half-built processes escape. */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-[11px]"
                disabled={!isActive}
                title={
                  !isActive
                    ? "Activate this workflow before running it"
                    : undefined
                }
                onClick={onRun}
              >
                <Play className="w-3.5 h-3.5" />
                Run
              </Button>
              {/* §11.13 — flip the lifecycle without opening the builder. */}
              {isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[11px]"
                  onClick={() => onStatusChange("archived")}
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  Archive
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[11px]"
                  onClick={() => onStatusChange("active")}
                >
                  <Power className="w-3.5 h-3.5" />
                  Activate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-[11px]"
                onClick={onEdit}
              >
                <Pencil className="w-3.5 h-3.5" />
                {wf.kind === "system" ? "View" : "Edit"}
              </Button>
              {wf.kind === "custom" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          <CollapsibleContent>
            <ol className="mt-3 space-y-1.5">
              {wf.tasks.map((task) => {
                const reviewer = reviewerLabel(task.reviewer, roles);
                // §11.6 — name what this task waits on, so the order isn't
                // just implied by position in the list.
                const blockers = (task.dependsOn ?? [])
                  .map((id) => wf.tasks.find((t) => t.id === id)?.order)
                  .filter(Boolean);
                return (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                      {task.order}
                    </span>
                    <span className="text-foreground">{task.title}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">
                      {assigneeLabel(task.assignee, roles, employees)}
                    </span>
                    {reviewer && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground"
                      >
                        Reviewer: {reviewer}
                      </Badge>
                    )}
                    {/* §11.9 — due date and priority. */}
                    {task.dueDayOffset !== undefined && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px] text-muted-foreground"
                      >
                        <Clock className="h-2.5 w-2.5" />
                        Due day {task.dueDayOffset}
                      </Badge>
                    )}
                    {task.priority && task.priority !== "normal" && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          TASK_PRIORITY_STYLES[task.priority],
                        )}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>
                    )}
                    {blockers.length > 0 && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px] text-muted-foreground"
                      >
                        <Link2 className="h-2.5 w-2.5" />
                        After {blockers.join(", ")}
                      </Badge>
                    )}
                    {/* §11.8 — concurrent tasks. */}
                    {task.parallelGroup && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px] text-muted-foreground"
                      >
                        <GitBranch className="h-2.5 w-2.5" />
                        Parallel: {task.parallelGroup}
                      </Badge>
                    )}
                    {/* §11.11 — conditional tasks. */}
                    {task.condition && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground"
                      >
                        {WORKFLOW_CONDITION_LABELS[task.condition]}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
