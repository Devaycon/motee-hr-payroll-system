"use client";

import {
  Building2,
  CalendarDays,
  Target,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { GAP_STATUS_LABELS, GAP_STATUS_STYLES } from "../data";
import type { HeadcountPlan } from "../types";

interface Props {
  plan: HeadcountPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function PlanDetailModal({ plan, open, onOpenChange }: Props) {
  if (!plan) return null;

  const fillRate =
    plan.target > 0
      ? Math.min(100, Math.round((plan.actual / plan.target) * 100))
      : 0;
  const gap = plan.actual - plan.target;

  const GapIcon = gap > 0 ? TrendingUp : gap < 0 ? TrendingDown : Minus;

  const gapColor =
    gap > 0
      ? "text-blue-600 dark:text-blue-400"
      : gap < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-5 pt-10 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-semibold leading-tight">
                {plan.department}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Headcount plan — {plan.period}
              </p>
            </div>
            <Badge
              className={cn(
                "shrink-0 text-[10px] font-medium border",
                GAP_STATUS_STYLES[plan.gapStatus],
              )}
            >
              {GAP_STATUS_LABELS[plan.gapStatus]}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground">Target</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {plan.target}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground">Actual</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {plan.actual}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground">Gap</p>
              <p className={cn("text-xl font-bold tabular-nums", gapColor)}>
                {gap > 0 ? `+${gap}` : gap === 0 ? "—" : gap}
              </p>
            </div>
          </div>

          <Separator />

          <DetailRow icon={Building2} label="Department">
            <span>{plan.department}</span>
          </DetailRow>

          <DetailRow icon={CalendarDays} label="Period">
            <span>{plan.period}</span>
          </DetailRow>

          <DetailRow icon={Target} label="Headcount Target">
            <span className="font-medium">{plan.target} employees</span>
          </DetailRow>

          <DetailRow icon={Users} label="Actual Headcount">
            <span className="font-medium">{plan.actual} employees</span>
          </DetailRow>

          <DetailRow icon={GapIcon} label="Variance">
            <span className={cn("font-medium", gapColor)}>
              {gap === 0
                ? "On target — no variance"
                : gap > 0
                  ? `+${gap} over target`
                  : `${Math.abs(gap)} below target`}
            </span>
          </DetailRow>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Fill Rate</p>
              <p className="text-xs font-semibold tabular-nums text-foreground">
                {fillRate}%
              </p>
            </div>
            <Progress value={fillRate} className="h-2" />
            <p className="text-[11px] text-muted-foreground">
              {fillRate < 100
                ? `${plan.target - plan.actual} position${plan.target - plan.actual !== 1 ? "s" : ""} remaining to reach target`
                : plan.actual > plan.target
                  ? `${plan.actual - plan.target} position${plan.actual - plan.target !== 1 ? "s" : ""} over target`
                  : "Target fully met"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
