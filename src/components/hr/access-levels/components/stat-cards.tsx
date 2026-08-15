"use client";

import { ShieldCheck, Users, Lock, Layers } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { computeAccessLevelStats } from "../data";
import type { AccessLevel } from "../types";

/** The slice a KPI card drills the roles list down to. */
export type AccessLevelCardFilter = "all" | "custom";

export const ACCESS_LEVEL_CARD_FILTER_LABELS: Record<
  Exclude<AccessLevelCardFilter, "all">,
  string
> = {
  custom: "Custom roles",
};

/** Single source of truth for what each card counts and the list then shows. */
export function matchesAccessLevelCardFilter(
  level: AccessLevel,
  filter: AccessLevelCardFilter,
): boolean {
  return filter === "custom" ? level.kind !== "default" : true;
}

interface StatCardsProps {
  levels: AccessLevel[];
  /** The tab currently open. */
  activeTab: string;
  /** The card drill-down currently applied. */
  cardFilter: AccessLevelCardFilter;
  /** Drill-down: opens the tab holding these rows and filters to them. */
  onDrillDown: (tab: string, filter: AccessLevelCardFilter) => void;
  /** Opens the permissions matrix, which is the list of protected modules. */
  onViewMatrix: () => void;
}

export function StatCards({
  levels,
  activeTab,
  cardFilter,
  onDrillDown,
  onViewMatrix,
}: StatCardsProps) {
  const { totalRoles, customRoles, totalUsers, modulesProtected } =
    computeAccessLevelStats(levels);

  const cards: HrStatCardItem[] = [
    {
      label: "Total Roles",
      value: totalRoles,
      sub: `${levels.filter((l) => l.kind === "default").length} default`,
      icon: ShieldCheck,
      tone: "blue",
      active: activeTab === "roles" && cardFilter === "all",
      onClick: () => onDrillDown("roles", "all"),
    },
    {
      label: "Custom Roles",
      value: customRoles,
      sub: "User-defined",
      icon: Layers,
      tone: "violet",
      active: cardFilter === "custom",
      onClick: () => onDrillDown("roles", "custom"),
    },
    {
      // Who holds which role is recorded in the assignment history.
      label: "Active Users",
      value: totalUsers,
      sub: "Across all roles",
      icon: Users,
      tone: "emerald",
      active: activeTab === "history",
      onClick: () => onDrillDown("history", "all"),
    },
    {
      label: "Modules Protected",
      value: modulesProtected,
      sub: "Permission-gated",
      icon: Lock,
      tone: "amber",
      onClick: onViewMatrix,
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
