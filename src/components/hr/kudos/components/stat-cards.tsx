"use client";

import { Trophy, Star, Heart, Users } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { KUDOS_TYPE_CONFIG, LEADERBOARD } from "../data";
import type { KudosPost } from "../types";

interface StatCardsProps {
  posts: KudosPost[];
}

export function StatCards({ posts }: StatCardsProps) {
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPosts = posts.filter((p) => p.createdAt.startsWith(thisMonth));

  const totalThisMonth = thisMonthPosts.length;

  const topRecipient = LEADERBOARD[0];

  const typeCounts: Record<string, number> = {};
  posts.forEach((p) => {
    typeCounts[p.kudosType] = (typeCounts[p.kudosType] ?? 0) + 1;
  });
  const topTypeKey = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] as string | undefined;
  const topTypeLabel = topTypeKey
    ? KUDOS_TYPE_CONFIG[topTypeKey as keyof typeof KUDOS_TYPE_CONFIG]?.label
    : "—";

  const uniqueGivers = new Set(posts.map((p) => p.senderName)).size;
  const totalEmployees = 156;
  const participationPct = Math.round((uniqueGivers / totalEmployees) * 100);

  const cards = [
    {
      label: "Kudos This Month",
      value: totalThisMonth,
      sub: "Recognitions sent",
      icon: Trophy,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      label: "Top Recipient",
      value: topRecipient?.employeeName ?? "—",
      sub: `${topRecipient?.kudosReceived ?? 0} kudos received`,
      icon: Star,
      iconClass: "text-yellow-500",
      bgClass: "bg-yellow-500/10",
      isText: true,
    },
    {
      label: "Most Used Value",
      value: topTypeLabel,
      sub: `${typeCounts[topTypeKey ?? ""] ?? 0} times this period`,
      icon: Heart,
      iconClass: "text-rose-500",
      bgClass: "bg-rose-500/10",
      isText: true,
    },
    {
      label: "Participation Rate",
      value: `${participationPct}%`,
      sub: `${uniqueGivers} of ${totalEmployees} employees`,
      icon: Users,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`${card.bgClass} rounded-xl p-3 shrink-0`}>
              <card.icon className={`${card.iconClass} w-5 h-5`} />
            </div>
            <div className="min-w-0">
              {card.isText ? (
                <p className="text-base font-bold text-foreground truncate leading-tight">
                  {card.value}
                </p>
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
              )}
              <p className="text-sm font-medium text-foreground truncate">
                {card.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {card.sub}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
