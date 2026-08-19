import type { ComponentType, CSSProperties } from "react";
import { Building2, Laptop, Users } from "lucide-react";
import type { AttendanceStatus, WorkLocation } from "@/src/lib/types/attendance";

/**
 * Presentation constants only.
 *
 * The schedule, the contracted hours and the week's history all used to be
 * hardcoded here. They now come from the employee's own work pattern and from
 * their real time logs, so what is left is purely how things look.
 */

/** Minutes past the scheduled start before an arrival counts as late. */
export const LATE_GRACE_MINUTES = 10;

/** How many weeks of history the timesheet pager offers. */
export const TIMESHEET_WEEKS = 8;

export const LOCATION_CONFIG: Record<
  WorkLocation,
  {
    label: string;
    icon: ComponentType<{ className?: string; style?: CSSProperties }>;
    color: string;
  }
> = {
  office: { label: "Office", icon: Building2, color: "#2563EB" },
  remote: { label: "Remote", icon: Laptop, color: "#7F77DD" },
  client_site: { label: "Client Site", icon: Users, color: "#1D9E75" },
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
  not_clocked_in: "No record",
};

export const STATUS_BADGE: Partial<Record<AttendanceStatus, string>> = {
  present: "bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/20",
  late: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  absent: "bg-red-500/10 text-red-600 border border-red-500/20",
  on_leave: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
  early_departure:
    "bg-orange-500/10 text-orange-600 border border-orange-500/20",
  not_clocked_in: "bg-slate-500/10 text-slate-500 border border-slate-500/20",
};
