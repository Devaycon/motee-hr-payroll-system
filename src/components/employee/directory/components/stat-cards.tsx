"use client";

import { Users, Building2, GitBranch, Briefcase } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useDirectoryEmployees } from "../hooks";
import type { EmployeeRow } from "./data";

/** The slice a KPI card drills the directory down to. */
export type DirectoryCardFilter = "all" | "on_leave";

export const DIRECTORY_CARD_FILTER_LABELS: Record<
  Exclude<DirectoryCardFilter, "all">,
  string
> = {
  on_leave: "On leave today",
};

/** Single source of truth for what each card counts and the list then shows. */
export function matchesDirectoryCardFilter(
  employee: EmployeeRow,
  filter: DirectoryCardFilter,
): boolean {
  return filter === "on_leave" ? employee.status === "on_leave" : true;
}

interface DirectoryStatCardsProps {
  /** The tab currently open. */
  activeTab: string;
  /** The department filter currently applied, or "all". */
  deptFilter: string;
  /** The card drill-down currently applied. */
  cardFilter: DirectoryCardFilter;
  /** Drill-down: opens the tab and filters it to the counted people. */
  onDrillDown: (
    tab: string,
    dept: string,
    cardFilter: DirectoryCardFilter,
  ) => void;
}

export function DirectoryStatCards({
  activeTab,
  deptFilter,
  cardFilter,
  onDrillDown,
}: DirectoryStatCardsProps) {
  const { data: employees } = useDirectoryEmployees();
  const list = employees ?? [];
  const myDept = useAppSelector((s) => s.auth.user?.departmentName) ?? "";

  const onLeave = list.filter((e) =>
    matchesDirectoryCardFilter(e, "on_leave"),
  ).length;
  const myTeam = myDept
    ? list.filter((e) => e.department === myDept).length
    : 0;

  const onDirectory = activeTab === "directory";

  const cards: HrStatCardItem[] = [
    {
      label: "Total Employees",
      value: list.length,
      sub: "Everyone in the directory",
      icon: Users,
      tone: "blue",
      active: onDirectory && deptFilter === "all" && cardFilter === "all",
      onClick: () => onDrillDown("directory", "all", "all"),
    },
    {
      // The org chart is the view that groups people by department.
      label: "Departments",
      value: new Set(list.map((e) => e.department)).size,
      sub: "Across the company",
      icon: Building2,
      tone: "emerald",
      active: activeTab === "org-chart",
      onClick: () => onDrillDown("org-chart", deptFilter, "all"),
    },
    {
      label: "My Team",
      value: myTeam,
      sub: myDept || "No department set",
      icon: GitBranch,
      tone: "amber",
      active: onDirectory && deptFilter === myDept && myDept !== "",
      onClick: () =>
        onDrillDown("directory", deptFilter === myDept ? "all" : myDept, "all"),
    },
    {
      label: "On Leave Today",
      value: onLeave,
      sub: "Away right now",
      icon: Briefcase,
      tone: "violet",
      active: cardFilter === "on_leave",
      onClick: () =>
        onDrillDown(
          "directory",
          "all",
          cardFilter === "on_leave" ? "all" : "on_leave",
        ),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
