import type { Workflow, WorkflowTask } from "@/src/lib/types/workflows";

interface SeedTask {
  title: string;
  description?: string;
  /** Role id that does the work. */
  assigneeRoleId: string;
  /** Optional role id that reviews/approves the task. */
  reviewerRoleId?: string;
}

// Adapted from the onboarding/offboarding steps in approval-seeds.ts, split into
// an explicit doer (assignee) plus an optional reviewer.
const ONBOARDING_TASKS: SeedTask[] = [
  {
    title: "Confirm offer & documents",
    description: "Verify the signed offer letter and collect onboarding documents.",
    assigneeRoleId: "ROLE-HRMGR",
  },
  {
    title: "Provision equipment & accounts",
    description: "Set up laptop, email, and system access for the new hire.",
    assigneeRoleId: "ROLE-IT",
  },
  {
    title: "HR compliance sign-off",
    description: "Final HR review that onboarding is complete and compliant.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
  },
];

const OFFBOARDING_TASKS: SeedTask[] = [
  {
    title: "Handover & manager clearance",
    description: "Complete knowledge handover and obtain manager clearance.",
    assigneeRoleId: "ROLE-MGR",
  },
  {
    title: "Revoke access & collect assets",
    description: "Disable accounts and collect company assets.",
    assigneeRoleId: "ROLE-IT",
  },
  {
    title: "Final settlement",
    description: "Process final pay and settle outstanding balances.",
    assigneeRoleId: "ROLE-FIN",
  },
  {
    title: "HR exit sign-off",
    description: "Confirm the exit checklist is complete and file records.",
    assigneeRoleId: "ROLE-HRADMIN",
    reviewerRoleId: "ROLE-HRMGR",
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
  }));
}

export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "WF-DEFAULT-ONBOARDING",
    title: "Standard Onboarding",
    description: "Default onboarding workflow for new hires.",
    triggerMode: "automatic",
    schedule: {
      kind: "relative",
      event: "onboarding_initiated",
      offsetValue: 0,
      offsetUnit: "days",
    },
    scope: { kind: "all" },
    kind: "system",
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
    tasks: buildTasks("WF-OFFBOARDING", OFFBOARDING_TASKS),
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
  },
];

export const DEFAULT_WORKFLOW_IDS = new Set(DEFAULT_WORKFLOWS.map((w) => w.id));
