"use client";

import { TrendingUp } from "lucide-react";
import { LineChartCard } from "@/src/components/shared/charts/line-chart";
import {
  REVENUE_TREND_DATA,
  REVENUE_TREND_CONFIG,
} from "@/src/data/motee-demo";

export function RevenueTrendCard() {
  return (
    <LineChartCard
      title="Monthly Recurring Revenue"
      description="May 2025 – Apr 2026"
      icon={TrendingUp}
      data={REVENUE_TREND_DATA}
      config={REVENUE_TREND_CONFIG}
      series={[{ key: "revenue", color: "#ff8b2d", showLabels: false }]}
      xAxisKey="month"
      footerSub="MRR trend over 12 months"
    />
  );
}
