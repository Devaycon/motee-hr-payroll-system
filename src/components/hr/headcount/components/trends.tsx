"use client";

import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { LineChart } from "@/src/components/shared/charts";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { cn } from "@/src/lib/utils";
import type { HeadcountPlan, PlanPeriod } from "../types";
import {
  headcountSeries,
  quarterOverQuarter,
  yearOverYear,
  type TrendRow,
  type TrendSummary,
} from "../trends";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

interface TrendsProps {
  /** Every plan across every period — not just the active one. */
  plans: HeadcountPlan[];
  activePeriod: PlanPeriod;
}

/** "+4 (+6.5%)" / "−2 (−3.1%)" / "no change". */
/**
 * Mirrors the columns on screen. The two headcount columns are named after
 * the periods being compared, so they're built per-render rather than fixed.
 */
function trendExportColumns(
  activePeriod: string,
  comparisonPeriod: string,
): ReportColumn<TrendRow>[] {
  return [
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "previous", header: comparisonPeriod, value: (r) => r.previous },
    { key: "current", header: activePeriod, value: (r) => r.current },
    { key: "target", header: "Target", value: (r) => r.target },
    { key: "delta", header: "Movement", value: (r) => r.delta },
    {
      key: "pctChange",
      header: "Change %",
      value: (r) => r.pctChange ?? "—",
    },
  ];
}

function movementLabel(delta: number, pct: number | null): string {
  if (delta === 0) return "no change";
  const sign = delta > 0 ? "+" : "−";
  const abs = Math.abs(delta);
  return pct == null
    ? `${sign}${abs}`
    : `${sign}${abs} (${sign}${Math.abs(pct)}%)`;
}

export function Trends({ plans, activePeriod }: TrendsProps) {
  const qoq = useMemo(
    () => quarterOverQuarter(plans, activePeriod),
    [plans, activePeriod],
  );
  const yoy = useMemo(
    () => yearOverYear(plans, activePeriod),
    [plans, activePeriod],
  );
  const series = useMemo(() => headcountSeries(plans), [plans]);

  const stats = useMemo<HrStatCardItem[]>(
    () => [
      {
        icon: Users,
        label: "Current Headcount",
        value: qoq.totalCurrent,
        sub: `Across ${qoq.rows.length} departments · ${activePeriod}`,
        tone: "violet",
      },
      {
        icon: TrendingUp,
        label: "Quarter on Quarter",
        value: movementLabel(qoq.totalDelta, qoq.totalPctChange),
        sub: qoq.comparisonPeriod
          ? `vs ${qoq.comparisonPeriod}`
          : "No previous quarter held",
        tone: qoq.totalDelta >= 0 ? "emerald" : "amber",
        trend: qoq.totalPctChange != null ? `${qoq.totalPctChange}%` : undefined,
        up: qoq.totalDelta >= 0,
      },
      {
        icon: CalendarRange,
        label: "Year on Year",
        value: movementLabel(yoy.totalDelta, yoy.totalPctChange),
        sub: yoy.comparisonPeriod
          ? `vs ${yoy.comparisonPeriod}`
          : "No prior-year data held",
        tone: yoy.totalDelta >= 0 ? "emerald" : "amber",
        trend: yoy.totalPctChange != null ? `${yoy.totalPctChange}%` : undefined,
        up: yoy.totalDelta >= 0,
      },
      {
        icon: ArrowUpRight,
        label: "Departments Growing",
        value: qoq.grew,
        sub: `${qoq.shrank} shrinking · ${qoq.flat} flat`,
        tone: "blue",
      },
    ],
    [qoq, yoy, activePeriod],
  );

  return (
    <div className="space-y-6">
      <HrStatCardsGrid stats={stats} columns={4} />

      <LineChart
        title="Headcount Trend"
        description="Company-wide actual against target across every quarter held."
        footer={
          qoq.comparisonPeriod
            ? `${activePeriod} is ${movementLabel(qoq.totalDelta, qoq.totalPctChange)} against ${qoq.comparisonPeriod}.`
            : undefined
        }
        categories={series.map((p) => p.period)}
        series={[
          { name: "Actual", data: series.map((p) => p.actual) },
          { name: "Target", data: series.map((p) => p.target) },
        ]}
      />

      <TrendTable
        title="Quarter on Quarter"
        summary={qoq}
        activePeriod={activePeriod}
      />
      <TrendTable
        title="Year on Year"
        summary={yoy}
        activePeriod={activePeriod}
      />
    </div>
  );
}

interface TrendTableProps {
  title: string;
  summary: TrendSummary;
  activePeriod: PlanPeriod;
}

function TrendTable({ title, summary, activePeriod }: TrendTableProps) {
  if (!summary.comparisonPeriod) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          No comparison period is held for {activePeriod}. Pick a quarterly
          period with earlier data to see the movement.
        </p>
      </div>
    );
  }

  // Biggest movers first — a department that lost six people matters as much
  // as one that gained six, so the sort is on magnitude.
  const rows = [...summary.rows].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {activePeriod} vs {summary.comparisonPeriod} ·{" "}
            <span className="font-medium text-foreground">
              {movementLabel(summary.totalDelta, summary.totalPctChange)}
            </span>{" "}
            overall
          </p>
          <ExportMenu
            name={`headcount-trend-${title.toLowerCase().replace(/\s+/g, "-")}`}
            title={`${title} — ${activePeriod} vs ${summary.comparisonPeriod}`}
            columns={trendExportColumns(activePeriod, summary.comparisonPeriod)}
            rows={rows}
            variant="outline"
            buttonClassName="h-7 text-xs"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2 font-medium">Department</th>
              <th className="px-4 py-2 text-right font-medium">
                {summary.comparisonPeriod}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {activePeriod}
              </th>
              <th className="px-4 py-2 text-right font-medium">Target</th>
              <th className="px-4 py-2 text-right font-medium">Movement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <MovementRow key={row.department} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovementRow({ row }: { row: TrendRow }) {
  const Icon =
    row.delta > 0 ? ArrowUpRight : row.delta < 0 ? ArrowDownRight : ArrowRight;
  const tone =
    row.delta > 0
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : row.delta < 0
        ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
        : "border-border bg-muted text-muted-foreground";

  return (
    <tr className="border-b border-border/30 last:border-0">
      <td className="px-4 py-2 font-medium text-foreground">
        {row.department}
      </td>
      <td className="px-4 py-2 text-right text-muted-foreground">
        {row.previous}
      </td>
      <td className="px-4 py-2 text-right text-foreground">{row.current}</td>
      <td className="px-4 py-2 text-right text-muted-foreground">
        {row.target}
      </td>
      <td className="px-4 py-2 text-right">
        <Badge variant="outline" className={cn("gap-1 text-[10px]", tone)}>
          <Icon className="h-2.5 w-2.5" />
          {movementLabel(row.delta, row.pctChange)}
        </Badge>
      </td>
    </tr>
  );
}
