"use client";

import { Network, Users, BriefcaseBusiness, LayoutGrid } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import type { Department } from "../types";

/** The slice a KPI card drills the departments table down to. */
export type DepartmentCardFilter = "all" | "active" | "no_head";

export const DEPARTMENT_CARD_FILTER_LABELS: Record<
  Exclude<DepartmentCardFilter, "all">,
  string
> = {
  active: "Active departments",
  no_head: "No department head",
};

/** Single source of truth for what each card counts and the table then shows. */
export function matchesDepartmentCardFilter(
  department: Department,
  filter: DepartmentCardFilter,
): boolean {
  switch (filter) {
    case "active":
      return department.status === "active";
    case "no_head":
      return department.head === null;
    default:
      return true;
  }
}

interface StatCardsProps {
  departments: Department[];
  /** The card drill-down currently applied. */
  cardFilter: DepartmentCardFilter;
  /** Drill-down: filters the departments table to the records counted here. */
  onFilterChange: (filter: DepartmentCardFilter) => void;
}

export function StatCards({
  departments,
  cardFilter,
  onFilterChange,
}: StatCardsProps) {
  const total = departments.length;
  const active = departments.filter((d) => d.status === "active").length;
  const noHead = departments.filter((d) => d.head === null).length;
  const totalEmployees = departments.reduce(
    (sum, d) => sum + d.employeeCount,
    0,
  );
  const totalOpenPositions = departments.reduce(
    (sum, d) => sum + d.openPositions,
    0,
  );

  const stats: HrStatCardItem[] = [
    {
      icon: LayoutGrid,
      label: "Total Departments",
      value: total,
      sub: `${active} active`,
      tone: "blue",
      active: cardFilter === "all",
      onClick: () => onFilterChange("all"),
    },
    {
      // Headcount lives on the employees page, so this one routes out.
      icon: Users,
      label: "Total Employees",
      value: totalEmployees,
      sub: "across all departments",
      link: "/organization/employees",
    },
    {
      icon: BriefcaseBusiness,
      label: "Open Positions",
      value: totalOpenPositions,
      sub: "currently hiring",
      link: "/talent/recruitment",
    },
    {
      icon: Network,
      label: "No Department Head",
      value: noHead,
      sub: "require assignment",
      tone: "amber",
      active: cardFilter === "no_head",
      onClick: () => onFilterChange("no_head"),
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
