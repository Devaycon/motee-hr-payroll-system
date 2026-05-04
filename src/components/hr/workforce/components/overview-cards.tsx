import {
  Users,
  Briefcase,
  TrendingDown,
  Clock,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { HiringMetric } from "../types";
import type { AttritionRisk } from "@/src/components/hr/headcount/types";

interface OverviewCardsProps {
  totalHeadcount: number;
  hiringMetrics: HiringMetric[];
  currentTurnoverRate: number;
  attritionRisks: AttritionRisk[];
  avgTenureYears: number;
}

export function OverviewCards({
  totalHeadcount,
  hiringMetrics,
  currentTurnoverRate,
  attritionRisks,
  avgTenureYears,
}: OverviewCardsProps) {
  const openPositions = hiringMetrics.reduce(
    (s, m) => s + m.openRequisitions,
    0,
  );
  const avgDaysToFill =
    hiringMetrics.length > 0
      ? Math.round(
          hiringMetrics.reduce((s, m) => s + m.avgDaysToFill, 0) /
            hiringMetrics.length,
        )
      : 0;
  const highRisk = attritionRisks.filter((r) => r.riskLevel === "high").length;

  const cards = [
    {
      label: "Total Workforce",
      value: totalHeadcount,
      sub: "Active employees",
      icon: Users,
      iconClass: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-500/10",
    },
    {
      label: "Open Positions",
      value: openPositions,
      sub: "Active requisitions",
      icon: Briefcase,
      iconClass: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Turnover Rate",
      value: `${currentTurnoverRate}%`,
      sub: "Current quarter",
      icon: TrendingDown,
      iconClass:
        currentTurnoverRate > 10
          ? "text-red-500 dark:text-red-400"
          : "text-emerald-500 dark:text-emerald-400",
      iconBg: currentTurnoverRate > 10 ? "bg-red-500/10" : "bg-emerald-500/10",
    },
    {
      label: "Avg Days to Fill",
      value: `${avgDaysToFill}d`,
      sub: "Across all departments",
      icon: Clock,
      iconClass: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      label: "High Attrition Risk",
      value: highRisk,
      sub: "Employees flagged",
      icon: AlertTriangle,
      iconClass:
        highRisk > 0
          ? "text-red-500 dark:text-red-400"
          : "text-emerald-500 dark:text-emerald-400",
      iconBg: highRisk > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
    },
    {
      label: "Avg Tenure",
      value: `${avgTenureYears}y`,
      sub: "Company-wide",
      icon: Timer,
      iconClass: "text-violet-500 dark:text-violet-400",
      iconBg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {cards.slice(0, 2).map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-2.5 ${card.iconBg}`}>
                  <card.icon className={`size-5 ${card.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.slice(2).map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-2.5 ${card.iconBg}`}>
                  <card.icon className={`size-5 ${card.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
