"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Progress } from "@/src/components/ui/progress";
import {
  HEADCOUNT_PLANS,
  PLAN_PERIODS,
  GAP_STATUS_LABELS,
  GAP_STATUS_STYLES,
  ATTRITION_RISKS,
  RISK_LABELS,
  RISK_STYLES,
} from "@/src/components/hr/headcount/data";
import type {
  PlanPeriod,
  HeadcountPlan,
  AttritionRisk,
} from "@/src/components/hr/headcount/types";
import {
  HeadcountPlanDetailModal,
  AttritionRiskDetailModal,
} from "./detail-modals";

export function HeadcountSection() {
  const [activePeriod, setActivePeriod] = useState<PlanPeriod>("Q1 2026");
  const [selectedPlan, setSelectedPlan] = useState<HeadcountPlan | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<AttritionRisk | null>(null);

  const periodPlans = useMemo(
    () => HEADCOUNT_PLANS.filter((p) => p.period === activePeriod),
    [activePeriod],
  );

  const totalTarget = periodPlans.reduce((s, p) => s + p.target, 0);
  const totalActual = periodPlans.reduce((s, p) => s + p.actual, 0);
  const totalGap = totalTarget - totalActual;
  const underCount = periodPlans.filter((p) => p.gapStatus === "under").length;
  const onTargetCount = periodPlans.filter(
    (p) => p.gapStatus === "on_target",
  ).length;
  const overCount = periodPlans.filter((p) => p.gapStatus === "over").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Target Headcount",
            value: totalTarget,
            color: "text-foreground",
          },
          {
            label: "Actual Headcount",
            value: totalActual,
            color: "text-foreground",
          },
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

      <Card className="border-border/60">
        <CardContent className="p-0">
          {periodPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <BarChart3 className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No headcount plans for {activePeriod}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Actual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground min-w-40">
                      Fill Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Gap
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {periodPlans.map((plan) => {
                    const fillPct =
                      plan.target > 0
                        ? Math.min(
                            Math.round((plan.actual / plan.target) * 100),
                            100,
                          )
                        : 0;
                    const gap = plan.target - plan.actual;
                    return (
                      <tr
                        key={plan.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {plan.department}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {plan.target}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {plan.actual}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={fillPct}
                              className="h-1.5 flex-1"
                            />
                            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                              {fillPct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {gap > 0 ? (
                              <TrendingDown className="size-3.5 text-red-500" />
                            ) : gap < 0 ? (
                              <TrendingUp className="size-3.5 text-blue-500" />
                            ) : (
                              <Minus className="size-3.5 text-emerald-500" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                gap > 0
                                  ? "text-red-600 dark:text-red-400"
                                  : gap < 0
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {gap > 0
                                ? `−${gap}`
                                : gap < 0
                                  ? `+${Math.abs(gap)}`
                                  : "0"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${GAP_STATUS_STYLES[plan.gapStatus]}`}
                          >
                            {GAP_STATUS_LABELS[plan.gapStatus]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedPlan(plan)}
                              >
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <p className="mb-3 text-2xl font-semibold text-foreground">
          Attrition Risk Indicators
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Employees flagged based on tenure, promotion history, and performance
          trends
        </p>
        <div className="space-y-2">
          {ATTRITION_RISKS.map((risk) => (
            <Card key={risk.id} className="border-border/60">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {risk.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{risk.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {risk.jobTitle} · {risk.department}
                    </p>
                  </div>
                </div>
                <div className="hidden flex-1 flex-wrap gap-1.5 sm:flex">
                  {risk.riskFactors.map((f) => (
                    <span
                      key={f}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">
                    {risk.tenureYears}y tenure
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-xs ${RISK_STYLES[risk.riskLevel]}`}
                  >
                    {RISK_LABELS[risk.riskLevel]} Risk
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedRisk(risk)}>
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <HeadcountPlanDetailModal
        plan={selectedPlan}
        open={selectedPlan !== null}
        onClose={() => setSelectedPlan(null)}
      />
      <AttritionRiskDetailModal
        risk={selectedRisk}
        open={selectedRisk !== null}
        onClose={() => setSelectedRisk(null)}
      />
    </div>
  );
}
