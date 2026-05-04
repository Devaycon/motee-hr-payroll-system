"use client";

import { ShieldCheck, Users, Lock, Layers } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { computeAccessLevelStats } from "../data";
import type { AccessLevel } from "../types";

interface StatCardsProps {
  levels: AccessLevel[];
}

export function StatCards({ levels }: StatCardsProps) {
  const { totalRoles, customRoles, totalUsers, modulesProtected } =
    computeAccessLevelStats(levels);

  const cards = [
    {
      label: "Total Roles",
      value: totalRoles,
      icon: ShieldCheck,
      iconBg: "bg-indigo-100 dark:bg-indigo-950/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      sub: `${levels.filter((l) => l.kind === "default").length} default`,
    },
    {
      label: "Custom Roles",
      value: customRoles,
      icon: Layers,
      iconBg: "bg-violet-100 dark:bg-violet-950/60",
      iconColor: "text-violet-600 dark:text-violet-400",
      sub: "User-defined",
    },
    {
      label: "Active Users",
      value: totalUsers,
      icon: Users,
      iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sub: "Across all roles",
    },
    {
      label: "Modules Protected",
      value: modulesProtected,
      icon: Lock,
      iconBg: "bg-amber-100 dark:bg-amber-950/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      sub: "Permission-gated",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {card.sub}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
