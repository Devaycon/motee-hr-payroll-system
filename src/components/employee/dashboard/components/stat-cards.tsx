"use client";

import { Clock, CalendarDays, AlertCircle, CheckSquare } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { DAY_AT_A_GLANCE } from "@/src/data/employee-dashboard-demo";
import type { MyDayDto } from "@/src/types/dashboard";

function hoursLabel(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

/** The API's day (GET /dashboard/mine) in the demo shape the cards read. */
function dayFromApi(t: MyDayDto) {
  const clockedIn = t.clock !== "notStarted" && !!t.clockedInAt;
  return {
    clockedIn,
    clockInTime: t.clockedInAt
      ? new Date(t.clockedInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : undefined,
    hoursWorked: hoursLabel(t.workedHours),
    pendingActions: t.pendingActions,
    // The API counts outstanding tasks (and overdue ones), not only today's.
    tasksDueToday: t.tasksOutstanding,
  };
}

export function StatCards({ today }: { today?: MyDayDto }) {
  const d = today ? dayFromApi(today) : DAY_AT_A_GLANCE;

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
