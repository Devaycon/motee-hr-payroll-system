"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import { DonutChart } from "@/src/components/shared/charts";
import { useEmploymentTypeBreakdown } from "../hooks";

export function SatisfactionCard() {
  const { data, loading } = useEmploymentTypeBreakdown();

  if (loading || !data) {
    return <Skeleton className="col-span-2 h-80 w-full rounded-xl" />;
  }

  const items = data.data;
  return (
    <DonutChart
      title="Employment Type"
      description="Workforce by contract type"
      className="col-span-2"
      height={300}
      centerLabel="Employees"
      viewMoreHref="/operations/reports/employees"
      labels={items.map((d) => d.label)}
      values={items.map((d) => d.value)}
      colors={items.map((d) => d.fill)}
      details={items.map((d) => ({
        label: d.label,
        value: d.value,
        color: d.fill,
        pct: true,
      }))}
    />
  );
}
