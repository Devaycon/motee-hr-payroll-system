import type { Candidate, JobRequisition } from "@/src/lib/types/recruitment";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";

/**
 * Turn a hired candidate into an onboarding record.
 *
 * The task list is deliberately left empty here. Tasks used to be instantiated
 * from an approval chain - a list of reviewers - with the doer guessed from the
 * reviewer's job title. They now come from the onboarding workflow run that the
 * runs listener starts the moment this record lands in the store, which is the
 * only thing that knows who actually does each one.
 */
export function candidateToOnboardingRecord(
  candidate: Candidate,
  requisition: JobRequisition | undefined,
): OnboardingRecord {
  // Derived from the candidate alone (no timestamp), so inviting the same hire
  // twice - from the table and from the drawer, say - collides on one id and is
  // dropped by `addRecord` rather than creating a second onboarding.
  const id = `onb-${candidate.id}`;
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    employeeName: candidate.name,
    employeeInitials: candidate.initials,
    email: candidate.email,
    jobTitle: requisition?.positionTitle ?? candidate.requisitionTitle ?? "New hire",
    department: requisition?.department ?? "-",
    startDate: requisition?.targetStartDate ?? today,
    stage: "pre_boarding",
    status: "not_started",
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: false,
    initiatedAt: today,
    mode: "invited",
  };
}
