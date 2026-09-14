"use client";

import { useTheme } from "next-themes";
import { ResponsiveBar, type BarDatum } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveRadar } from "@nivo/radar";
import type { PartialTheme } from "@nivo/theming";
import { ChartCard } from "@/src/components/shared/charts";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import type { ReportChartSpec } from "@/src/lib/reports/types";
import { RingStat } from "./ring-stat";
import { FunnelStat } from "./funnel-stat";

export function useNivoTheme(): PartialTheme {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const fg = dark ? "#a1a1aa" : "#64748b";
  const grid = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const labelFill = dark ? "#0a0a0a" : "#fafafa";
  return {
    text: { fill: fg, fontSize: 11 },
    axis: {
      ticks: { text: { fill: fg, fontSize: 10.5 } },
      legend: { text: { fill: fg, fontSize: 11 } },
    },
    grid: { line: { stroke: grid, strokeWidth: 1 } },
    labels: { text: { fill: labelFill, fontSize: 11, fontWeight: 600 } },
    legends: { text: { fill: fg, fontSize: 11 } },
    tooltip: {
      container: {
        background: dark ? "#18181b" : "#ffffff",
        color: dark ? "#fafafa" : "#18181b",
        fontSize: 12,
      },
    },
  };
}

function fmt(v: number, money?: boolean): string {
  return money ? formatMoneyLocale(v) : v.toLocaleString();
}

/**
 * Shared hover tooltip for every chart kind. Nivo's own tooltip defaults show
 * whatever internal field name the datum happens to use for its series id —
 * for a single-series bar that's the literal string "value", for a multi-
 * series chart it's the raw (often lower_snake_case) series key. This always
 * takes an explicit, already-resolved label instead, so nothing internal ever
 * leaks into what the user reads.
 */
function ChartTooltip({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function ReportChartCard({
  spec,
  height = 260,
  compact,
  fullWidth,
}: {
  spec: ReportChartSpec;
  height?: number;
  compact?: boolean;
  fullWidth?: boolean;
}) {
  const theme = useNivoTheme();
  const card = {
    title: spec.title,
    description: spec.description,
    footer: spec.footer,
    details: spec.details,
    fullWidth,
    compact,
    // Cards in the same grid row are stretched to equal height by CSS grid,
    // but only if the card itself opts in to filling that stretched space —
    // without this, a card with a short legend just sits shorter than its
    // taller sibling instead of matching it.
    className: "h-full",
  };

  switch (spec.kind) {
    case "bar": {
      const horizontal = spec.layout !== "vertical";
      const longLabels = !horizontal && spec.data.some((d) => d.category.length > 8);
      return (
        <ChartCard {...card}>
          <div style={{ height }}>
            <ResponsiveBar
              data={spec.data as unknown as BarDatum[]}
              keys={["value"]}
              indexBy="category"
              layout={horizontal ? "horizontal" : "vertical"}
              margin={
                horizontal
                  ? { top: 4, right: 28, bottom: 24, left: 96 }
                  : {
                      top: 20,
                      right: longLabels ? 32 : 8,
                      bottom: longLabels ? 76 : 32,
                      left: longLabels ? 56 : 44,
                    }
              }
              padding={0.35}
              borderRadius={4}
              colors={{ datum: "data.fill" }}
              theme={theme}
              enableGridX={horizontal}
              enableGridY={!horizontal}
              enableLabel
              label={(d) => fmt(Number(d.value ?? 0), spec.money)}
              labelPosition={horizontal ? "end" : "end"}
              labelOffset={horizontal ? -8 : -14}
              labelTextColor={horizontal ? theme.text?.fill : "#ffffff"}
              axisLeft={horizontal ? { tickSize: 0, tickPadding: 8 } : { tickSize: 0, tickPadding: 6, format: (v) => fmt(Math.round(Number(v)), spec.money) }}
              axisBottom={
                horizontal
                  ? { tickSize: 0, tickPadding: 6, format: (v) => fmt(Math.round(Number(v)), spec.money) }
                  : {
                      tickSize: 0,
                      tickPadding: 8,
                      tickRotation: longLabels ? -35 : 0,
                      format: (v) => {
                        const s = String(v);
                        return longLabels && s.length > 14 ? `${s.slice(0, 13)}…` : s;
                      },
                    }
              }
              tooltip={(d) => (
                <ChartTooltip
                  color={d.color}
                  label={String(d.indexValue)}
                  value={fmt(Number(d.value ?? 0), spec.money)}
                />
              )}
              isInteractive
              animate={false}
            />
          </div>
        </ChartCard>
      );
    }

    case "multibar": {
      const longLabels = spec.data.some(
        (d) => String(d[spec.xAxisKey] ?? "").length > 8,
      );
      return (
        <ChartCard {...card}>
          <div style={{ height }}>
            <ResponsiveBar
              data={spec.data as unknown as BarDatum[]}
              keys={spec.series.map((s) => s.key)}
              indexBy={spec.xAxisKey}
              groupMode={spec.stacked ? "stacked" : "grouped"}
              margin={{ top: 8, right: 8, bottom: longLabels ? 60 : 32, left: 44 }}
              padding={0.3}
              innerPadding={spec.stacked ? 0 : 2}
              borderRadius={3}
              colors={spec.series.map((s) => s.color)}
              theme={theme}
              enableGridY
              enableGridX={false}
              enableLabel={false}
              axisLeft={{ tickSize: 0, tickPadding: 6, format: (v) => fmt(Math.round(Number(v)), spec.money) }}
              axisBottom={{ tickSize: 0, tickPadding: 8, tickRotation: longLabels ? -35 : 0 }}
              // Nivo's own legend would show the raw series keys (e.g.
              // "involuntary") — the card's own details legend below already
              // shows the resolved labels, so skip the redundant, mislabeled one.
              tooltip={(d) => (
                <ChartTooltip
                  color={d.color}
                  label={`${d.indexValue} · ${spec.series.find((s) => s.key === d.id)?.label ?? d.id}`}
                  value={fmt(Number(d.value ?? 0), spec.money)}
                />
              )}
              isInteractive
              animate={false}
            />
          </div>
        </ChartCard>
      );
    }

    case "pie": {
      const total = spec.data.reduce((s, d) => s + d.value, 0);
      return (
        <ChartCard {...card}>
          <div className="relative" style={{ height }}>
            <ResponsivePie
              data={spec.data}
              id="label"
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
              innerRadius={0.65}
              padAngle={1.2}
              cornerRadius={3}
              colors={{ datum: "data.fill" }}
              theme={theme}
              enableArcLinkLabels={false}
              arcLabelsSkipAngle={18}
              arcLabelsTextColor={theme.labels?.text?.fill as string}
              tooltip={({ datum }) => (
                <ChartTooltip
                  color={datum.color}
                  label={String(datum.label)}
                  value={fmt(datum.value, spec.money)}
                />
              )}
              isInteractive
              animate={false}
            />
            {spec.centerLabel && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {fmt(total, spec.money)}
                </span>
                <span className="text-[11px] text-muted-foreground">{spec.centerLabel}</span>
              </div>
            )}
          </div>
        </ChartCard>
      );
    }

    case "line":
    case "area": {
      // `x` is the point's position in the array, not the raw category label:
      // two different years both truncated to e.g. "Jan" by the report's own
      // month formatting would otherwise collide onto one x-scale position,
      // and Nivo's point scale would zigzag the line back and forth between
      // them. The real label is looked up for display via `tickLabels` below.
      const tickLabels = spec.data.map((d) => String(d[spec.xAxisKey] ?? ""));
      // `id` is the resolved series label, not the raw field key — it's what
      // both the legend and the tooltip's series name fall back to.
      const series = spec.series.map((s) => ({
        id: s.label,
        color: s.color,
        data: spec.data.map((d, i) => ({
          x: i,
          y: Number(d[s.key]) || 0,
        })),
      }));
      return (
        <ChartCard {...card}>
          <div style={{ height }}>
            <ResponsiveLine
              data={series}
              margin={{ top: 10, right: 16, bottom: 28, left: 48 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: 0, max: "auto", nice: true }}
              curve="monotoneX"
              colors={series.map((s) => s.color || "#5193fd")}
              theme={theme}
              lineWidth={2.25}
              enablePoints
              pointSize={5}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              pointColor={{ from: "serieColor" }}
              enableGridX={false}
              enableGridY
              enableArea={spec.kind === "area"}
              areaOpacity={0.14}
              axisLeft={{ tickSize: 0, tickPadding: 8, format: (v) => fmt(Math.round(Number(v)), spec.money) }}
              axisBottom={{
                tickSize: 0,
                tickPadding: 8,
                format: (v) => tickLabels[Number(v)] ?? "",
              }}
              tooltip={({ point }) => (
                <ChartTooltip
                  color={point.seriesColor}
                  label={
                    series.length > 1
                      ? `${tickLabels[Number(point.data.x)] ?? ""} · ${point.seriesId}`
                      : tickLabels[Number(point.data.x)] ?? ""
                  }
                  value={fmt(Number(point.data.y), spec.money)}
                />
              )}
              useMesh
              animate={false}
              legends={
                series.length > 1
                  ? [
                      {
                        anchor: "top-right",
                        direction: "row",
                        translateY: -20,
                        itemWidth: 80,
                        itemHeight: 16,
                        symbolSize: 8,
                        symbolShape: "circle",
                      },
                    ]
                  : []
              }
            />
          </div>
        </ChartCard>
      );
    }

    case "radial": {
      return (
        <ChartCard {...card}>
          <div className="flex h-full items-center justify-center" style={{ minHeight: height }}>
            <RingStat
              segments={spec.series.map((s) => ({ value: s.value, color: s.color }))}
              total={spec.series[0]?.total}
              size={compact ? 108 : 132}
              centerValue={String(spec.series[0]?.value ?? "")}
              centerLabel={spec.centerLabel}
            />
          </div>
        </ChartCard>
      );
    }

    case "radar": {
      return (
        <ChartCard {...card}>
          <div style={{ height }}>
            <ResponsiveRadar
              data={spec.data}
              keys={spec.series.map((s) => s.key)}
              indexBy={spec.angleKey}
              margin={{ top: 24, right: 48, bottom: 24, left: 48 }}
              colors={spec.series.map((s) => s.color)}
              theme={theme}
              borderWidth={2}
              fillOpacity={0.18}
              gridLevels={4}
              dotSize={5}
              dotBorderWidth={2}
              isInteractive
              animate={false}
              // Nivo's own legend would show the raw series keys — the
              // card's own details legend below already has the resolved
              // labels, so skip the redundant, mislabeled one.
              sliceTooltip={({ index, data }) => (
                <div className="flex flex-col gap-1 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md">
                  <span className="font-medium text-foreground">{index}</span>
                  {data.map((d) => (
                    <div key={d.id} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{ background: d.color }}
                      />
                      <span className="text-muted-foreground">
                        {spec.series.find((s) => s.key === d.id)?.label ?? d.id}
                      </span>
                      <span className="ml-auto font-semibold tabular-nums">
                        {d.formattedValue}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>
        </ChartCard>
      );
    }

    case "funnel": {
      return (
        <ChartCard {...card}>
          <div className="flex h-full flex-col justify-center" style={{ minHeight: height }}>
            <FunnelStat stages={spec.data} />
          </div>
        </ChartCard>
      );
    }
  }
}
