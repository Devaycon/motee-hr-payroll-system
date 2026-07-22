"use client";

import { CalendarDays, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { LEAVE_TYPE_LABELS, LEAVE_POLICIES } from "@/src/data/leave-demo";
import type { BalanceEntry } from "./data";
import { TYPE_COLORS, daysRemaining, daysAvailable } from "./data";

interface EntitlementCardProps {
  balance: BalanceEntry;
  expanded: boolean;
  onToggleExpand: () => void;
  onViewPolicy: (policy: (typeof LEAVE_POLICIES)[0]) => void;
}

export function EntitlementCard({
  balance: b,
  expanded,
  onToggleExpand,
  onViewPolicy,
}: EntitlementCardProps) {
  const rem = daysRemaining(b);
  const avail = daysAvailable(b);
  const usedPct = (b.daysUsed / b.totalEntitlement) * 100;
  const pendPct = (b.daysPending / b.totalEntitlement) * 100;
  const colors = TYPE_COLORS[b.type];
  const policy = LEAVE_POLICIES.find((p) => p.leaveType === b.type);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: colors.bg }}
            >
              <CalendarDays
                className="w-3.5 h-3.5"
                style={{ color: colors.bar }}
              />
            </div>
            <div>
              {policy?.description ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs font-semibold text-foreground underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 cursor-help">
                        {LEAVE_TYPE_LABELS[b.type]}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-56 text-xs">
                      {policy.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="text-xs font-semibold text-foreground">
                  {LEAVE_TYPE_LABELS[b.type]}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {b.totalEntitlement} days/yr
                {b.carryOver ? ` · ${b.carryOver} days carried over` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">
                {avail}{" "}
                <span className="font-normal text-muted-foreground text-[10px]">
                  available
                </span>
              </p>
              {b.daysPending > 0 && (
                <p className="text-[10px] text-amber-600">
                  {b.daysPending} booked
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {policy && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onViewPolicy(policy)}
                >
                  <Info className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onToggleExpand}
              >
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full rounded-l-full transition-all"
              style={{ width: `${usedPct}%`, background: colors.bar }}
            />
            {pendPct > 0 && (
              <div
                className="h-full transition-all"
                style={{ width: `${pendPct}%`, background: `${colors.bar}70` }}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {b.daysUsed} used
              {b.daysPending > 0 ? ` · ${b.daysPending} pending` : ""}
            </span>
            <span>
              {rem} of {b.totalEntitlement} remaining
            </span>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-border/50 pt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Entitlement", value: `${b.totalEntitlement} days` },
              { label: "Used", value: `${b.daysUsed} days` },
              { label: "Remaining", value: `${rem} days` },
              { label: "Booked", value: `${b.daysPending} days` },
              { label: "Available", value: `${avail} days` },
              ...(b.carryOver
                ? [{ label: "Carried Over", value: `${b.carryOver} days` }]
                : []),
            ].map((r) => (
              <div key={r.label} className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted-foreground">{r.label}</p>
                <p className="text-xs font-semibold text-foreground">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
