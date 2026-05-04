"use client";

import { Network, Users, BriefcaseBusiness, LayoutGrid } from "lucide-react";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import type { HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import type { Department } from "../types";

interface StatCardsProps {
  departments: Department[];
}

export function StatCards({ departments }: StatCardsProps) {
  const total = departments.length;
  const active = departments.filter((d) => d.status === "active").length;
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
      link: "/organization/departments",
    },
    {
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
      value: departments.filter((d) => d.head === null).length,
      sub: "require assignment",
      link: "/organization/departments",
    },
  ];

  return <HrStatCardsGrid stats={stats} columns={4} />;
}
