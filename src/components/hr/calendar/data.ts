import type { EventType, CalEvent } from "./types";
import type { EventTypeOption } from "@/src/components/shared/calendar";

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: "meeting", label: "Meeting" },
  { value: "deadline", label: "Deadline" },
  { value: "reminder", label: "Reminder" },
  { value: "holiday", label: "Holiday" },
];

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting:  "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  deadline: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  reminder: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  holiday:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export const INITIAL_EVENTS: CalEvent[] = [
  { id: "ev-001", title: "Q1 All-Hands Meeting",          date: "2026-04-14", type: "meeting",  description: "Company-wide review of Q1 performance." },
  { id: "ev-002", title: "New Hire Orientation",           date: "2026-04-27", type: "meeting",  description: "Welcome session for April intake." },
  { id: "ev-003", title: "Payroll Processing Deadline",    date: "2026-04-30", type: "deadline", description: "Last day to submit payroll changes for April." },
  { id: "ev-004", title: "Employee Wellbeing Workshop",    date: "2026-04-24", type: "reminder", description: "Mental health awareness session." },
  { id: "ev-005", title: "Annual Leave Year-End Reset",    date: "2026-04-10", type: "reminder", description: "System reset for carry-over leave balances." },
];
