import type { EventType, CalEvent } from "./types";
import type { EventTypeOption } from "@/src/components/shared/calendar";

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: "meeting", label: "Meeting" },
  { value: "deadline", label: "Deadline" },
  { value: "reminder", label: "Reminder" },
  { value: "holiday", label: "Holiday" },
  { value: "leave", label: "On Leave" },
  { value: "leave_request", label: "Leave Request" },
  { value: "training", label: "Training Due" },
  { value: "one_to_one", label: "One-to-One" },
];

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting:  "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  deadline: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  reminder: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  holiday:  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  leave:    "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  leave_request: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  training: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
  one_to_one: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

/** Reusable event templates, cycled across the year to fill the calendar. */
interface EventTemplate {
  type: EventType;
  title: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  description?: string;
}

const HR_EVENT_TEMPLATES: EventTemplate[] = [
  { type: "meeting",  title: "Team Standup",              startTime: "09:00", endTime: "09:30", description: "Daily sync across the HR team." },
  { type: "meeting",  title: "Leadership Sync",           startTime: "11:00", endTime: "12:00", description: "Weekly alignment with department heads." },
  { type: "one_to_one", title: "1:1 Check-in",            startTime: "14:00", endTime: "14:30", description: "Manager and direct report catch-up." },
  { type: "meeting",  title: "Monthly All-Hands",         startTime: "16:00", endTime: "17:00", description: "Company-wide updates and Q&A." },
  { type: "meeting",  title: "Interview Panel",           startTime: "13:00", endTime: "14:00", description: "Candidate assessment for open roles." },
  { type: "meeting",  title: "New Hire Orientation",      startTime: "09:30", endTime: "11:30", description: "Onboarding session for new joiners." },
  { type: "meeting",  title: "Recruitment Review",        startTime: "15:00", endTime: "15:45", description: "Pipeline review with hiring managers." },
  { type: "deadline", title: "Payroll Cut-off",           startTime: "17:00", endTime: "17:30", description: "Final payroll changes due." },
  { type: "deadline", title: "Timesheet Submission",      startTime: "12:00", endTime: "12:30", description: "All timesheets must be approved." },
  { type: "deadline", title: "Performance Review Due",    startTime: "10:00", endTime: "10:30", description: "Submit cycle evaluations." },
  { type: "training", title: "Compliance Training Due",   startTime: "16:30", endTime: "17:00", description: "Mandatory training completion." },
  { type: "reminder", title: "Benefits Enrollment",       startTime: "10:00", endTime: "10:30", description: "Open enrollment window reminder." },
  { type: "reminder", title: "Wellbeing Workshop",        startTime: "13:00", endTime: "15:00", description: "Mental health awareness session." },
  { type: "reminder", title: "Policy Review",             allDay: true,                         description: "Annual handbook policy review." },
  { type: "reminder", title: "Probation Review",          startTime: "11:30", endTime: "12:00", description: "End-of-probation evaluation." },
  { type: "holiday",  title: "Public Holiday",            allDay: true,                         description: "Office closed." },
  { type: "holiday",  title: "Company Off-day",           allDay: true,                         description: "Staff appreciation day off." },
];

/** Days of the month seeded with events (kept ≤ 28 to stay valid in every month). */
const SEED_DAYS = [2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 27];
const SEED_YEARS = [2024, 2025, 2026, 2027];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Build a deterministic, year-spanning set of events so every month looks busy
 * and several days carry more than one event.
 */
function generateHrEvents(): CalEvent[] {
  const out: CalEvent[] = [];
  let counter = 0;
  for (const year of SEED_YEARS) {
    for (let month = 1; month <= 12; month++) {
      for (let d = 0; d < SEED_DAYS.length; d++) {
        const day = SEED_DAYS[d];
        // Most days get one event; every third seeded day gets a second.
        const count = d % 3 === 0 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const tpl = HR_EVENT_TEMPLATES[counter % HR_EVENT_TEMPLATES.length];
          counter++;
          out.push({
            id: `ev-${year}${pad(month)}${pad(day)}-${k}`,
            title: tpl.title,
            date: `${year}-${pad(month)}-${pad(day)}`,
            type: tpl.type,
            description: tpl.description,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
            allDay: tpl.allDay,
          });
        }
      }
    }
  }
  return out;
}

export const INITIAL_EVENTS: CalEvent[] = generateHrEvents();
