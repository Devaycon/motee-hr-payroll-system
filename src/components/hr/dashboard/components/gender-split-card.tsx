"use client";

import { Users } from "lucide-react";
import { DonutChart } from "@/src/components/shared/charts";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useGenderSplit } from "../hooks";

export function GenderSplitCard() {
  const { data, loading } = useGenderSplit();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <DonutChart
      title="Gender Split"
      description="Workforce gender breakdown"
      icon={Users}
      centerLabel="Employees"
      viewMoreHref="/operations/reports/employees"
      labels={data.series.map((s) => s.label)}
      values={data.series.map((s) => s.value)}
      colors={data.series.map((s) => s.color)}
      details={data.series.map((s) => ({
        label: s.label,
        value: s.value,
        color: s.color,
        pct: true,
      }))}
    />
  );
}
