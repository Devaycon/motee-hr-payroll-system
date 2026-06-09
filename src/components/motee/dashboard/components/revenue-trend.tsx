"use client";

import { TrendingUp } from "lucide-react";
import { LineChart } from "@/src/components/shared/charts";
import { REVENUE_TREND_DATA } from "@/src/data/motee-demo";

export function RevenueTrendCard() {
  return (
    <LineChart
      title="Monthly Recurring Revenue"
      description="May 2025 – Apr 2026"
      icon={TrendingUp}
      footer="MRR trend over 12 months"
      money
      categories={REVENUE_TREND_DATA.map((d) => d.month)}
      series={[
        {
          name: "Revenue",
          data: REVENUE_TREND_DATA.map((d) => d.revenue),
          color: "#ff8b2d",
        },
      ]}
    />
  );
}
