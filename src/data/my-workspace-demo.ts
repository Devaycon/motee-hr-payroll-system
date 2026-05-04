import { CalendarDays, Clock, Receipt, CheckSquare, Bell, UserCheck, FileText, DollarSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LEAVE_TYPE_STYLES: Record<string, string> = {
  Annual:    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  Sick:      "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  Maternity: "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400",
  Paternity: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  Emergency: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Study:     "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
};

export const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const PENDING_LEAVES: {
  id: string; initials: string; name: string; type: string; dept: string; from: string; to: string; days: number;
}[] = [
  { id: "pl-001", initials: "EN", name: "Emeka Nwosu",     type: "Annual",  dept: "Engineering",    from: "2026-01-27", to: "2026-01-31", days: 5 },
  { id: "pl-002", initials: "AG", name: "Aisha Garba",     type: "Sick",    dept: "Legal",           from: "2026-01-22", to: "2026-01-23", days: 2 },
  { id: "pl-003", initials: "CO", name: "Chukwuebuka Obi", type: "Annual",  dept: "Sales",           from: "2026-02-03", to: "2026-02-07", days: 5 },
  { id: "pl-004", initials: "TB", name: "Tunde Badmus",    type: "Emergency",dept: "Engineering",   from: "2026-01-24", to: "2026-01-24", days: 1 },
];

export const PENDING_TIMESHEETS: {
  id: string; initials: string; name: string; dept: string; period: string; hours: number;
}[] = [
  { id: "ts-001", initials: "NO", name: "Ngozi Obi",       dept: "Finance",  period: "Jan 13 – Jan 17", hours: 40 },
  { id: "ts-002", initials: "BL", name: "Babatunde Lawal", dept: "Marketing",period: "Jan 13 – Jan 17", hours: 38 },
  { id: "ts-003", initials: "CE", name: "Chiamaka Eze",    dept: "Operations",period: "Jan 13 – Jan 17", hours: 42 },
];

export const PENDING_EXPENSES: {
  id: string; initials: string; name: string; category: string; dept: string; amount: string; submitted: string;
}[] = [
  { id: "ex-001", initials: "HM", name: "Halima Musa",     category: "Travel",       dept: "Human Resources", amount: "₦65,000",  submitted: "2026-01-18" },
  { id: "ex-002", initials: "EN", name: "Emeka Nwosu",     category: "Equipment",    dept: "Engineering",    amount: "₦120,000", submitted: "2026-01-17" },
  { id: "ex-003", initials: "CO", name: "Chukwuebuka Obi", category: "Client Meals", dept: "Sales",          amount: "₦38,500",  submitted: "2026-01-16" },
];

export const MY_TASKS: {
  id: string; label: string; description?: string; done: boolean; priority: string; due: string; link: string;
}[] = [
  { id: "mt-001", label: "Review Q1 headcount plan",         description: "Analyse current headcount vs forecast. Identify gaps in Engineering and Sales and prepare a summary report for the executive team.", done: false, priority: "high",   due: "2026-01-24", link: "/workforce" },
  { id: "mt-002", label: "Approve 4 pending leave requests", description: "Review and action the 4 outstanding leave requests in the system. Check for scheduling conflicts before approving.",                  done: false, priority: "high",   due: "2026-01-22", link: "/leave" },
  { id: "mt-003", label: "Complete AML compliance training", description: "Complete the mandatory Anti-Money Laundering e-learning module on the LMS. Certificate must be uploaded on completion.",              done: false, priority: "medium", due: "2026-01-31", link: "/talent/training" },
  { id: "mt-004", label: "Update remote work policy draft",  description: "Incorporate the legal team's feedback into the remote work policy draft and circulate to department heads for final sign-off.",       done: true,  priority: "medium", due: "2026-01-20", link: "/knowledge" },
  { id: "mt-005", label: "Schedule 1:1 with new hires",      description: "Book 30-minute welcome calls with the 6 new joiners who started this month. Use Calendly link and send calendar invites.",             done: false, priority: "low",    due: "2026-01-28", link: "/talent/onboarding" },
];

export const UPCOMING_EVENTS: { id: number; icon: LucideIcon; label: string; date: string }[] = [
  { id: 1, icon: CalendarDays, label: "Q1 All-Hands Meeting",         date: "Feb 14, 2026" },
  { id: 2, icon: UserCheck,    label: "New Hire Orientation",          date: "Jan 27, 2026" },
  { id: 3, icon: FileText,     label: "Payroll Processing Deadline",   date: "Jan 30, 2026" },
  { id: 4, icon: CalendarDays, label: "Employee Wellbeing Workshop",   date: "Jan 24, 2026" },
];

export const RECENT_ACTIVITY: { id: number; icon: LucideIcon; action: string; time: string }[] = [
  { id: 1, icon: CheckSquare, action: "Approved leave request for Emeka Nwosu",   time: "2 hours ago" },
  { id: 2, icon: Bell,        action: "New helpdesk ticket: Salary not credited",  time: "3 hours ago" },
  { id: 3, icon: Receipt,     action: "Expense claim submitted by Halima Musa",    time: "5 hours ago" },
  { id: 4, icon: Clock,       action: "Timesheet approved for Ngozi Obi",          time: "Yesterday" },
  { id: 5, icon: DollarSign,  action: "Payroll run initiated for January 2026",    time: "Yesterday" },
];
