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

interface LineChartProps extends ChartCardProps {
  categories: string[];
  series: ApexSeries[];
  smooth?: boolean;
  money?: boolean;
  height?: number;
}

export function LineChart({
  categories,
  series,
  smooth = true,
  money,
  height = 280,
  ...card
}: LineChartProps) {
  const base = useApexTheme();
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "line" },
    colors: series.map((s, i) => s.color ?? chartColor(i)),
    stroke: { curve: smooth ? "smooth" : "straight", width: 3 },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories,
      labels: { rotate: 0, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { formatter: axisFormatter(money) } },
    legend: { show: series.length > 1, position: "top", horizontalAlign: "left" },
    tooltip: { y: { formatter: tipFormatter(money) } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="line" options={options} series={series} height={height} />
    </ChartCard>
  );
}
