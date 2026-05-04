"use client";

import {
  Clock,
  CalendarDays,
  AlertCircle,
  CheckSquare,
  Timer,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { DAY_AT_A_GLANCE } from "@/src/data/employee-dashboard-demo";

export function DayAtAGlance() {
  const d = DAY_AT_A_GLANCE;

  const stats = [
    {
      icon: Clock,
      label: "Clock Status",
      value: d.clockedIn ? d.clockInTime! : "—",
      sub: d.clockedIn ? "Clocked in today" : "Not clocked in yet",
      badge: d.clockedIn
        ? {
            label: "Active",
            className: "border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]",
          }
        : {
            label: "Absent",
            className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
          },
    },
    {
      icon: Timer,
      label: "Hours Today",
      value: d.clockedIn ? d.hoursWorked : "—",
      sub: "time worked so far",
      badge: null,
    },
    {
      icon: CalendarDays,
      label: "Leave Today",
      value: d.leaveToday ?? "None",
      sub: d.leaveToday ? "on approved leave" : "no leave scheduled",
      badge: d.leaveToday
        ? {
            label: "On Leave",
            className: "border-blue-500/30 bg-blue-500/10 text-blue-600",
          }
        : null,
    },
    {
      icon: AlertCircle,
      label: "Pending Actions",
      value: String(d.pendingActions),
      sub: `item${d.pendingActions !== 1 ? "s" : ""} need attention`,
      badge:
        d.pendingActions > 0
          ? {
              label: "Action needed",
              className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
            }
          : null,
    },
    {
      icon: CheckSquare,
      label: "Tasks Due Today",
      value: String(d.tasksDueToday),
      sub: `task${d.tasksDueToday !== 1 ? "s" : ""} due today`,
      badge: null,
    },
  ];

  return (
    <div className="col-span-3 grid grid-cols-6 gap-4">
      {stats.map((s, i) => (
        <Card
          key={s.label}
          className={cn(
            "transition-shadow hover:shadow-md",
            i < 2 ? "col-span-3" : "col-span-2",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#7F77DD]/10">
                <s.icon className="w-3.5 h-3.5 text-[#7F77DD]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {s.label}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
              {s.badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5 font-medium",
                    s.badge.className,
                  )}
                >
                  {s.badge.label}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
