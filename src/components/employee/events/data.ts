import type { EmployeeEventType, EmployeeCalEvent } from "./types";

export const EVENT_TYPE_COLORS: Record<EmployeeEventType, string> = {
  company:     "border-[#4361ee]/30 bg-[#4361ee]/10 text-[#4361ee]",
  training:    "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  birthday:    "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  anniversary: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  leave:       "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  performance: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export const EVENT_TYPE_LABELS: Record<EmployeeEventType, string> = {
  company:     "Company",
  training:    "Training",
  birthday:    "Birthday",
  anniversary: "Anniversary",
  leave:       "Leave",
  performance: "Performance",
};

export const INITIAL_EMPLOYEE_EVENTS: EmployeeCalEvent[] = [
  { id: "eev-001", title: "Employee Wellbeing Workshop",      date: "2026-04-24", type: "company",     description: "Mental health and wellbeing awareness session." },
  { id: "eev-002", title: "Q2 All-Hands Meeting",             date: "2026-04-25", type: "company",     description: "Company-wide review and Q2 planning." },
  { id: "eev-003", title: "AML Compliance Training Deadline", date: "2026-04-25", type: "training",    description: "Complete the AML compliance video and quiz." },
  { id: "eev-004", title: "Blessing Okafor's Birthday",       date: "2026-04-27", type: "birthday" },
  { id: "eev-005", title: "Annual Leave — Chukwuemeka Eze",   date: "2026-04-28", type: "leave",       description: "Chukwuemeka is on annual leave." },
  { id: "eev-006", title: "Emeka Nwosu — 3yr Work Anniversary", date: "2026-04-30", type: "anniversary", description: "Celebrating 3 years with the company." },
  { id: "eev-007", title: "Team Learning Day",                date: "2026-05-02", type: "training",    description: "Dedicated learning and development day." },
  { id: "eev-008", title: "New Hire Orientation",             date: "2026-05-05", type: "company",     description: "Welcome session for May intake." },
  { id: "eev-009", title: "Halima Musa's Birthday",           date: "2026-05-08", type: "birthday" },
  { id: "eev-010", title: "Q2 Performance Check-in",          date: "2026-05-15", type: "performance", description: "Mid-cycle performance review with your manager." },
];
