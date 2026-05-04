"use client";

import { UserPlus, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { OnboardingRecord } from "../types";

interface StatCardsProps {
  records: OnboardingRecord[];
}

export function StatCards({ records }: StatCardsProps) {
  const active = records.filter((r) => r.status === "in_progress").length;
  const completed = records.filter((r) => r.status === "completed").length;
  const overdue = records.filter((r) => r.status === "overdue").length;

  const cards = [
    {
      label: "Total Onboarding",
      value: records.length,
      sub: "All initiated pipelines",
      icon: UserPlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "In Progress",
      value: active,
      sub: "Currently onboarding",
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Completed",
      value: completed,
      sub: "Fully onboarded",
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Overdue",
      value: overdue,
      sub: "Require attention",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
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
