import type { OnboardingRecord } from "@/src/lib/types/onboarding";

export const DEPARTMENT_OPTIONS = [
  "all","Engineering","HR","Finance","Marketing","Sales",
  "Operations","Design","Product","Legal","Customer Success",
];

export const STAGE_ORDER = [
  "pre_boarding","day_one","first_week","thirty_day","sixty_day","ninety_day","completed",
] as const;

export const ONBOARDING_STAGE_LABELS: Record<string, string> = {
  pre_boarding: "Pre-Boarding",
  day_one: "Day 1",
  first_week: "First Week",
  thirty_day: "30 Day",
  sixty_day: "60 Day",
  ninety_day: "90 Day",
  completed: "Completed",
};

export const ONBOARDING_STAGE_STYLES: Record<string, string> = {
  pre_boarding: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  day_one: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  first_week: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  thirty_day: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  sixty_day: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  ninety_day: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export const ONBOARDING_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export const ONBOARDING_STATUS_STYLES: Record<string, string> = {
  not_started: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const ASSIGNEE_LABELS: Record<string, string> = {
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
  it: "IT",
};

export const ASSIGNEE_STYLES: Record<string, string> = {
  hr: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  employee: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  it: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export const TASK_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const ONBOARDING_RECORDS: OnboardingRecord[] = [
  {
    id: "onb-001",
    employeeName: "Seun Adeyemi",
    employeeInitials: "SA",
    department: "Engineering",
    jobTitle: "Frontend Engineer",
    startDate: "2026-04-14",
    stage: "pre_boarding",
    status: "in_progress",
    completedTasks: 2,
    totalTasks: 6,
    welcomeEmailSent: true,
    initiatedAt: "2026-04-01",
    mode: "invited",
    tasks: [
      { id: "t-001", taskName: "Send offer letter & NDA", assignee: "hr", dueDay: -7, status: "completed", isRequired: true },
      { id: "t-002", taskName: "Set up company email", assignee: "it", dueDay: -4, status: "completed", isRequired: true },
      { id: "t-003", taskName: "Prepare workstation & equipment", assignee: "it", dueDay: -2, status: "pending", isRequired: true },
      { id: "t-004", taskName: "Welcome breakfast & office tour", assignee: "hr", dueDay: 0, status: "pending", isRequired: false },
      { id: "t-005", taskName: "Meet direct team", assignee: "manager", dueDay: 0, status: "pending", isRequired: false },
      { id: "t-006", taskName: "HR & benefits orientation", assignee: "hr", dueDay: 3, status: "pending", isRequired: true },
    ],
  },
  {
    id: "onb-002",
    employeeName: "Ngozi Obasi",
    employeeInitials: "NO",
    department: "Finance",
    jobTitle: "Financial Analyst",
    startDate: "2026-03-17",
    stage: "thirty_day",
    status: "in_progress",
    completedTasks: 9,
    totalTasks: 12,
    welcomeEmailSent: true,
    initiatedAt: "2026-03-05",
    mode: "manual",
    tasks: [
      { id: "t-007", taskName: "Send offer letter", assignee: "hr", dueDay: -7, status: "completed", isRequired: true },
      { id: "t-008", taskName: "System access setup", assignee: "it", dueDay: -3, status: "completed", isRequired: true },
      { id: "t-009", taskName: "Complete payroll setup", assignee: "hr", dueDay: 5, status: "completed", isRequired: true },
      { id: "t-010", taskName: "30-day check-in with manager", assignee: "manager", dueDay: 30, status: "pending", isRequired: true },
      { id: "t-011", taskName: "Compliance training", assignee: "employee", dueDay: 14, status: "completed", isRequired: true },
      { id: "t-012", taskName: "Meet key stakeholders", assignee: "manager", dueDay: 7, status: "completed", isRequired: false },
    ],
  },
  {
    id: "onb-003",
    employeeName: "David Mensah",
    employeeInitials: "DM",
    department: "Marketing",
    jobTitle: "Content Strategist",
    startDate: "2026-01-06",
    stage: "completed",
    status: "completed",
    completedTasks: 12,
    totalTasks: 12,
    welcomeEmailSent: true,
    initiatedAt: "2025-12-20",
    mode: "invited",
    tasks: [
      { id: "t-013", taskName: "90-day performance review", assignee: "manager", dueDay: 90, status: "completed", isRequired: true },
      { id: "t-014", taskName: "HR onboarding sign-off", assignee: "hr", dueDay: 95, status: "completed", isRequired: true },
    ],
  },
  {
    id: "onb-004",
    employeeName: "Chinyere Obi",
    employeeInitials: "CO",
    department: "HR",
    jobTitle: "HR Generalist",
    startDate: "2026-02-10",
    stage: "sixty_day",
    status: "in_progress",
    completedTasks: 10,
    totalTasks: 12,
    welcomeEmailSent: true,
    initiatedAt: "2026-01-28",
    mode: "manual",
    tasks: [
      { id: "t-015", taskName: "Attend HR tools training", assignee: "employee", dueDay: 30, status: "completed", isRequired: true },
      { id: "t-016", taskName: "60-day feedback session", assignee: "manager", dueDay: 60, status: "pending", isRequired: true },
    ],
  },
  {
    id: "onb-005",
    employeeName: "Ibrahim Suleiman",
    employeeInitials: "IS",
    department: "Operations",
    jobTitle: "Operations Manager",
    startDate: "2026-02-24",
    stage: "thirty_day",
    status: "overdue",
    completedTasks: 7,
    totalTasks: 12,
    welcomeEmailSent: true,
    initiatedAt: "2026-02-10",
    mode: "invited",
    tasks: [
      { id: "t-017", taskName: "Shadow senior operations lead", assignee: "employee", dueDay: 5, status: "completed", isRequired: false },
      { id: "t-018", taskName: "Complete compliance training", assignee: "employee", dueDay: 14, status: "overdue", isRequired: true },
    ],
  },
];
