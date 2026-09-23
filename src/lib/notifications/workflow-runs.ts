/**
 * Notifications for a workflow run, addressed to the person who owns the task.
 *
 * The existing workflow builders embed the assignee's *name* in the body -
 * "Amara, you have a task" - because there was nowhere to say who a
 * notification was for, so every one went to a single shared list. With a
 * recipient the name becomes redundant, and "you have a task" reads correctly
 * because it only reaches the person it is about.
 */
import type { PushNotificationPayload } from "@/src/lib/stores/notifications-slice";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";
import { TASK_PRIORITY_LABELS } from "@/src/lib/types/workflows";

function meta(task: RunTask): string {
  const bits = [`due ${task.dueDate}`, `${TASK_PRIORITY_LABELS[task.priority]} priority`];
  if (task.expectedDurationDays != null) {
    bits.push(`~${task.expectedDurationDays}d effort`);
  }
  return bits.join(" · ");
}

export function runTaskAssigned(
  run: WorkflowRun,
  task: RunTask,
): PushNotificationPayload {
  return {
    title: `New task — ${task.title}`,
    description: `You have a task on ${run.subject.name} (due ${task.dueDate}).`,
    detail:
      `${task.title}\n\n` +
      (task.description ? `${task.description}\n\n` : "") +
      `Workflow: ${run.workflowTitle}\nFor: ${run.subject.name}\n${meta(task)}\n` +
      (task.reviewerName ? `Reviewed by: ${task.reviewerName}\n` : ""),
    type: task.priority === "critical" ? "warning" : "info",
    recipientEmployeeIds: task.assigneeEmployeeId
      ? [task.assigneeEmployeeId]
      : undefined,
    // Nobody holds the role in scope, so address the role instead of
    // broadcasting to everyone.
    recipientRoleIds:
      !task.assigneeEmployeeId && task.assignee.kind === "role"
        ? [task.assignee.roleId]
        : undefined,
    href: run.subject.href,
  };
}

export function runStarted(
  run: WorkflowRun,
  activated: number,
): PushNotificationPayload {
  return {
    title: `${run.workflowTitle} started`,
    description: `${activated} task${activated === 1 ? "" : "s"} opened for ${run.subject.name}.`,
    detail:
      `${run.workflowTitle}\nFor: ${run.subject.name}\n` +
      `${run.tasks.length} tasks in total, ${activated} starting now.\n`,
    type: "info",
    href: run.subject.href,
  };
}
