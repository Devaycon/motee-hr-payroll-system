"use client";

import { Clock, Users, CalendarCheck2, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { LeaveRequest } from "../types";

interface StatCardsProps {
  requests: LeaveRequest[];
}

export function StatCards({ requests }: StatCardsProps) {
  const today = new Date().toISOString().slice(0, 10);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const currentlyOnLeave = requests.filter(
    (r) =>
      r.status === "approved" && r.startDate <= today && r.endDate >= today,
  ).length;

  const thisMonth = today.slice(0, 7);
  const approvedThisMonth = requests.filter(
    (r) =>
      r.status === "approved" &&
      (r.approvedAt?.slice(0, 7) === thisMonth ||
        r.submittedAt.slice(0, 7) === thisMonth),
  ).length;

  const totalDaysUsed = requests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + r.totalDays, 0);

  const cards = [
    {
      label: "Pending Requests",
      value: pendingCount,
      sub: "Awaiting HR approval",
      icon: Clock,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      label: "Currently on Leave",
      value: currentlyOnLeave,
      sub: "Employees absent today",
      icon: Users,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
    },
    {
      label: "Approved This Month",
      value: approvedThisMonth,
      sub: `Requests approved in ${new Date().toLocaleString("en-GB", { month: "long" })}`,
      icon: CalendarCheck2,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      label: "Total Days Approved",
      value: totalDaysUsed,
      sub: "Across all leave types this year",
      icon: BarChart3,
      iconClass: "text-violet-500",
      bgClass: "bg-violet-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {card.label}
                </p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {card.sub}
                </p>
              </div>
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${card.bgClass}`}
              >
                <card.icon className={`w-4 h-4 ${card.iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
