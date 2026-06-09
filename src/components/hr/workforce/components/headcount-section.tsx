"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
// Reuse the canonical Headcount Planning building blocks so there is a single
// source of truth — Workforce Planning embeds them read-only.
import { useHeadcount } from "@/src/components/hr/headcount/hooks";
import { PlanTable } from "@/src/components/hr/headcount/components/plan-table";
import { AttritionRiskTable } from "@/src/components/hr/headcount/components/attrition-risk";
import { PLAN_PERIODS } from "@/src/components/hr/headcount/data";
import type { PlanPeriod } from "@/src/components/hr/headcount/types";

export function HeadcountSection() {
  const { data, loading } = useHeadcount();
  const plans = useMemo(() => data?.plans ?? [], [data]);
  const attritionRisks = data?.attritionRisks ?? [];
  const [activePeriod, setActivePeriod] = useState<PlanPeriod>("Q1 2026");

  const periodPlans = useMemo(
    () => plans.filter((p) => p.period === activePeriod),
    [plans, activePeriod],
  );

  const totalTarget = periodPlans.reduce((s, p) => s + p.target, 0);
  const totalActual = periodPlans.reduce((s, p) => s + p.actual, 0);
  const totalGap = totalTarget - totalActual;
  const underCount = periodPlans.filter((p) => p.gapStatus === "under").length;
  const onTargetCount = periodPlans.filter(
    (p) => p.gapStatus === "on_target",
  ).length;
  const overCount = periodPlans.filter((p) => p.gapStatus === "over").length;

  if (loading && plans.length === 0) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Target Headcount", value: totalTarget, color: "text-foreground" },
          { label: "Actual Headcount", value: totalActual, color: "text-foreground" },
          {
            label: "Total Gap",
            value:
              totalGap > 0
                ? `−${totalGap}`
                : totalGap < 0
                  ? `+${Math.abs(totalGap)}`
                  : "0",
            color:
              totalGap > 0
                ? "text-red-500"
                : totalGap < 0
                  ? "text-blue-500"
                  : "text-emerald-500",
          },
          {
            label: "Departments Under",
            value: underCount,
            color: underCount > 0 ? "text-red-500" : "text-emerald-500",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Card className="py-3 px-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">
                On Target ({onTargetCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">
                Under ({underCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">
                Over ({overCount})
              </span>
            </div>
          </div>
        </Card>
        <Select
          value={activePeriod}
          onValueChange={(v) => setActivePeriod(v as PlanPeriod)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_PERIODS.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PlanTable plans={periodPlans} readOnly />

      <div>
        <p className="mb-1 text-2xl font-semibold text-foreground">
          Attrition Risk Indicators
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Employees flagged based on tenure, promotion history, and performance
          trends
        </p>
        <AttritionRiskTable risks={attritionRisks} />
      </div>
    </div>
  );
}
