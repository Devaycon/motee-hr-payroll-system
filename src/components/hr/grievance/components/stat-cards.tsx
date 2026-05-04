"use client";

import { Shield, AlertTriangle, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { GrievanceCase, DisciplinaryCase } from "../types";
import { computeGrievanceStats } from "../data";

interface Props {
  grievances: GrievanceCase[];
  disciplinary: DisciplinaryCase[];
}

export function GrievanceStatCards({ grievances, disciplinary }: Props) {
  const stats = computeGrievanceStats(grievances, disciplinary);
  const pendingHearings = [
    ...grievances.filter((g) => g.status === "hearing_scheduled"),
    ...disciplinary.filter((d) => d.status === "hearing_scheduled"),
  ].length;

  const cards = [
    {
      label: "Open Grievances",
      value: stats.openGrievances,
      icon: Shield,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      ring: "ring-amber-200 dark:ring-amber-800",
    },
    {
      label: "Open Disciplinary",
      value: stats.openDisciplinary,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
      ring: "ring-red-200 dark:ring-red-800",
    },
    {
      label: "Pending Hearings",
      value: pendingHearings,
      icon: Calendar,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      ring: "ring-violet-200 dark:ring-violet-800",
    },
    {
      label: "Resolved / Closed",
      value: stats.resolved,
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
