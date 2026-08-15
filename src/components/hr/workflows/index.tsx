"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Trash2,
  Workflow,
  Zap,
  Hand,
  Clock,
  Link2,
  GitBranch,
  Play,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  deleteWorkflow,
  setWorkflowStatus,
} from "@/src/lib/stores/workflows-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { workflowStatusChanged } from "@/src/lib/notifications/workflows";
import { RunWorkflowDialog } from "./run-workflow-dialog";
import {
  TRIGGER_MODE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_STYLES,
  WORKFLOW_CONDITION_LABELS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_STYLES,
} from "@/src/lib/types/workflows";
import { cn } from "@/src/lib/utils";
import type { Workflow as WorkflowType } from "@/src/lib/types/workflows";
import {
  assigneeLabel,
  reviewerLabel,
  scheduleLabel,
  scopeLabel,
} from "./helpers";

export function WorkflowsHub() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const workflows = useAppSelector((s) => s.workflows.workflows);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const departments = useAppSelector((s) => s.locale.data?.departments ?? []);

  const [pendingDelete, setPendingDelete] = useState<WorkflowType | null>(null);
  const [running, setRunning] = useState<WorkflowType | null>(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    dispatch(deleteWorkflow(pendingDelete.id));
    toast.success("Workflow deleted");
    setPendingDelete(null);
  }

  /** §11.13 — activate/archive in place, and tell the owner it moved. */
  function handleStatusChange(
    wf: WorkflowType,
    next: NonNullable<WorkflowType["status"]>,
  ) {
    const from = wf.status ?? "draft";
    if (from === next) return;
    dispatch(setWorkflowStatus({ id: wf.id, status: next }));
    dispatch(pushNotification(workflowStatusChanged(wf, from, next)));
    toast.success(
      next === "active"
        ? `"${wf.title}" is now active`
        : next === "archived"
          ? `"${wf.title}" archived`
          : `"${wf.title}" moved back to draft`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        <Button
          className="gap-1.5 shrink-0"
          onClick={() => router.push("/hr-action-center/workflows/new")}
        >
          <Plus className="w-4 h-4" />
          Create workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Workflow className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">No workflows yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/hr-action-center/workflows/new")}
          >
            Create the first workflow
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <Card key={wf.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {wf.title}
                      </h3>
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
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
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
                      {wf.triggerMode === "automatic" &&
                        scheduleLabel(wf.schedule) && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {scheduleLabel(wf.schedule)}
                          </Badge>
                        )}
                    </div>
                    {wf.description && (
                      <p className="text-xs text-muted-foreground">
                        {wf.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* §11.12 — only an active workflow can be run; a draft
                        being runnable is how half-built processes escape. */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-[11px]"
                      disabled={(wf.status ?? "draft") !== "active"}
                      title={
                        (wf.status ?? "draft") !== "active"
                          ? "Activate this workflow before running it"
                          : undefined
                      }
                      onClick={() => setRunning(wf)}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Run
                    </Button>
                    {/* §11.13 — flip the lifecycle without opening the builder. */}
                    {(wf.status ?? "draft") === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-[11px]"
                        onClick={() => handleStatusChange(wf, "archived")}
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                        Archive
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-[11px]"
                        onClick={() => handleStatusChange(wf, "active")}
                      >
                        <Power className="w-3.5 h-3.5" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-[11px]"
                      onClick={() =>
                        router.push(`/hr-action-center/workflows/${wf.id}`)
                      }
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {wf.kind === "system" ? "View" : "Edit"}
                    </Button>
                    {wf.kind === "custom" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setPendingDelete(wf)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <ol className="mt-3 space-y-1.5">
                  {wf.tasks.map((task) => {
                    const reviewer = reviewerLabel(task.reviewer, roles);
                    // §11.6 — name what this task waits on, so the order isn't
                    // just implied by position in the list.
                    const blockers = (task.dependsOn ?? [])
                      .map(
                        (id) => wf.tasks.find((t) => t.id === id)?.order,
                      )
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RunWorkflowDialog
        workflow={running}
        onClose={() => setRunning(null)}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(v) => !v && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
