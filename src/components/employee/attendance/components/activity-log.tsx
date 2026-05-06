"use client";

import { LogIn, LogOut, Coffee } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { ActivityEvent } from "./types";

interface ActivityLogProps {
  activity: ActivityEvent[];
}

export function ActivityLog({ activity }: ActivityLogProps) {
  const iconMap = {
    clock_in: { icon: LogIn, color: "#1D9E75" },
    clock_out: { icon: LogOut, color: "#EF4444" },
    break_start: { icon: Coffee, color: "#F59E0B" },
    break_end: { icon: Coffee, color: "#7F77DD" },
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardContent className="p-4 flex flex-col gap-2 flex-1 overflow-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Activity Log
        </p>
        {activity.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-3 text-center">
            No activity recorded yet today.
          </p>
        ) : (
          <div className="flex flex-col">
            {activity.map((ev) => {
              const { icon: Icon, color } = iconMap[ev.type];
              return (
                <div
                  key={ev.time}
                  className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${color}18` }}
                  >
                    <Icon className="w-3 h-3" style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-foreground">
                      {ev.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {ev.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
