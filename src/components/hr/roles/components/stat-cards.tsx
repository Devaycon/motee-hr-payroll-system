"use client";

import {
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { Position } from "../types";

interface StatCardsProps {
  positions: Position[];
  /** The tab currently open. */
  activeTab: string;
  /** The status filter applied to the positions table, or "all". */
  statusFilter: string;
  /** Drill-down: opens the tab and status behind the number (§6.17). */
  onDrillDown: (tab: string, status: string) => void;
}

export function StatCards({
  positions,
  activeTab,
  statusFilter,
  onDrillDown,
}: StatCardsProps) {
  const total = positions.length;
  const filled = positions.filter((p) => p.status === "filled").length;
  const vacant = positions.filter((p) => p.status === "vacant").length;
  const departments = new Set(
    positions.filter((p) => p.status === "vacant").map((p) => p.department),
  ).size;

  /** A card is selected when both its tab and its status filter are live. */
  const onPositions = activeTab === "positions";

  const cards: HrStatCardItem[] = [
    {
      label: "Total Positions",
      value: total,
      sub: `${filled} filled, ${vacant} vacant`,
      icon: ListOrdered,
      tone: "blue",
      active: onPositions && statusFilter === "all",
      onClick: () => onDrillDown("positions", "all"),
    },
    {
      label: "Filled",
      value: filled,
      sub: `${Math.round((filled / total) * 100) || 0}% fill rate`,
      icon: CheckCircle2,
      tone: "emerald",
      active: onPositions && statusFilter === "filled",
      onClick: () => onDrillDown("positions", "filled"),
    },
    {
      label: "Vacant",
      value: vacant,
      sub: vacant === 1 ? "1 open position" : `${vacant} open positions`,
      icon: AlertCircle,
      tone: "amber",
      active: onPositions && statusFilter === "vacant",
      onClick: () => onDrillDown("positions", "vacant"),
    },
    {
      label: "Depts with Vacancies",
      value: departments,
      sub:
        departments === 1
          ? "1 department affected"
          : `${departments} departments affected`,
      icon: Building2,
      tone: "violet",
      // The vacancy report is already grouped by department — that report is
      // the list behind this number.
      active: activeTab === "vacancies",
      onClick: () => onDrillDown("vacancies", "all"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
