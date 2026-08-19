"use client";

import { Users, GitFork, BarChart3, Building2 } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { HierarchyNode, ViewMode } from "../types";

/** The slice a KPI card drills the reporting list down to. */
export type StructureCardFilter = "all" | "managers";

export const STRUCTURE_CARD_FILTER_LABELS: Record<
  Exclude<StructureCardFilter, "all">,
  string
> = {
  managers: "People with direct reports",
};

/** Single source of truth for what each card counts and the list then shows. */
export function matchesStructureCardFilter(
  node: HierarchyNode,
  filter: StructureCardFilter,
): boolean {
  return filter === "managers" ? node.directReports > 0 : true;
}

interface StatCardsProps {
  nodes: HierarchyNode[];
  /** Tree or list — cards switch this to show what sits behind the number. */
  viewMode: ViewMode;
  /** The card drill-down currently applied. */
  cardFilter: StructureCardFilter;
  /** Drill-down: switches the view and filters it to the counted records. */
  onDrillDown: (view: ViewMode, filter: StructureCardFilter) => void;
}

export function StatCards({
  nodes,
  viewMode,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const totalEmployees = nodes.length;

  const maxLevel = nodes.reduce((acc, n) => Math.max(acc, n.level), 0);

  const managers = nodes.filter((n) =>
    matchesStructureCardFilter(n, "managers"),
  );
  const avgDirectReports =
    managers.length > 0
      ? (
          managers.reduce((acc, n) => acc + n.directReports, 0) /
          managers.length
        ).toFixed(1)
      : "0";

  const departments = new Set(nodes.map((n) => n.department)).size;

  const cards: HrStatCardItem[] = [
    {
      label: "Total Employees",
      value: totalEmployees,
      sub: `${nodes.filter((n) => n.status === "active").length} active`,
      icon: Users,
      tone: "blue",
      active: viewMode === "table" && cardFilter === "all",
      onClick: () => onDrillDown("table", "all"),
    },
    {
      // Depth of the chain is only legible in the tree, so that's what opens.
      label: "Management Levels",
      value: maxLevel,
      sub: "depth of reporting chain",
      icon: GitFork,
      tone: "violet",
      active: viewMode === "tree",
      onClick: () => onDrillDown("tree", "all"),
    },
    {
      label: "Avg Direct Reports",
      value: avgDirectReports,
      sub: `across ${managers.length} manager${managers.length !== 1 ? "s" : ""}`,
      icon: BarChart3,
      tone: "amber",
      active: cardFilter === "managers",
      onClick: () => onDrillDown("table", "managers"),
    },
    {
      // Departments are how the tree groups people — no separate list exists,
      // so this opens the tree without claiming a selected state of its own.
      label: "Departments",
      value: departments,
      sub: `${nodes.filter((n) => n.managerId === null).length} top-level leads`,
      icon: Building2,
      tone: "emerald",
      onClick: () => onDrillDown("tree", "all"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
