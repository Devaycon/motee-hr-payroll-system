import type {
  ChecklistItem,
  NewHire,
  ResponsibleParty,
  DueDateRule,
  NewHireStatus,
} from "@/src/lib/types/employee-checklist";

export const RESPONSIBLE_PARTY_LABELS: Record<ResponsibleParty, string> = {
  hr: "HR",
  manager: "Manager",
  it: "IT",
  employee: "Employee",
  finance: "Finance",
};

export const RESPONSIBLE_PARTY_STYLES: Record<ResponsibleParty, string> = {
  hr: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  manager: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  it: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
  employee: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  finance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
};

export const NEW_HIRE_STATUS_LABELS: Record<NewHireStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export const NEW_HIRE_STATUS_STYLES: Record<NewHireStatus, string> = {
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

const DUE_DATE_LABELS: Record<DueDateRule, string> = {
  on_start: "On Start",
  same_day: "Same Day",
  day_1: "Day 1",
  day_3: "Day 3",
  day_7: "Week 1",
  day_14: "Week 2",
  day_30: "Month 1",
  day_60: "Month 2",
  day_90: "Month 3",
};

export function formatDueDateRule(rule: DueDateRule, offset?: number): string {
  return DUE_DATE_LABELS[rule] ?? (offset !== undefined ? `Day ${offset}` : rule);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "ci-001", title: "Complete employment paperwork", taskName: "Complete employment paperwork", description: "Sign offer letter, NDA, and employment agreement.", category: "Documentation", responsibleParty: "hr", dueDateRule: "on_start", dueDateOffset: 0, isRequired: true, isActive: true, order: 1 },
  { id: "ci-002", title: "Set up workstation and accounts", taskName: "Set up workstation and accounts", description: "Configure laptop, email, Slack, and required software access.", category: "IT Setup", responsibleParty: "it", dueDateRule: "day_1", dueDateOffset: 1, isRequired: true, isActive: true, order: 2 },
  { id: "ci-003", title: "HR orientation session", taskName: "HR orientation session", description: "Attend 2-hour HR orientation covering policies and benefits.", category: "Orientation", responsibleParty: "hr", dueDateRule: "day_3", dueDateOffset: 3, isRequired: true, isActive: true, order: 3 },
  { id: "ci-004", title: "Meet with line manager", taskName: "Meet with line manager", description: "30-minute 1:1 with direct manager to review role expectations.", category: "Onboarding", responsibleParty: "manager", dueDateRule: "day_3", dueDateOffset: 3, isRequired: true, isActive: true, order: 4 },
  { id: "ci-005", title: "Complete compliance training", taskName: "Complete compliance training", description: "Complete mandatory anti-money laundering and data protection courses.", category: "Compliance", responsibleParty: "employee", dueDateRule: "day_7", dueDateOffset: 7, isRequired: true, isActive: true, order: 5 },
  { id: "ci-006", title: "Set up payroll details", taskName: "Set up payroll details", description: "Submit bank details and tax identification number to Finance.", category: "Finance", responsibleParty: "finance", dueDateRule: "day_7", dueDateOffset: 7, isRequired: true, isActive: true, order: 6 },
  { id: "ci-007", title: "30-day check-in with manager", taskName: "30-day check-in with manager", description: "Schedule and complete 30-day performance and well-being check-in.", category: "Onboarding", responsibleParty: "manager", dueDateRule: "day_30", dueDateOffset: 30, isRequired: false, isActive: true, order: 7 },
  { id: "ci-008", title: "Complete probation review form", taskName: "Complete probation review form", description: "Fill out the 90-day probation self-assessment form.", category: "Performance", responsibleParty: "employee", dueDateRule: "day_90", dueDateOffset: 90, isRequired: true, isActive: true, order: 8 },
];

export const NEW_HIRES: NewHire[] = [
  {
    id: "nh-001",
    name: "Emeka Nwosu",
    initials: "EN",
    jobTitle: "Mobile Engineer",
    department: "Engineering",
    startDate: "2026-01-15",
    status: "in_progress",
    completedItems: 4,
    totalItems: 8,
    progress: [
      { itemId: "ci-001", completed: true, completedAt: "2026-01-15" },
      { itemId: "ci-002", completed: true, completedAt: "2026-01-15" },
      { itemId: "ci-003", completed: true, completedAt: "2026-01-17" },
      { itemId: "ci-004", completed: true, completedAt: "2026-01-16" },
      { itemId: "ci-005", completed: false },
      { itemId: "ci-006", completed: true, completedAt: "2026-01-20" },
      { itemId: "ci-007", completed: false },
      { itemId: "ci-008", completed: false },
    ],
  },
  {
    id: "nh-002",
    name: "Aisha Garba",
    initials: "AG",
    jobTitle: "Legal Counsel",
    department: "Legal",
    startDate: "2026-02-01",
    status: "completed",
    completedItems: 8,
    totalItems: 8,
    progress: CHECKLIST_ITEMS.map((item) => ({ itemId: item.id, completed: true, completedAt: "2026-03-01" })),
  },
  {
    id: "nh-003",
    name: "Chukwuebuka Obi",
    initials: "CO",
    jobTitle: "Sales Executive",
    department: "Sales",
    startDate: "2026-03-10",
    status: "pending",
    completedItems: 0,
    totalItems: 8,
    progress: [],
  },
  {
    id: "nh-004",
    name: "Halima Musa",
    initials: "HM",
    jobTitle: "HR Intern",
    department: "Human Resources",
    startDate: "2026-01-05",
    status: "overdue",
    completedItems: 2,
    totalItems: 8,
    progress: [
      { itemId: "ci-001", completed: true, completedAt: "2026-01-05" },
      { itemId: "ci-002", completed: true, completedAt: "2026-01-05" },
      { itemId: "ci-003", completed: false },
      { itemId: "ci-004", completed: false },
      { itemId: "ci-005", completed: false },
      { itemId: "ci-006", completed: false },
      { itemId: "ci-007", completed: false },
      { itemId: "ci-008", completed: false },
    ],
  },
];
