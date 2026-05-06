"use client";

import { Clock, CalendarDays, AlertCircle, CheckSquare } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { DAY_AT_A_GLANCE } from "@/src/data/employee-dashboard-demo";

export function StatCards() {
  const d = DAY_AT_A_GLANCE;

  const stats: HrStatCardItem[] = [
    {
      icon: Clock,
      label: "Clock Status",
      value: d.clockedIn ? d.clockInTime! : "—",
      sub: d.clockedIn ? "Clocked in today" : "Not clocked in yet",
      link: "/time-off/attendance",
    },
    {
      icon: Clock,
      label: "Hours Today",
      value: d.clockedIn ? d.hoursWorked : "—",
      sub: "time worked so far",
      link: "/time-off/attendance",
    },
    {
      icon: AlertCircle,
      label: "Pending Actions",
      value: d.pendingActions,
      sub: `item${d.pendingActions !== 1 ? "s" : ""} need attention`,
      link: "#pending",
    },
    {
      icon: CheckSquare,
      label: "Tasks Due Today",
      value: d.tasksDueToday,
      sub: `task${d.tasksDueToday !== 1 ? "s" : ""} due today`,
      link: "#tasks",
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
