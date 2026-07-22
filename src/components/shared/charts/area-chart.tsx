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

interface AreaChartProps extends ChartCardProps {
  categories: string[];
  series: ApexSeries[];
  stacked?: boolean;
  money?: boolean;
  height?: number;
  /** Cap the number of X-axis labels shown (thins a crowded date axis). */
  tickAmount?: number;
}

export function AreaChart({
  categories,
  series,
  stacked,
  money,
  height = 280,
  tickAmount,
  ...card
}: AreaChartProps) {
  const base = useApexTheme();
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "area", stacked: !!stacked },
    colors: series.map((s, i) => s.color ?? chartColor(i)),
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 95] },
    },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories,
      ...(tickAmount ? { tickAmount } : {}),
      labels: { hideOverlappingLabels: true },
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
      <ApexChart type="area" options={options} series={series} height={height} />
    </ChartCard>
  );
}
