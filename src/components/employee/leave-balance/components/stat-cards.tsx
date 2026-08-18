"use client";

import { CalendarDays, Clock, CheckCircle2, TrendingUp } from "lucide-react";
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
  const sick = MY_BALANCES[1];

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
      label: "Sick Leave Remaining",
      value: `${daysRemaining(sick)} days`,
      sub: "See the full entitlement",
      icon: TrendingUp,
      tone: "red",
      ...balanceCard(sick),
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
