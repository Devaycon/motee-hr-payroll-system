"use client";

import { CheckCircle2, Coffee, TrendingUp, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import type { BreakComplianceResult } from "@/src/lib/types/attendance";
import { hoursToHHMM } from "@/src/lib/utils/format-duration";

interface ComplianceStripProps {
  breaks: BreakComplianceResult;
  overtimeToday: number;
  weekOvertime: number;
  /** Nothing to judge until the day has actually started. */
  active: boolean;
}

/**
 * Break and overtime standing for today.
 *
 * This is deliberately advisory rather than blocking — an employee who has not
 * taken their break needs to know before the day ends, but the system has no
 * business refusing to let them clock out over it.
 */
export function ComplianceStrip({
  breaks,
  overtimeToday,
  weekOvertime,
  active,
}: ComplianceStripProps) {
  const items = [
    {
      key: "break",
      icon: breaks.compliant ? CheckCircle2 : Coffee,
      label: "Break entitlement",
      value: breaks.requiredMinutes
        ? `${breaks.takenMinutes} / ${breaks.requiredMinutes} min`
        : "None required",
      note: !breaks.requiredMinutes
        ? "No unpaid break in your pattern"
        : breaks.compliant
          ? "Entitlement taken"
          : `${breaks.shortfallMinutes} min still to take`,
      tone: !breaks.requiredMinutes || breaks.compliant ? "ok" : "warn",
    },
    {
      key: "ot-today",
      icon: TrendingUp,
      label: "Overtime today",
      value: overtimeToday > 0 ? hoursToHHMM(overtimeToday) : "None",
      note:
        overtimeToday > 0
          ? "Beyond your scheduled day"
          : "Within scheduled hours",
      tone: overtimeToday > 0 ? "warn" : "ok",
    },
    {
      key: "ot-week",
      icon: TrendingUp,
      label: "Overtime this week",
      value: weekOvertime > 0 ? hoursToHHMM(weekOvertime) : "None",
      note:
        weekOvertime > 0 ? "Beyond contracted hours" : "Within contracted hours",
      tone: weekOvertime > 0 ? "warn" : "ok",
    },
  ] as const;

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Working time
        </p>
        {!active ? (
          <p className="text-[11px] text-muted-foreground py-3 text-center">
            Clock in to start tracking today&apos;s working time.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <div key={item.key} className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    item.tone === "ok"
                      ? "bg-[#1D9E75]/10"
                      : "bg-amber-500/10",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-3 h-3",
                      item.tone === "ok" ? "text-[#1D9E75]" : "text-amber-600",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-foreground">
                      {item.label}
                    </p>
                    <span className="text-xs font-semibold text-foreground tabular-nums shrink-0">
                      {item.value}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {item.note}
                  </p>
                </div>
              </div>
            ))}
            {!breaks.compliant && breaks.requiredMinutes > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
                You still owe yourself {breaks.shortfallMinutes} minutes of
                break today.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
