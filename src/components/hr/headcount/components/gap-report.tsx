"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import { GAP_STATUS_LABELS, GAP_STATUS_STYLES } from "../data";
import type { HeadcountPlan, GapStatus } from "../types";

interface GapReportProps {
  plans: HeadcountPlan[];
}

export function GapReport({ plans }: GapReportProps) {
  const under = plans.filter((p) => p.gapStatus === "under");
  const over = plans.filter((p) => p.gapStatus === "over");
  const onTarget = plans.filter((p) => p.gapStatus === "on_target");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GapGroup
        plans={under}
        emptyText="No departments under target"
        statusKey="under"
      />
      <GapGroup
        plans={onTarget}
        emptyText="No departments on target"
        statusKey="on_target"
      />
      <GapGroup
        plans={over}
        emptyText="No departments over target"
        statusKey="over"
      />
    </div>
  );
}

interface GapGroupProps {
  plans: HeadcountPlan[];
  emptyText: string;
  statusKey: GapStatus;
}

function GapGroup({ plans, emptyText, statusKey }: GapGroupProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              GAP_STATUS_STYLES[statusKey],
            )}
          >
            {GAP_STATUS_LABELS[statusKey]}
          </span>
          <span className="text-xs text-muted-foreground">
            {plans.length} dept{plans.length !== 1 ? "s" : ""}
          </span>
        </div>

        {plans.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {emptyText}
          </p>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const gap = plan.actual - plan.target;
              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground leading-none">
                      {plan.department}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.actual} / {plan.target} headcount
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      gap > 0 && "text-blue-600 dark:text-blue-400",
                      gap < 0 && "text-red-600 dark:text-red-400",
                      gap === 0 && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {gap > 0 ? `+${gap}` : gap === 0 ? "✓" : gap}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
