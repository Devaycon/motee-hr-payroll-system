"use client";

import { Users, UserCheck, Umbrella, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { EmployeeRow } from "../types";

interface StatCardsProps {
  employees: EmployeeRow[];
}

export function StatCards({ employees }: StatCardsProps) {
  const total = employees.length;
  const active = employees.filter((e) => e.status === "active").length;
  const onLeave = employees.filter((e) => e.status === "on_leave").length;
  const probation = employees.filter((e) => e.status === "probation").length;

  const cards = [
    {
      label: "Total Employees",
      value: total,
      sub: `${active} active`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active",
      value: active,
      sub: `${Math.round((active / total) * 100) || 0}% of workforce`,
      icon: UserCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "On Leave",
      value: onLeave,
      sub: onLeave === 1 ? "1 employee away" : `${onLeave} employees away`,
      icon: Umbrella,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Probation",
      value: probation,
      sub: probation === 1 ? "1 under review" : `${probation} under review`,
      icon: AlertCircle,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label}>
            <CardContent className="flex items-start gap-4 py-5">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${c.bg}`}
              >
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">
                  {c.value}
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {c.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
