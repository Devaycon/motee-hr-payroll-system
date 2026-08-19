/**
 * View-local shapes for the attendance screen.
 *
 * The domain types (`ClockState`, `ClockSession`, `DailyEntry`, …) live in
 * `lib/types/attendance` because the slice and the HR side share them; only
 * things that exist purely to render live here.
 */

export type {
  ClockState,
  ClockSession,
  WorkLocation,
  BreakInterval,
  DaySchedule,
  CorrectionRequest,
} from "@/src/lib/types/attendance";

/** One line in the activity feed, derived from the session rather than stored. */
export interface ActivityEvent {
  /** ISO instant — used as the key and formatted at render time. */
  at: string;
  label: string;
  type: "clock_in" | "clock_out" | "break_start" | "break_end";
}

/** A day cell in the month calendar. */
export interface DayDetail {
  clockIn?: string;
  clockOut?: string;
  breakMinutes?: number;
  totalHours?: number;
  note?: string;
}
