"use client";

import type { ApexOptions } from "apexcharts";
import {
  ApexChart,
  ChartCard,
  useApexTheme,
  mergeApex,
  chartColor,
  axisFormatter,
  tipFormatter,
  type ApexSeries,
  type ChartCardProps,
} from "./apex-base";

interface BarChartProps extends ChartCardProps {
  categories: string[];
  series: ApexSeries[];
  /** Per-bar colors for a single-series chart (distributed coloring). */
  colors?: string[];
  money?: boolean;
  height?: number;
}

/** Horizontal bar chart. */
export function BarChart({
  categories,
  series,
  colors,
  money,
  height = 280,
  ...card
}: BarChartProps) {
  const base = useApexTheme();
  const distributed = series.length === 1 && !!colors?.length;
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "bar" },
    colors: distributed ? colors : series.map((s, i) => s.color ?? chartColor(i)),
    plotOptions: {
      bar: {
        horizontal: true,
        distributed,
        borderRadius: 5,
        borderRadiusApplication: "end",
        barHeight: categories.length > 8 ? "75%" : "55%",
      },
    },
    xaxis: {
      categories,
      labels: { formatter: axisFormatter(money) },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { fontSize: "12px" } } },
    legend: { show: !distributed && series.length > 1 },
    tooltip: { y: { formatter: tipFormatter(money) } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="bar" options={options} series={series} height={height} />
    </ChartCard>
  );
}
