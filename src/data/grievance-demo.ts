import type {
  GrievanceCase,
  DisciplinaryCase,
  GrievanceCategory,
  DisciplinaryCategory,
  GrievanceStatus,
  DisciplinaryStatus,
  DisciplinaryOutcome,
  CasePriority,
} from "@/src/lib/types/grievance";

export const GRIEVANCE_CATEGORY_CONFIG: Record<
  GrievanceCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  harassment: {
    label: "Harassment",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  unfair_treatment: {
    label: "Unfair Treatment",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  pay_dispute: {
    label: "Pay Dispute",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  working_conditions: {
    label: "Working Conditions",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
  discrimination: {
    label: "Discrimination",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  other: {
    label: "Other",
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
};

export const DISCIPLINARY_CATEGORY_CONFIG: Record<
  DisciplinaryCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  misconduct: {
    label: "Misconduct",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
  },
  poor_performance: {
    label: "Poor Performance",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
  attendance: {
    label: "Attendance",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
  },
  insubordination: {
    label: "Insubordination",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
  },
  policy_violation: {
    label: "Policy Violation",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
  },
  other: {
    label: "Other",
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
  },
};

export const GRIEVANCE_STATUS_CONFIG: Record<
  GrievanceStatus,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  raised: {
    label: "Raised",
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    step: 1,
  },
  under_review: {
    label: "Under Review",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    step: 2,
  },
  under_investigation: {
    label: "Under Investigation",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    step: 3,
  },
  hearing_scheduled: {
    label: "Hearing Scheduled",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    step: 4,
  },
  mediation: {
    label: "Mediation",
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
    step: 5,
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    step: 6,
  },
  closed: {
    label: "Closed",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
    step: 7,
  },
  appealed: {
    label: "Appealed",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    step: 8,
  },
};

export const DISCIPLINARY_STATUS_CONFIG: Record<
  DisciplinaryStatus,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  reported: {
    label: "Reported",
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800",
    step: 1,
  },
  investigation: {
    label: "Investigation",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    step: 2,
  },
  hearing_scheduled: {
    label: "Hearing Scheduled",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    step: 3,
  },
  outcome_issued: {
    label: "Outcome Issued",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    step: 4,
  },
  appealed: {
    label: "Appealed",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    step: 5,
  },
  closed: {
    label: "Closed",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
    step: 6,
  },
};

export const DISCIPLINARY_OUTCOME_CONFIG: Record<
  DisciplinaryOutcome,
  { label: string; color: string; bg: string; border: string }
> = {
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
  demotion: {
    label: "Demotion",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
  },
};

export const PRIORITY_CONFIG: Record<
  CasePriority,
  { label: string; color: string; bg: string; border: string }
> = {
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

export const GRIEVANCE_CATEGORY_OPTIONS = Object.entries(
  GRIEVANCE_CATEGORY_CONFIG,
).map(([value, cfg]) => ({ value, label: cfg.label }));

export const DISCIPLINARY_CATEGORY_OPTIONS = Object.entries(
  DISCIPLINARY_CATEGORY_CONFIG,
).map(([value, cfg]) => ({ value, label: cfg.label }));

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);

export const GRIEVANCE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(GRIEVANCE_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

export const DISCIPLINARY_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...Object.entries(DISCIPLINARY_STATUS_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

export const GRIEVANCES: GrievanceCase[] = [
  {
    id: "gc-001",
    type: "grievance",
    caseNumber: "GRV-001",
    employeeName: "Priya Sharma",
    employeeInitials: "PS",
    employeeDept: "Design",
    dateRaised: "2026-03-10",
    incidentDate: "2026-03-08",
    description:
      "Employee reports a pattern of dismissive behaviour from line manager during team meetings, including being talked over and having ideas attributed to others.",
    category: "harassment",
    status: "under_investigation",
    priority: "high",
    assignedTo: "Rachel Mensah",
    assignedInitials: "RM",
    hearingDate: "2026-04-10",
    hasAppeal: false,
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
    id: "gc-002",
    type: "grievance",
    caseNumber: "GRV-002",
    employeeName: "Tom Clark",
    employeeInitials: "TC",
    employeeDept: "Operations",
    dateRaised: "2026-03-15",
    incidentDate: "2026-03-01",
    description:
      "Employee disputes March payslip which shows a deduction not previously communicated or agreed upon.",
    category: "pay_dispute",
    status: "resolved",
    priority: "medium",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    outcome:
      "Payroll error confirmed. Deduction was applied in error due to a system misconfiguration. Full refund processed in April payroll. Payroll team notified to review configuration.",
    outcomeDate: "2026-03-25",
    hasAppeal: false,
    notes: [
      {
        id: "n-003",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "Reviewed payslip against payroll run config. Deduction not documented in employee contract or any amendment.",
        createdAt: "2026-03-17",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-03-15",
    updatedAt: "2026-03-25",
  },
  {
    id: "gc-003",
    type: "grievance",
    caseNumber: "GRV-003",
    employeeName: "Ngozi Adeyemi",
    employeeInitials: "NA",
    employeeDept: "Engineering",
    dateRaised: "2026-04-01",
    incidentDate: "2026-03-30",
    description:
      "Employee raises concern about being passed over for a senior promotion role despite meeting all criteria. Believes decision was influenced by gender bias.",
    category: "discrimination",
    status: "raised",
    priority: "urgent",
    assignedTo: "Rachel Mensah",
    assignedInitials: "RM",
    hasAppeal: false,
    notes: [],
    createdAt: "2026-04-01",
    updatedAt: "2026-04-01",
  },
  {
    id: "gc-004",
    type: "grievance",
    caseNumber: "GRV-004",
    employeeName: "Marcus Brown",
    employeeInitials: "MB",
    employeeDept: "Sales",
    dateRaised: "2026-02-20",
    incidentDate: "2026-02-18",
    description:
      "Employee reports unsafe working conditions in the Lagos warehouse including inadequate fire exits and non-functional extinguishers.",
    category: "working_conditions",
    status: "closed",
    priority: "high",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    outcome:
      "Facilities team inspected the warehouse on Feb 25. Three fire exit signs replaced and two extinguishers recharged. Compliance certificate renewed. Employee informed and case closed.",
    outcomeDate: "2026-03-05",
    hasAppeal: false,
    notes: [
      {
        id: "n-004",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "Facilities inspection arranged for Feb 25. Employee provided photos of the blocked exit.",
        createdAt: "2026-02-22",
        isInternal: true,
        isPrivate: false,
      },
    ],
    createdAt: "2026-02-20",
    updatedAt: "2026-03-05",
  },
];

export const DISCIPLINARY_CASES: DisciplinaryCase[] = [
  {
    id: "dc-001",
    type: "disciplinary",
    caseNumber: "DISC-001",
    employeeName: "James Okonkwo",
    employeeInitials: "JO",
    employeeDept: "Finance",
    incidentDate: "2026-03-20",
    dateRaised: "2026-03-22",
    description:
      "Employee accessed payroll records of colleagues without authorisation. IT logs confirm access to 12 employee records outside their permitted scope.",
    category: "policy_violation",
    status: "outcome_issued",
    priority: "urgent",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    hearingDate: "2026-04-01",
    outcome: "final_written_warning",
    outcomeDate: "2026-04-03",
    hasAppeal: false,
    notes: [
      {
        id: "n-005",
        authorName: "Amara Osei",
        authorInitials: "AO",
        content:
          "IT provided full access log. Employee admitted accessing records but claimed it was accidental. Access pattern does not support accidental access.",
        createdAt: "2026-03-25",
        isInternal: true,
        isPrivate: false,
      },
      {
        id: "n-006",
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
    id: "dc-002",
    type: "disciplinary",
    caseNumber: "DISC-002",
    employeeName: "Sola Adeyemi",
    employeeInitials: "SA",
    employeeDept: "Customer Success",
    incidentDate: "2026-03-12",
    dateRaised: "2026-03-13",
    description:
      "Employee has been absent without leave for 5 consecutive working days with no contact to line manager or HR. Previous verbal warning for attendance issued January 2026.",
    category: "attendance",
    status: "investigation",
    priority: "high",
    assignedTo: "Rachel Mensah",
    assignedInitials: "RM",
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
    id: "dc-003",
    type: "disciplinary",
    caseNumber: "DISC-003",
    employeeName: "Chidi Nwosu",
    employeeInitials: "CN",
    employeeDept: "Engineering",
    incidentDate: "2026-02-14",
    dateRaised: "2026-02-16",
    description:
      "Employee made threatening remarks to a colleague during a code review session witnessed by two other team members.",
    category: "misconduct",
    status: "closed",
    priority: "high",
    assignedTo: "Amara Osei",
    assignedInitials: "AO",
    hearingDate: "2026-02-28",
    outcome: "written_warning",
    outcomeDate: "2026-03-02",
    hasAppeal: false,
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
    updatedAt: "2026-03-02",
  },
  {
    id: "dc-004",
    type: "disciplinary",
    caseNumber: "DISC-004",
    employeeName: "Fatima Al-Hassan",
    employeeInitials: "FA",
    employeeDept: "Legal",
    incidentDate: "2026-04-02",
    dateRaised: "2026-04-03",
    description:
      "Employee refused a direct instruction from their department head regarding client file submission deadlines, resulting in a client complaint.",
    category: "insubordination",
    status: "reported",
    priority: "medium",
    hasAppeal: false,
    notes: [],
    createdAt: "2026-04-03",
    updatedAt: "2026-04-03",
  },
];

export function computeGrievanceStats(
  grievances: GrievanceCase[],
  disciplinary: DisciplinaryCase[],
) {
  const openGrievances = grievances.filter(
    (g) => g.status !== "closed" && g.status !== "resolved",
  ).length;
  const openDisciplinary = disciplinary.filter(
    (d) => d.status !== "closed",
  ).length;
  const resolved =
    grievances.filter(
      (g) => g.status === "resolved" || g.status === "closed",
    ).length + disciplinary.filter((d) => d.status === "closed").length;
  const totalCases = grievances.length + disciplinary.length;
  return { openGrievances, openDisciplinary, resolved, totalCases };
}



