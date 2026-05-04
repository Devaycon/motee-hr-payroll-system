"use client";

import {
  HeadphonesIcon,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { computeHelpdeskStats } from "../data";
import type { HelpDeskTicket } from "../types";

interface StatCardsProps {
  tickets: HelpDeskTicket[];
}

export function StatCards({ tickets }: StatCardsProps) {
  const { total, open, resolvedToday, overdue } = computeHelpdeskStats(tickets);

  const cards = [
    {
      label: "Total Cases",
      value: total,
      icon: HeadphonesIcon,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Open / Active",
      value: open,
      icon: Inbox,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      valueColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Resolved Today",
      value: resolvedToday,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Overdue (SLA)",
      value: overdue,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      iconBg: "bg-red-500/10",
      valueColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${c.valueColor}`}>
                  {c.value}
                </p>
              </div>
              <div className={`${c.iconBg} rounded-xl p-2.5`}>
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
