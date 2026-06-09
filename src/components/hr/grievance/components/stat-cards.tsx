"use client";

import { FolderOpen, Search, Gavel, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { ERCase } from "../types";
import { computeCaseStats } from "../data";

interface Props {
  cases: ERCase[];
}

export function GrievanceStatCards({ cases }: Props) {
  const stats = computeCaseStats(cases);

  const cards = [
    {
      label: "Open Cases",
      value: stats.open,
      icon: FolderOpen,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      ring: "ring-amber-200 dark:ring-amber-800",
    },
    {
      label: "Under Investigation",
      value: stats.investigations,
      icon: Search,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      ring: "ring-orange-200 dark:ring-orange-800",
    },
    {
      label: "Hearings",
      value: stats.hearings,
      icon: Gavel,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      ring: "ring-violet-200 dark:ring-violet-800",
    },
    {
      label: "Closed",
      value: stats.closed,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      ring: "ring-emerald-200 dark:ring-emerald-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="border-0 shadow-sm ring-1 ring-border"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${card.bg} ${card.ring}`}
                >
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
