/**
 * §11.12 — workflow engine notifications.
 *
 * A workflow that assigns a task to someone who is never told about it is just
 * a document. These builders return payloads for `pushNotification`, raised
 * when a workflow is run (see `components/hr/workflows/run.ts`) and when a
 * workflow's own status changes.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";
import type {
  Workflow,
  WorkflowStatus,
  WorkflowTask,
} from "@/src/lib/types/workflows";
import {
  TASK_PRIORITY_LABELS,
  WORKFLOW_STATUS_LABELS,
} from "@/src/lib/types/workflows";

/** "due in 3 days" / "due today" / "no due date set". */
export function duePhrase(task: WorkflowTask): string {
  const offset = task.dueDayOffset;
  if (offset == null) return "no due date set";
  if (offset <= 0) return "due today";
  return `due in ${offset} day${offset === 1 ? "" : "s"}`;
}

function taskMeta(task: WorkflowTask): string {
  const bits = [duePhrase(task)];
  if (task.priority) bits.push(`${TASK_PRIORITY_LABELS[task.priority]} priority`);
  if (task.expectedDurationDays != null) {
    bits.push(`~${task.expectedDurationDays}d effort`);
  }
  return bits.join(" · ");
}

export function taskAssigned(
  workflow: Workflow,
  task: WorkflowTask,
  assigneeName: string,
): PushNotificationPayload {
  return {
    title: `Task assigned — ${task.title}`,
    description: `${assigneeName}, you have a task on "${workflow.title}" (${duePhrase(task)}).`,
    detail:
      `${task.title}\n\n` +
      (task.description ? `${task.description}\n\n` : "") +
      `Workflow: ${workflow.title}\n${taskMeta(task)}\n` +
      (task.parallelGroup
        ? `This runs alongside the other "${task.parallelGroup}" tasks.\n`
        : "") +
      (task.escalateAfterDays != null
        ? `Escalates to the reviewer if not done within ${task.escalateAfterDays} day(s) of the due date.\n`
        : ""),
    type: task.priority === "critical" ? "warning" : "info",
  };
}

export function taskAwaitingReview(
  workflow: Workflow,
  task: WorkflowTask,
  reviewerName: string,
): PushNotificationPayload {
  return {
    title: `Review required — ${task.title}`,
    description: `${reviewerName}, you are the reviewer for "${task.title}" on ${workflow.title}.`,
    detail:
      `You have been named as the reviewer for a task on "${workflow.title}".\n\n` +
      `Task: ${task.title}\n${taskMeta(task)}\n\n` +
      "You will be asked to sign it off once the assignee marks it done.",
    type: "info",
  };
}

export function workflowRunStarted(
  workflow: Workflow,
  activated: WorkflowTask[],
  skipped: WorkflowTask[],
  blocked: WorkflowTask[],
): PushNotificationPayload {
  const lines = [
    `${activated.length} task(s) have started:`,
    ...activated.map((t) => `• ${t.title} — ${duePhrase(t)}`),
  ];
  if (blocked.length > 0) {
    lines.push(
      "",
      `${blocked.length} task(s) are waiting on dependencies:`,
      ...blocked.map((t) => `• ${t.title}`),
    );
  }
  if (skipped.length > 0) {
    lines.push(
      "",
      `${skipped.length} conditional task(s) do not apply to this run:`,
      ...skipped.map((t) => `• ${t.title}`),
    );
  }
  return {
    title: `Workflow started — ${workflow.title}`,
    description: `${activated.length} task(s) assigned, ${blocked.length} waiting, ${skipped.length} not applicable.`,
    detail: lines.join("\n"),
    type: "success",
  };
}

export function workflowStatusChanged(
  workflow: Workflow,
  from: WorkflowStatus,
  to: WorkflowStatus,
): PushNotificationPayload {
  return {
    title: `Workflow ${WORKFLOW_STATUS_LABELS[to].toLowerCase()} — ${workflow.title}`,
    description: `"${workflow.title}" moved from ${WORKFLOW_STATUS_LABELS[from]} to ${WORKFLOW_STATUS_LABELS[to]}.`,
    detail:
      `"${workflow.title}" is now ${WORKFLOW_STATUS_LABELS[to]}.\n\n` +
      (workflow.version != null ? `Version: v${workflow.version}\n` : "") +
      (workflow.effectiveDate ? `Effective from: ${workflow.effectiveDate}\n` : "") +
      (workflow.owner ? `Owner: ${workflow.owner}\n` : "") +
      (to === "active"
        ? "\nIt can now be run and will fire on its configured trigger."
        : to === "archived"
          ? "\nIt can no longer be run. Existing runs are unaffected."
          : "\nDrafts cannot be run until they are activated."),
    type: to === "active" ? "success" : "info",
  };
}
