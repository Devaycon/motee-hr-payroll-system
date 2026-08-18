/**
 * Standalone workflow model for the Workflows module.
 *
 * A workflow is an ordered list of tasks for an action (onboarding, offboarding,
 * etc.). Unlike the approvals engine, each task here separates the *doer*
 * (assignee) from an *optional* reviewer.
 */

/** How a workflow is started: kicked off by hand, or fired automatically. */
export type WorkflowTriggerMode = "manual" | "automatic";

/** Unit for a relative (event-based) schedule offset. */
export type WorkflowScheduleOffsetUnit = "minutes" | "hours" | "days";

/** The lifecycle event a relative schedule is anchored to. */
export type WorkflowTriggerEvent =
  | "preboarding_initiated"
  | "onboarding_initiated"
  | "offboarding_initiated";

/**
 * When an automatic workflow fires. Either a fixed calendar date & time, or a
 * delay relative to a lifecycle event (e.g. after onboarding/offboarding is
 * initiated). `null` when the trigger mode is manual.
 */
export type WorkflowSchedule =
  | { kind: "fixed"; date: string; time: string }
  | {
      kind: "relative";
      event: WorkflowTriggerEvent;
      offsetValue: number;
      offsetUnit: WorkflowScheduleOffsetUnit;
    };

/**
 * Workflow scope. Tasks inherit this scope when resolving assignee/reviewer
 * options — there is no separate per-task scope.
 */
export type WorkflowScope =
  | { kind: "all" }
  | { kind: "department"; departmentId: string };

/** The doer of a task: a role (anyone with the role) or a specific employee. */
export type WorkflowAssignee =
  | { kind: "role"; roleId: string }
  | { kind: "employee"; employeeId: string };

/** A task's reviewer is optional and role-based only. */
export type WorkflowReviewer = { kind: "role"; roleId: string };

/** §11.9 — how urgent a task is, shown on the assignee's list. */
export type WorkflowTaskPriority = "low" | "normal" | "high" | "critical";

export const TASK_PRIORITY_LABELS: Record<WorkflowTaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
};

export const TASK_PRIORITY_STYLES: Record<WorkflowTaskPriority, string> = {
  low: "border-border bg-muted text-muted-foreground",
  normal: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/** §11.10 — where a task has got to. */
export type WorkflowTaskStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_approval"
  | "completed"
  | "blocked"
  | "overdue";

export const TASK_STATUS_LABELS: Record<WorkflowTaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  awaiting_approval: "Awaiting Approval",
  completed: "Completed",
  blocked: "Blocked",
  overdue: "Overdue",
};

export const TASK_STATUS_STYLES: Record<WorkflowTaskStatus, string> = {
  not_started: "border-border bg-muted text-muted-foreground",
  in_progress:
    "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  awaiting_approval:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  blocked:
    "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  overdue: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/**
 * §11.11 — a task that only applies in certain circumstances. Shipping
 * equipment to a remote worker, or immigration checks for a visa holder,
 * shouldn't sit on everyone's list looking incomplete.
 */
export type WorkflowConditionKey =
  | "remote_worker"
  | "company_car"
  | "contractor"
  | "visa_holder";

export const WORKFLOW_CONDITION_LABELS: Record<WorkflowConditionKey, string> = {
  remote_worker: "Only if remote worker",
  company_car: "Only if company car",
  contractor: "Only if contractor",
  visa_holder: "Only if visa holder",
};

export interface WorkflowTask {
  id: string;
  order: number;
  title: string;
  description?: string;
  assignee: WorkflowAssignee;
  /** null when the reviewer toggle is off. */
  reviewer: WorkflowReviewer | null;
  // §11.9 — timing, effort and urgency.
  /** Days from workflow start that this task is due. */
  dueDayOffset?: number;
  expectedDurationDays?: number;
  priority?: WorkflowTaskPriority;
  /** Days overdue before the task escalates to its reviewer. */
  escalateAfterDays?: number;
  /**
   * §11.6 — ids of tasks that must finish first. IT cannot activate accounts
   * before HR has approved the employee record, and payroll shouldn't
   * finalise before bank details are verified.
   */
  dependsOn?: string[];
  /**
   * §11.8 — tasks sharing a group run at the same time instead of queueing.
   * HR documents, payroll setup and IT setup can all start once the contract
   * is signed.
   */
  parallelGroup?: string;
  /** §11.11 — the task only applies when this condition holds. */
  condition?: WorkflowConditionKey;
}

/** §11.13 — a workflow's own lifecycle, so drafts aren't live by accident. */
export type WorkflowStatus = "draft" | "active" | "archived";

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const WORKFLOW_STATUS_STYLES: Record<WorkflowStatus, string> = {
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  active:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "border-border bg-muted text-muted-foreground",
};

export interface Workflow {
  id: string;
  title: string;
  description?: string;
  triggerMode: WorkflowTriggerMode;
  /** Set when triggerMode is "automatic"; null/undefined for manual. */
  schedule?: WorkflowSchedule | null;
  scope: WorkflowScope;
  /** system = seeded onboarding/offboarding (read-only, undeletable). */
  kind: "system" | "custom";
  tasks: WorkflowTask[];
  lastModifiedBy: string;
  lastModifiedAt: string;
  // §11.13 — configuration that lets different groups have different workflows.
  status?: WorkflowStatus;
  /** Bumped whenever the task list changes materially. */
  version?: number;
  /** ISO date this version takes effect from. */
  effectiveDate?: string;
  owner?: string;
  /** Restrict to an employment type (e.g. only permanent staff). */
  employmentType?: string;
}

/**
 * §11.6 / §11.8 — the tasks that can be started right now: everything whose
 * dependencies are met and which isn't already done. Tasks in the same
 * parallel group all become available together.
 */
export function availableTasks(
  tasks: WorkflowTask[],
  completedIds: Set<string>,
): WorkflowTask[] {
  return tasks.filter((t) => {
    if (completedIds.has(t.id)) return false;
    const deps = t.dependsOn ?? [];
    return deps.every((d) => completedIds.has(d));
  });
}

/** True when a task is waiting on something that hasn't finished. */
export function isBlocked(
  task: WorkflowTask,
  completedIds: Set<string>,
): boolean {
  return (task.dependsOn ?? []).some((d) => !completedIds.has(d));
}

export const TRIGGER_MODE_LABELS: Record<WorkflowTriggerMode, string> = {
  manual: "Manual",
  automatic: "Automatic",
};

export const TRIGGER_EVENT_LABELS: Record<WorkflowTriggerEvent, string> = {
  preboarding_initiated: "a candidate is hired",
  onboarding_initiated: "onboarding is initiated",
  offboarding_initiated: "offboarding is initiated",
};

export const SCHEDULE_OFFSET_UNIT_LABELS: Record<
  WorkflowScheduleOffsetUnit,
  string
> = {
  minutes: "minutes",
  hours: "hours",
  days: "days",
};
