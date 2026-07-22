"use client";

import {
  AreaChart,
  BarChart,
  ColumnChart,
  DonutChart,
  FunnelChart,
  LineChart,
  MultiBarChart,
  RadarChart,
  RadialGauge,
  chartColor,
} from "@/src/components/shared/charts";
import type { ReportChartSpec } from "@/src/lib/reports/types";

/** Renders one report chart spec via the shared ApexCharts components. */
export function ReportChartCard({ spec }: { spec: ReportChartSpec }) {
  const card = {
    title: spec.title,
    description: spec.description,
    footer: spec.footer,
    details: spec.details,
    fullWidth: spec.fullWidth,
  };

  switch (spec.kind) {
    case "bar": {
      const categories = spec.data.map((d) => d.category);
      const series = [{ name: spec.title, data: spec.data.map((d) => d.value) }];
      const colors = spec.data.map((d) => d.fill);
      return spec.layout === "horizontal" ? (
        <BarChart
          {...card}
          categories={categories}
          series={series}
          colors={colors}
          money={spec.money}
        />
      ) : (
        <ColumnChart
          {...card}
          categories={categories}
          series={series}
          colors={colors}
          money={spec.money}
        />
      );
    }

    case "multibar":
      return (
        <MultiBarChart
          {...card}
          categories={spec.data.map((d) => String(d[spec.xAxisKey] ?? ""))}
          series={spec.series.map((s) => ({
            name: s.label,
            data: spec.data.map((d) => Number(d[s.key]) || 0),
            color: s.color,
          }))}
          stacked={spec.stacked}
          money={spec.money}
        />
      );

    case "pie":
      return (
        <DonutChart
          {...card}
          labels={spec.data.map((d) => d.label)}
          values={spec.data.map((d) => d.value)}
          colors={spec.data.map((d) => d.fill)}
          centerLabel={spec.centerLabel}
          money={spec.money}
        />
      );

    case "line":
    case "area": {
      const categories = spec.data.map((d) => String(d[spec.xAxisKey] ?? ""));
      const series = spec.series.map((s) => ({
        name: s.label,
        data: spec.data.map((d) => Number(d[s.key]) || 0),
        color: s.color,
      }));
      return spec.kind === "area" ? (
        <AreaChart {...card} categories={categories} series={series} money={spec.money} />
      ) : (
        <LineChart {...card} categories={categories} series={series} money={spec.money} />
      );
    }

    case "radial": {
      const sum = spec.series.reduce((s, d) => s + d.value, 0) || 1;
      return (
        <RadialGauge
          {...card}
          items={spec.series.map((s) => ({
            label: s.label,
            value: s.value,
            total: s.total ?? sum,
            color: s.color,
          }))}
        />
      );
    }

    case "radar":
      return (
        <RadarChart
          {...card}
          categories={spec.data.map((d) => String(d[spec.angleKey] ?? ""))}
          series={spec.series.map((s) => ({
            name: s.label,
            data: spec.data.map((d) => Number(d[s.key]) || 0),
            color: s.color,
          }))}
        />
      );

    case "funnel":
      return (
        <FunnelChart
          {...card}
          labels={spec.data.map((d) => d.stage)}
          values={spec.data.map((d) => d.value)}
          colors={spec.data.map((d, i) => d.fill ?? chartColor(i))}
        />
      );
  }
}
