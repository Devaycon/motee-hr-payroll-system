"use client";

import { FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";

interface ContractStatsProps {
  total: number;
  active: number;
  expiring: number;
  pending: number;
}

export function ContractStats({
  total,
  active,
  expiring,
  pending,
}: ContractStatsProps) {
  const cards = [
    {
      label: "Total Contracts",
      value: total,
      sub: "All agreements",
      icon: FileText,
      iconClass: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-500/10",
    },
    {
      label: "Active",
      value: active,
      sub: "Currently in effect",
      icon: CheckCircle2,
      iconClass: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Expiring Soon",
      value: expiring,
      sub: "Needs attention",
      icon: AlertTriangle,
      iconClass: "text-orange-500",
      iconBg: "bg-orange-500/10",
    },
    {
      label: "Pending Signature",
      value: pending,
      sub: "Awaiting sign-off",
      icon: Clock,
      iconClass: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${card.iconBg}`}
              >
                <card.icon className={`size-4 ${card.iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
