"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { SYSTEM_HEALTH } from "@/src/data/motee-demo";

const STATUS_STYLES = {
  operational: {
    dot: "bg-[#4ED251]",
    badge: "bg-[#4ED251]/10 text-[#4ED251] border-[#4ED251]/30",
    label: "Operational",
  },
  degraded: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    label: "Degraded",
  },
  down: {
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 border-red-500/30",
    label: "Down",
  },
};

export function SystemHealthCard() {
  const allOperational = SYSTEM_HEALTH.every((h) => h.status === "operational");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
        </div>
        <Link
          href="/platform/health"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View details →
        </Link>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex flex-col gap-2.5">
        {!allOperational && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Some services are experiencing issues
          </div>
        )}
        {allOperational && (
          <div className="rounded-md bg-[#4ED251]/10 border border-[#4ED251]/20 px-3 py-1.5 text-xs text-[#4ED251] font-medium">
            All systems operational
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          {SYSTEM_HEALTH.map((item) => {
            const style = STATUS_STYLES[item.status];
            return (
              <div
                key={item.label}
                className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("w-2 h-2 rounded-full shrink-0", style.dot)}
                  />
                  <span className="text-xs text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {item.uptime}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                      style.badge,
                    )}
                  >
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
