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

export interface WorkflowTask {
  id: string;
  order: number;
  title: string;
  description?: string;
  assignee: WorkflowAssignee;
  /** null when the reviewer toggle is off. */
  reviewer: WorkflowReviewer | null;
}

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
