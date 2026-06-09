import type {
  ApprovalRequest,
  ApprovalStepInstance,
  ApprovalEvent,
  ApprovalStatus,
  ApproverResolver,
} from "@/src/lib/types/approvals";
import type { Requisition } from "@/src/lib/stores/requisitions-slice";

/**
 * Demo data for the Requisition module: a set of requisitions (each sourced from
 * an approved workforce request) linked to a pre-built approval request at a
 * different point in the Manager → HR → Finance chain, so the Requested and
 * Approved tabs are populated.
 */

const CHAIN_TEMPLATE_ID = "ACT-DEFAULT-JOB-REQUISITION";

interface Desk {
  label: string;
  approver: ApproverResolver;
  name: string;
  employeeId: string;
}

const DESKS: Desk[] = [
  { label: "Approve role need", approver: "LINE_MANAGER", name: "Folake Afolayan", employeeId: "EMP-MGR" },
  { label: "Confirm headcount & grade", approver: "ROLE:ROLE-HRMGR", name: "Amara Okafor", employeeId: "EMP-HRMGR" },
  { label: "Budget approval", approver: "ROLE:ROLE-FIN", name: "Tunde Bello", employeeId: "EMP-FIN" },
];

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

interface ScenarioInput {
  reqId: string;
  approvalId: string;
  workforceRequestId: string;
  workforceLabel: string;
  title: string;
  department: string;
  location: string;
  numberOfPositions: number;
  salaryMin: number;
  salaryMax: number;
  qualifications: string;
  startDate: string;
  reportingManager: string;
  budgetAllocation: number;
  jobDescription: string;
  submitterName: string;
  submitterInitials: string;
  approvedCount: number;
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
      base.note = "Approved.";
    } else if (i === s.approvedCount && s.outcome === "returned") {
      base.status = "returned";
      base.decidedAt = daysAgoIso(s.submittedDaysAgo - (i + 1));
      base.note = "Please confirm the grade band before I can approve.";
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
      note: "Approved.",
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
      note: "Please confirm the grade band before I can approve.",
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
    documentType: "job_requisition",
    documentId: s.reqId,
    documentTitle: `${s.title} — ${s.department}`,
    documentSummary: s.jobDescription,
    payloadSnapshot: {
      title: s.title,
      department: s.department,
      location: s.location,
      numberOfPositions: s.numberOfPositions,
      salaryMin: s.salaryMin,
      salaryMax: s.salaryMax,
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
    reqId: "REQ-DEMO-1",
    approvalId: "APR-REQ-DEMO-1",
    workforceRequestId: "WFR-DEMO-5",
    workforceLabel: "4 hires — Sales",
    title: "Sales Representative",
    department: "Sales",
    location: "Lagos (Hybrid)",
    numberOfPositions: 2,
    salaryMin: 3500000,
    salaryMax: 4500000,
    qualifications: "2+ years B2B sales experience; strong communication skills.",
    startDate: "2026-08-01",
    reportingManager: "Ngozi Eze",
    budgetAllocation: 9000000,
    jobDescription: "Drive new business in the East region as part of the new sales pod.",
    submitterName: "Ngozi Eze",
    submitterInitials: "NE",
    approvedCount: 3,
    outcome: "approved",
    submittedDaysAgo: 10,
  },
  {
    reqId: "REQ-DEMO-2",
    approvalId: "APR-REQ-DEMO-2",
    workforceRequestId: "WFR-DEMO-6",
    workforceLabel: "2 hires — Operations",
    title: "Operations Associate",
    department: "Operations",
    location: "Ibadan (On-site)",
    numberOfPositions: 2,
    salaryMin: 2800000,
    salaryMax: 3400000,
    qualifications: "Logistics or supply-chain background; comfortable with shift work.",
    startDate: "2026-07-10",
    reportingManager: "Yusuf Bello",
    budgetAllocation: 6500000,
    jobDescription: "Staff the new distribution hub ahead of the peak season.",
    submitterName: "Yusuf Bello",
    submitterInitials: "YB",
    approvedCount: 3,
    outcome: "approved",
    submittedDaysAgo: 16,
  },
  {
    reqId: "REQ-DEMO-3",
    approvalId: "APR-REQ-DEMO-3",
    workforceRequestId: "WFR-DEMO-5",
    workforceLabel: "4 hires — Sales",
    title: "Senior Account Executive",
    department: "Sales",
    location: "Remote",
    numberOfPositions: 1,
    salaryMin: 5000000,
    salaryMax: 6500000,
    qualifications: "5+ years enterprise sales; proven quota attainment.",
    startDate: "2026-09-01",
    reportingManager: "Ngozi Eze",
    budgetAllocation: 6500000,
    jobDescription: "Own strategic enterprise accounts for the East region pod.",
    submitterName: "Ngozi Eze",
    submitterInitials: "NE",
    approvedCount: 1,
    outcome: "in_progress",
    submittedDaysAgo: 3,
  },
  {
    reqId: "REQ-DEMO-4",
    approvalId: "APR-REQ-DEMO-4",
    workforceRequestId: "WFR-DEMO-6",
    workforceLabel: "2 hires — Operations",
    title: "Warehouse Supervisor",
    department: "Operations",
    location: "Ibadan (On-site)",
    numberOfPositions: 1,
    salaryMin: 3200000,
    salaryMax: 3800000,
    qualifications: "Team-lead experience in a warehouse or distribution setting.",
    startDate: "2026-07-20",
    reportingManager: "Yusuf Bello",
    budgetAllocation: 3800000,
    jobDescription: "Lead the day shift at the new distribution hub.",
    submitterName: "Yusuf Bello",
    submitterInitials: "YB",
    approvedCount: 1,
    outcome: "returned",
    submittedDaysAgo: 5,
  },
];

export function buildRequisitionDemo(): {
  requisitions: Requisition[];
  approvals: ApprovalRequest[];
} {
  const approvals = SCENARIOS.map(buildApproval);
  const requisitions: Requisition[] = SCENARIOS.map((s) => ({
    id: s.reqId,
    workforceRequestId: s.workforceRequestId,
    workforceLabel: s.workforceLabel,
    title: s.title,
    jobDescription: s.jobDescription,
    department: s.department,
    location: s.location,
    numberOfPositions: s.numberOfPositions,
    salaryMin: s.salaryMin,
    salaryMax: s.salaryMax,
    qualifications: s.qualifications,
    startDate: s.startDate,
    reportingManager: s.reportingManager,
    budgetAllocation: s.budgetAllocation,
    status: "draft",
    lifecycleStatus: "active",
    approvalRequestId: s.approvalId,
    createdById: "",
    createdByName: s.submitterName,
    createdAt: daysAgoIso(s.submittedDaysAgo).slice(0, 10),
  }));
  return { requisitions, approvals };
}
