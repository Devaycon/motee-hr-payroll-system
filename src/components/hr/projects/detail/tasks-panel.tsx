"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link2, Lock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { addTask, deleteTask, updateTask } from "@/src/lib/stores/projects-slice";
import { cn } from "@/src/lib/utils";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  criticalPath,
  isTaskBlocked,
  type Project,
  type ProjectTask,
  type ProjectTaskStatus,
} from "@/src/lib/types/projects";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

/** Mirrors the columns on screen, so an export reads the same as the table. */
const TASK_EXPORT_COLUMNS: ReportColumn<ProjectTask>[] = [
  { key: "name", header: "Task", value: (t) => t.name },
  {
    key: "assigneeName",
    header: "Assignee",
    value: (t) => t.assigneeName ?? "Unassigned",
  },
  { key: "startDate", header: "Start", value: (t) => t.startDate },
  { key: "endDate", header: "End", value: (t) => t.endDate },
  {
    key: "percentComplete",
    header: "Progress %",
    value: (t) => t.percentComplete,
  },
  {
    key: "status",
    header: "Status",
    value: (t) => TASK_STATUS_LABELS[t.status],
  },
];

export function TasksPanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const [adding, setAdding] = useState(false);

  const critical = useMemo(
    () => new Set(criticalPath(project.tasks)),
    [project.tasks],
  );

  function setStatus(task: ProjectTask, status: ProjectTaskStatus) {
    // §11.6-style guard: a task can't start while a dependency is unfinished.
    // Letting it through would make the Gantt's dependency arrows decorative.
    if (
      (status === "in_progress" || status === "completed") &&
      isTaskBlocked(task, project.tasks)
    ) {
      const blockers = (task.dependsOn ?? [])
        .map((id) => project.tasks.find((t) => t.id === id))
        .filter((t): t is ProjectTask => Boolean(t) && t!.status !== "completed")
        .map((t) => t.name);
      toast.error(`"${task.name}" is waiting on other work.`, {
        description: `Finish ${blockers.join(", ")} first.`,
      });
      return;
    }
    dispatch(
      updateTask({ projectId: project.id, taskId: task.id, patch: { status } }),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add task
        </Button>
      </div>

      {project.tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No tasks yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Add tasks with dates to build the timeline.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="flex justify-end border-b border-border/40 bg-muted/30 px-3 py-2">
            <ExportMenu
              name={`${project.code}-tasks`}
              title={`${project.name} — Tasks`}
              columns={TASK_EXPORT_COLUMNS}
              rows={project.tasks}
              variant="outline"
              buttonClassName="h-7 text-xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Task</th>
                  <th className="px-3 py-2 font-medium">Assignee</th>
                  <th className="px-3 py-2 font-medium">Dates</th>
                  <th className="px-3 py-2 text-center font-medium">Progress</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {project.tasks.map((task) => {
                  const blocked = isTaskBlocked(task, project.tasks);
                  const blockerNames = (task.dependsOn ?? [])
                    .map((id) => project.tasks.find((t) => t.id === id)?.name)
                    .filter(Boolean);

                  return (
                    <tr
                      key={task.id}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-foreground">
                            {task.name}
                          </span>
                          {critical.has(task.id) && (
                            <Badge
                              variant="outline"
                              className="border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-600 dark:text-rose-400"
                            >
                              Critical path
                            </Badge>
                          )}
                          {blocked && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[10px] text-muted-foreground"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              Blocked
                            </Badge>
                          )}
                        </div>
                        {task.phase && (
                          <p className="text-[10px] text-muted-foreground">
                            {task.phase}
                          </p>
                        )}
                        {blockerNames.length > 0 && (
                          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Link2 className="h-2.5 w-2.5" />
                            After {blockerNames.join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {task.assigneeName ?? "Unassigned"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">
                        {task.startDate}
                        <br />→ {task.endDate}
                      </td>
                      <td className="px-3 py-2">
                        <div className="mx-auto w-24 space-y-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="h-7 text-center text-xs"
                            value={task.percentComplete}
                            onChange={(e) =>
                              dispatch(
                                updateTask({
                                  projectId: project.id,
                                  taskId: task.id,
                                  patch: {
                                    percentComplete: Math.min(
                                      100,
                                      Math.max(0, Number(e.target.value) || 0),
                                    ),
                                  },
                                }),
                              )
                            }
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={task.status}
                          onValueChange={(v) =>
                            setStatus(task, v as ProjectTaskStatus)
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-36 text-[11px]",
                              TASK_STATUS_STYLES[task.status],
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.keys(
                                TASK_STATUS_LABELS,
                              ) as ProjectTaskStatus[]
                            ).map((s) => (
                              <SelectItem key={s} value={s}>
                                {TASK_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            dispatch(
                              deleteTask({
                                projectId: project.id,
                                taskId: task.id,
                              }),
                            );
                            toast.success(`"${task.name}" deleted`);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddTaskDialog
        open={adding}
        project={project}
        employees={employees.map((e) => ({ id: e.id, name: e.fullName }))}
        onClose={() => setAdding(false)}
        onAdd={(task) => {
          dispatch(addTask({ projectId: project.id, task }));
          toast.success(`"${task.name}" added`);
          setAdding(false);
        }}
      />
    </div>
  );
}

interface AddTaskDialogProps {
  open: boolean;
  project: Project;
  employees: { id: string; name: string }[];
  onClose: () => void;
  onAdd: (task: Omit<ProjectTask, "id">) => void;
}

function AddTaskDialog({
  open,
  project,
  employees,
  onClose,
  onAdd,
}: AddTaskDialogProps) {
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.startDate);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setPhase("");
      setAssignee("");
      setStartDate(project.startDate);
      setEndDate(project.startDate);
      setDependsOn([]);
    }
  }

  function handleAdd() {
    if (name.trim().length < 2) {
      toast.error("Give the task a name.");
      return;
    }
    if (endDate < startDate) {
      toast.error("The end date is before the start date.");
      return;
    }
    onAdd({
      name: name.trim(),
      phase: phase.trim() || undefined,
      status: "not_started",
      startDate,
      endDate,
      percentComplete: 0,
      assigneeName: assignee || undefined,
      dependsOn: dependsOn.length ? dependsOn : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Phase</Label>
              <Input
                placeholder="e.g. Discovery"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assignee</Label>
              <Select
                value={assignee || "none"}
                onValueChange={(v) => setAssignee(v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.slice(0, 60).map((e) => (
                    <SelectItem key={e.id} value={e.name}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Start</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {project.tasks.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Waits for</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                {project.tasks.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 text-[11px] text-foreground"
                  >
                    <Checkbox
                      checked={dependsOn.includes(t.id)}
                      onCheckedChange={() =>
                        setDependsOn((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((id) => id !== t.id)
                            : [...prev, t.id],
                        )
                      }
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
