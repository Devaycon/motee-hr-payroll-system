"use client";

import {
  CalendarDays,
  ClipboardList,
  Clock,
  Receipt,
  BellRing,
  CalendarClock,
} from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { HR_ALERT_TOTAL } from "@/src/data/hr-alerts-demo";
import {
  PENDING_TIMESHEETS,
  PENDING_EXPENSES,
  UPCOMING_EVENTS,
} from "../data";

interface StatCardsProps {
  pendingLeaveCount: number;
  openTaskCount: number;
}

export function StatCards({
  pendingLeaveCount,
  openTaskCount,
}: StatCardsProps) {
  const stats: HrStatCardItem[] = [
    {
      icon: BellRing,
      label: "Open Alerts",
      value: HR_ALERT_TOTAL,
      sub: "across all categories",
      link: "#alerts",
    },
    {
      icon: CalendarDays,
      label: "Pending Leaves",
      value: pendingLeaveCount,
      sub: "awaiting approval",
      link: "/time-payroll/leave",
    },
    {
      icon: ClipboardList,
      label: "Open Tasks",
      value: openTaskCount,
      sub: "assigned to you",
      link: "#tasks",
    },
    {
      icon: Clock,
      label: "Pending Timesheets",
      value: PENDING_TIMESHEETS.length,
      sub: "to review",
      link: "/time-payroll/attendance",
    },
    {
      icon: Receipt,
      label: "Pending Expenses",
      value: PENDING_EXPENSES.length,
      sub: "to reimburse",
      // Expenses live in the self-service portal (client feedback §4.3).
      link: "/employee/expenses",
    },
    {
      icon: CalendarClock,
      label: "Upcoming Events",
      value: UPCOMING_EVENTS.length,
      sub: "scheduled soon",
      link: "/hr-action-center/events",
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={3} />;
}
