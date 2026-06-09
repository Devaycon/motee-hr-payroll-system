"use client";

import type { ApexOptions } from "apexcharts";
import {
  ApexChart,
  ChartCard,
  useApexTheme,
  mergeApex,
  chartColor,
  type ChartCardProps,
} from "./apex-base";

export interface RadialItem {
  label: string;
  value: number;
  /** When given, the ring shows value/total as a percentage. */
  total?: number;
  color?: string;
}

interface RadialGaugeProps extends ChartCardProps {
  items: RadialItem[];
  height?: number;
}

/** Concentric percentage rings (radialBar). */
export function RadialGauge({
  items,
  height = 300,
  ...card
}: RadialGaugeProps) {
  const base = useApexTheme();
  const pct = (it: RadialItem) =>
    it.total ? Math.round((it.value / it.total) * 100) : Math.round(it.value);
  const series = items.map(pct);
  const options: ApexOptions = mergeApex(base, {
    chart: { type: "radialBar" },
    labels: items.map((it) => it.label),
    colors: items.map((it, i) => it.color ?? chartColor(i)),
    plotOptions: {
      radialBar: {
        hollow: { size: items.length > 1 ? "40%" : "60%" },
        track: { background: "rgba(128,128,128,0.15)", margin: 6 },
        dataLabels: {
          name: { fontSize: "13px" },
          value: { fontSize: "20px", fontWeight: 700, formatter: (v: number) => `${v}%` },
          total: {
            show: items.length > 1,
            label: items.length > 1 ? "Avg" : items[0]?.label,
            formatter: () =>
              `${Math.round(series.reduce((s, v) => s + v, 0) / (series.length || 1))}%`,
          },
        },
      },
    },
    legend: { show: false },
  });
  return (
    <ChartCard {...card}>
      <ApexChart type="radialBar" options={options} series={series} height={height} />
    </ChartCard>
  );
}
