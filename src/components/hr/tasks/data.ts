import type { Task } from "./types";

export const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const INITIAL_TASKS: Task[] = [
  { id: "mt-001", label: "Review Q1 headcount plan",         done: false, priority: "high",   due: "2026-01-24", link: "/workforce" },
  { id: "mt-002", label: "Approve 4 pending leave requests", done: false, priority: "high",   due: "2026-01-22", link: "/leave" },
  { id: "mt-003", label: "Complete AML compliance training", done: false, priority: "medium", due: "2026-01-31", link: "/talent/training" },
  { id: "mt-004", label: "Update remote work policy draft",  done: true,  priority: "medium", due: "2026-01-20", link: "/knowledge" },
  { id: "mt-005", label: "Schedule 1:1 with new hires",      done: false, priority: "low",    due: "2026-01-28", link: "/talent/onboarding" },
];
