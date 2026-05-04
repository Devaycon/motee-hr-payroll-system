"use client";

import { BookOpen, CheckCircle2, Eye, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { computeKbStats } from "../data";
import type { KnowledgeArticle } from "../types";

interface StatCardsProps {
  articles: KnowledgeArticle[];
}

export function StatCards({ articles }: StatCardsProps) {
  const stats = computeKbStats(articles);

  const cards = [
    {
      label: "Total Articles",
      value: stats.total,
      icon: BookOpen,
      iconBg: "bg-indigo-100 dark:bg-indigo-950/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      valueCls: "text-indigo-700 dark:text-indigo-300",
    },
    {
      label: "Published",
      value: stats.published,
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueCls: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Drafts",
      value: stats.drafts,
      icon: FileEdit,
      iconBg: "bg-amber-100 dark:bg-amber-950/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      valueCls: "text-amber-700 dark:text-amber-300",
    },
    {
      label: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      iconBg: "bg-blue-100 dark:bg-blue-950/60",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueCls: "text-blue-700 dark:text-blue-300",
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
