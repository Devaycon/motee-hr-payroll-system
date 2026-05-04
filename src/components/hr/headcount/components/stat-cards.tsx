"use client";

import { Users, Briefcase, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { HeadcountPlan, AttritionRisk } from "../types";

interface StatCardsProps {
  plans: HeadcountPlan[];
  attritionRisks: AttritionRisk[];
}

export function StatCards({ plans, attritionRisks }: StatCardsProps) {
  const totalActual = plans.reduce((sum, p) => sum + p.actual, 0);
  const totalTarget = plans.reduce((sum, p) => sum + p.target, 0);
  const openVacancies = Math.max(0, totalTarget - totalActual);
  const deptsOnTarget = plans.filter((p) => p.gapStatus === "on_target").length;
  const highRisk = attritionRisks.filter((r) => r.riskLevel === "high").length;

  const cards = [
    {
      label: "Total Headcount",
      value: totalActual,
      sub: `${totalTarget} planned`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Open Vacancies",
      value: openVacancies,
      sub:
        openVacancies === 1
          ? "1 position unfilled"
          : `${openVacancies} positions unfilled`,
      icon: Briefcase,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Depts On Target",
      value: deptsOnTarget,
      sub: `out of ${plans.length} departments`,
      icon: Target,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Attrition Risk",
      value: attritionRisks.length,
      sub: `${highRisk} high-risk employee${highRisk !== 1 ? "s" : ""}`,
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
