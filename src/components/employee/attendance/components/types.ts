import type { AttendanceStatus, TimesheetRecord } from "@/src/lib/types/attendance";

export type ClockState = "idle" | "clocked_in" | "on_break" | "clocked_out";
export type WorkLocation = "office" | "remote" | "client_site";

export interface BreakEntry {
  start: Date;
  end?: Date;
}

export interface ActivityEvent {
  time: string;
  label: string;
  type: "clock_in" | "clock_out" | "break_start" | "break_end";
}

export interface DayDetail {
  clockIn?: string;
  clockOut?: string;
  breakMinutes?: number;
  totalHours?: number;
  note?: string;
}

export interface WeekEntry {
  date: string;
  day: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  status: AttendanceStatus;
}

export interface WeekItem {
  offset: number;
  label: string;
  entries: WeekEntry[];
  ts?: TimesheetRecord;
}
