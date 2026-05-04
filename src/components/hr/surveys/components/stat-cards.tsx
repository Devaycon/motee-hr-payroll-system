"use client";

import { BarChart3, Users, TrendingUp, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { SURVEYS, getResponseRate, getEngagementScore } from "../data";
import type { Survey } from "../types";

interface StatCardsProps {
  surveys: Survey[];
}

export function StatCards({ surveys }: StatCardsProps) {
  const activeSurveys = surveys.filter((s) => s.status === "active").length;

  const respondedSurveys = surveys.filter((s) => s.responses.length > 0);
  const avgResponseRate =
    respondedSurveys.length > 0
      ? Math.round(
          respondedSurveys.reduce((sum, s) => sum + getResponseRate(s), 0) /
            respondedSurveys.length,
        )
      : 0;

  const engagementScore = getEngagementScore(SURVEYS);

  const totalSurveys = surveys.filter((s) => !s.isArchived).length;

  const cards = [
    {
      label: "Active Surveys",
      value: activeSurveys,
      suffix: "",
      icon: BarChart3,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Avg Response Rate",
      value: avgResponseRate,
      suffix: "%",
      icon: Users,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Engagement Score",
      value: engagementScore,
      suffix: "%",
      icon: TrendingUp,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      valueColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Total Surveys",
      value: totalSurveys,
      suffix: "",
      icon: ClipboardList,
      iconColor: "text-slate-500",
      iconBg: "bg-slate-500/10",
      valueColor: "text-slate-600 dark:text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-border bg-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${c.iconBg} rounded-xl p-2.5 shrink-0`}>
                <Icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {c.label}
                </p>
                <p className={`text-2xl font-bold mt-0.5 ${c.valueColor}`}>
                  {c.value}
                  {c.suffix}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
