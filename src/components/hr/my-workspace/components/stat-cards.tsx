"use client";

import { CalendarDays, ClipboardList } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";

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
  ];

  return <HrStatCardsGrid stats={stats} columns={2} />;
}
