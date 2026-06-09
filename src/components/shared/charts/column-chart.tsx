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

interface ColumnChartProps extends ChartCardProps {
  categories: string[];
  series: ApexSeries[];
  /** Per-bar colors for a single-series chart (distributed coloring). */
  colors?: string[];
  stacked?: boolean;
  money?: boolean;
  height?: number;
}

export function ColumnChart({
  categories,
  series,
  colors,
  stacked,
  money,
  height = 280,
  ...card
}: ColumnChartProps) {
  const base = useApexTheme();
  const distributed = series.length === 1 && !!colors?.length;
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "bar", stacked: !!stacked },
    colors: distributed ? colors : series.map((s, i) => s.color ?? chartColor(i)),
    plotOptions: {
      bar: {
        horizontal: false,
        distributed,
        borderRadius: 5,
        borderRadiusApplication: "end",
        columnWidth: categories.length > 8 ? "70%" : "50%",
      },
    },
    xaxis: {
      categories,
      labels: { rotate: -25, trim: true, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { formatter: axisFormatter(money) } },
    legend: { show: !distributed && series.length > 1 },
    tooltip: { y: { formatter: tipFormatter(money) } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="bar" options={options} series={series} height={height} />
    </ChartCard>
  );
}
