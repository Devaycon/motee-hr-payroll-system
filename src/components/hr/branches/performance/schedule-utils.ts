import {
  addMonths,
  previousDay,
  subMonths,
  format,
  nextDay,
  setHours,
  setMinutes,
  startOfMonth,
  startOfQuarter,
  type Day,
} from "date-fns";
import { FREQUENCY_LABELS } from "@/src/lib/branches/performance";
import type { ReportSchedule, Weekday } from "@/src/lib/stores/branch-performance-slice";

const DAY_INDEX: Record<Weekday, Day> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

function at(d: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return setMinutes(setHours(d, h || 0), m || 0);
}

/** When this schedule next fires, from `now`. */
export function nextRun(s: ReportSchedule, now = new Date()): Date {
  if (s.frequency === "weekly") {
    const today = at(now, s.time);
    if (now.getDay() === DAY_INDEX[s.weekday] && today > now) return today;
    return at(nextDay(now, DAY_INDEX[s.weekday]), s.time);
  }
  if (s.frequency === "monthly") {
    const first = at(startOfMonth(addMonths(now, 1)), s.time);
    return first;
  }
  return at(startOfQuarter(addMonths(now, 3)), s.time);
}

/** The most recent time this schedule should have fired, at or before `now`. */
export function previousRun(s: ReportSchedule, now = new Date()): Date {
  if (s.frequency === "weekly") {
    const today = at(now, s.time);
    if (now.getDay() === DAY_INDEX[s.weekday] && today <= now) return today;
    return at(previousDay(now, DAY_INDEX[s.weekday]), s.time);
  }
  if (s.frequency === "monthly") {
    const first = at(startOfMonth(now), s.time);
    return first <= now ? first : at(startOfMonth(subMonths(now, 1)), s.time);
  }
  const first = at(startOfQuarter(now), s.time);
  return first <= now ? first : at(startOfQuarter(subMonths(now, 3)), s.time);
}

/** Active schedules whose last due run hasn't gone out yet. */
export function dueSchedules(schedules: ReportSchedule[], now = new Date()): ReportSchedule[] {
  return schedules.filter((s) => {
    if (!s.active || s.recipients.length === 0) return false;
    const due = previousRun(s, now);
    if (new Date(s.createdAt) > due) return false;
    return !s.lastSentAt || new Date(s.lastSentAt) < due;
  });
}

export function scheduleLabel(s: ReportSchedule): string {
  const t = format(at(new Date(), s.time), "h:mm a");
  if (s.frequency === "weekly") return `Every ${WEEKDAY_LABELS[s.weekday]}, ${t}`;
  if (s.frequency === "monthly") return `1st of every month, ${t}`;
  return `First day of each quarter, ${t}`;
}

export function frequencyLabel(s: ReportSchedule): string {
  return FREQUENCY_LABELS[s.frequency];
}

/** Hours until the next run, for "in 3 days" style copy. */
export function relativeNext(s: ReportSchedule, now = new Date()): string {
  const n = nextRun(s, now);
  const days = Math.round((n.getTime() - now.getTime()) / 86400000);
  return days <= 0 ? `today at ${format(n, "HH:mm")}` : days === 1 ? `tomorrow at ${format(n, "HH:mm")}` : format(n, "EEE d MMM, HH:mm");
}

