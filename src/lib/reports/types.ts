import type { LucideIcon } from "lucide-react";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { TenantPayroll } from "@/src/lib/stores/payroll-slice";

/**
 * Data a report can read beyond the locale bundle. Payroll lives in its own
 * store (it's confidential and computed), so payroll reports read it from
 * here; every other report ignores it.
 */
export interface ReportContext {
  country: "uk" | "ng";
  /** The tenant's payroll, when this user may see it and the country runs payroll. */
  payroll: TenantPayroll | null;
}

export interface ReportColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string | number;
  /** Render through the locale currency formatter. */
  money?: boolean;
  /** Drill-down: the cell links here (e.g. the employee's profile). */
  href?: (row: T) => string | undefined;
  // ── Data dictionary (Report Studio, feedback B2) ──
  /** What the field means, in one sentence. */
  description?: string;
  /** The module the value comes from (e.g. "Payroll — final payslips"). */
  source?: string;
  type?: FieldType;
  /**
   * Restricted data. "identifier" (TIN, RSA PIN, NIN, BVN) and "bank"
   * (account number, holder) are masked unless the viewer may see them —
   * checked every time the report runs or is exported, not only when built.
   */
  sensitive?: "identifier" | "bank";
  /** Section heading inside a dataset's field list ("Employee", "Earnings"). */
  section?: string;
}

export type FieldType = "text" | "money" | "number" | "percent" | "date" | "boolean";

/** One item in a report row's ⋯ actions menu. */
export interface ReportRowAction {
  label: string;
  href: string;
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
  /** Accent color for the stat's icon chip — lets a breakdown page (e.g. per-gender stats) carry meaning through color. */
  tone?: "violet" | "blue" | "amber" | "emerald" | "red";
  /** Makes the card drillable: a ⋯ menu opening the detail behind the figure. */
  drill?: ReportStatDrill;
}

/**
 * What sits behind a stat card. `components` must add up exactly to the
 * card's value (it's how a reviewer reconciles it); `table` is the
 * employee-level detail with the page's current filters already applied.
 */
export interface ReportStatDrill {
  title?: string;
  description?: string;
  /** The filters in force, spelled out ("Oct 2026 · all departments · all run types"). */
  scope?: string;
  components?: { label: string; value: number; basis?: string; money?: boolean }[];
  table?: { headers: string[]; rows: (string | number)[][]; money?: boolean[]; footer?: (string | number)[]; hrefs?: (string | undefined)[] };
  /** e.g. the run comparison for "Oct vs Sep". */
  links?: { label: string; href: string }[];
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

/**
 * A dedicated deep-dive on one dimension of a report (e.g. "Gender Split"
 * inside the Employees report) — its own page, its own robust set of stats
 * and charts, reusing the parent report's row shape and filters.
 */
export interface ReportBreakdownDef<T> {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  analytics: (rows: T[], bundle: LocaleBundle, ctx: ReportContext) => ReportAnalytics;
}

export interface ReportDef<T> {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  group: string;
  /** Permission module id gating visibility. */
  permission: string;
  /** Countries the report exists in (default: all). */
  countries?: ReportContext["country"][];
  /** Dataset for the report. */
  select: (bundle: LocaleBundle, ctx: ReportContext) => T[];
  columns: ReportColumn<T>[];
  filters?: ReportFilterDef<T>[];
  /** Optional domain-specific toggles shown in the export dialog. */
  exportParams?: ReportExportParam<T>[];
  /** Free-text search haystack for a row. */
  searchText?: (row: T) => string;
  analytics: (rows: T[], bundle: LocaleBundle, ctx: ReportContext) => ReportAnalytics;
  /** Dedicated single-dimension deep-dive pages, each with several graphs of its own. */
  breakdowns?: ReportBreakdownDef<T>[];
  /** ⋯ menu on each row (drill-downs). */
  rowActions?: (row: T) => ReportRowAction[];
  /**
   * Fields that exist only at run time — e.g. one per pay element the tenant
   * created, so a new "Security Allowance" is reportable with no development.
   */
  dynamicColumns?: (ctx: ReportContext) => ReportColumn<T>[];
  /** Datasets sharing a row model; Report Studio lets you combine their fields (keyed by employee + period). */
  joinGroup?: string;
  /** A builder dataset: offered in the custom builders, not listed as its own report card. */
  datasetOnly?: boolean;
  /** Short note on what one row is ("One row per employee per payslip"). */
  grain?: string;
}

/** Every column of a report, its run-time fields included. */
export function columnsOf<T>(def: ReportDef<T>, ctx: ReportContext): ReportColumn<T>[] {
  const extra = def.dynamicColumns?.(ctx) ?? [];
  const seen = new Set(def.columns.map((c) => c.key));
  return [...def.columns, ...extra.filter((c) => !seen.has(c.key))];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyReportDef = ReportDef<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyReportBreakdownDef = ReportBreakdownDef<any>;

/** Identity helper that preserves the row type while authoring a report def. */
export function defineReport<T>(def: ReportDef<T>): ReportDef<T> {
  return def;
}
