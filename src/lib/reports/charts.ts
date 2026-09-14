import type {
  ChartDetail,
  ChartSeries,
  RadialSeriesItem,
  ReportChartSpec,
} from "./types";

export const PALETTE = [
  "#50D34C",
  "#6366f1",
  "#FE8F44",
  "#5192FA",
  "#a855f7",
  "#14b8a6",
  "#f43f5e",
  "#eab308",
  "#64748b",
  "#0ea5e9",
];

export function paletteColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export interface Tally {
  label: string;
  value: number;
}

/** Optional card chrome shared by all chart builders. */
interface Chrome {
  description?: string;
  footer?: string;
  fullWidth?: boolean;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "x";
}

/** Count rows grouped by a key (sorted desc). */
export function countBy<T>(
  rows: T[],
  key: (r: T) => string | null | undefined,
): Tally[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (key(r) ?? "").toString().trim() || "—";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([label, value]) => ({ label, value })).sort(
    (a, z) => z.value - a.value,
  );
}

/** Sum a numeric field grouped by a key (sorted desc). */
export function sumBy<T>(
  rows: T[],
  key: (r: T) => string | null | undefined,
  val: (r: T) => number,
): Tally[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (key(r) ?? "").toString().trim() || "—";
    m.set(k, (m.get(k) ?? 0) + val(r));
  }
  return Array.from(m, ([label, value]) => ({ label, value })).sort(
    (a, z) => z.value - a.value,
  );
}

/** Average a numeric field grouped by a key (sorted desc, rounded to 1dp). */
export function avgBy<T>(
  rows: T[],
  key: (r: T) => string | null | undefined,
  val: (r: T) => number,
): Tally[] {
  const m = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = (key(r) ?? "").toString().trim() || "—";
    const cur = m.get(k) ?? { sum: 0, n: 0 };
    cur.sum += val(r);
    cur.n += 1;
    m.set(k, cur);
  }
  return Array.from(m, ([label, { sum, n }]) => ({
    label,
    value: Math.round((sum / (n || 1)) * 10) / 10,
  })).sort((a, z) => z.value - a.value);
}

/** Chronologically sorted YYYY-MM tallies from a date accessor. */
export function byMonth<T>(
  rows: T[],
  date: (r: T) => string | null | undefined,
): Tally[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const d = (date(r) ?? "").toString();
    if (d.length < 7) continue;
    const k = d.slice(0, 7);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([label, value]) => ({ label, value })).sort((a, z) =>
    a.label.localeCompare(z.label),
  );
}

/**
 * "YYYY-MM" keys for the last `n` consecutive calendar months ending at `end`
 * (default: now). Use with {@link fillMonths} / {@link byMonthCross}'s
 * `months` param so a trend never skips straight from e.g. "Mar" to "Sep"
 * just because nothing happened in between — a real gap still reads as a
 * flat zero stretch instead of vanishing and warping the axis order.
 */
export function lastMonths(n: number, end: Date = new Date()): string[] {
  const anchor = new Date(end.getFullYear(), end.getMonth(), 1);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

/** Reindex "YYYY-MM"-labelled tallies onto exactly `months`, filling gaps with 0. */
export function fillMonths(tallies: Tally[], months: string[]): Tally[] {
  const byKey = new Map(tallies.map((t) => [t.label, t.value]));
  return months.map((label) => ({ label, value: byKey.get(label) ?? 0 }));
}

/**
 * Two-way tally (e.g. gender × department) shaped for {@link multiBarSpec}:
 * one row per group, one field per series value, sorted by row total desc.
 */
export function crossTab<T>(
  rows: T[],
  groupKey: (r: T) => string | null | undefined,
  seriesKey: (r: T) => string | null | undefined,
): { data: Record<string, unknown>[]; series: ChartSeries[] } {
  const groups = new Map<string, Map<string, number>>();
  const seriesSet = new Set<string>();
  for (const r of rows) {
    const g = (groupKey(r) ?? "").toString().trim() || "—";
    const s = (seriesKey(r) ?? "").toString().trim() || "—";
    seriesSet.add(s);
    const m = groups.get(g) ?? new Map<string, number>();
    m.set(s, (m.get(s) ?? 0) + 1);
    groups.set(g, m);
  }
  const seriesNames = Array.from(seriesSet);
  const data = Array.from(groups, ([group, m]) => {
    const row: Record<string, unknown> = { group };
    for (const s of seriesNames) row[s] = m.get(s) ?? 0;
    return row;
  }).sort((a, z) => {
    const total = (r: Record<string, unknown>) =>
      seriesNames.reduce((s, k) => s + (Number(r[k]) || 0), 0);
    return total(z) - total(a);
  });
  const series: ChartSeries[] = seriesNames.map((name, i) => ({
    key: name,
    label: name,
    color: paletteColor(i),
  }));
  return { data, series };
}

/**
 * Like {@link crossTab}, but grouped by calendar month instead of a category.
 * Pass `months` (e.g. from {@link lastMonths}) to reindex onto a fixed,
 * gap-filled window instead of only the months rows happen to land in —
 * otherwise a sparse dataset produces a trend whose x-axis silently skips
 * years, reading as nonsense (labels look out of order once the year is
 * dropped for display).
 */
export function byMonthCross<T>(
  rows: T[],
  date: (r: T) => string | null | undefined,
  seriesKey: (r: T) => string | null | undefined,
  months?: string[],
): { data: Record<string, unknown>[]; series: ChartSeries[] } {
  const buckets = new Map<string, Map<string, number>>();
  const seriesSet = new Set<string>();
  for (const r of rows) {
    const d = (date(r) ?? "").toString();
    if (d.length < 7) continue;
    const k = d.slice(0, 7);
    const s = (seriesKey(r) ?? "").toString().trim() || "—";
    seriesSet.add(s);
    const m = buckets.get(k) ?? new Map<string, number>();
    m.set(s, (m.get(s) ?? 0) + 1);
    buckets.set(k, m);
  }
  const seriesNames = Array.from(seriesSet);
  const keys = months ?? Array.from(buckets.keys()).sort();
  const data = keys.map((ym) => {
    const m = buckets.get(ym);
    const row: Record<string, unknown> = { month: monthLabel(ym) };
    for (const s of seriesNames) row[s] = m?.get(s) ?? 0;
    return row;
  });
  const series: ChartSeries[] = seriesNames.map((name, i) => ({
    key: name,
    label: name,
    color: paletteColor(i),
  }));
  return { data, series };
}

/** "2026-03" → "Mar". */
export function monthLabel(ym: string): string {
  const month = Number(ym.slice(5, 7));
  return (
    [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][month - 1] ?? ym
  );
}

function detailsFromTallies(rows: Tally[], opts: { pct?: boolean; money?: boolean } = {}): ChartDetail[] {
  return rows.map((r, i) => ({
    label: r.label,
    value: r.value,
    color: paletteColor(i),
    pct: opts.pct,
    money: opts.money,
  }));
}

/** Bar chart spec from {label,value} tallies. */
export function barSpec(
  title: string,
  rows: Tally[],
  opts: {
    valueLabel?: string;
    layout?: "vertical" | "horizontal";
    money?: boolean;
  } & Chrome = {},
): ReportChartSpec {
  const data = rows.map((r, i) => ({
    category: r.label,
    value: r.value,
    fill: paletteColor(i),
  }));
  return {
    kind: "bar",
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    money: opts.money,
    layout: opts.layout ?? "vertical",
    data,
    details: detailsFromTallies(rows, { money: opts.money }),
  };
}

/** Grouped or stacked multi-series bar chart. */
export function multiBarSpec(
  title: string,
  data: Record<string, unknown>[],
  series: ChartSeries[],
  xAxisKey: string,
  opts: { stacked?: boolean; money?: boolean } & Chrome = {},
): ReportChartSpec {
  return {
    kind: "multibar",
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    stacked: opts.stacked,
    money: opts.money,
    data,
    series,
    xAxisKey,
    details: series.map((s) => ({
      label: s.label,
      value: data.reduce((acc, d) => acc + (Number(d[s.key]) || 0), 0),
      color: s.color,
      money: opts.money,
    })),
  };
}

/** Donut (pie) spec from {label,value} tallies, with center total + %. */
export function pieSpec(
  id: string,
  title: string,
  rows: Tally[],
  opts: { centerLabel?: string } & Chrome = {},
): ReportChartSpec {
  const data = rows.map((r, i) => ({
    key: slug(r.label) + "_" + i,
    label: r.label,
    value: r.value,
    fill: paletteColor(i),
  }));
  return {
    kind: "pie",
    id,
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    centerLabel: opts.centerLabel,
    data,
    details: detailsFromTallies(rows, { pct: true }),
  };
}

/** Alias for {@link pieSpec} — donut with center total. */
export const donutSpec = pieSpec;

/** Line/area chart spec from a series of {x, ...values} rows. */
export function lineSpec(
  title: string,
  data: Record<string, unknown>[],
  series: ChartSeries[],
  xAxisKey: string,
  kind: "line" | "area" = "line",
  opts: { money?: boolean } & Chrome = {},
): ReportChartSpec {
  return {
    kind,
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    money: opts.money,
    data,
    series,
    xAxisKey,
    details: series.map((s) => ({
      label: s.label,
      value: data.reduce((acc, d) => acc + (Number(d[s.key]) || 0), 0),
      color: s.color,
      money: opts.money,
    })),
  };
}

/** Radial gauge / concentric chart from labelled values. */
export function radialSpec(
  title: string,
  series: RadialSeriesItem[],
  opts: { centerLabel?: string; details?: ChartDetail[] } & Chrome = {},
): ReportChartSpec {
  return {
    kind: "radial",
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    centerLabel: opts.centerLabel,
    series,
    details:
      opts.details ??
      series.map((s) => ({
        label: s.label,
        value: s.value,
        color: s.color,
      })),
  };
}

/** Radar (multi-axis) comparison chart. */
export function radarSpec(
  title: string,
  data: Record<string, unknown>[],
  series: ChartSeries[],
  angleKey: string,
  opts: Chrome = {},
): ReportChartSpec {
  return {
    kind: "radar",
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    data,
    series,
    angleKey,
    details: series.map((s) => ({
      label: s.label,
      value:
        Math.round(
          (data.reduce((acc, d) => acc + (Number(d[s.key]) || 0), 0) /
            (data.length || 1)) *
            10,
        ) / 10,
      color: s.color,
    })),
  };
}

/** Funnel (pipeline) chart from ordered stages. */
export function funnelSpec(
  title: string,
  stages: Tally[],
  opts: Chrome = {},
): ReportChartSpec {
  const data = stages.map((s, i) => ({
    stage: s.label,
    value: s.value,
    fill: paletteColor(i),
  }));
  return {
    kind: "funnel",
    title,
    description: opts.description,
    footer: opts.footer,
    fullWidth: opts.fullWidth,
    data,
    details: stages.map((s, i) => ({
      label: s.label,
      value: s.value,
      color: paletteColor(i),
    })),
  };
}
