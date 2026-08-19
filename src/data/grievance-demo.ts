import type {
  ERCase,
  CaseComplaintType,
  CaseStage,
  ConfidentialityLevel,
  CaseOutcome,
  CasePriority,
} from "@/src/lib/types/grievance";

type Style = { label: string; color: string; bg: string; border: string };

export const CASE_TYPE_CONFIG: Record<CaseComplaintType, Style> = {
  grievance: {
    label: "Grievance",
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  disciplinary: {
    label: "Disciplinary",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  harassment: {
    label: "Harassment",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  discrimination: {
    label: "Discrimination",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  pay_dispute: {
    label: "Pay Dispute",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  misconduct: {
    label: "Misconduct",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  attendance: {
    label: "Attendance",
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
  },
  policy_violation: {
    label: "Policy Violation",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
  working_conditions: {
    label: "Working Conditions",
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
  },
  // Client feedback §5.1.
  bullying_harassment: {
    label: "Bullying & Harassment",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  absence_management: {
    label: "Absence Management",
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
  },
  performance_improvement: {
    label: "Performance Improvement",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  capability: {
    label: "Capability",
    color: "text-cyan-700 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  whistleblowing: {
    label: "Whistleblowing",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
  },
  health_safety: {
    label: "Health & Safety",
    color: "text-lime-700 dark:text-lime-400",
    bg: "bg-lime-50 dark:bg-lime-950/40",
    border: "border-lime-200 dark:border-lime-800",
  },
  equality_diversity: {
    label: "Equality & Diversity",
    color: "text-fuchsia-700 dark:text-fuchsia-400",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
  },
  appeal: {
    label: "Appeal",
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
  investigation: {
    label: "Investigation",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  safeguarding: {
    label: "Safeguarding",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
};

export const CASE_STAGE_CONFIG: Record<CaseStage, Style & { step: number }> = {
  raised: {
    label: "Raised",
    step: 1,
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  triage: {
    label: "Triage",
    step: 2,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  assigned: {
    label: "Assigned",
    step: 3,
    color: "text-cyan-700 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  investigation: {
    label: "Investigation",
    step: 4,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  hearing: {
    label: "Hearing",
    step: 5,
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
  outcome_issued: {
    label: "Outcome Issued",
    step: 6,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  appeal: {
    label: "Appeal",
    step: 7,
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  closed: {
    label: "Closed",
    step: 8,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
};

/** Ordered list of stages for the workflow stepper. */
export const CASE_STAGE_ORDER: CaseStage[] = [
  "raised",
  "triage",
  "assigned",
  "investigation",
  "hearing",
  "outcome_issued",
  "appeal",
  "closed",
];

export const CONFIDENTIALITY_CONFIG: Record<ConfidentialityLevel, Style> = {
  standard: {
    label: "Standard",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
  confidential: {
    label: "Confidential",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  highly_confidential: {
    label: "Highly Confidential",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  // §5.8 — the most restrictive level: named individuals only.
  restricted: {
    label: "Restricted",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
  },
};

export const CASE_OUTCOME_CONFIG: Record<CaseOutcome, Style> = {
  verbal_warning: {
    label: "Verbal Warning",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  written_warning: {
    label: "Written Warning",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  final_written_warning: {
    label: "Final Written Warning",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  suspension: {
    label: "Suspension",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  demotion: {
    label: "Demotion",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  termination: {
    label: "Termination",
    color: "text-red-800 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-950/60",
    border: "border-red-300 dark:border-red-700",
  },
  no_action: {
    label: "No Action",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  upheld: {
    label: "Upheld",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  partially_upheld: {
    label: "Partially Upheld",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  not_upheld: {
    label: "Not Upheld",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  // §5.6 — the client's standard outcome list.
  no_case_to_answer: {
    label: "No Case to Answer",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
  informal_resolution: {
    label: "Informal Resolution",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  mediation: {
    label: "Mediation",
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
  },
  training_required: {
    label: "Training Required",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  policy_update: {
    label: "Policy Update",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
};

export const PRIORITY_CONFIG: Record<CasePriority, Style> = {
  low: {
    label: "Low",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
  medium: {
    label: "Medium",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  high: {
    label: "High",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
};

// ── Select options ──────────────────────────────────────────────────────────
export const CASE_TYPE_OPTIONS = Object.entries(CASE_TYPE_CONFIG).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);

export const CONFIDENTIALITY_OPTIONS = Object.entries(
  CONFIDENTIALITY_CONFIG,
).map(([value, cfg]) => ({ value, label: cfg.label }));

export const STAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Stages" },
  ...CASE_STAGE_ORDER.map((value) => ({
    value,
    label: CASE_STAGE_CONFIG[value].label,
  })),
];

export const CASE_OUTCOME_OPTIONS = Object.entries(CASE_OUTCOME_CONFIG).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);

// ── Demo cases (unified) ──────────────────────────────────────────────────────
export const ER_CASES: ERCase[] = [
  {
    id: "erc-001",
    caseNumber: "ERC-001",
    complaintType: "harassment",
    employeeName: "Priya Sharma",
    employeeInitials: "PS",
    employeeDept: "Design",
    dateRaised: "2026-03-10",
    incidentDate: "2026-03-08",
    description:
      "Employee reports a pattern of dismissive behaviour from line manager during team meetings, including being talked over and having ideas attributed to others.",
    stage: "investigation",
    priority: "high",
    confidentialityLevel: "confidential",
    assignedTo: "Rachel Mensah",
    assignedInitials: "RM",
    witnesses: [
      { name: "Daniel Owusu", statement: "Corroborated the meeting incidents." },
      { name: "Lucy Adeniran", statement: "Confirmed ideas were re-attributed." },
    ],
    evidence: [
      { name: "meeting-notes-mar.pdf", url: "/files/er/erc-001-notes.pdf", uploadedAt: "2026-03-13" },
    ],
    hearingDate: "2026-04-10",
    hearingPanel: ["Rachel Mensah", "Kofi Asante"],
    hasAppeal: false,
    retentionPeriod: "6 years",
    notes: [
      {
        id: "n-001",
        authorName: "Rachel Mensah",
        authorInitials: "RM",
        content:
          "Initial intake call completed. Employee provided written statement. Line manager notified of investigation.",
        createdAt: "2026-03-12",
        isInternal: true,
        isPrivate: false,
      },
      {
        id: "n-002",
        authorName: "Rachel Mensah",
        authorInitials: "RM",
        content:
          "Two witnesses interviewed. Both corroborated parts of the employee's account. Hearing scheduled for Apr 10.",
        createdAt: "2026-03-28",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-03-10",
    updatedAt: "2026-03-28",
  },
  {
    id: "erc-002",
    caseNumber: "ERC-002",
    complaintType: "pay_dispute",
    employeeName: "Tom Clark",
    employeeInitials: "TC",
    employeeDept: "Operations",
    dateRaised: "2026-03-15",
    incidentDate: "2026-03-01",
    description:
      "Employee disputes March payslip which shows a deduction not previously communicated or agreed upon.",
    stage: "outcome_issued",
    priority: "medium",
    confidentialityLevel: "standard",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    witnesses: [],
    evidence: [
      { name: "march-payslip.pdf", url: "/files/er/erc-002-payslip.pdf", uploadedAt: "2026-03-16" },
    ],
    hearingPanel: [],
    outcome: "upheld",
    outcomeDate: "2026-03-25",
    hasAppeal: false,
    retentionPeriod: "6 years",
    notes: [
      {
        id: "n-003",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "Reviewed payslip against payroll run config. Deduction not documented in employee contract or any amendment. Full refund processed in April payroll.",
        createdAt: "2026-03-17",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-03-15",
    updatedAt: "2026-03-25",
  },
  {
    id: "erc-003",
    caseNumber: "ERC-003",
    complaintType: "discrimination",
    employeeName: "Ngozi Adeyemi",
    employeeInitials: "NA",
    employeeDept: "Engineering",
    dateRaised: "2026-04-01",
    incidentDate: "2026-03-30",
    description:
      "Employee raises concern about being passed over for a senior promotion role despite meeting all criteria. Believes decision was influenced by gender bias.",
    stage: "raised",
    priority: "urgent",
    confidentialityLevel: "highly_confidential",
    assignedTo: "Rachel Mensah",
    assignedInitials: "RM",
    witnesses: [],
    evidence: [],
    hearingPanel: [],
    hasAppeal: false,
    notes: [],
    createdAt: "2026-04-01",
    updatedAt: "2026-04-01",
  },
  {
    id: "erc-004",
    caseNumber: "ERC-004",
    complaintType: "working_conditions",
    employeeName: "Marcus Brown",
    employeeInitials: "MB",
    employeeDept: "Sales",
    dateRaised: "2026-02-20",
    incidentDate: "2026-02-18",
    description:
      "Employee reports unsafe working conditions in the Lagos warehouse including inadequate fire exits and non-functional extinguishers.",
    stage: "closed",
    priority: "high",
    confidentialityLevel: "standard",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    witnesses: [
      { name: "Warehouse Supervisor", statement: "Confirmed blocked fire exit." },
    ],
    evidence: [
      { name: "warehouse-photos.zip", url: "/files/er/erc-004-photos.zip", uploadedAt: "2026-02-22" },
    ],
    hearingPanel: [],
    outcome: "resolved",
    outcomeDate: "2026-03-05",
    hasAppeal: false,
    retentionPeriod: "6 years",
    closureDate: "2026-03-05",
    notes: [
      {
        id: "n-004",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "Facilities inspection arranged for Feb 25. Three fire exit signs replaced and two extinguishers recharged. Compliance certificate renewed.",
        createdAt: "2026-02-22",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-02-20",
    updatedAt: "2026-03-05",
  },
  {
    id: "erc-005",
    caseNumber: "ERC-005",
    complaintType: "policy_violation",
    employeeName: "James Okonkwo",
    employeeInitials: "JO",
    employeeDept: "Finance",
    dateRaised: "2026-03-22",
    incidentDate: "2026-03-20",
    description:
      "Employee accessed payroll records of colleagues without authorisation. IT logs confirm access to 12 employee records outside their permitted scope.",
    stage: "outcome_issued",
    priority: "urgent",
    confidentialityLevel: "highly_confidential",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    witnesses: [
      { name: "IT Security Lead", statement: "Provided full access log." },
    ],
    evidence: [
      { name: "access-log.csv", url: "/files/er/erc-005-log.csv", uploadedAt: "2026-03-25" },
    ],
    hearingDate: "2026-04-01",
    hearingPanel: ["Amara Osei", "Kofi Asante", "Head of Finance"],
    outcome: "final_written_warning",
    outcomeDate: "2026-04-03",
    hasAppeal: false,
    retentionPeriod: "6 years",
    notes: [
      {
        id: "n-005",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "Hearing held Apr 1. Employee admitted to the breach but provided mitigating circumstances. Panel recommended final written warning.",
        createdAt: "2026-04-01",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-03-22",
    updatedAt: "2026-04-03",
  },
  {
    id: "erc-006",
    caseNumber: "ERC-006",
    complaintType: "attendance",
    employeeName: "Sola Adeyemi",
    employeeInitials: "SA",
    employeeDept: "Customer Success",
    dateRaised: "2026-03-13",
    incidentDate: "2026-03-12",
    description:
      "Employee has been absent without leave for 5 consecutive working days with no contact to line manager or HR. Previous verbal warning for attendance issued January 2026.",
    stage: "investigation",
    priority: "high",
    confidentialityLevel: "confidential",
    assignedTo: "Rachel Mensah",
    assignedInitials: "RM",
    witnesses: [],
    evidence: [],
    hearingPanel: [],
    hasAppeal: false,
    notes: [
      {
        id: "n-007",
        authorName: "Rachel Mensah",
        authorInitials: "RM",
        content:
          "Attempted contact via phone and email. No response received. Emergency contact also unreachable. Welfare check requested through local HR representative.",
        createdAt: "2026-03-14",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-03-13",
    updatedAt: "2026-03-14",
  },
  {
    id: "erc-007",
    caseNumber: "ERC-007",
    complaintType: "misconduct",
    employeeName: "Chidi Nwosu",
    employeeInitials: "CN",
    employeeDept: "Engineering",
    dateRaised: "2026-02-16",
    incidentDate: "2026-02-14",
    description:
      "Employee made threatening remarks to a colleague during a code review session witnessed by two other team members.",
    stage: "closed",
    priority: "high",
    confidentialityLevel: "confidential",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    witnesses: [
      { name: "Team Member A", statement: "Heard the remarks directly." },
      { name: "Team Member B", statement: "Consistent account of the incident." },
    ],
    evidence: [],
    hearingDate: "2026-02-28",
    hearingPanel: ["Amara Osei", "Engineering Director"],
    outcome: "written_warning",
    outcomeDate: "2026-03-02",
    hasAppeal: true,
    appealCaseId: "APPEAL-ERC007",
    appealReviewer: "Kofi Asante",
    appealGrounds: "Employee disputes severity of the sanction.",
    retentionPeriod: "6 years",
    closureDate: "2026-03-10",
    notes: [
      {
        id: "n-008",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "Both witnesses gave consistent statements. Employee acknowledged the incident and expressed regret. First offence.",
        createdAt: "2026-02-20",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-02-16",
    updatedAt: "2026-03-10",
  },
  {
    id: "erc-008",
    caseNumber: "ERC-008",
    complaintType: "disciplinary",
    employeeName: "Fatima Al-Hassan",
    employeeInitials: "FA",
    employeeDept: "Legal",
    dateRaised: "2026-04-03",
    incidentDate: "2026-04-02",
    description:
      "Employee refused a direct instruction from their department head regarding client file submission deadlines, resulting in a client complaint.",
    stage: "triage",
    priority: "medium",
    confidentialityLevel: "standard",
    assignedTo: undefined,
    witnesses: [],
    evidence: [],
    hearingPanel: [],
    hasAppeal: false,
    notes: [],
    createdAt: "2026-04-03",
    updatedAt: "2026-04-03",
  },
];

export function computeCaseStats(cases: ERCase[]) {
  const open = cases.filter((c) => c.stage !== "closed").length;
  const investigations = cases.filter(
    (c) => c.stage === "investigation",
  ).length;
  const hearings = cases.filter((c) => c.stage === "hearing").length;
  const closed = cases.filter((c) => c.stage === "closed").length;
  const totalCases = cases.length;
  return { open, investigations, hearings, closed, totalCases };
}
