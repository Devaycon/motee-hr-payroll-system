"use client";

import { Lightbulb, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { computeSuggestionStats } from "../data";
import type { Suggestion } from "../types";

interface StatCardsProps {
  suggestions: Suggestion[];
}

export function StatCards({ suggestions }: StatCardsProps) {
  const { total, implemented, underReview, avgUpvotes } =
    computeSuggestionStats(suggestions);

  const cards = [
    {
      label: "Total Submissions",
      value: total,
      suffix: "",
      icon: Lightbulb,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
      valueColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Implemented",
      value: implemented,
      suffix: "",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Under Review",
      value: underReview,
      suffix: "",
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
      valueColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Avg Upvotes",
      value: avgUpvotes,
      suffix: "",
      icon: TrendingUp,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label} className="border-border/60">
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
