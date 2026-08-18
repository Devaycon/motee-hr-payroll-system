"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GitBranch, Link2, Play, SkipForward } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import {
  taskAssigned,
  taskAwaitingReview,
  workflowRunStarted,
  duePhrase,
} from "@/src/lib/notifications/workflows";
import type { Workflow } from "@/src/lib/types/workflows";
import {
  RUN_CONTEXT_FIELDS,
  planRun,
  resolveAssignees,
  resolveReviewer,
  type RunContext,
} from "./run";

interface RunWorkflowDialogProps {
  workflow: Workflow | null;
  onClose: () => void;
}

/**
 * §11.12 — starting a workflow and telling everyone involved.
 *
 * The preview is the point: the conditional/dependency/parallel settings are
 * invisible until something evaluates them, so the dialog shows exactly which
 * tasks start, which wait and which don't apply *before* anyone is notified.
 */
export function RunWorkflowDialog({
  workflow,
  onClose,
}: RunWorkflowDialogProps) {
  const dispatch = useAppDispatch();
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);

  const [context, setContext] = useState<RunContext>({});

  const plan = useMemo(
    () => (workflow ? planRun(workflow, context) : null),
    [workflow, context],
  );

  if (!workflow || !plan) return null;

  function toggle(key: keyof RunContext) {
    setContext((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleRun() {
    if (!workflow || !plan) return;

    // One notification per assignee per activated task, plus the reviewer.
    let notified = 0;
    for (const task of plan.activated) {
      for (const name of resolveAssignees(workflow, task, roles, employees)) {
        dispatch(pushNotification(taskAssigned(workflow, task, name)));
        notified++;
      }
      const reviewer = resolveReviewer(task, roles);
      if (reviewer) {
        dispatch(
          pushNotification(taskAwaitingReview(workflow, task, reviewer)),
        );
        notified++;
      }
    }

    // …and a run summary for whoever owns the process.
    dispatch(
      pushNotification(
        workflowRunStarted(
          workflow,
          plan.activated,
          plan.skipped,
          plan.blocked,
        ),
      ),
    );

    toast.success(`"${workflow.title}" started`, {
      description: `${plan.activated.length} task(s) assigned · ${notified} notification(s) sent.`,
    });
    setContext({});
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Run &ldquo;{workflow.title}&rdquo;</DialogTitle>
          <DialogDescription>
            Everyone assigned a task that starts now will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* §11.11 — the facts conditional tasks are evaluated against. */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              About this run
            </p>
            <div className="grid grid-cols-2 gap-2">
              {RUN_CONTEXT_FIELDS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  <Checkbox
                    checked={context[f.key] === true}
                    onCheckedChange={() => toggle(f.key)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Conditional tasks are skipped unless their condition is ticked.
            </p>
          </div>

          <Separator />

          <div className="max-h-64 space-y-3 overflow-y-auto">
            <RunSection
              title={`Starting now (${plan.activated.length})`}
              tone="text-emerald-600 dark:text-emerald-400"
              empty="Nothing can start — every task is waiting or skipped."
              tasks={plan.activated.map((t) => ({
                id: t.id,
                title: t.title,
                meta: duePhrase(t),
                badge: t.parallelGroup
                  ? { icon: "parallel" as const, text: t.parallelGroup }
                  : undefined,
              }))}
            />

            {plan.blocked.length > 0 && (
              <RunSection
                title={`Waiting on dependencies (${plan.blocked.length})`}
                tone="text-amber-600 dark:text-amber-400"
                tasks={plan.blocked.map((t) => ({
                  id: t.id,
                  title: t.title,
                  meta: "starts once its dependencies finish",
                  badge: { icon: "blocked" as const, text: "Blocked" },
                }))}
              />
            )}

            {plan.skipped.length > 0 && (
              <RunSection
                title={`Not applicable (${plan.skipped.length})`}
                tone="text-muted-foreground"
                tasks={plan.skipped.map((t) => ({
                  id: t.id,
                  title: t.title,
                  meta: "condition not met for this run",
                  badge: { icon: "skipped" as const, text: "Skipped" },
                }))}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="gap-1.5"
            disabled={plan.activated.length === 0}
            onClick={handleRun}
          >
            <Play className="h-3.5 w-3.5" />
            Start &amp; notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RunSectionProps {
  title: string;
  tone: string;
  empty?: string;
  tasks: {
    id: string;
    title: string;
    meta: string;
    badge?: { icon: "parallel" | "blocked" | "skipped"; text: string };
  }[];
}

function RunSection({ title, tone, empty, tasks }: RunSectionProps) {
  return (
    <div className="space-y-1.5">
      <p className={`text-xs font-semibold ${tone}`}>{title}</p>
      {tasks.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{empty}</p>
      ) : (
        tasks.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs"
          >
            <span className="font-medium text-foreground">{t.title}</span>
            <span className="text-muted-foreground">— {t.meta}</span>
            {t.badge && (
              <Badge
                variant="outline"
                className="ml-auto gap-1 text-[10px] text-muted-foreground"
              >
                {t.badge.icon === "parallel" && (
                  <GitBranch className="h-2.5 w-2.5" />
                )}
                {t.badge.icon === "blocked" && <Link2 className="h-2.5 w-2.5" />}
                {t.badge.icon === "skipped" && (
                  <SkipForward className="h-2.5 w-2.5" />
                )}
                {t.badge.text}
              </Badge>
            )}
          </div>
        ))
      )}
    </div>
  );
}
