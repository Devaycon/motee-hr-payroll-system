"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Separator } from "@/src/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  createWorkflow,
  updateWorkflow,
} from "@/src/lib/stores/workflows-slice";
import type {
  Workflow,
  WorkflowAssignee,
  WorkflowReviewer,
  WorkflowSchedule,
  WorkflowScheduleOffsetUnit,
  WorkflowScope,
  WorkflowTriggerEvent,
  WorkflowTriggerMode,
} from "@/src/lib/types/workflows";
import {
  SCHEDULE_OFFSET_UNIT_LABELS,
  TRIGGER_EVENT_LABELS,
} from "@/src/lib/types/workflows";
import { employeesForScope } from "./helpers";

interface TaskDraft {
  title: string;
  description: string;
  assigneeKind: "role" | "employee";
  assigneeRoleId: string;
  assigneeEmployeeId: string;
  hasReviewer: boolean;
  reviewerRoleId: string;
}

function emptyTask(defaultRoleId: string): TaskDraft {
  return {
    title: "",
    description: "",
    assigneeKind: "role",
    assigneeRoleId: defaultRoleId,
    assigneeEmployeeId: "",
    hasReviewer: false,
    reviewerRoleId: defaultRoleId,
  };
}

function taskFromWorkflow(
  task: Workflow["tasks"][number],
  defaultRoleId: string,
): TaskDraft {
  return {
    title: task.title,
    description: task.description ?? "",
    assigneeKind: task.assignee.kind,
    assigneeRoleId:
      task.assignee.kind === "role" ? task.assignee.roleId : defaultRoleId,
    assigneeEmployeeId:
      task.assignee.kind === "employee" ? task.assignee.employeeId : "",
    hasReviewer: task.reviewer !== null,
    reviewerRoleId: task.reviewer?.roleId ?? defaultRoleId,
  };
}

interface WorkflowBuilderProps {
  /** When set, the builder edits/views this workflow; otherwise it creates one. */
  workflow?: Workflow | null;
  /** View-only (used for system workflows). */
  readOnly?: boolean;
}

export function WorkflowBuilder({
  workflow,
  readOnly = false,
}: WorkflowBuilderProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const departments = useAppSelector((s) => s.locale.data?.departments ?? []);
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR Admin";

  const defaultRoleId = roles[0]?.id ?? "";

  const [title, setTitle] = useState(workflow?.title ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [triggerMode, setTriggerMode] = useState<WorkflowTriggerMode>(
    workflow?.triggerMode ?? "manual",
  );

  // Schedule (only used when triggerMode === "automatic").
  const initialSchedule = workflow?.schedule ?? null;
  const [scheduleKind, setScheduleKind] = useState<"fixed" | "relative">(
    initialSchedule?.kind ?? "relative",
  );
  const [fixedDate, setFixedDate] = useState<string>(
    initialSchedule?.kind === "fixed" ? initialSchedule.date : "",
  );
  const [fixedTime, setFixedTime] = useState<string>(
    initialSchedule?.kind === "fixed" ? initialSchedule.time : "",
  );
  const [relEvent, setRelEvent] = useState<WorkflowTriggerEvent>(
    initialSchedule?.kind === "relative"
      ? initialSchedule.event
      : "onboarding_initiated",
  );
  const [relOffsetValue, setRelOffsetValue] = useState<string>(
    initialSchedule?.kind === "relative"
      ? String(initialSchedule.offsetValue)
      : "0",
  );
  const [relOffsetUnit, setRelOffsetUnit] =
    useState<WorkflowScheduleOffsetUnit>(
      initialSchedule?.kind === "relative" ? initialSchedule.offsetUnit : "days",
    );

  const [scopeKind, setScopeKind] = useState<"all" | "department">(
    workflow?.scope.kind ?? "all",
  );
  const [departmentId, setDepartmentId] = useState<string>(
    workflow?.scope.kind === "department"
      ? workflow.scope.departmentId
      : (departments[0]?.id ?? ""),
  );
  const [tasks, setTasks] = useState<TaskDraft[]>(
    workflow && workflow.tasks.length > 0
      ? workflow.tasks.map((t) => taskFromWorkflow(t, defaultRoleId))
      : [emptyTask(defaultRoleId)],
  );

  const scope: WorkflowScope = useMemo(
    () => (scopeKind === "all" ? { kind: "all" } : { kind: "department", departmentId }),
    [scopeKind, departmentId],
  );

  const scopedEmployees = useMemo(
    () => employeesForScope(scope, employees),
    [scope, employees],
  );

  const isEdit = Boolean(workflow) && !readOnly;

  function updateTask(index: number, patch: Partial<TaskDraft>) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  function moveTask(index: number, dir: -1 | 1) {
    setTasks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      toast.error("Give the workflow a title (at least 3 characters).");
      return;
    }
    if (scopeKind === "department" && !departmentId) {
      toast.error("Choose a department for this workflow's scope.");
      return;
    }

    // Build & validate the schedule for automatic workflows.
    let schedule: WorkflowSchedule | null = null;
    if (triggerMode === "automatic") {
      if (scheduleKind === "fixed") {
        if (!fixedDate) {
          toast.error("Pick a date for the automatic trigger.");
          return;
        }
        schedule = { kind: "fixed", date: fixedDate, time: fixedTime };
      } else {
        const offset = Number(relOffsetValue);
        if (!Number.isFinite(offset) || offset < 0) {
          toast.error("Enter a valid offset for the relative trigger.");
          return;
        }
        schedule = {
          kind: "relative",
          event: relEvent,
          offsetValue: offset,
          offsetUnit: relOffsetUnit,
        };
      }
    }

    if (tasks.length === 0) {
      toast.error("Add at least one task.");
      return;
    }
    for (const t of tasks) {
      if (!t.title.trim()) {
        toast.error("Every task needs a title.");
        return;
      }
      if (t.assigneeKind === "role" && !t.assigneeRoleId) {
        toast.error(`Pick a role assignee for "${t.title.trim()}".`);
        return;
      }
      if (t.assigneeKind === "employee" && !t.assigneeEmployeeId) {
        toast.error(`Pick an employee assignee for "${t.title.trim()}".`);
        return;
      }
      if (t.hasReviewer && !t.reviewerRoleId) {
        toast.error(`Pick a reviewer for "${t.title.trim()}".`);
        return;
      }
    }

    const cleanedTasks = tasks.map((t) => {
      const assignee: WorkflowAssignee =
        t.assigneeKind === "role"
          ? { kind: "role", roleId: t.assigneeRoleId }
          : { kind: "employee", employeeId: t.assigneeEmployeeId };
      const reviewer: WorkflowReviewer | null = t.hasReviewer
        ? { kind: "role", roleId: t.reviewerRoleId }
        : null;
      return {
        title: t.title.trim(),
        description: t.description.trim() || undefined,
        assignee,
        reviewer,
      };
    });

    const draft = {
      title: trimmedTitle,
      description: description.trim() || undefined,
      triggerMode,
      schedule,
      scope,
      tasks: cleanedTasks,
      actorName,
    };

    if (workflow) {
      dispatch(updateWorkflow({ id: workflow.id, ...draft }));
      toast.success("Workflow updated");
    } else {
      dispatch(createWorkflow(draft));
      toast.success("Workflow created");
    }
    router.push("/hr-action-center/workflows");
  }

  const heading = readOnly
    ? (workflow?.title ?? "Workflow")
    : isEdit
      ? "Edit workflow"
      : "Create workflow";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/hr-action-center/workflows")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{heading}</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Section 1 — Workflow details */}
          <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Workflow details
        </h2>

        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            disabled={readOnly}
            placeholder="e.g. New Hire Onboarding"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={description}
            disabled={readOnly}
            placeholder="What does this workflow do?"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Trigger mode</Label>
            <RadioGroup
              className="gap-2"
              value={triggerMode}
              onValueChange={(v) =>
                !readOnly && setTriggerMode(v as WorkflowTriggerMode)
              }
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="manual" disabled={readOnly} />
                Manual
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="automatic" disabled={readOnly} />
                Automatic
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label>Scope</Label>
            <RadioGroup
              className="gap-2"
              value={scopeKind}
              onValueChange={(v) =>
                !readOnly && setScopeKind(v as "all" | "department")
              }
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="all" disabled={readOnly} />
                All departments
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="department" disabled={readOnly} />
                Specific department
              </label>
            </RadioGroup>
            {scopeKind === "department" && (
              <Select
                value={departmentId}
                disabled={readOnly}
                onValueChange={setDepartmentId}
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {triggerMode === "automatic" && (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <Label>When should it trigger?</Label>
            <RadioGroup
              className="gap-2"
              value={scheduleKind}
              onValueChange={(v) =>
                !readOnly && setScheduleKind(v as "fixed" | "relative")
              }
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="fixed" disabled={readOnly} />
                On a specific date &amp; time
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="relative" disabled={readOnly} />
                After a lifecycle event
              </label>
            </RadioGroup>

            {scheduleKind === "fixed" ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  className="h-8 w-44"
                  value={fixedDate}
                  disabled={readOnly}
                  onChange={(e) => setFixedDate(e.target.value)}
                />
                <Input
                  type="time"
                  className="h-8 w-32"
                  value={fixedTime}
                  disabled={readOnly}
                  onChange={(e) => setFixedTime(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-20"
                  value={relOffsetValue}
                  disabled={readOnly}
                  onChange={(e) => setRelOffsetValue(e.target.value)}
                />
                <Select
                  value={relOffsetUnit}
                  disabled={readOnly}
                  onValueChange={(v) =>
                    setRelOffsetUnit(v as WorkflowScheduleOffsetUnit)
                  }
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        SCHEDULE_OFFSET_UNIT_LABELS,
                      ) as WorkflowScheduleOffsetUnit[]
                    ).map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {SCHEDULE_OFFSET_UNIT_LABELS[unit]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>after</span>
                <Select
                  value={relEvent}
                  disabled={readOnly}
                  onValueChange={(v) =>
                    setRelEvent(v as WorkflowTriggerEvent)
                  }
                >
                  <SelectTrigger className="h-8 w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        TRIGGER_EVENT_LABELS,
                      ) as WorkflowTriggerEvent[]
                    ).map((evt) => (
                      <SelectItem key={evt} value={evt}>
                        {TRIGGER_EVENT_LABELS[evt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Section 2 — Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px]"
              onClick={() =>
                setTasks((p) => [...p, emptyTask(defaultRoleId)])
              }
            >
              <Plus className="w-3 h-3" />
              Add task
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-border/60 p-3"
            >
              <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Task title</Label>
                  <Input
                    value={task.title}
                    disabled={readOnly}
                    placeholder="e.g. Provision equipment & accounts"
                    onChange={(e) => updateTask(i, { title: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Task description</Label>
                  <Textarea
                    rows={2}
                    value={task.description}
                    disabled={readOnly}
                    placeholder="What needs to be done?"
                    onChange={(e) =>
                      updateTask(i, { description: e.target.value })
                    }
                  />
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Assignee</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <RadioGroup
                      className="flex w-auto flex-row gap-3"
                      value={task.assigneeKind}
                      onValueChange={(v) =>
                        !readOnly &&
                        updateTask(i, {
                          assigneeKind: v as "role" | "employee",
                        })
                      }
                    >
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RadioGroupItem value="role" disabled={readOnly} />
                        Role based
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <RadioGroupItem value="employee" disabled={readOnly} />
                        Individual employee
                      </label>
                    </RadioGroup>

                    {task.assigneeKind === "role" ? (
                      <Select
                        value={task.assigneeRoleId}
                        disabled={readOnly}
                        onValueChange={(v) =>
                          updateTask(i, { assigneeRoleId: v })
                        }
                      >
                        <SelectTrigger className="h-8 w-56">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        value={task.assigneeEmployeeId}
                        disabled={readOnly}
                        onValueChange={(v) =>
                          updateTask(i, { assigneeEmployeeId: v })
                        }
                      >
                        <SelectTrigger className="h-8 w-56">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {scopedEmployees.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                              No employees in this scope
                            </div>
                          ) : (
                            scopedEmployees.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.fullName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Reviewer (optional) */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={task.hasReviewer}
                      disabled={readOnly}
                      onCheckedChange={(v) =>
                        updateTask(i, { hasReviewer: Boolean(v) })
                      }
                    />
                    Add reviewer
                  </label>
                  {task.hasReviewer && (
                    <Select
                      value={task.reviewerRoleId}
                      disabled={readOnly}
                      onValueChange={(v) =>
                        updateTask(i, { reviewerRoleId: v })
                      }
                    >
                      <SelectTrigger className="h-8 w-56">
                        <SelectValue placeholder="Select reviewer role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {!readOnly && (
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={i === 0}
                    onClick={() => moveTask(i, -1)}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={i === tasks.length - 1}
                    onClick={() => moveTask(i, 1)}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    disabled={tasks.length === 1}
                    onClick={() => removeTask(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/hr-action-center/workflows")}
            >
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {!readOnly && (
              <Button onClick={handleSave}>
                {isEdit ? "Save changes" : "Create workflow"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
