import {
  Users,
  Briefcase,
  TrendingDown,
  Clock,
  AlertTriangle,
  Timer,
} from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { HiringMetric } from "../types";
import type { AttritionRisk } from "@/src/components/hr/headcount/types";

interface OverviewCardsProps {
  totalHeadcount: number;
  hiringMetrics: HiringMetric[];
  currentTurnoverRate: number;
  attritionRisks: AttritionRisk[];
  avgTenureYears: number;
  /** The analytics section currently open. */
  activeTab: string;
  /** Drill-down: opens the section that breaks this number down. */
  onTabChange: (tab: string) => void;
}

export function OverviewCards({
  totalHeadcount,
  hiringMetrics,
  currentTurnoverRate,
  attritionRisks,
  avgTenureYears,
  activeTab,
  onTabChange,
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

  // Every card is a roll-up of one analytics section, so each opens the
  // section that breaks its number down.
  const card = (tab: string) => ({
    active: activeTab === tab,
    onClick: () => onTabChange(tab),
  });

  const headline: HrStatCardItem[] = [
    {
      label: "Total Workforce",
      value: totalHeadcount,
      sub: "Active employees",
      icon: Users,
      tone: "violet",
      ...card("headcount"),
    },
    {
      label: "Open Positions",
      value: openPositions,
      sub: "Active requisitions",
      icon: Briefcase,
      tone: "blue",
      ...card("hiring"),
    },
  ];

  const secondary: HrStatCardItem[] = [
    {
      label: "Turnover Rate",
      value: `${currentTurnoverRate}%`,
      sub: "Current quarter",
      icon: TrendingDown,
      tone: currentTurnoverRate > 10 ? "red" : "emerald",
      ...card("turnover"),
    },
    {
      label: "Avg Days to Fill",
      value: `${avgDaysToFill}d`,
      sub: "Across all departments",
      icon: Clock,
      tone: "amber",
      ...card("hiring"),
    },
    {
      label: "High Attrition Risk",
      value: highRisk,
      sub: "Employees flagged",
      icon: AlertTriangle,
      tone: highRisk > 0 ? "red" : "emerald",
      ...card("turnover"),
    },
    {
      label: "Avg Tenure",
      value: `${avgTenureYears}y`,
      sub: "Company-wide",
      icon: Timer,
      tone: "violet",
      ...card("demographics"),
    },
  ];

  return (
    <div className="space-y-4">
      <HrStatCardsGrid stats={headline} columns={2} />
      <HrStatCardsGrid stats={secondary} columns={4} />
    </div>
  );
}
