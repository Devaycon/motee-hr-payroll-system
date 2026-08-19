"use client";

import { AlertCircle, CalendarClock, Timer, TrendingUp } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { DailyEntry } from "@/src/lib/types/attendance";
import { hoursToHHMM } from "@/src/lib/utils/format-duration";

/**
 * The cards are drill-down controls, not decoration: each one filters the
 * timesheet below it. This union and the predicate beneath are the single
 * source of truth for what a card counts and what it then shows.
 */
export type AttendanceCardFilter = "all" | "worked" | "late" | "overtime";

export const ATTENDANCE_CARD_FILTER_LABELS: Record<
  Exclude<AttendanceCardFilter, "all">,
  string
> = {
  worked: "Days worked",
  late: "Late arrivals",
  overtime: "Days with overtime",
};

export function matchesAttendanceCardFilter(
  entry: DailyEntry,
  filter: AttendanceCardFilter,
  contractedDailyHours: number,
): boolean {
  switch (filter) {
    case "worked":
      return entry.status === "present" || entry.status === "late";
    case "late":
      return entry.status === "late";
    case "overtime":
      return (entry.totalHours ?? 0) > contractedDailyHours;
    default:
      return true;
  }
}

interface AttendanceStatCardsProps {
  hoursToday: number;
  weekHours: number;
  contractedWeekly: number;
  overtimeHours: number;
  punctuality: number;
  filter: AttendanceCardFilter;
  onDrillDown: (filter: Exclude<AttendanceCardFilter, "all">) => void;
}

export function AttendanceStatCards({
  hoursToday,
  weekHours,
  contractedWeekly,
  overtimeHours,
  punctuality,
  filter,
  onDrillDown,
}: AttendanceStatCardsProps) {
  const remaining = Math.max(0, contractedWeekly - weekHours);

  const cards: HrStatCardItem[] = [
    {
      label: "Hours today",
      value: hoursToHHMM(hoursToday),
      sub: hoursToday > 0 ? "Recorded so far" : "Not clocked in yet",
      icon: Timer,
      tone: "violet",
      active: filter === "worked",
      onClick: () => onDrillDown("worked"),
    },
    {
      label: "This week",
      value: hoursToHHMM(weekHours),
      sub: contractedWeekly
        ? remaining > 0
          ? `${hoursToHHMM(remaining)} left of ${contractedWeekly}h`
          : `Contract of ${contractedWeekly}h met`
        : "No contracted hours set",
      icon: CalendarClock,
      tone: "blue",
      active: filter === "all",
      onClick: () => onDrillDown("worked"),
    },
    {
      label: "Overtime",
      value: overtimeHours > 0 ? hoursToHHMM(overtimeHours) : "None",
      sub: "Beyond contracted hours this week",
      icon: TrendingUp,
      tone: overtimeHours > 0 ? "amber" : "emerald",
      active: filter === "overtime",
      onClick: () => onDrillDown("overtime"),
    },
    {
      label: "Punctuality",
      value: `${punctuality}%`,
      sub: punctuality === 100 ? "On time every day" : "On-time arrivals",
      icon: AlertCircle,
      tone: punctuality >= 90 ? "emerald" : "red",
      active: filter === "late",
      onClick: () => onDrillDown("late"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
