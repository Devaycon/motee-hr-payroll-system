"use client";

import { Users } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { BarChart } from "@/src/components/shared/charts";
import { useDepartmentHeadcount } from "../hooks";

export function SalaryDistributionCard() {
  const { data, loading } = useDepartmentHeadcount();

  if (loading || !data) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  // The per-department legend duplicated the bars and was the row that scrolled;
  // /operations/reports/employees carries the full table.
  const total = data.data.reduce((s, d) => s + d.value, 0);
  return (
    <BarChart
      title="Dept. Headcount"
      description="Active employees in each department"
      icon={Users}
      height={260}
      footer={`${total} employees across ${data.data.length} departments`}
      viewMoreHref="/operations/reports/employees"
      categories={data.data.map((d) => d.category)}
      series={[{ name: "Employees", data: data.data.map((d) => d.value) }]}
      colors={data.data.map(
        (d) => String(data.config[d.category]?.color ?? "#4ED251"),
      )}
    />
  );
}
