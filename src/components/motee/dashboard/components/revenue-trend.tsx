"use client";

import { TrendingUp } from "lucide-react";
import { ChartCard, ChartPlaceholder } from "@/src/components/shared/charts";

export function RevenueTrendCard() {
  return (
    <ChartCard
      title="Monthly Recurring Revenue"
      description="May 2025 – Apr 2026"
      icon={TrendingUp}
      footer="MRR trend over 12 months"
    >
      <ChartPlaceholder />
    </ChartCard>
  );
}
