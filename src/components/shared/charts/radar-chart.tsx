"use client";

import type { ApexOptions } from "apexcharts";
import {
  ApexChart,
  ChartCard,
  useApexTheme,
  mergeApex,
  chartColor,
  tipFormatter,
  type ApexSeries,
  type ChartCardProps,
} from "./apex-base";

interface RadarChartProps extends ChartCardProps {
  categories: string[];
  series: ApexSeries[];
  money?: boolean;
  height?: number;
}

export function RadarChart({
  categories,
  series,
  money,
  height = 300,
  ...card
}: RadarChartProps) {
  const base = useApexTheme();
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "radar" },
    colors: series.map((s, i) => s.color ?? chartColor(i)),
    stroke: { width: 2 },
    fill: { opacity: 0.15 },
    markers: { size: 3 },
    xaxis: { categories },
    yaxis: { show: false },
    legend: { show: series.length > 1, position: "top", horizontalAlign: "left" },
    tooltip: { y: { formatter: tipFormatter(money) } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="radar" options={options} series={series} height={height} />
    </ChartCard>
  );
}
