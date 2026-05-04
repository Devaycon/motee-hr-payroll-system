"use client";

import { Users, GitFork, BarChart3, Building2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { HierarchyNode } from "../types";

interface StatCardsProps {
  nodes: HierarchyNode[];
}

export function StatCards({ nodes }: StatCardsProps) {
  const totalEmployees = nodes.length;

  const maxLevel = nodes.reduce((acc, n) => Math.max(acc, n.level), 0);

  const managers = nodes.filter((n) => n.directReports > 0);
  const avgDirectReports =
    managers.length > 0
      ? (
          managers.reduce((acc, n) => acc + n.directReports, 0) /
          managers.length
        ).toFixed(1)
      : "0";

  const departments = new Set(nodes.map((n) => n.department)).size;

  const cards = [
    {
      label: "Total Employees",
      value: totalEmployees,
      sub: `${nodes.filter((n) => n.status === "active").length} active`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Management Levels",
      value: maxLevel,
      sub: "depth of reporting chain",
      icon: GitFork,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Avg Direct Reports",
      value: avgDirectReports,
      sub: `across ${managers.length} manager${managers.length !== 1 ? "s" : ""}`,
      icon: BarChart3,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Departments",
      value: departments,
      sub: `${nodes.filter((n) => n.managerId === null).length} top-level leads`,
      icon: Building2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} >
          <CardContent className="p-4 flex items-start gap-3">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${card.bg}`}
            >
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">
                {card.value}
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {card.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
