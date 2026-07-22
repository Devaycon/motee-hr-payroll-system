import type { LucideIcon } from "lucide-react";
import type { LocaleBundle } from "@/src/lib/types/locale";

export interface ReportColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string | number;
  /** Render through the locale currency formatter. */
  money?: boolean;
}

export interface ReportFilterDef<T> {
  key: string;
  label: string;
  options: (rows: T[]) => string[];
  match: (row: T, value: string) => boolean;
}

/**
 * A domain-specific, export-only parameter rendered as a toggle in the export
 * dialog (e.g. "Line managers only", "Active employees only"). When enabled,
 * only rows passing {@link predicate} are exported. Generic column filters
 * (ranges, date ranges, category pickers, text search) are derived automatically
 * from a report's columns and do not need to be declared here.
 */
export interface ReportExportParam<T> {
  key: string;
  label: string;
  description?: string;
  predicate: (row: T) => boolean;
}

export interface ReportStat {
  label: string;
  value: string | number;
  money?: boolean;
  /** Supporting context shown under the value (rich card). */
  sub?: string;
  /** Lucide icon for the rich card; a sensible default is used when omitted. */
  icon?: LucideIcon;
  /** e.g. "+12" / "-3" — renders a colored trend badge. */
  trend?: string;
  /** Trend direction: true = green/up, false = red/down. */
  up?: boolean;
}

/** One row in a chart card's breakdown legend (label · value · %). */
export interface ChartDetail {
  label: string;
  value: number;
  color?: string;
  /** Show the value as a percent of the total. */
  pct?: boolean;
  /** Format the value through the locale currency formatter. */
  money?: boolean;
}

// ── Spec data shapes (renderer-agnostic) ────────────────────────────────────
export interface BarChartItem {
  category: string;
  value: number;
  fill: string;
}
export interface PieChartItem {
  key: string;
  label: string;
  value: number;
  fill: string;
}
export interface RadialSeriesItem {
  key: string;
  label: string;
  value: number;
  color: string;
  /**
   * Denominator for the ring's percentage. Defaults to the sum of all ring
   * values (share-of-total). Set explicitly (e.g. 100) when `value` is already
   * a percentage, so a single-ring gauge shows the rate rather than 100%.
   */
  total?: number;
}
export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

/** Chrome shared by every chart card: header, footer and breakdown legend. */
interface ChartChrome {
  title: string;
  description?: string;
  /** Trend / insight line shown in the card footer. */
  footer?: string;
  /** Span both columns of the analytics grid (for trends / funnels). */
  fullWidth?: boolean;
  /** Per-series / per-slice breakdown rendered under the chart. */
  details?: ChartDetail[];
}

/** A chart spec the analytics renderer maps onto the report chart cards. */
export type ReportChartSpec =
  | (ChartChrome & {
      kind: "bar";
      data: BarChartItem[];
      layout?: "vertical" | "horizontal";
      money?: boolean;
    })
  | (ChartChrome & {
      kind: "multibar";
      data: Record<string, unknown>[];
      series: ChartSeries[];
      xAxisKey: string;
      stacked?: boolean;
      money?: boolean;
    })
  | (ChartChrome & {
      kind: "pie";
      id: string;
      data: PieChartItem[];
      centerLabel?: string;
      money?: boolean;
    })
  | (ChartChrome & {
      kind: "line" | "area";
      data: Record<string, unknown>[];
      series: ChartSeries[];
      xAxisKey: string;
      money?: boolean;
    })
  | (ChartChrome & {
      kind: "radial";
      series: RadialSeriesItem[];
      centerLabel?: string;
    })
  | (ChartChrome & {
      kind: "radar";
      data: Record<string, unknown>[];
      series: ChartSeries[];
      angleKey: string;
    })
  | (ChartChrome & {
      kind: "funnel";
      data: { stage: string; value: number; fill: string }[];
    });

export interface ReportAnalytics {
  stats: ReportStat[];
  charts: ReportChartSpec[];
}

export interface ReportDef<T> {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  group: string;
  /** Permission module id gating visibility. */
  permission: string;
  /** Dataset for the report. */
  select: (bundle: LocaleBundle) => T[];
  columns: ReportColumn<T>[];
  filters?: ReportFilterDef<T>[];
  /** Optional domain-specific toggles shown in the export dialog. */
  exportParams?: ReportExportParam<T>[];
  /** Free-text search haystack for a row. */
  searchText?: (row: T) => string;
  analytics: (rows: T[], bundle: LocaleBundle) => ReportAnalytics;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyReportDef = ReportDef<any>;

/** Identity helper that preserves the row type while authoring a report def. */
export function defineReport<T>(def: ReportDef<T>): ReportDef<T> {
  return def;
}
