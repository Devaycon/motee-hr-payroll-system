"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Workflow, Zap, Hand, Clock } from "lucide-react";
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
import { deleteWorkflow } from "@/src/lib/stores/workflows-slice";
import { TRIGGER_MODE_LABELS } from "@/src/lib/types/workflows";
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

  function confirmDelete() {
    if (!pendingDelete) return;
    dispatch(deleteWorkflow(pendingDelete.id));
    toast.success("Workflow deleted");
    setPendingDelete(null);
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
                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-2.5 text-sm"
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
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
