/**
 * Turning a workflow template into a run for one specific hire.
 *
 * Pure and store-free so it can be unit tested and called from a listener
 * without pulling React in. It reuses `planRun` verbatim for the dependency,
 * parallel and conditional evaluation that was already written and already
 * correct - the only thing that was missing was somewhere to put the answer.
 */
import type { LocaleEmployee, LocaleRole } from "@/src/lib/types/locale";
import type { Workflow, WorkflowTask } from "@/src/lib/types/workflows";
import type {
  RunSubject,
  RunTask,
  WorkflowRun,
} from "@/src/lib/types/workflow-runs";
import {
  planRun,
  resolveAssigneeIdentity,
  resolveReviewerIdentity,
  type RunContext,
} from "@/src/components/hr/workflows/run";

/** A role id mapped to the person the source record actually named. */
export type RunOverrides = Record<string, { employeeId: string; name: string }>;

export interface BuildRunArgs {
  workflow: Workflow;
  subject: RunSubject;
  /** The date day-offsets are measured from (yyyy-mm-dd). */
  anchorDate: string;
  context: RunContext;
  roles: LocaleRole[];
  employees: LocaleEmployee[];
  startedBy: string;
  trigger: WorkflowRun["trigger"];
  /** The record's own people, which beat the global role table. */
  overrides?: RunOverrides;
}

/**
 * Date arithmetic entirely in UTC.
 *
 * Building a *local* midnight and then formatting it with `toISOString` shifts
 * the date by a day for anyone east of UTC - a due date of the 10th came out
 * as the 9th on a UTC+1 machine, which is every due date in the product.
 */
function addDays(from: string, days: number): string {
  const base = new Date(`${from}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return from;
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function runIdFor(workflowId: string, subjectId: string): string {
  return `RUN-${workflowId}-${subjectId}`;
}

function runTaskId(runId: string, templateTaskId: string): string {
  return `${runId}::${templateTaskId}`;
}

export function buildRun({
  workflow,
  subject,
  anchorDate,
  context,
  roles,
  employees,
  startedBy,
  trigger,
  overrides = {},
}: BuildRunArgs): WorkflowRun {
  const id = runIdFor(workflow.id, subject.id);
  const plan = planRun(workflow, context);

  const activated = new Set(plan.activated.map((t) => t.id));
  const skipped = new Set(plan.skipped.map((t) => t.id));

  const toRunTask = (task: WorkflowTask): RunTask => {
    const assignee = resolveAssigneeIdentity(
      workflow,
      task,
      roles,
      employees,
      overrides,
    );
    const reviewer = resolveReviewerIdentity(task, roles, employees, overrides);
    return {
      id: runTaskId(id, task.id),
      templateTaskId: task.id,
      order: task.order,
      title: task.title,
      description: task.description,
      priority: task.priority ?? "normal",
      status: skipped.has(task.id)
        ? "skipped"
        : activated.has(task.id)
          ? "not_started"
          : "blocked",
      assignee: task.assignee,
      assigneeEmployeeId: assignee.employeeId,
      assigneeName: assignee.name,
      reviewer: task.reviewer,
      reviewerEmployeeId: reviewer?.employeeId ?? null,
      reviewerName: reviewer?.name ?? null,
      dueDate: addDays(anchorDate, task.dueDayOffset ?? 0),
      expectedDurationDays: task.expectedDurationDays,
      escalateAfterDays: task.escalateAfterDays,
      // Template ids are rewritten to run ids so a task never depends on
      // another run's copy of itself.
      dependsOn: (task.dependsOn ?? []).map((d) => runTaskId(id, d)),
      parallelGroup: task.parallelGroup,
      condition: task.condition,
    };
  };

  return {
    id,
    workflowId: workflow.id,
    workflowTitle: workflow.title,
    workflowVersion: workflow.version ?? 1,
    trigger,
    subject,
    anchorDate,
    context,
    status: "active",
    startedAt: new Date().toISOString(),
    startedBy,
    tasks: [...workflow.tasks].sort((a, b) => a.order - b.order).map(toRunTask),
  };
}
