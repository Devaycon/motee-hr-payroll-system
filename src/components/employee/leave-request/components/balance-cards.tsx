"use client";

import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { LEAVE_TYPE_LABELS } from "@/src/data/leave-demo";
import type { LeaveTypeName } from "@/src/lib/types/leave";
import { LEAVE_TYPE_COLORS } from "./leave-colors";
import type { LeaveBalance } from "./types";

interface BalanceCardsProps {
  balances: LeaveBalance;
}

export function BalanceCards({ balances }: BalanceCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {(["annual", "sick", "compassionate", "study"] as LeaveTypeName[]).map(
        (t) => {
          const b = balances[t];
          const rem = b.total - b.used - b.pending;
          const c = LEAVE_TYPE_COLORS[t];
          return (
            <Card key={t} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: c.bg }}
                >
                  <CalendarDays className="w-4 h-4" style={{ color: c.bar }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground leading-none">
                    {rem}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      / {b.total} days
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {LEAVE_TYPE_LABELS[t]} Remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        },
      )}
    </div>
  );
}
