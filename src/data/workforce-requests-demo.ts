import type {
  ApprovalRequest,
  ApprovalStepInstance,
  ApprovalEvent,
  ApprovalStatus,
  ApproverResolver,
} from "@/src/lib/types/approvals";
import type { WorkforceRequest } from "@/src/lib/stores/workforce-requests-slice";

/**
 * Demo data for the Workforce Requests module: a set of workforce requests, each
 * linked to a pre-built approval request at a different point in the
 * HR → Finance → Executive chain, so the Request and Approved tabs are populated.
 */

const CHAIN_TEMPLATE_ID = "ACT-DEFAULT-WORKFORCE-REQUEST";

interface Desk {
  label: string;
  approver: ApproverResolver;
  name: string;
  employeeId: string;
}

const DESKS: Desk[] = [
  {
    label: "Review role justification",
    approver: "ROLE:ROLE-HRMGR",
    name: "Amara Okafor",
    employeeId: "EMP-HRMGR",
  },
  {
    label: "Confirm budget availability",
    approver: "ROLE:ROLE-FIN",
    name: "Tunde Bello",
    employeeId: "EMP-FIN",
  },
  {
    label: "Executive authorization",
    approver: "ROLE:ROLE-EXEC",
    name: "Chidi Eze",
    employeeId: "EMP-EXEC",
  },
];

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

interface ScenarioInput {
  wfrId: string;
  approvalId: string;
  department: string;
  numberOfHires: number;
  reason: string;
  budgetEstimate: number;
  urgency: WorkforceRequest["urgency"];
  expectedStartDate: string;
  submitterName: string;
  submitterInitials: string;
  /** Number of desks already approved (0..3). */
  approvedCount: number;
  /** Final state of the chain. */
  outcome: "in_progress" | "approved" | "returned";
  submittedDaysAgo: number;
}

function buildApproval(s: ScenarioInput): ApprovalRequest {
  const steps: ApprovalStepInstance[] = DESKS.map((desk, i) => {
    const base: ApprovalStepInstance = {
      id: `${s.approvalId}-S${i + 1}`,
      order: i + 1,
      templateStepId: `${CHAIN_TEMPLATE_ID}-${i + 1}`,
      label: desk.label,
      approver: desk.approver,
      resolvedEmployeeId: desk.employeeId,
      resolvedEmployeeName: desk.name,
      status: "pending",
    };
    if (i < s.approvedCount) {
      base.status = "approved";
      base.decidedAt = daysAgoIso(s.submittedDaysAgo - (i + 1));
      base.note = "Looks good — approved.";
    } else if (i === s.approvedCount && s.outcome === "returned") {
      base.status = "returned";
      base.decidedAt = daysAgoIso(s.submittedDaysAgo - (i + 1));
      base.note =
        "Please attach a detailed cost breakdown before I can approve.";
    }
    return base;
  });

  const history: ApprovalEvent[] = [
    {
      id: `${s.approvalId}-E0`,
      at: daysAgoIso(s.submittedDaysAgo),
      actorEmployeeId: "",
      actorName: s.submitterName,
      type: "submitted",
    },
  ];
  for (let i = 0; i < s.approvedCount; i += 1) {
    history.push({
      id: `${s.approvalId}-E${i + 1}`,
      at: daysAgoIso(s.submittedDaysAgo - (i + 1)),
      actorEmployeeId: DESKS[i].employeeId,
      actorName: DESKS[i].name,
      type: "approved",
      stepOrder: i + 1,
      note: "Looks good — approved.",
    });
  }
  if (s.outcome === "returned") {
    history.push({
      id: `${s.approvalId}-ER`,
      at: daysAgoIso(s.submittedDaysAgo - (s.approvedCount + 1)),
      actorEmployeeId: DESKS[s.approvedCount].employeeId,
      actorName: DESKS[s.approvedCount].name,
      type: "returned",
      stepOrder: s.approvedCount + 1,
      note: "Please attach a detailed cost breakdown before I can approve.",
    });
  }

  const status: ApprovalStatus =
    s.outcome === "approved"
      ? "approved"
      : s.outcome === "returned"
        ? "returned"
        : "in_progress";

  const currentStepIndex =
    s.outcome === "approved" ? steps.length : s.approvedCount;

  return {
    id: s.approvalId,
    documentType: "workforce_request",
    documentId: s.wfrId,
    documentTitle: `${s.numberOfHires} hire${s.numberOfHires === 1 ? "" : "s"} — ${s.department}`,
    documentSummary: s.reason,
    payloadSnapshot: {
      department: s.department,
      numberOfHires: s.numberOfHires,
      reason: s.reason,
      budgetEstimate: s.budgetEstimate,
      urgency: s.urgency,
      expectedStartDate: s.expectedStartDate,
    },
    submittedBy: {
      employeeId: "",
      name: s.submitterName,
      initials: s.submitterInitials,
      departmentName: s.department,
    },
    submittedAt: daysAgoIso(s.submittedDaysAgo),
    chainTemplateId: CHAIN_TEMPLATE_ID,
    currentStepIndex,
    status,
    steps,
    history,
    attachments: [],
    signatures: [],
  };
}

const SCENARIOS: ScenarioInput[] = [
  {
    wfrId: "WFR-DEMO-1",
    approvalId: "APR-WFR-DEMO-1",
    department: "Engineering",
    numberOfHires: 3,
    reason: "Scale the platform team for the Q3 product roadmap.",
    budgetEstimate: 24000000,
    urgency: "high",
    expectedStartDate: "2026-09-01",
    submitterName: "Ifeoma Nwosu",
    submitterInitials: "IN",
    approvedCount: 0,
    outcome: "in_progress",
    submittedDaysAgo: 2,
  },
  {
    wfrId: "WFR-DEMO-2",
    approvalId: "APR-WFR-DEMO-2",
    department: "Customer Success",
    numberOfHires: 2,
    reason: "Reduce ticket backlog and improve response SLAs.",
    budgetEstimate: 8000000,
    urgency: "medium",
    expectedStartDate: "2026-08-15",
    submitterName: "Bola Adeyemi",
    submitterInitials: "BA",
    approvedCount: 1,
    outcome: "in_progress",
    submittedDaysAgo: 5,
  },
  {
    wfrId: "WFR-DEMO-3",
    approvalId: "APR-WFR-DEMO-3",
    department: "Marketing",
    numberOfHires: 1,
    reason: "Hire a brand designer ahead of the rebrand launch.",
    budgetEstimate: 6000000,
    urgency: "medium",
    expectedStartDate: "2026-07-20",
    submitterName: "Kemi Johnson",
    submitterInitials: "KJ",
    approvedCount: 2,
    outcome: "in_progress",
    submittedDaysAgo: 8,
  },
  {
    wfrId: "WFR-DEMO-4",
    approvalId: "APR-WFR-DEMO-4",
    department: "Finance",
    numberOfHires: 1,
    reason: "Backfill a financial analyst who is relocating.",
    budgetEstimate: 7000000,
    urgency: "low",
    expectedStartDate: "2026-09-30",
    submitterName: "Uche Okeke",
    submitterInitials: "UO",
    approvedCount: 1,
    outcome: "returned",
    submittedDaysAgo: 6,
  },
  {
    wfrId: "WFR-DEMO-5",
    approvalId: "APR-WFR-DEMO-5",
    department: "Sales",
    numberOfHires: 4,
    reason: "Expand into the East region with a new sales pod.",
    budgetEstimate: 18000000,
    urgency: "high",
    expectedStartDate: "2026-08-01",
    submitterName: "Ngozi Eze",
    submitterInitials: "NE",
    approvedCount: 3,
    outcome: "approved",
    submittedDaysAgo: 14,
  },
  {
    wfrId: "WFR-DEMO-6",
    approvalId: "APR-WFR-DEMO-6",
    department: "Operations",
    numberOfHires: 2,
    reason: "Staff the new distribution hub before peak season.",
    budgetEstimate: 9500000,
    urgency: "critical",
    expectedStartDate: "2026-07-10",
    submitterName: "Yusuf Bello",
    submitterInitials: "YB",
    approvedCount: 3,
    outcome: "approved",
    submittedDaysAgo: 20,
  },
];

export function buildWorkforceDemo(): {
  requests: WorkforceRequest[];
  approvals: ApprovalRequest[];
} {
  const approvals = SCENARIOS.map(buildApproval);
  const requests: WorkforceRequest[] = SCENARIOS.map((s) => ({
    id: s.wfrId,
    department: s.department,
    numberOfHires: s.numberOfHires,
    reason: s.reason,
    budgetEstimate: s.budgetEstimate,
    urgency: s.urgency,
    expectedStartDate: s.expectedStartDate,
    status: "draft",
    approvalRequestId: s.approvalId,
    createdById: "",
    createdByName: s.submitterName,
    createdAt: daysAgoIso(s.submittedDaysAgo).slice(0, 10),
  }));
  return { requests, approvals };
}
