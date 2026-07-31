import type {
  OffboardingRecord,
  OffboardingStatus,
  ExitReason,
  ClearanceItem,
} from "@/src/lib/types/offboarding";

export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
  resignation: "Resignation",
  termination: "Termination",
  redundancy: "Redundancy",
  retirement: "Retirement",
  contract_end: "Contract End",
  other: "Other",
};

export const EXIT_REASON_STYLES: Record<ExitReason, string> = {
  resignation: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  termination: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  redundancy: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  retirement: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  contract_end: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const OFFBOARDING_STATUS_LABELS: Record<OffboardingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  disapproved: "Disapproved",
  in_progress: "In Progress",
  completed: "Completed",
  reactivated: "Reactivated",
  cancelled: "Cancelled",
};

export const OFFBOARDING_STATUS_STYLES: Record<OffboardingStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  approved: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
  disapproved: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  reactivated: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Product",
  "Sales",
  "Operations",
  "Legal",
];

export const DEFAULT_CLEARANCE_ITEMS: ClearanceItem[] = [
  { id: "ci-001", label: "Return laptop and accessories", department: "IT", completed: false },
  { id: "ci-002", label: "Return access cards and badges", department: "Operations", completed: false },
  { id: "ci-003", label: "Clear company email and transfer data", department: "IT", completed: false },
  { id: "ci-004", label: "Complete final timesheet submission", department: "Finance", completed: false },
  { id: "ci-005", label: "Receive final payslip and clearance", department: "Finance", completed: false },
  { id: "ci-006", label: "Exit interview completed", department: "HR", completed: false },
  { id: "ci-007", label: "Knowledge transfer documentation", department: "HR", completed: false },
  { id: "ci-008", label: "Revoke system access", department: "IT", completed: false },
];

export const OFFBOARDING_RECORDS: OffboardingRecord[] = [
  {
    id: "ob-001",
    employeeName: "Kelechi Onyekachi",
    employeeInitials: "KO",
    jobTitle: "Digital Marketing Specialist",
    department: "Marketing",
    lastWorkingDate: "2026-04-30",
    exitReason: "resignation",
    status: "in_progress",
    clearanceItems: DEFAULT_CLEARANCE_ITEMS.map((item, i) => ({
      ...item,
      id: `ob-001-ci-${i + 1}`,
      completed: i < 3,
      completedAt: i < 3 ? "2026-04-10" : undefined,
    })),
    exitInterviewCompleted: false,
    exitInterviewNotes: "Employee expressed interest in contract consulting work.",
    initiatedAt: "2026-04-05",
  },
  {
    id: "ob-002",
    employeeName: "Sodiq Olawale",
    employeeInitials: "SO",
    jobTitle: "Business Analyst",
    department: "Operations",
    lastWorkingDate: "2026-03-31",
    exitReason: "contract_end",
    status: "completed",
    clearanceItems: DEFAULT_CLEARANCE_ITEMS.map((item, i) => ({
      ...item,
      id: `ob-002-ci-${i + 1}`,
      completed: true,
      completedAt: "2026-03-28",
      completedBy: "HR Admin",
    })),
    exitInterviewCompleted: true,
    exitInterviewNotes: "Contract completed successfully. Would consider rehire.",
    initiatedAt: "2026-03-15",
  },
  {
    id: "ob-003",
    employeeName: "Emeka Nwosu",
    employeeInitials: "EN",
    jobTitle: "Mobile Engineer",
    department: "Engineering",
    lastWorkingDate: "2026-05-15",
    exitReason: "resignation",
    status: "pending",
    clearanceItems: DEFAULT_CLEARANCE_ITEMS.map((item, i) => ({
      ...item,
      id: `ob-003-ci-${i + 1}`,
    })),
    exitInterviewCompleted: false,
    initiatedAt: "2026-04-18",
  },
  {
    id: "ob-004",
    employeeName: "Ifeoma Nwachukwu",
    employeeInitials: "IN",
    jobTitle: "Payroll Officer",
    department: "Finance",
    lastWorkingDate: "2026-04-15",
    exitReason: "redundancy",
    status: "in_progress",
    clearanceItems: DEFAULT_CLEARANCE_ITEMS.map((item, i) => ({
      ...item,
      id: `ob-004-ci-${i + 1}`,
      completed: i < 5,
      completedAt: i < 5 ? "2026-04-08" : undefined,
    })),
    exitInterviewCompleted: true,
    exitInterviewNotes: "Transition due to department restructure.",
    initiatedAt: "2026-04-01",
  },
];
