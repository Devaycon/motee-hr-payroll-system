"use client";

import { Activity, Clock, AlertTriangle, Gauge } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { computeAuditStats } from "../data";
import type { AuditEntry } from "../types";

interface StatCardsProps {
  entries: AuditEntry[];
}

export function StatCards({ entries }: StatCardsProps) {
  const { totalActions, sessions, errorRate, avgResponseTime, suspicious } =
    computeAuditStats(entries);

  const cards = [
    {
      label: "Total Actions",
      value: totalActions,
      icon: Activity,
      iconBg: "bg-indigo-100 dark:bg-indigo-950/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      sub: `${sessions} session${sessions !== 1 ? "s" : ""}`,
    },
    {
      label: "Error Rate",
      value: `${errorRate}%`,
      icon: AlertTriangle,
      iconBg:
        errorRate > 5
          ? "bg-red-100 dark:bg-red-950/60"
          : "bg-emerald-100 dark:bg-emerald-950/60",
      iconColor:
        errorRate > 5
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400",
      sub: `${entries.filter((e) => e.httpStatus >= 400).length} failed requests`,
    },
    {
      label: "Avg Response",
      value: `${avgResponseTime}ms`,
      icon: Gauge,
      iconBg: "bg-violet-100 dark:bg-violet-950/60",
      iconColor: "text-violet-600 dark:text-violet-400",
      sub: "Server response time",
    },
    {
      label: "Suspicious",
      value: suspicious,
      icon: Clock,
      iconBg:
        suspicious > 0
          ? "bg-amber-100 dark:bg-amber-950/60"
          : "bg-slate-100 dark:bg-slate-800/60",
      iconColor:
        suspicious > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-slate-500 dark:text-slate-400",
      sub: suspicious > 0 ? "Flagged events" : "No alerts",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
