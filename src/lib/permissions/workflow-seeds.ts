import type {
  Workflow,
  WorkflowConditionKey,
  WorkflowTask,
  WorkflowTaskPriority,
} from "@/src/lib/types/workflows";

interface SeedTask {
  title: string;
  description?: string;
  /** Role id that does the work. */
  assigneeRoleId: string;
  /** Optional role id that reviews/approves the task. */
  reviewerRoleId?: string;
  /** §11.9 — days from workflow start that this task is due. */
  dueDayOffset?: number;
  expectedDurationDays?: number;
  priority?: WorkflowTaskPriority;
  escalateAfterDays?: number;
  /** §11.6 — 1-based indices of earlier tasks in this same list. */
  dependsOnSteps?: number[];
  /** §11.8 — tasks sharing a label run concurrently. */
  parallelGroup?: string;
  /** §11.11 — only applies when the condition holds. */
  condition?: WorkflowConditionKey;
}

/**
 * Before day one — compliance, logistics and data collection.
 *
 * Reordered per client feedback §11.1–§11.4: offer acceptance is now an
 * explicit gate before anything else happens, right-to-work verification is
 * split into upload and verify so the audit trail shows who checked what, and
 * payroll detail collection moved after acceptance rather than being bundled
 * into the first document sweep. Hiring-manager tasks were added because the
 * flow was otherwise entirely HR and IT.
 */
const PREBOARDING_TASKS: SeedTask[] = [
  {
    title: "Send offer & employment contract",
    description:
      "Issue the formal offer and employment contract for the new hire to sign.",
    assigneeRoleId: "ROLE-HRMGR",
    dueDayOffset: 1,
    expectedDurationDays: 1,
    priority: "high",
    escalateAfterDays: 2,
  },
  {
    // §11.1 — nothing downstream should start until the offer is accepted.
    title: "Candidate accepts offer",
    description:
      "Record the candidate's acceptance. Everything downstream waits on this.",
    assigneeRoleId: "ROLE-HRMGR",
    dueDayOffset: 5,
    priority: "critical",
    escalateAfterDays: 3,
    dependsOnSteps: [1],
  },
  {
    title: "Collect signed contract",
    description: "Confirm the signed contract has been returned and filed.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 7,
    priority: "high",
    dependsOnSteps: [2],
  },
  {
    // §11.3 — upload and verification are separate steps so the audit trail
    // shows who checked the documents, not just that they exist.
    title: "Upload right-to-work documents",
    description: "New hire submits passport, share code or other RTW evidence.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 8,
    priority: "high",
    dependsOnSteps: [2],
    parallelGroup: "pre-checks",
  },
  {
    title: "HR verifies right-to-work documents",
    description:
      "Check the documents against the original and record the verification.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 10,
    priority: "critical",
    escalateAfterDays: 2,
    dependsOnSteps: [4],
  },
  {
    // §11.11 — only relevant where immigration status applies.
    title: "Immigration verification",
    description: "Additional checks where the hire's right to work is visa-based.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 12,
    priority: "critical",
    dependsOnSteps: [5],
    condition: "visa_holder",
  },
  {
    title: "Build employee profile & confirm start date",
    description:
      "Create the employee profile from the collected data and confirm the start date.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 12,
    priority: "high",
    dependsOnSteps: [5],
  },
  {
    // §11.2 — payroll details are collected after acceptance, close to
    // onboarding, rather than up front with the offer.
    title: "Capture payroll, bank & tax details",
    description:
      "Collect bank, tax and pension details so payroll can be set up.",
    assigneeRoleId: "ROLE-FIN",
    dueDayOffset: 14,
    priority: "high",
    dependsOnSteps: [7],
    parallelGroup: "setup",
  },
  {
    title: "Provision IT equipment & accounts",
    description:
      "Order the laptop and create email / system accounts ahead of day one.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 14,
    expectedDurationDays: 3,
    priority: "high",
    dependsOnSteps: [7],
    parallelGroup: "setup",
  },
  {
    // §11.11 — remote hires need kit shipped rather than handed over.
    title: "Ship equipment to home address",
    description: "Courier the laptop and peripherals to a remote worker.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 16,
    priority: "normal",
    dependsOnSteps: [9],
    condition: "remote_worker",
  },
  {
    title: "Assign company vehicle",
    description: "Arrange the vehicle, insurance and handover.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 16,
    priority: "normal",
    dependsOnSteps: [7],
    condition: "company_car",
  },
  // §11.4 — the hiring manager's own preparation, previously missing entirely.
  {
    title: "Assign buddy / mentor",
    description: "Pair the new starter with someone to show them the ropes.",
    assigneeRoleId: "ROLE-MGR",
    dueDayOffset: 15,
    priority: "normal",
    dependsOnSteps: [7],
    parallelGroup: "manager-prep",
  },
  {
    title: "Prepare workspace",
    description: "Desk, access card and anything else needed on day one.",
    assigneeRoleId: "ROLE-MGR",
    dueDayOffset: 16,
    priority: "normal",
    dependsOnSteps: [7],
    parallelGroup: "manager-prep",
  },
  {
    title: "Schedule induction & first-week objectives",
    description:
      "Book the induction sessions and set out what the first week should achieve.",
    assigneeRoleId: "ROLE-MGR",
    dueDayOffset: 17,
    priority: "normal",
    dependsOnSteps: [7],
    parallelGroup: "manager-prep",
  },
];

/**
 * Day one onwards. Expanded from three steps to the full first-weeks flow the
 * client set out in §11.5 — the old version stopped at equipment and a
 * compliance sign-off, which said nothing about induction, training or
 * benefits.
 */
const ONBOARDING_TASKS: SeedTask[] = [
  {
    title: "Employee completes onboarding forms",
    description: "Personal, bank, emergency contact and tax details submitted.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 1,
    priority: "critical",
    escalateAfterDays: 2,
  },
  {
    title: "HR verifies documentation",
    description: "Check the submitted pack and request changes if needed.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 2,
    priority: "high",
    dependsOnSteps: [1],
  },
  {
    // §11.6 — payroll must not finalise before bank details are verified.
    title: "Payroll approval",
    description: "Payroll confirms bank and tax details and sets up the record.",
    assigneeRoleId: "ROLE-FIN",
    dueDayOffset: 3,
    priority: "critical",
    escalateAfterDays: 2,
    dependsOnSteps: [2],
    parallelGroup: "day-one-setup",
  },
  {
    // §11.6 — IT cannot activate accounts until HR has approved the record.
    title: "IT account activation",
    description: "Enable email, system and building access.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 1,
    priority: "critical",
    dependsOnSteps: [2],
    parallelGroup: "day-one-setup",
  },
  {
    title: "Equipment issued",
    description: "Hand over laptop, phone and access card.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 1,
    priority: "high",
    dependsOnSteps: [4],
  },
  {
    title: "Manager induction",
    description: "Team introductions, role expectations and first objectives.",
    assigneeRoleId: "ROLE-MGR",
    dueDayOffset: 2,
    priority: "high",
    dependsOnSteps: [4],
    parallelGroup: "induction",
  },
  {
    title: "Health & Safety induction",
    description: "Site safety briefing, fire procedure and DSE assessment.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 3,
    priority: "critical",
    escalateAfterDays: 2,
    parallelGroup: "induction",
  },
  {
    title: "Mandatory training assigned",
    description: "Assign the compliance courses required for the role.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 5,
    priority: "normal",
    dependsOnSteps: [6],
  },
  {
    title: "Benefits enrolment",
    description: "Pension, healthcare and any role-specific benefits.",
    assigneeRoleId: "ROLE-FIN",
    dueDayOffset: 10,
    priority: "normal",
    dependsOnSteps: [3],
    // §11.11 — contractors aren't enrolled in employee benefits.
    condition: "contractor",
  },
  {
    // §11.6 — compliance sign-off only once the mandatory tasks are done.
    title: "HR compliance sign-off",
    description: "Final HR review that onboarding is complete and compliant.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 20,
    priority: "high",
    dependsOnSteps: [3, 5, 7, 8],
  },
  {
    title: "Manager confirms onboarding complete",
    description: "The hiring manager signs off that the new starter is settled.",
    assigneeRoleId: "ROLE-MGR",
    dueDayOffset: 30,
    priority: "normal",
    dependsOnSteps: [10],
  },
];

/**
 * Leavers. Expanded per §11.7 — the four-step version covered clearance and
 * pay but not the exit interview, benefits cessation or record archiving.
 */
const OFFBOARDING_TASKS: SeedTask[] = [
  {
    title: "Handover & manager clearance",
    description: "Complete knowledge handover and obtain manager clearance.",
    assigneeRoleId: "ROLE-MGR",
    dueDayOffset: 5,
    priority: "high",
  },
  {
    title: "Exit interview",
    description: "Capture why they're leaving and what would have kept them.",
    assigneeRoleId: "ROLE-HRMGR",
    dueDayOffset: 7,
    priority: "normal",
    parallelGroup: "exit-admin",
  },
  {
    title: "Recover company assets",
    description: "Laptop, phone, access card, keys and any company vehicle.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 1,
    priority: "high",
    dependsOnSteps: [1],
    parallelGroup: "exit-admin",
  },
  {
    title: "Disable system access",
    description: "Revoke accounts, building access and remote access.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 1,
    priority: "critical",
    escalateAfterDays: 1,
    dependsOnSteps: [1],
    parallelGroup: "exit-admin",
  },
  {
    title: "Remove from distribution lists",
    description: "Mailing lists, shared calendars and internal directories.",
    assigneeRoleId: "ROLE-IT",
    dueDayOffset: 2,
    priority: "normal",
    dependsOnSteps: [4],
  },
  {
    title: "Notify Payroll",
    description: "Tell payroll the leaving date so final pay is calculated.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 3,
    priority: "critical",
    parallelGroup: "finance-close",
  },
  {
    title: "Notify benefits provider",
    description: "End pension, healthcare and other benefit memberships.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 5,
    priority: "high",
    parallelGroup: "finance-close",
  },
  {
    title: "Final settlement",
    description: "Process final pay and settle outstanding balances.",
    assigneeRoleId: "ROLE-FIN",
    dueDayOffset: 10,
    priority: "critical",
    dependsOnSteps: [6],
  },
  {
    title: "Final payslip confirmation",
    description: "Confirm the final payslip has been issued and received.",
    assigneeRoleId: "ROLE-FIN",
    dueDayOffset: 14,
    priority: "normal",
    dependsOnSteps: [8],
  },
  {
    title: "Reference request status",
    description: "Record whether a reference has been requested and provided.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 20,
    priority: "low",
  },
  {
    title: "Archive employee records",
    description:
      "Move the file to archive with the correct retention period applied.",
    assigneeRoleId: "ROLE-HRADMIN",
    dueDayOffset: 25,
    priority: "normal",
    dependsOnSteps: [8],
  },
  {
    title: "HR exit sign-off",
    description: "Confirm the exit checklist is complete and file records.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
    dueDayOffset: 30,
    priority: "high",
    dependsOnSteps: [3, 4, 8, 11],
  },
];

function buildTasks(prefix: string, seeds: SeedTask[]): WorkflowTask[] {
  return seeds.map((s, i) => ({
    id: `${prefix}-T${i + 1}`,
    order: i + 1,
    title: s.title,
    description: s.description,
    assignee: { kind: "role", roleId: s.assigneeRoleId },
    reviewer: s.reviewerRoleId
      ? { kind: "role", roleId: s.reviewerRoleId }
      : null,
    dueDayOffset: s.dueDayOffset,
    expectedDurationDays: s.expectedDurationDays,
    priority: s.priority ?? "normal",
    escalateAfterDays: s.escalateAfterDays,
    // Step numbers are 1-based in the seed for readability; resolve to ids.
    dependsOn: s.dependsOnSteps?.map((n) => `${prefix}-T${n}`),
    parallelGroup: s.parallelGroup,
    condition: s.condition,
  }));
}

export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "WF-DEFAULT-PREBOARDING",
    title: "Standard Preboarding",
    description:
      "Before day one — compliance, logistics and data collection to ready the system and the new hire. Initiated from Recruitment when a candidate is hired.",
    triggerMode: "automatic",
    schedule: {
      kind: "relative",
      event: "preboarding_initiated",
      offsetValue: 0,
      offsetUnit: "days",
    },
    scope: { kind: "all" },
    kind: "system",
    status: "active",
    version: 2,
    effectiveDate: "2026-01-01",
    owner: "HR Operations",
    tasks: buildTasks("WF-PREBOARDING", PREBOARDING_TASKS),
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
  },
  {
    id: "WF-DEFAULT-ONBOARDING",
    title: "Standard Onboarding",
    description:
      "Day one through the first weeks — induction, training, benefits and final sign-off.",
    triggerMode: "automatic",
    schedule: {
      kind: "relative",
      event: "onboarding_initiated",
      offsetValue: 0,
      offsetUnit: "days",
    },
    scope: { kind: "all" },
    kind: "system",
    status: "active",
    version: 2,
    effectiveDate: "2026-01-01",
    owner: "HR Operations",
    tasks: buildTasks("WF-ONBOARDING", ONBOARDING_TASKS),
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
  },
  {
    id: "WF-DEFAULT-OFFBOARDING",
    title: "Standard Offboarding",
    description: "Default offboarding & clearance workflow for leavers.",
    triggerMode: "automatic",
    schedule: {
      kind: "relative",
      event: "offboarding_initiated",
      offsetValue: 0,
      offsetUnit: "days",
    },
    scope: { kind: "all" },
    kind: "system",
    status: "active",
    version: 2,
    effectiveDate: "2026-01-01",
    owner: "HR Operations",
    tasks: buildTasks("WF-OFFBOARDING", OFFBOARDING_TASKS),
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
  },
];

export const DEFAULT_WORKFLOW_IDS = new Set(DEFAULT_WORKFLOWS.map((w) => w.id));
