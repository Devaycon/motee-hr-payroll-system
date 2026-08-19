"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Plus,
  Workflow,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { WorkflowCard } from "./components/workflow-card";
import type { Workflow as WorkflowType } from "@/src/lib/types/workflows";

export function WorkflowsHub() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const workflows = useAppSelector((s) => s.workflows.workflows);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const departments = useAppSelector((s) => s.locale.data?.departments ?? []);

  const [pendingDelete, setPendingDelete] = useState<WorkflowType | null>(null);
  const [running, setRunning] = useState<WorkflowType | null>(null);
  /**
   * Which cards are expanded. Cards start collapsed — the hub is for choosing
   * a workflow, not for reading every step of all of them at once.
   */
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const allOpen = workflows.length > 0 && openIds.size === workflows.length;

  function toggleOpen(id: string, open: boolean) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll() {
    setOpenIds(allOpen ? new Set() : new Set(workflows.map((w) => w.id)));
  }

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
      <div className="flex items-start justify-end gap-2">
        {workflows.length > 0 && (
          <Button
            variant="ghost"
            className="gap-1.5 shrink-0 text-muted-foreground"
            onClick={toggleAll}
          >
            {allOpen ? (
              <ChevronsDownUp className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4" />
            )}
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        )}
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
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              roles={roles}
              employees={employees}
              departments={departments}
              open={openIds.has(wf.id)}
              onOpenChange={(open) => toggleOpen(wf.id, open)}
              onRun={() => setRunning(wf)}
              onStatusChange={(next) => handleStatusChange(wf, next)}
              onEdit={() =>
                router.push(`/hr-action-center/workflows/${wf.id}`)
              }
              onDelete={() => setPendingDelete(wf)}
            />
          ))}
        </div>
      )}

      <RunWorkflowDialog workflow={running} onClose={() => setRunning(null)} />

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
