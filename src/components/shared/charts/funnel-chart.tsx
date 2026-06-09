"use client";

import type { ApexOptions } from "apexcharts";
import {
  ApexChart,
  ChartCard,
  useApexTheme,
  mergeApex,
  CHART_COLORS,
  tipFormatter,
  type ChartCardProps,
} from "./apex-base";

interface FunnelChartProps extends ChartCardProps {
  labels: string[];
  values: number[];
  colors?: string[];
  money?: boolean;
  height?: number;
}

/** Pipeline funnel (horizontal bar with isFunnel). */
export function FunnelChart({
  labels,
  values,
  colors,
  money,
  height = 300,
  ...card
}: FunnelChartProps) {
  const base = useApexTheme();
  const fmt = tipFormatter(money);
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "bar" },
    colors: colors?.length ? colors : CHART_COLORS,
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        barHeight: "78%",
        isFunnel: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) =>
        `${labels[opts?.dataPointIndex ?? 0]}: ${fmt(Number(val))}`,
      dropShadow: { enabled: false },
      style: { fontSize: "11px" },
    },
    xaxis: { categories: labels },
    legend: { show: false },
    tooltip: { y: { formatter: fmt } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart
        type="bar"
        options={options}
        series={[{ name: "Value", data: values }]}
        height={height}
      />
    </ChartCard>
  );
}
