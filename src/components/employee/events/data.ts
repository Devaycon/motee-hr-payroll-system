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

/** Reusable event templates, cycled across the year to fill the calendar. */
interface EmployeeEventTemplate {
  type: EmployeeEventType;
  title: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  description?: string;
}

const EMPLOYEE_EVENT_TEMPLATES: EmployeeEventTemplate[] = [
  { type: "company",     title: "Monthly All-Hands",        startTime: "10:00", endTime: "12:00", description: "Company-wide review and planning." },
  { type: "company",     title: "Town Hall",                startTime: "16:00", endTime: "17:00", description: "Leadership updates and open Q&A." },
  { type: "company",     title: "New Hire Orientation",     startTime: "09:30", endTime: "11:00", description: "Welcome session for new joiners." },
  { type: "company",     title: "Team Social",              startTime: "17:30", endTime: "19:00", description: "After-work team get-together." },
  { type: "training",    title: "Compliance Training",      startTime: "15:00", endTime: "16:00", description: "Complete the assigned module and quiz." },
  { type: "training",    title: "Team Learning Day",        startTime: "09:00", endTime: "17:00", description: "Dedicated learning and development day." },
  { type: "training",    title: "Lunch & Learn",            startTime: "12:30", endTime: "13:30", description: "Informal skill-sharing session." },
  { type: "training",    title: "Onboarding Workshop",      startTime: "11:00", endTime: "12:30", description: "Tools and process walkthrough." },
  { type: "birthday",    title: "Team Birthday",            allDay: true,                         description: "Celebrate a teammate's birthday." },
  { type: "anniversary", title: "Work Anniversary",         allDay: true,                         description: "Celebrating years of service." },
  { type: "leave",       title: "Annual Leave",             allDay: true,                         description: "A colleague is on annual leave." },
  { type: "leave",       title: "Public Holiday",           allDay: true,                         description: "Office closed." },
  { type: "performance", title: "Performance Check-in",     startTime: "14:00", endTime: "14:30", description: "Review progress with your manager." },
  { type: "performance", title: "Goal-Setting Review",      startTime: "10:30", endTime: "11:15", description: "Quarterly objectives alignment." },
];

/** Days of the month seeded with events (kept ≤ 28 to stay valid in every month). */
const SEED_DAYS = [3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 26, 28];
const SEED_YEARS = [2024, 2025, 2026, 2027];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Build a deterministic, year-spanning set of events so every month looks busy
 * and several days carry more than one event.
 */
function generateEmployeeEvents(): EmployeeCalEvent[] {
  const out: EmployeeCalEvent[] = [];
  let counter = 0;
  for (const year of SEED_YEARS) {
    for (let month = 1; month <= 12; month++) {
      for (let d = 0; d < SEED_DAYS.length; d++) {
        const day = SEED_DAYS[d];
        const count = d % 3 === 0 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const tpl =
            EMPLOYEE_EVENT_TEMPLATES[counter % EMPLOYEE_EVENT_TEMPLATES.length];
          counter++;
          out.push({
            id: `eev-${year}${pad(month)}${pad(day)}-${k}`,
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

export const INITIAL_EMPLOYEE_EVENTS: EmployeeCalEvent[] = generateEmployeeEvents();
