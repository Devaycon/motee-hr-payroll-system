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

interface DonutChartProps extends ChartCardProps {
  labels: string[];
  values: number[];
  colors?: string[];
  /** Text under the center total (e.g. "Employees"). */
  centerLabel?: string;
  money?: boolean;
  height?: number;
}

export function DonutChart({
  labels,
  values,
  colors,
  centerLabel = "Total",
  money,
  height = 300,
  ...card
}: DonutChartProps) {
  const base = useApexTheme();
  const total = values.reduce((s, v) => s + v, 0);
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "donut" },
    labels,
    colors: colors?.length ? colors : CHART_COLORS,
    stroke: { width: 0 },
    legend: { position: "bottom" },
    dataLabels: { enabled: true, style: { fontSize: "11px" }, dropShadow: { enabled: false } },
    tooltip: { y: { formatter: tipFormatter(money) } },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: {
            show: true,
            total: {
              show: true,
              label: centerLabel,
              fontSize: "12px",
              formatter: () => (money ? tipFormatter(true)(total) : total.toLocaleString()),
            },
            value: {
              fontSize: "22px",
              fontWeight: 700,
              formatter: (v: string) =>
                money ? tipFormatter(true)(Number(v)) : Number(v).toLocaleString(),
            },
          },
        },
      },
    },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="donut" options={options} series={values} height={height} />
    </ChartCard>
  );
}
