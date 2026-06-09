import type { Candidate, JobRequisition } from "@/src/lib/types/recruitment";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import type { ApprovalChainTemplate } from "@/src/lib/types/approvals";
import { buildTasksForSelection } from "@/src/components/hr/onboarding/instantiate";

interface RoleLite {
  id: string;
  name: string;
}

/**
 * Turn a hired candidate into a pre-boarding onboarding record, mirroring the
 * "Send to onboarding" action in the candidate drawer. Reuses
 * `buildTasksForSelection` to instantiate tasks from the default onboarding
 * workflow.
 */
export function candidateToOnboardingRecord(
  candidate: Candidate,
  requisition: JobRequisition | undefined,
  templates: ApprovalChainTemplate[],
  roles: RoleLite[],
): OnboardingRecord {
  const id = `onb-${candidate.id}-${Date.now()}`;
  const { tasks, template } = buildTasksForSelection(id, templates, roles);
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    employeeName: candidate.name,
    employeeInitials: candidate.initials,
    email: candidate.email,
    jobTitle: requisition?.positionTitle ?? candidate.requisitionTitle ?? "New hire",
    department: requisition?.department ?? "—",
    startDate: requisition?.targetStartDate ?? today,
    stage: "pre_boarding",
    status: "not_started",
    phase: "pre_onboarding",
    workflowTemplateId: template?.id,
    workflowName: template?.name,
    tasks,
    completedTasks: 0,
    totalTasks: tasks.length,
    welcomeEmailSent: false,
    initiatedAt: today,
    mode: "invited",
  };
}
