"use client";

import { ClipboardList, CheckCircle, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { PerformanceReview, PerformanceGoal } from "../types";

interface StatCardsProps {
  reviews: PerformanceReview[];
  goals: PerformanceGoal[];
}

export function StatCards({ reviews, goals }: StatCardsProps) {
  const completed = reviews.filter((r) => r.status === "completed").length;
  const inProgress = reviews.filter((r) => r.status === "in_progress").length;
  const overdue = reviews.filter((r) => r.status === "overdue").length;
  const completedWithRating = reviews.filter(
    (r) => r.status === "completed" && r.rating,
  );
  const avgRating =
    completedWithRating.length > 0
      ? (
          completedWithRating.reduce((s, r) => s + (r.rating ?? 0), 0) /
          completedWithRating.length
        ).toFixed(1)
      : "—";

  const goalsOnTrack = goals.filter(
    (g) => g.status === "on_track" || g.status === "completed",
  ).length;

  const cards = [
    {
      label: "Total Reviews",
      value: reviews.length,
      sub: `${completed} completed`,
      icon: ClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "In Progress",
      value: inProgress,
      sub: `${overdue} overdue`,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Avg. Rating",
      value: avgRating,
      sub: "Across completed reviews",
      icon: Star,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Goals On Track",
      value: goalsOnTrack,
      sub: `of ${goals.length} total goals`,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
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
