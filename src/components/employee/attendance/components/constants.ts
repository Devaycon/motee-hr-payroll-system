import type { ComponentType, CSSProperties } from "react";
import { Building2, Laptop, Users } from "lucide-react";
import type { AttendanceStatus } from "@/src/lib/types/attendance";
import { TIMESHEETS } from "@/src/data/attendance-demo";
import type { WorkLocation, DayDetail, WeekEntry } from "./types";

export const MY_SCHEDULE = {
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: 30,
};

export const SCHEDULED_HOURS = 7.5;

export const CURRENT_WEEK_ENTRIES: WeekEntry[] = [
  {
    date: "2026-04-20",
    day: "Mon",
    clockIn: "08:55",
    clockOut: "17:10",
    breakMinutes: 30,
    totalHours: 7.75,
    status: "present",
  },
  {
    date: "2026-04-21",
    day: "Tue",
    clockIn: "09:18",
    clockOut: "17:00",
    breakMinutes: 30,
    totalHours: 7.2,
    status: "late",
  },
  {
    date: "2026-04-22",
    day: "Wed",
    clockIn: "08:50",
    clockOut: "17:05",
    breakMinutes: 30,
    totalHours: 7.75,
    status: "present",
  },
  {
    date: "2026-04-23",
    day: "Thu",
    clockIn: undefined,
    clockOut: undefined,
    breakMinutes: 0,
    totalHours: undefined,
    status: "not_clocked_in",
  },
  {
    date: "2026-04-24",
    day: "Fri",
    clockIn: undefined,
    clockOut: undefined,
    breakMinutes: 0,
    totalHours: undefined,
    status: "not_clocked_in",
  },
];

export const PAST_TIMESHEETS = TIMESHEETS.filter(
  (t) => t.employeeName === "Adaeze Okonkwo",
);

export const LOCATION_CONFIG: Record<
  WorkLocation,
  { label: string; icon: ComponentType<{ className?: string; style?: CSSProperties }>; color: string }
> = {
  office: { label: "Office", icon: Building2, color: "#2563EB" },
  remote: { label: "Remote", icon: Laptop, color: "#7F77DD" },
  client_site: { label: "Client Site", icon: Users, color: "#1D9E75" },
};

export const MONTH_DEMO: Record<string, AttendanceStatus> = {
  "2026-04-01": "present",
  "2026-04-02": "present",
  "2026-04-03": "present",
  "2026-04-06": "present",
  "2026-04-07": "late",
  "2026-04-08": "present",
  "2026-04-09": "present",
  "2026-04-10": "present",
  "2026-04-13": "present",
  "2026-04-14": "present",
  "2026-04-15": "on_leave",
  "2026-04-16": "on_leave",
  "2026-04-17": "on_leave",
  "2026-04-20": "present",
  "2026-04-21": "late",
  "2026-04-22": "present",
};

export const MONTH_DETAILS: Record<string, DayDetail> = {
  "2026-04-01": { clockIn: "08:58", clockOut: "17:02", breakMinutes: 30, totalHours: 7.6 },
  "2026-04-02": { clockIn: "08:55", clockOut: "17:10", breakMinutes: 30, totalHours: 7.8 },
  "2026-04-03": { clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5 },
  "2026-04-06": { clockIn: "08:50", clockOut: "17:05", breakMinutes: 30, totalHours: 7.8 },
  "2026-04-07": { clockIn: "09:24", clockOut: "17:00", breakMinutes: 30, totalHours: 7.1, note: "Late arrival" },
  "2026-04-08": { clockIn: "08:57", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5 },
  "2026-04-09": { clockIn: "09:00", clockOut: "17:15", breakMinutes: 30, totalHours: 7.75 },
  "2026-04-10": { clockIn: "08:45", clockOut: "17:00", breakMinutes: 30, totalHours: 7.75 },
  "2026-04-13": { clockIn: "09:01", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5 },
  "2026-04-14": { clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5 },
  "2026-04-15": { note: "Annual Leave" },
  "2026-04-16": { note: "Annual Leave" },
  "2026-04-17": { note: "Annual Leave" },
  "2026-04-20": { clockIn: "09:00", clockOut: "17:05", breakMinutes: 30, totalHours: 7.6 },
  "2026-04-21": { clockIn: "09:31", clockOut: "17:00", breakMinutes: 30, totalHours: 7.0, note: "Late arrival" },
  "2026-04-22": { clockIn: "08:52", clockOut: "17:00", breakMinutes: 30, totalHours: 7.6 },
};

export const STATUS_DOT: Partial<Record<AttendanceStatus, string>> = {
  present: "bg-[#1D9E75]",
  late: "bg-amber-500",
  absent: "bg-red-500",
  on_leave: "bg-violet-500",
  early_departure: "bg-orange-500",
};

export const STATUS_LABEL: Partial<Record<AttendanceStatus, string>> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  on_leave: "On Leave",
  early_departure: "Early Departure",
};

export const STATUS_BADGE: Partial<Record<AttendanceStatus, string>> = {
  present: "bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/20",
  late: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  absent: "bg-red-500/10 text-red-600 border border-red-500/20",
  on_leave: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
  early_departure: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
};
