"use client";

import { UserCheck, UserX, Clock, FileText } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { AttendanceRecord, TimesheetRecord } from "../types";

interface StatCardsProps {
  records: AttendanceRecord[];
  timesheets: TimesheetRecord[];
}

export function StatCards({ records, timesheets }: StatCardsProps) {
  const presentCount = records.filter((r) =>
    ["present", "late", "early_departure"].includes(r.status),
  ).length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const pendingApprovals = timesheets.filter(
    (t) => t.status === "submitted",
  ).length;

  const total = records.length;
  const attendanceRate =
    total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const cards = [
    {
      label: "Present Today",
      value: presentCount,
      sub: `${attendanceRate}% attendance rate`,
      icon: UserCheck,
      iconClass: "text-emerald-500",
      bgClass: "bg-emerald-500/10",
    },
    {
      label: "Absent Today",
      value: absentCount,
      sub: `Out of ${total} tracked employees`,
      icon: UserX,
      iconClass: "text-red-500",
      bgClass: "bg-red-500/10",
    },
    {
      label: "Late Arrivals",
      value: lateCount,
      sub: "Clocked in after schedule today",
      icon: Clock,
      iconClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      sub: "Timesheets awaiting review",
      icon: FileText,
      iconClass: "text-blue-500",
      bgClass: "bg-blue-500/10",
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
                <card.icon className={`w-4.5 h-4.5 ${card.iconClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
