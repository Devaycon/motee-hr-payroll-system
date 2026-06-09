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

interface MultiBarChartProps extends ChartCardProps {
  categories: string[];
  series: ApexSeries[];
  /** Stack the series instead of grouping side-by-side. */
  stacked?: boolean;
  horizontal?: boolean;
  money?: boolean;
  height?: number;
}

/** Grouped (or stacked) multi-series bar chart. */
export function MultiBarChart({
  categories,
  series,
  stacked,
  horizontal,
  money,
  height = 280,
  ...card
}: MultiBarChartProps) {
  const base = useApexTheme();
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "bar", stacked: !!stacked },
    colors: series.map((s, i) => s.color ?? chartColor(i)),
    plotOptions: {
      bar: {
        horizontal: !!horizontal,
        borderRadius: 4,
        borderRadiusApplication: stacked ? "around" : "end",
        columnWidth: "60%",
      },
    },
    xaxis: {
      categories,
      labels: horizontal
        ? { formatter: axisFormatter(money) }
        : { rotate: -25, trim: true, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: horizontal ? {} : { formatter: axisFormatter(money) },
    },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    tooltip: { y: { formatter: tipFormatter(money) } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="bar" options={options} series={series} height={height} />
    </ChartCard>
  );
}
