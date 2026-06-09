import type {
  OnboardingTask,
  OnboardingTaskAssignee,
} from "@/src/lib/types/onboarding";
import type {
  ApprovalChainTemplate,
  ApproverResolver,
} from "@/src/lib/types/approvals";

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
  if (approver.startsWith("ROLE:")) {
    const roleId = approver.slice(5);
    return roles.find((r) => r.id === roleId)?.name ?? "Reviewer";
  }
  return "Reviewer";
}

/** Best-effort assignee bucket from a reviewer label (drives the assignee badge color). */
function assigneeFromLabel(label: string): OnboardingTaskAssignee {
  const l = label.toLowerCase();
  if (l.includes("it")) return "it";
  if (l.includes("manager") || l.includes("head") || l.includes("lead"))
    return "manager";
  return "hr";
}

/**
 * Trigger a workflow for a hire: turn the chosen onboarding workflow
 * (ApprovalChainTemplate) into the hire's task list — one task per step,
 * each carrying the reviewer who must approve it.
 */
export function buildTasksFromWorkflow(
  recordId: string,
  template: ApprovalChainTemplate,
  roles: RoleLite[],
): OnboardingTask[] {
  return [...template.steps]
    .sort((a, b) => a.order - b.order)
    .map((step, i) => {
      const reviewer = resolveReviewerLabel(step.approver, roles);
      return {
        id: `${recordId}-t${i + 1}`,
        taskName: step.label,
        assignee: assigneeFromLabel(reviewer),
        reviewer,
        dueDay: i, // sequential placeholder; real due dates set elsewhere
        status: "pending" as const,
        isRequired: step.required,
      };
    });
}

/** Onboarding-category workflow templates, default first. */
export function getOnboardingTemplates(
  templates: ApprovalChainTemplate[],
): ApprovalChainTemplate[] {
  return templates
    .filter((t) => t.documentType === "onboarding")
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/** The default onboarding workflow (or the first available). */
export function getDefaultOnboardingTemplate(
  templates: ApprovalChainTemplate[],
): ApprovalChainTemplate | undefined {
  const onboarding = getOnboardingTemplates(templates);
  return onboarding.find((t) => t.isDefault) ?? onboarding[0];
}

/** Build tasks from a chosen template id, falling back to the default. */
export function buildTasksForSelection(
  recordId: string,
  templates: ApprovalChainTemplate[],
  roles: RoleLite[],
  templateId?: string,
): { tasks: OnboardingTask[]; template: ApprovalChainTemplate | undefined } {
  const template =
    (templateId
      ? templates.find((t) => t.id === templateId)
      : undefined) ?? getDefaultOnboardingTemplate(templates);
  const tasks = template ? buildTasksFromWorkflow(recordId, template, roles) : [];
  return { tasks, template };
}
