"use client";

import {
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Position } from "../types";

interface StatCardsProps {
  positions: Position[];
}

export function StatCards({ positions }: StatCardsProps) {
  const total = positions.length;
  const filled = positions.filter((p) => p.status === "filled").length;
  const vacant = positions.filter((p) => p.status === "vacant").length;
  const departments = new Set(
    positions.filter((p) => p.status === "vacant").map((p) => p.department),
  ).size;

  const cards = [
    {
      label: "Total Positions",
      value: total,
      sub: `${filled} filled, ${vacant} vacant`,
      icon: ListOrdered,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Filled",
      value: filled,
      sub: `${Math.round((filled / total) * 100) || 0}% fill rate`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Vacant",
      value: vacant,
      sub: vacant === 1 ? "1 open position" : `${vacant} open positions`,
      icon: AlertCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Depts with Vacancies",
      value: departments,
      sub:
        departments === 1
          ? "1 department affected"
          : `${departments} departments affected`,
      icon: Building2,
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
