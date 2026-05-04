"use client";

import { Megaphone, Bell, CalendarClock, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Announcement } from "../types";

interface StatCardsProps {
  announcements: Announcement[];
}

export function StatCards({ announcements }: StatCardsProps) {
  const active = announcements.filter((a) => !a.isArchived);

  const publishedCount = active.filter((a) => a.status === "published").length;

  const needsAckCount = active.filter(
    (a) => a.status === "published" && a.requiresAcknowledgement,
  ).length;

  const scheduledCount = active.filter((a) => a.status === "scheduled").length;

  const draftCount = active.filter((a) => a.status === "draft").length;

  const cards = [
    {
      label: "Published",
      value: publishedCount,
      sub: "Live announcements",
      icon: Megaphone,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      label: "Needs Acknowledgement",
      value: needsAckCount,
      sub: "Require employee sign-off",
      icon: Bell,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      label: "Upcoming",
      value: scheduledCount,
      sub: "Scheduled to publish",
      icon: CalendarClock,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    },
    {
      label: "Drafts",
      value: draftCount,
      sub: "Not yet published",
      icon: FileEdit,
      iconClass: "text-slate-500",
      bgClass: "bg-slate-500/10",
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
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
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
