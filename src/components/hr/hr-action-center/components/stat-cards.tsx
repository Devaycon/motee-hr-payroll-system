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
import {
  HR_ALERT_CATEGORIES,
  HR_ALERT_TOTAL,
  severitySummary,
} from "@/src/data/hr-alerts-demo";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { isClaimOpen } from "@/src/lib/expenses/stages";
import { PENDING_TIMESHEETS, UPCOMING_EVENTS } from "../data";

interface StatCardsProps {
  pendingLeaveCount: number;
  openTaskCount: number;
}

export function StatCards({
  pendingLeaveCount,
  openTaskCount,
}: StatCardsProps) {
  // Read live, or the card contradicts the screen it links to.
  const pendingExpenseCount = useAppSelector(
    (s) => s.expenses.claims.filter((c) => isClaimOpen(c.status)).length,
  );

  const stats: HrStatCardItem[] = [
    {
      icon: BellRing,
      label: "Open Alerts",
      value: HR_ALERT_TOTAL,
      // Says how urgent the pile is, not just how big (client feedback).
      sub: severitySummary(HR_ALERT_CATEGORIES),
      zeroSub: "Nothing outstanding",
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
      value: pendingExpenseCount,
      sub: "to reimburse",
      link: "/time-payroll/expenses",
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
