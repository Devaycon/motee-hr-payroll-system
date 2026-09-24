"use client";

import { Laptop, Wallet, UserCheck, ShieldOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import {
  CLEARANCE_BOTTLENECK_CATEGORIES,
  CLEARANCE_CATEGORY_LABELS,
  hasPendingClearance,
  type ClearanceBottleneckCategory,
} from "@/src/lib/offboarding/clearance";
import type { OffboardingRecord } from "../types";
import {
  clearanceStageFilter,
  type OffboardingCardFilter,
} from "./stat-cards";

const STAGE_ICONS: Record<ClearanceBottleneckCategory, LucideIcon> = {
  it_assets: Laptop,
  finance: Wallet,
  manager: UserCheck,
  access: ShieldOff,
};

interface ClearanceBreakdownProps {
  records: OffboardingRecord[];
  cardFilter: OffboardingCardFilter;
  onDrillDown: (tab: string, filter: OffboardingCardFilter) => void;
}

/**
 * Splits "Clearance Pending" by the team that has to act (Offboarding §1), so
 * HR can see the bottleneck at a glance instead of a single total. Each stage
 * drills into the leavers stuck on it.
 */
export function ClearanceBreakdown({
  records,
  cardFilter,
  onDrillDown,
}: ClearanceBreakdownProps) {
  const stages = CLEARANCE_BOTTLENECK_CATEGORIES.map((category) => ({
    category,
    count: records.filter((r) => hasPendingClearance(r, category)).length,
  }));
  const max = Math.max(0, ...stages.map((s) => s.count));

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
        <p className="text-xs font-medium text-muted-foreground">
          Clearance pending by stage
        </p>
        <p className="text-[11px] text-muted-foreground">
          Leavers waiting on each team
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3">
        {stages.map(({ category, count }) => {
          const Icon = STAGE_ICONS[category];
          const filter = clearanceStageFilter(category);
          const active = cardFilter === filter;
          const bottleneck = count > 0 && count === max;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => onDrillDown("all", filter)}
              className={cn(
                "flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "ring-2 ring-primary border-primary",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {CLEARANCE_CATEGORY_LABELS[category]}
                </span>
                {bottleneck && (
                  <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                    Bottleneck
                  </span>
                )}
              </div>
              <span className="text-xl font-semibold tabular-nums text-foreground leading-none">
                {count}
              </span>
              <span className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    bottleneck ? "bg-red-500" : "bg-amber-500",
                  )}
                  style={{ width: max ? `${(count / max) * 100}%` : "0%" }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
