"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { LifeBuoy, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface Props {
  total: number;
  open: number;
  resolved: number;
  overdue: number;
}

export function HelpdeskStatCards({ total, open, resolved, overdue }: Props) {
  const cards = [
    {
      label: "Total Cases",
      value: total,
      icon: LifeBuoy,
      color: "text-[#4361ee]",
      bg: "bg-[#4361ee]/10",
    },
    {
      label: "Open / In Progress",
      value: open,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
