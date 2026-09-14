"use client";

import { ResponsiveLine } from "@nivo/line";
import type { ReportChartSpec } from "@/src/lib/reports/types";

type TrendChartSpec = Extract<ReportChartSpec, { kind: "line" | "area" }>;

/** First line/area chart in a report's chart set — used as a small live preview. */
export function findTrendChart(charts: ReportChartSpec[]): TrendChartSpec | undefined {
  return charts.find(
    (c): c is TrendChartSpec => c.kind === "line" || c.kind === "area",
  );
}

/** Tiny, non-interactive preview of a report's own trend chart — real data, no chrome. */
export function ReportMiniChart({ chart }: { chart: TrendChartSpec }) {
  const series = chart.series[0];
  if (!series) return null;

  // `x` is each point's array position, not its raw month/category label —
  // two different years truncated to the same short label (e.g. "Jan")
  // would otherwise collide onto one x-scale position and zigzag the line.
  const points = chart.data.map((d, i) => ({
    x: i,
    y: Number(d[series.key]) || 0,
  }));
  if (points.length < 2) return null;

  return (
    <div className="h-11 w-full">
      <ResponsiveLine
        data={[{ id: series.key, data: points }]}
        margin={{ top: 4, right: 2, bottom: 4, left: 2 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto" }}
        curve="monotoneX"
        colors={[series.color || "#5193fd"]}
        lineWidth={1.75}
        enablePoints={false}
        enableGridX={false}
        enableGridY={false}
        axisBottom={null}
        axisLeft={null}
        enableArea
        areaOpacity={0.16}
        isInteractive={false}
        animate={false}
        useMesh={false}
      />
    </div>
  );
}
