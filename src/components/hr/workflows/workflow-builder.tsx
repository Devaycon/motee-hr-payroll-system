"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
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
  WorkflowConditionKey,
  WorkflowReviewer,
  WorkflowSchedule,
  WorkflowScheduleOffsetUnit,
  WorkflowScope,
  WorkflowStatus,
  WorkflowTaskPriority,
  WorkflowTriggerEvent,
  WorkflowTriggerMode,
} from "@/src/lib/types/workflows";
import {
  SCHEDULE_OFFSET_UNIT_LABELS,
  TASK_PRIORITY_LABELS,
  TRIGGER_EVENT_LABELS,
  WORKFLOW_CONDITION_LABELS,
  WORKFLOW_STATUS_LABELS,
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
  // §11.9 — timing, effort and urgency. Empty string means "not set", so a
  // blank field stays undefined rather than becoming 0.
  dueDayOffset: string;
  expectedDurationDays: string;
  escalateAfterDays: string;
  priority: WorkflowTaskPriority | "";
  /**
   * §11.6 — positions of earlier tasks this one waits on. Positions rather
   * than ids because the store re-mints task ids on every save.
   */
  dependsOnIndexes: number[];
  /** §11.8 — tasks sharing a group name run together instead of queueing. */
  parallelGroup: string;
  /** §11.11 — the task only applies when this condition holds. */
  condition: WorkflowConditionKey | "";
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
    dueDayOffset: "",
    expectedDurationDays: "",
    escalateAfterDays: "",
    priority: "",
    dependsOnIndexes: [],
    parallelGroup: "",
    condition: "",
  };
}

function taskFromWorkflow(
  task: Workflow["tasks"][number],
  defaultRoleId: string,
  /** Stored task id → position, so dependencies survive the round-trip. */
  indexById: Map<string, number>,
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
    dueDayOffset: task.dueDayOffset != null ? String(task.dueDayOffset) : "",
    expectedDurationDays:
      task.expectedDurationDays != null
        ? String(task.expectedDurationDays)
        : "",
    escalateAfterDays:
      task.escalateAfterDays != null ? String(task.escalateAfterDays) : "",
    priority: task.priority ?? "",
    dependsOnIndexes: (task.dependsOn ?? [])
      .map((id) => indexById.get(id))
      .filter((i): i is number => i != null),
    parallelGroup: task.parallelGroup ?? "",
    condition: task.condition ?? "",
  };
}

/** "" → undefined; otherwise a finite number. Blank must not become 0. */
function optionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * How many advanced settings a task has, shown on the collapsed toggle so
 * configuration isn't invisible once the panel is closed.
 */
function advancedCount(task: TaskDraft): number {
  return [
    task.dueDayOffset.trim(),
    task.expectedDurationDays.trim(),
    task.escalateAfterDays.trim(),
    task.priority,
    task.parallelGroup.trim(),
    task.condition,
    task.dependsOnIndexes.length > 0 ? "y" : "",
  ].filter(Boolean).length;
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
  const employmentTypes = useAppSelector(
    (s) => s.locale.data?.employmentTypes ?? [],
  );
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
  const [tasks, setTasks] = useState<TaskDraft[]>(() => {
    if (!workflow || workflow.tasks.length === 0) {
      return [emptyTask(defaultRoleId)];
    }
    const indexById = new Map(workflow.tasks.map((t, i) => [t.id, i]));
    return workflow.tasks.map((t) =>
      taskFromWorkflow(t, defaultRoleId, indexById),
    );
  });

  // §11.13 — workflow-level configuration, so different groups can run
  // different versions of the same process.
  const [status, setStatus] = useState<WorkflowStatus>(
    workflow?.status ?? "draft",
  );
  const [owner, setOwner] = useState(workflow?.owner ?? "");
  const [effectiveDate, setEffectiveDate] = useState(
    workflow?.effectiveDate ?? "",
  );
  const [employmentType, setEmploymentType] = useState(
    workflow?.employmentType ?? "",
  );

  /** Which task cards have their advanced section open. */
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  function toggleExpanded(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

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

  /**
   * Rewrite every task's `dependsOnIndexes` after the list has been reordered
   * or shortened. `oldToNew` maps a task's previous position to its new one;
   * `null` means it was deleted. Dependencies that would end up pointing at a
   * later task are dropped — after a move, "wait for step 4" from step 2 is no
   * longer a thing the workflow can express.
   */
  function remapDependencies(
    list: TaskDraft[],
    oldToNew: (old: number) => number | null,
  ): TaskDraft[] {
    return list.map((task, newIndex) => ({
      ...task,
      dependsOnIndexes: task.dependsOnIndexes
        .map(oldToNew)
        .filter((i): i is number => i != null && i < newIndex),
    }));
  }

  function moveTask(index: number, dir: -1 | 1) {
    setTasks((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return remapDependencies(next, (old) => {
        if (old === index) return target;
        if (old === target) return index;
        return old;
      });
    });
  }

  function removeTask(index: number) {
    setTasks((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return remapDependencies(next, (old) => {
        if (old === index) return null;
        return old > index ? old - 1 : old;
      });
    });
  }

  /** §11.6 — toggle a dependency on the task at `depIndex`. */
  function toggleDependency(taskIndex: number, depIndex: number) {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== taskIndex) return t;
        const has = t.dependsOnIndexes.includes(depIndex);
        return {
          ...t,
          dependsOnIndexes: has
            ? t.dependsOnIndexes.filter((d) => d !== depIndex)
            : [...t.dependsOnIndexes, depIndex].sort((a, b) => a - b),
        };
      }),
    );
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

    // §11.6 — a task can only wait on one that runs before it. The dependency
    // picker only offers earlier tasks, but a reorder can invalidate a choice
    // that was legal when it was made, so it is re-checked here.
    for (let i = 0; i < tasks.length; i++) {
      const bad = tasks[i].dependsOnIndexes.find((d) => d >= i);
      if (bad !== undefined) {
        toast.error(`"${tasks[i].title.trim()}" depends on a later task.`, {
          description: "Move it earlier in the list, or drop the dependency.",
        });
        return;
      }
    }

    // §11.8 — a parallel group whose members depend on each other isn't
    // parallel. Worth a warning rather than a block: the run still works, it
    // just queues, and the author may be mid-edit.
    for (let i = 0; i < tasks.length; i++) {
      const group = tasks[i].parallelGroup.trim();
      if (!group) continue;
      const clash = tasks[i].dependsOnIndexes.some(
        (d) => tasks[d]?.parallelGroup.trim() === group,
      );
      if (clash) {
        toast.warning(`"${tasks[i].title.trim()}" won't run in parallel.`, {
          description: `It depends on another task in the "${group}" group, so it will wait for it.`,
        });
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
        // §11.9 / §11.6 / §11.8 / §11.11 — these used to be dropped here, which
        // is why the builder could never set them.
        dueDayOffset: optionalNumber(t.dueDayOffset),
        expectedDurationDays: optionalNumber(t.expectedDurationDays),
        escalateAfterDays: optionalNumber(t.escalateAfterDays),
        priority: t.priority || undefined,
        dependsOnIndexes:
          t.dependsOnIndexes.length > 0 ? t.dependsOnIndexes : undefined,
        parallelGroup: t.parallelGroup.trim() || undefined,
        condition: t.condition || undefined,
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
      // §11.13
      status,
      owner: owner.trim() || undefined,
      effectiveDate: effectiveDate || undefined,
      employmentType: employmentType || undefined,
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

        {/* §11.13 — a workflow's own lifecycle and applicability. Without
            these, every group runs the same version and a half-built draft is
            indistinguishable from a live process. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              disabled={readOnly}
              onValueChange={(v) => setStatus(v as WorkflowStatus)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(WORKFLOW_STATUS_LABELS) as WorkflowStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {WORKFLOW_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Only active workflows can be run.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Owner</Label>
            <Input
              value={owner}
              disabled={readOnly}
              placeholder={actorName}
              onChange={(e) => setOwner(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Who is accountable for this process. Defaults to you.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Effective from</Label>
            <Input
              type="date"
              value={effectiveDate}
              disabled={readOnly}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Applies to</Label>
            <Select
              value={employmentType || "all"}
              disabled={readOnly}
              onValueChange={(v) => setEmploymentType(v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employment types</SelectItem>
                {employmentTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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

                {/* §11.6 / §11.8 / §11.9 / §11.11 — collapsed by default so a
                    simple linear workflow stays simple to build. */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-1 text-[11px] text-muted-foreground"
                  onClick={() => toggleExpanded(i)}
                >
                  {expanded.has(i) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  Timing, dependencies &amp; conditions
                  {advancedCount(task) > 0 && (
                    <span className="rounded bg-primary/10 px-1 text-[10px] font-medium text-primary">
                      {advancedCount(task)}
                    </span>
                  )}
                </Button>

                {expanded.has(i) && (
                  <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                    {/* §11.9 — timing and urgency. */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Due (days from start)</Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-8"
                          placeholder="No due date"
                          value={task.dueDayOffset}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateTask(i, { dueDayOffset: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Priority</Label>
                        <Select
                          value={task.priority || "none"}
                          disabled={readOnly}
                          onValueChange={(v) =>
                            updateTask(i, {
                              priority:
                                v === "none"
                                  ? ""
                                  : (v as WorkflowTaskPriority),
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            {(
                              Object.keys(
                                TASK_PRIORITY_LABELS,
                              ) as WorkflowTaskPriority[]
                            ).map((p) => (
                              <SelectItem key={p} value={p}>
                                {TASK_PRIORITY_LABELS[p]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Expected effort (days)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-8"
                          placeholder="—"
                          value={task.expectedDurationDays}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateTask(i, {
                              expectedDurationDays: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Escalate after (days overdue)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-8"
                          placeholder="Never"
                          value={task.escalateAfterDays}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateTask(i, {
                              escalateAfterDays: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* §11.6 — only earlier tasks are offered, so a cycle
                        can't be built in the first place. */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Waits for</Label>
                      {i === 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          The first task has nothing to wait for.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {tasks.slice(0, i).map((dep, depIndex) => (
                            <label
                              key={depIndex}
                              className="flex items-center gap-2 text-[11px] text-foreground"
                            >
                              <Checkbox
                                checked={task.dependsOnIndexes.includes(
                                  depIndex,
                                )}
                                disabled={readOnly}
                                onCheckedChange={() =>
                                  toggleDependency(i, depIndex)
                                }
                              />
                              <span className="text-muted-foreground">
                                {depIndex + 1}.
                              </span>
                              {dep.title.trim() || (
                                <span className="italic text-muted-foreground">
                                  Untitled task
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* §11.8 — same group name = runs at the same time. */}
                      <div className="space-y-1">
                        <Label className="text-xs">Parallel group</Label>
                        <Input
                          className="h-8"
                          placeholder="e.g. Day one setup"
                          value={task.parallelGroup}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateTask(i, { parallelGroup: e.target.value })
                          }
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Tasks sharing a group name start together.
                        </p>
                      </div>

                      {/* §11.11 — conditional tasks. */}
                      <div className="space-y-1">
                        <Label className="text-xs">Only applies when</Label>
                        <Select
                          value={task.condition || "always"}
                          disabled={readOnly}
                          onValueChange={(v) =>
                            updateTask(i, {
                              condition:
                                v === "always"
                                  ? ""
                                  : (v as WorkflowConditionKey),
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="always">
                              Always applies
                            </SelectItem>
                            {(
                              Object.keys(
                                WORKFLOW_CONDITION_LABELS,
                              ) as WorkflowConditionKey[]
                            ).map((c) => (
                              <SelectItem key={c} value={c}>
                                {WORKFLOW_CONDITION_LABELS[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                          Skipped entirely when the condition doesn&apos;t hold.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
