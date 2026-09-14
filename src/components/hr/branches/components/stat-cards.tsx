"use client";

import { Building2, Users, MapPin, UserRoundX } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import type { Branch } from "../types";

/** The slice a KPI card drills the branches table down to. */
export type BranchCardFilter = "all" | "no_head" | "understaffed";

export const BRANCH_CARD_FILTER_LABELS: Record<
  Exclude<BranchCardFilter, "all">,
  string
> = {
  no_head: "No branch head",
  understaffed: "Below headcount target",
};

/** Single source of truth for what each card counts and the table then shows. */
export function matchesBranchCardFilter(
  branch: Branch,
  filter: BranchCardFilter,
): boolean {
  switch (filter) {
    case "no_head":
      return branch.managerName === null;
    case "understaffed":
      return branch.openPositions > 0;
    default:
      return true;
  }
}

interface StatCardsProps {
  branches: Branch[];
  cardFilter: BranchCardFilter;
  onFilterChange: (filter: BranchCardFilter) => void;
}

export function StatCards({
  branches,
  cardFilter,
  onFilterChange,
}: StatCardsProps) {
  const active = branches.filter((b) => b.status === "active").length;
  const headcount = branches.reduce((sum, b) => sum + b.employeeCount, 0);
  const cities = new Set(branches.map((b) => b.city).filter(Boolean)).size;
  const noHead = branches.filter((b) => b.managerName === null).length;

  const stats: HrStatCardItem[] = [
    {
      icon: Building2,
      label: "Total Branches",
      value: branches.length,
      sub: `${active} active`,
      tone: "blue",
      active: cardFilter === "all",
      onClick: () => onFilterChange("all"),
    },
    {
      icon: Users,
      label: "People Posted",
      value: headcount,
      sub: "across all branches",
      link: "/organization/employees",
    },
    {
      icon: MapPin,
      label: "Cities",
      value: cities,
      sub: "locations covered",
    },
    {
      icon: UserRoundX,
      label: "No Branch Head",
      value: noHead,
      sub: "require assignment",
      tone: "amber",
      active: cardFilter === "no_head",
      onClick: () => onFilterChange("no_head"),
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
