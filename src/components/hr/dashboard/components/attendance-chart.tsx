"use client";

import { ResponsiveHeatMap } from "@nivo/heatmap";
import { BarChart2 } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { useAttendanceSeries } from "../hooks";

/** Days of history the dashboard shows. Narrower ranges live on the report. */
const WINDOW_DAYS = 30;

/** Only every Nth date gets a bottom-axis label — 30 daily labels would overlap into mush. */
const LABEL_STRIDE = 5;

export function AttendanceChart() {
  const { data, loading } = useAttendanceSeries();

  if (loading || !data) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  // Three rows (one per status) by day, shaded by headcount — a calendar-style
  // read of the same 30 days the line/bar trend on the report gives numbers for.
  const heatmapData = [
    { id: "Present", data: data.map((d) => ({ x: d.date, y: d.present })) },
    { id: "Late", data: data.map((d) => ({ x: d.date, y: d.late })) },
    { id: "Absent", data: data.map((d) => ({ x: d.date, y: d.absent })) },
  ];

  const shownDates = new Set(data.filter((_, i) => i % LABEL_STRIDE === 0).map((d) => d.date));

  return (
    <ChartCard
      title="Attendance Trends"
      description={`Present, late and absent · last ${WINDOW_DAYS} days`}
      icon={BarChart2}
      compact
      viewMoreHref="/operations/analytics/attendance"
    >
      <div style={{ height: 200 }}>
        <ResponsiveHeatMap
          data={heatmapData}
          margin={{ top: 10, right: 24, bottom: 30, left: 60 }}
          axisTop={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            tickRotation: -40,
            format: (v) => (shownDates.has(String(v)) ? String(v) : ""),
          }}
          axisLeft={{ tickSize: 0, tickPadding: 10 }}
          colors={{ type: "sequential", scheme: "blues" }}
          emptyColor="var(--muted)"
          borderRadius={3}
          borderWidth={2}
          borderColor="var(--card)"
          enableLabels={false}
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}
