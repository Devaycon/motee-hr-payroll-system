"use client";

import { Users } from "lucide-react";
import { RadialChartCard } from "@/src/components/shared/charts/radial-chart";
import { GENDER_SPLIT_SERIES, GENDER_SPLIT_CONFIG } from "@/src/data/dashboard-demo";

export function GenderSplitCard() {
  return (
    <RadialChartCard
      title="Gender Split"
      icon={Users}
      series={GENDER_SPLIT_SERIES}
      config={GENDER_SPLIT_CONFIG}
      centerLabel="Employees"
    />
  );
}
