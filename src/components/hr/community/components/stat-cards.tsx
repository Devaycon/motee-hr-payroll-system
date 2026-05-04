"use client";

import { Users, MessageSquare, ThumbsUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { computeFeedStats } from "../data";
import type { CommunityPost } from "../types";

interface StatCardsProps {
  posts: CommunityPost[];
  memberCount: number;
}

export function StatCards({ posts, memberCount }: StatCardsProps) {
  const stats = computeFeedStats(posts);

  const cards = [
    {
      label: "Team Members",
      value: memberCount,
      icon: Users,
      iconBg: "bg-indigo-100 dark:bg-indigo-950/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      valueCls: "text-indigo-700 dark:text-indigo-300",
    },
    {
      label: "Total Posts",
      value: stats.totalPosts,
      icon: MessageSquare,
      iconBg: "bg-violet-100 dark:bg-violet-950/60",
      iconColor: "text-violet-600 dark:text-violet-400",
      valueCls: "text-violet-700 dark:text-violet-300",
    },
    {
      label: "Reactions",
      value: stats.totalLikes,
      icon: ThumbsUp,
      iconBg: "bg-pink-100 dark:bg-pink-950/60",
      iconColor: "text-pink-600 dark:text-pink-400",
      valueCls: "text-pink-700 dark:text-pink-300",
    },
    {
      label: "Poll Votes",
      value: stats.totalPollVotes,
      icon: BarChart3,
      iconBg: "bg-amber-100 dark:bg-amber-950/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueCls: "text-amber-700 dark:text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="border border-border">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}
            >
              <c.icon className={`h-5 w-5 ${c.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-2xl font-bold ${c.valueCls}`}>{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
