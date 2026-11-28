"use client";

import { Users, UserCheck, Umbrella, AlertCircle } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { EmployeeRow } from "../types";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { useGetEmployeeStatsQuery } from "@/src/store/services/employees";

interface StatCardsProps {
  employees: EmployeeRow[];
  /** The lifecycle tab currently open, so the matching card reads as selected. */
  activeTab: string;
  /** Drill-down: opens the tab listing the records behind the number. */
  onTabChange: (tab: string) => void;
}

export function StatCards({
  employees,
  activeTab,
  onTabChange,
}: StatCardsProps) {
  // Soft-deleted rows still render on their own tab but must not inflate
  // headcount (client feedback §1.1).
  // Signed in: headcount and status counts from GET /employees/stats, which
  // covers everyone, not just the rows loaded.
  const server = useGetEmployeeStatsQuery(undefined, { skip: !useIsLive() }).data?.data;
  const byStatus = (s: string) => server?.byStatus.find((x) => x.status === s)?.count ?? 0;
  const total = server?.headcount ?? employees.filter((e) => e.status !== "deleted").length;
  const active = server ? byStatus("active") : employees.filter((e) => e.status === "active").length;
  const onLeaveRows = employees.filter((e) => e.status === "on_leave");
  const onLeave = server ? byStatus("onLeave") : onLeaveRows.length;
  const probation = server ? byStatus("probation") : employees.filter((e) => e.status === "probation").length;

  // Break the count down by leave type so the card says what kind (§C1).
  const byType = new Map<string, number>();
  for (const e of onLeaveRows) {
    const label = e.leaveTypeLabel ?? "Unspecified";
    byType.set(label, (byType.get(label) ?? 0) + 1);
  }
  const leaveBreakdown = [...byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => `${n} ${label.replace(/ Leave$/, "").toLowerCase()}`)
    .join(" · ");

  const cards: HrStatCardItem[] = [
    {
      // Drills to the "All" tab, which is the only view spanning every
      // lifecycle status — note it also lists soft-deleted rows, which this
      // headcount deliberately leaves out (§1.1).
      label: "Total Employees",
      value: total,
      sub: `${active} active`,
      icon: Users,
      tone: "blue",
      active: activeTab === "all",
      onClick: () => onTabChange("all"),
    },
    {
      label: "Active",
      value: active,
      sub: `${Math.round((active / total) * 100) || 0}% of workforce`,
      icon: UserCheck,
      tone: "emerald",
      active: activeTab === "active",
      onClick: () => onTabChange("active"),
    },
    {
      label: "On Leave",
      value: onLeave,
      sub:
        leaveBreakdown ||
        (onLeave === 1 ? "1 employee away" : `${onLeave} employees away`),
      icon: Umbrella,
      tone: "amber",
      active: activeTab === "on_leave",
      onClick: () => onTabChange("on_leave"),
    },
    {
      label: "Probation",
      value: probation,
      sub: probation === 1 ? "1 under review" : `${probation} under review`,
      icon: AlertCircle,
      tone: "violet",
      active: activeTab === "probation",
      onClick: () => onTabChange("probation"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
