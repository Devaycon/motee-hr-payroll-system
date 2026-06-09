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

interface PieChartProps extends ChartCardProps {
  labels: string[];
  values: number[];
  colors?: string[];
  money?: boolean;
  height?: number;
}

export function PieChart({
  labels,
  values,
  colors,
  money,
  height = 300,
  ...card
}: PieChartProps) {
  const base = useApexTheme();
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "pie" },
    labels,
    colors: colors?.length ? colors : CHART_COLORS,
    stroke: { width: 0 },
    legend: { position: "bottom" },
    tooltip: { y: { formatter: tipFormatter(money) } },
    dataLabels: { enabled: true, style: { fontSize: "11px" } },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="pie" options={options} series={values} height={height} />
    </ChartCard>
  );
}
