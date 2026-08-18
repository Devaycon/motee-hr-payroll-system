"use client";

import { UserCheck, UserX, Clock, FileText } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { AttendanceRecord, TimesheetRecord } from "../types";

/** The slice a KPI card drills into. */
export type AttendanceCardFilter =
  | "all"
  | "present"
  | "absent"
  | "late"
  | "pending_timesheets";

export const ATTENDANCE_CARD_FILTER_LABELS: Record<
  Exclude<AttendanceCardFilter, "all">,
  string
> = {
  present: "Present today",
  absent: "Absent today",
  late: "Late arrivals",
  pending_timesheets: "Timesheets awaiting review",
};

/** Single source of truth for what the attendance cards count and show. */
export function matchesAttendanceCardFilter(
  record: AttendanceRecord,
  filter: AttendanceCardFilter,
): boolean {
  switch (filter) {
    case "present":
      return ["present", "late", "early_departure"].includes(record.status);
    case "absent":
      return record.status === "absent";
    case "late":
      return record.status === "late";
    default:
      return true;
  }
}

interface StatCardsProps {
  records: AttendanceRecord[];
  timesheets: TimesheetRecord[];
  /** The card drill-down currently applied. */
  cardFilter: AttendanceCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: AttendanceCardFilter) => void;
}

export function StatCards({
  records,
  timesheets,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const presentCount = records.filter((r) =>
    matchesAttendanceCardFilter(r, "present"),
  ).length;
  const absentCount = records.filter((r) =>
    matchesAttendanceCardFilter(r, "absent"),
  ).length;
  const lateCount = records.filter((r) =>
    matchesAttendanceCardFilter(r, "late"),
  ).length;
  const pendingApprovals = timesheets.filter(
    (t) => t.status === "submitted",
  ).length;

  const total = records.length;
  const attendanceRate =
    total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const card = (key: AttendanceCardFilter, tab: string) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to the full list.
    onClick: () => onDrillDown(tab, cardFilter === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Present Today",
      value: presentCount,
      sub: `${attendanceRate}% attendance rate`,
      icon: UserCheck,
      tone: "emerald",
      ...card("present", "today"),
    },
    {
      label: "Absent Today",
      value: absentCount,
      sub: `Out of ${total} tracked employees`,
      icon: UserX,
      tone: "red",
      ...card("absent", "today"),
    },
    {
      label: "Late Arrivals",
      value: lateCount,
      sub: "Clocked in after schedule today",
      icon: Clock,
      tone: "amber",
      ...card("late", "today"),
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      sub: "Timesheets awaiting review",
      icon: FileText,
      tone: "blue",
      ...card("pending_timesheets", "timesheets"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
