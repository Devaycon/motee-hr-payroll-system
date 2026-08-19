"use client";

import { BarChart2 } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { AreaChart } from "@/src/components/shared/charts";
import { useAttendanceSeries } from "../hooks";

/** Days of history the dashboard shows. Narrower ranges live on the report. */
const WINDOW_DAYS = 30;

export function AttendanceChart() {
  const { data, loading } = useAttendanceSeries();

  if (loading || !data) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  // A fixed window with no in-card controls or average pills — the range
  // picker, per-department cuts and totals all live on the attendance report.
  const series = data.slice(-WINDOW_DAYS);

  return (
    <AreaChart
      title="Attendance Trends"
      description={`Daily present, late and absent counts · last ${WINDOW_DAYS} days`}
      icon={BarChart2}
      height={260}
      viewMoreHref="/operations/reports/attendance"
      // Thin a crowded date axis to roughly every 3rd label.
      tickAmount={series.length > 14 ? Math.ceil(series.length / 3) : undefined}
      categories={series.map((d) => d.date)}
      series={[
        { name: "Present", data: series.map((d) => d.present), color: "#4ED251" },
        { name: "Late arrivals", data: series.map((d) => d.late), color: "#ff8b2d" },
        { name: "Absent", data: series.map((d) => d.absent), color: "#6366f1" },
      ]}
    />
  );
}
