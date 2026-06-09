"use client";

import { TrendingUp } from "lucide-react";
import { LineChart } from "@/src/components/shared/charts";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useHeadcountTrend } from "../hooks";

export function HeadcountTrendCard() {
  const { data, loading } = useHeadcountTrend();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const counts = data.map((d) => d.headcount);
  const latest = counts[counts.length - 1] ?? 0;
  const peak = counts.length ? Math.max(...counts) : 0;
  return (
    <LineChart
      title="Headcount Trend"
      description="Monthly employee headcount"
      icon={TrendingUp}
      footer={`Latest ${latest} · Peak ${peak} over ${data.length} months`}
      viewMoreHref="/operations/reports/employees"
      categories={data.map((d) => d.month)}
      series={[
        { name: "Headcount", data: counts, color: "#4ED251" },
      ]}
    />
  );
}
