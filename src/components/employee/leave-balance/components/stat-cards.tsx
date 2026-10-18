"use client";

import { CalendarDays, Clock, CheckCircle2, HeartPulse } from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { MY_BALANCES, MY_HISTORY, daysRemaining } from "./data";
import type { LeaveTypeName } from "@/src/lib/types/leave";

/** The slice a KPI card drills the leave history down to. */
export type LeaveHistoryFilter = "all" | "pending" | "approved";

export const LEAVE_HISTORY_FILTER_LABELS: Record<
  Exclude<LeaveHistoryFilter, "all">,
  string
> = {
  pending: "Pending requests",
  approved: "Approved leave",
};

interface LeaveStatCardsProps {
  /** The tab currently open. */
  activeTab: string;
  /** The entitlement card currently expanded, if any. */
  expandedType: LeaveTypeName | null;
  /** The history drill-down currently applied. */
  historyFilter: LeaveHistoryFilter;
  /** Drill-down: opens the entitlement behind a balance card. */
  onShowEntitlement: (type: LeaveTypeName) => void;
  /** Drill-down: opens the history filtered to the requests counted here. */
  onShowHistory: (filter: LeaveHistoryFilter) => void;
}

export function LeaveStatCards({
  activeTab,
  expandedType,
  historyFilter,
  onShowEntitlement,
  onShowHistory,
}: LeaveStatCardsProps) {
  const pendingCount = MY_HISTORY.filter((h) => h.status === "pending").length;
  const annual = MY_BALANCES[0];
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const year = String(new Date().getFullYear());
  const sickDays = useAppSelector((s) =>
    s.sickness.records
      .filter((r) => r.employeeId === me && r.startDate.startsWith(year) && r.approvalStatus !== "rejected" && r.approvalStatus !== "cancelled")
      .reduce((sum, r) => {
        const end = r.endDate ?? new Date().toISOString().slice(0, 10);
        return sum + Math.max(1, Math.round((Date.parse(end) - Date.parse(r.startDate)) / 86400000) + 1);
      }, 0),
  );

  /** Re-clicking the open entitlement collapses it again. */
  const balanceCard = (balance: (typeof MY_BALANCES)[number]) => ({
    active: activeTab === "entitlements" && expandedType === balance.type,
    onClick: () => onShowEntitlement(balance.type),
  });

  const stats: HrStatCardItem[] = [
    {
      label: "Annual Leave Remaining",
      value: `${daysRemaining(annual)} days`,
      sub: "See the full entitlement",
      icon: CalendarDays,
      tone: "blue",
      ...balanceCard(annual),
    },
    {
      // Sickness isn't a leave balance any more — it's reported in My Sickness.
      label: "Days Off Sick This Year",
      value: `${sickDays} days`,
      sub: "Report sickness & fit notes",
      icon: HeartPulse,
      tone: "red",
      link: "/time-off/sickness",
    },
    {
      label: "Pending Requests",
      value: pendingCount,
      sub: "Awaiting a decision",
      icon: Clock,
      tone: "amber",
      active: historyFilter === "pending",
      onClick: () =>
        onShowHistory(historyFilter === "pending" ? "all" : "pending"),
    },
    {
      label: "Total Leave Taken",
      value: `${MY_HISTORY.filter((h) => h.status === "approved").reduce((s, h) => s + h.totalDays, 0)} days`,
      sub: "Approved and taken",
      icon: CheckCircle2,
      tone: "emerald",
      active: historyFilter === "approved",
      onClick: () =>
        onShowHistory(historyFilter === "approved" ? "all" : "approved"),
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
