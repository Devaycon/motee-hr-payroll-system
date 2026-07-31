"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import { DonutChart } from "@/src/components/shared/charts";
import { useEmploymentTypeBreakdown } from "../hooks";

export function SatisfactionCard() {
  const { data, loading } = useEmploymentTypeBreakdown();

  if (loading || !data) {
    return <Skeleton className="col-span-2 h-72 w-full rounded-xl" />;
  }

  // Summary only — the slice labels and Apex legend already name every type.
  // The full breakdown lives on /operations/reports/employees.
  const items = data.data;
  return (
    <DonutChart
      title="Employment Type Distribution"
      description="Employee distribution by employment type"
      className="col-span-2"
      height={260}
      centerLabel="Total Employees"
      viewMoreHref="/operations/reports/employees"
      labels={items.map((d) => d.label)}
      values={items.map((d) => d.value)}
      colors={items.map((d) => d.fill)}
    />
  );
}
