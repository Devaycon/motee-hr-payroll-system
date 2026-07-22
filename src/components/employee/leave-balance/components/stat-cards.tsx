"use client";

import { CalendarDays, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { MY_BALANCES, MY_HISTORY, daysRemaining } from "./data";

export function LeaveStatCards() {
  const pendingCount = MY_HISTORY.filter((h) => h.status === "pending").length;

  const stats = [
    {
      label: "Annual Leave Remaining",
      value: `${daysRemaining(MY_BALANCES[0])} days`,
      icon: CalendarDays,
      color: "#2563EB",
    },
    {
      label: "Sick Leave Remaining",
      value: `${daysRemaining(MY_BALANCES[1])} days`,
      icon: TrendingUp,
      color: "#EF4444",
    },
    {
      label: "Pending Requests",
      value: pendingCount,
      icon: Clock,
      color: "#F59E0B",
    },
    {
      label: "Total Leave Taken",
      value: `${MY_HISTORY.filter((h) => h.status === "approved").reduce((s, h) => s + h.totalDays, 0)} days`,
      icon: CheckCircle2,
      color: "#1D9E75",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${s.color}18` }}
            >
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground leading-none">
                {s.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {s.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
