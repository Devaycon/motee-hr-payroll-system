import type {
  OnboardingTask,
  OnboardingTaskAssignee,
} from "@/src/lib/types/onboarding";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";
import type { ApprovalChainTemplate, ApproverResolver } from "@/src/lib/types/approvals";
import type { Workflow } from "@/src/lib/types/workflows";

interface RoleLite {
  id: string;
  name: string;
}

/** Human label for a step's reviewer (role name or special resolver). */
export function resolveReviewerLabel(
  approver: ApproverResolver,
  roles: RoleLite[],
): string {
  if (approver === "LINE_MANAGER") return "Line Manager";
  if (approver === "DEPARTMENT_HEAD") return "Department Head";
  if (approver.startsWith("EMP:")) return approver.slice(4);
  if (approver.startsWith("ROLE:")) {
    const roleId = approver.slice(5);
    return roles.find((r) => r.id === roleId)?.name ?? "Reviewer";
  }
  return "Reviewer";
}

/**
 * Which function a task belongs to, keyed on the role id that owns it.
 *
 * This replaces a substring search over the *reviewer's job title*:
 *
 *     if (label.toLowerCase().includes("it")) return "it";
 *
 * which routed every task reviewed by a "Recru-it-er" or an "Aud-it-or" to the
 * IT desk. The badge is cosmetic, so an unrecognised role falls back to HR -
 * but it is now derived from an identifier rather than from spelling.
 */
const ROLE_BUCKET: Record<string, OnboardingTaskAssignee> = {
  "ROLE-IT": "it",
  "ROLE-MGR": "manager",
  "ROLE-FIN": "finance",
  "ROLE-HRADMIN": "hr",
  "ROLE-HRMGR": "hr",
  "ROLE-RECRUIT": "hr",
  "ROLE-EMP": "employee",
  "ROLE-EXEC": "manager",
};

function bucketFor(task: RunTask): OnboardingTaskAssignee {
  if (task.assignee.kind === "employee") return "employee";
  return ROLE_BUCKET[task.assignee.roleId] ?? "hr";
}

/** Project a run's tasks onto the onboarding record that displays them. */
export function tasksFromRun(run: WorkflowRun): OnboardingTask[] {
  return run.tasks.map((task) => ({
    id: task.id,
    taskName: task.title,
    assignee: bucketFor(task),
    // The run resolved a person; fall back to the role's name so the column is
    // never blank.
    reviewer: task.reviewerName ?? task.assigneeName,
    status: task.status === "completed" ? ("completed" as const) : ("pending" as const),
    isRequired: task.priority === "critical" || task.priority === "high",
    dueDate: task.dueDate,
    assigneeEmployeeId: task.assigneeEmployeeId ?? undefined,
    assigneeName: task.assigneeName,
    reviewerEmployeeId: task.reviewerEmployeeId ?? undefined,
    runId: run.id,
    runTaskId: task.id,
  }));
}

/** Onboarding workflows, default first. */
export function getOnboardingWorkflows(workflows: Workflow[]): Workflow[] {
  return workflows.filter(
    (w) =>
      w.status !== "archived" &&
      w.schedule?.kind === "relative" &&
      w.schedule.event === "onboarding_initiated",
  );
}

/** The workflow a new hire's onboarding should run. */
export function getDefaultOnboardingWorkflow(
  workflows: Workflow[],
): Workflow | undefined {
  const onboarding = getOnboardingWorkflows(workflows);
  return onboarding.find((w) => w.kind === "system") ?? onboarding[0];
}

/** Onboarding-category approval templates, default first. */
export function getOnboardingTemplates(
  templates: ApprovalChainTemplate[],
): ApprovalChainTemplate[] {
  return templates
    .filter((t) => t.documentType === "onboarding")
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/** The default onboarding approval chain (or the first available). */
export function getDefaultOnboardingTemplate(
  templates: ApprovalChainTemplate[],
): ApprovalChainTemplate | undefined {
  const onboarding = getOnboardingTemplates(templates);
  return onboarding.find((t) => t.isDefault) ?? onboarding[0];
}
