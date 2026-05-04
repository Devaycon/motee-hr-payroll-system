"use client";

import { TrendingUp } from "lucide-react";
import { LineChartCard } from "@/src/components/shared/charts/line-chart";
import { HEADCOUNT_DATA, HEADCOUNT_CONFIG } from "@/src/data/dashboard-demo";

export function HeadcountTrendCard() {
  return (
    <LineChartCard
      title="Headcount Trend"
      description="Jan – Oct 2025"
      icon={TrendingUp}
      data={HEADCOUNT_DATA}
      config={HEADCOUNT_CONFIG}
      series={[{ key: "headcount", color: "#4ED251", showLabels: true }]}
      xAxisKey="month"
      footerSub="Monthly employee headcount"
    />
  );
}
