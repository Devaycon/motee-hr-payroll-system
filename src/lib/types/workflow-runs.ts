/**
 * A workflow that is actually running, for one specific hire.
 *
 * The Workflows module stored templates and evaluated them with `planRun`, but
 * nothing ever kept the result: the one caller fired notifications and threw
 * the plan away. So `WorkflowTaskStatus` was declared and never assigned,
 * `dependsOn` never unblocked anything, and no screen could answer "who is
 * doing what" because no record of an assignment existed.
 *
 * This is that record. A run is the instance; the `Workflow` remains the
 * template. The run owns assignment, due dates and dependency state — every
 * "who has this?" question reads the run, never the template.
 */
import type {
  WorkflowAssignee,
  WorkflowConditionKey,
  WorkflowReviewer,
  WorkflowTaskPriority,
  WorkflowTaskStatus,
  WorkflowTriggerEvent,
} from "./workflows";
import type { RunContext } from "@/src/components/hr/workflows/run";

/** What a run is about — the record it was started for. */
export type RunSubjectKind =
  | "requisition"
  | "candidate"
  | "onboarding_record";

export interface RunSubject {
  kind: RunSubjectKind;
  id: string;
  /** The person, or the role being filled when no person exists yet. */
  name: string;
  /** Where to go to act on it. */
  href: string;
}

export interface RunTask {
  /** `${runId}::${templateTaskId}` — unique across runs of the same workflow. */
  id: string;
  /** The template task this came from; keeps `dependsOn` resolvable. */
  templateTaskId: string;
  order: number;
  title: string;
  description?: string;
  priority: WorkflowTaskPriority;
  status: WorkflowTaskStatus;
  /** The template's intent, preserved so a reassign can be seen as a change. */
  assignee: WorkflowAssignee;
  /** The resolved doer. Null when no employee holds the role in scope. */
  assigneeEmployeeId: string | null;
  /** A person's name, or the role's name when nobody holds it. */
  assigneeName: string;
  reviewer: WorkflowReviewer | null;
  reviewerEmployeeId: string | null;
  reviewerName: string | null;
  /** Real date, from the run's anchor plus the template's day offset. */
  dueDate: string;
  expectedDurationDays?: number;
  escalateAfterDays?: number;
  /** Ids of `RunTask`s (not template tasks) that must finish first. */
  dependsOn: string[];
  parallelGroup?: string;
  condition?: WorkflowConditionKey;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  completedBy?: string;
  note?: string;
  /** Set when someone moved the task off its resolved owner. */
  reassignedFrom?: string;
}

export interface WorkflowRun {
  /** `RUN-${workflowId}-${subjectId}` — deterministic, so a repeat is a no-op. */
  id: string;
  workflowId: string;
  workflowTitle: string;
  workflowVersion: number;
  trigger: WorkflowTriggerEvent | "manual";
  subject: RunSubject;
  /** The date `dueDayOffset` is measured from. */
  anchorDate: string;
  /** The §11.11 facts this run was planned against. */
  context: RunContext;
  status: "active" | "completed" | "cancelled";
  startedAt: string;
  startedBy: string;
  completedAt?: string;
  tasks: RunTask[];
}

/**
 * `overdue` is derived, never stored — a stored flag would be wrong the moment
 * the demo is opened on a later date than it was saved.
 */
export function effectiveStatus(
  task: RunTask,
  now: Date = new Date(),
): WorkflowTaskStatus {
  if (task.status !== "not_started" && task.status !== "in_progress") {
    return task.status;
  }
  const due = new Date(`${task.dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return task.status;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due < today ? "overdue" : task.status;
}

/** Whole days a task is past due; 0 when it is not. */
export function daysOverdue(task: RunTask, now: Date = new Date()): number {
  const due = new Date(`${task.dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000));
}

/** A task nobody can start yet, because something upstream is unfinished. */
export function isRunTaskOpen(task: RunTask): boolean {
  return (
    task.status === "not_started" ||
    task.status === "in_progress" ||
    task.status === "overdue"
  );
}
