"use client";

import { ArrowDown, ArrowUp, BarChart3 } from "lucide-react";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";
import type { ReportGroupTheme } from "@/src/lib/reports/group-theme";
import type { ChartDetail, ReportChartSpec, ReportStat } from "@/src/lib/reports/types";
import { HeroRingCard } from "@/src/components/shared/charts";
import { ReportChartCard } from "./report-chart-card";

// ── Layout primitives ───────────────────────────────────────────────────────
// A dense, MI-dashboard-style bento: a hero ring row when the report has a
// radial spec (the "804 SUPPLIERS / 61% CONTRACTED" style opener), then big
// sentence-style summary cards, then a rhythm of "big chart + companion"
// rows, closing with whatever's left packed edge-to-edge.

/** Static literals only — Tailwind's scanner needs the whole class in source. */
const SPAN_CLASS: Record<number, string> = {
  3: "col-span-12 sm:col-span-6 lg:col-span-3",
  4: "col-span-12 sm:col-span-6 lg:col-span-4",
  6: "col-span-12 sm:col-span-6 lg:col-span-6",
  8: "col-span-12 sm:col-span-12 lg:col-span-8",
  12: "col-span-12 sm:col-span-12 lg:col-span-12",
};

function evenSpans(n: number): number[] {
  return Array.from({ length: n }, () => 12 / n);
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function statText(stat: ReportStat): string {
  return stat.money ? formatMoneyLocale(Number(stat.value)) : String(stat.value);
}

// ── Hero ring row ────────────────────────────────────────────────────────────
// Delegates to the shape-agnostic `HeroRingCard` (rings | Analytics Summary |
// Ranked breakdown) — this is the report-registry-specific adapter that
// pulls a `RadialSpec` apart into that generic component's props. The same
// card pattern is reused, undecorated, by the main HR dashboard's tabs.

type RadialSpec = Extract<ReportChartSpec, { kind: "radial" }>;

function HeroRings({ spec }: { spec: RadialSpec }) {
  return (
    <HeroRingCard
      title={spec.title}
      description={spec.description}
      segments={spec.series}
      totalNoun={spec.centerLabel ? spec.centerLabel.toLowerCase() : "total"}
    />
  );
}

// ── Summary / insight cards ──────────────────────────────────────────────────

function InsightCard({ stat, theme }: { stat: ReportStat; theme: ReportGroupTheme }) {
  const Icon = stat.icon ?? BarChart3;
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", theme.bg, theme.text)}>
          <Icon className="h-4 w-4" />
        </div>
        {stat.trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              stat.up ? "bg-[#50D34C]/10 text-[#50D34C]" : "bg-red-600/10 text-red-600",
            )}
          >
            {stat.up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {stat.trend}
          </span>
        )}
      </div>
      <p className="text-base leading-snug font-semibold text-foreground">
        {stat.label} sits at <span className={theme.text}>{statText(stat)}</span>.
      </p>
      {stat.sub && <p className="mt-auto text-xs text-muted-foreground">{stat.sub}</p>}
    </div>
  );
}

// ── Ranked-list fallback for a chart kind already used elsewhere on the page ─

function RankedListCard({
  spec,
  theme,
  columns = 1,
}: {
  spec: ReportChartSpec;
  theme: ReportGroupTheme;
  columns?: number;
}) {
  const details: ChartDetail[] = spec.details ?? [];
  const shown = details.slice(0, columns > 1 ? 9 : 6);
  const overflow = details.length - shown.length;
  const total = details.reduce((s, d) => s + d.value, 0) || 1;
  const fmt = (d: ChartDetail) => (d.money ? formatMoneyLocale(d.value) : d.value.toLocaleString());

  return (
    <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", theme.bar)} />
      <div>
        <h3 className="text-sm font-semibold text-foreground">{spec.title}</h3>
        {spec.description && <p className="text-xs text-muted-foreground">{spec.description}</p>}
      </div>
      <div
        className={cn(
          "flex-1 gap-x-6 gap-y-2.5",
          columns > 1
            ? cn("grid content-evenly", columns === 2 ? "grid-cols-2" : "grid-cols-3")
            : "flex flex-col justify-evenly",
        )}
      >
        {shown.map((d) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <div
              key={d.label}
              className="flex items-center justify-between gap-2 border-b border-border/60 pb-2 text-xs last:border-b-0 last:pb-0"
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate text-foreground">
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: d.color ?? "var(--primary)" }}
                />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-foreground tabular-nums">
                {d.pct ? `${pct}%` : fmt(d)}
              </span>
            </div>
          );
        })}
        {overflow > 0 && (
          <p className="pt-0.5 text-[11px] text-muted-foreground">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

// ── Chart classification ─────────────────────────────────────────────────────

const TREND_KINDS = new Set(["line", "area"]);
const WIDE_KINDS = new Set(["bar", "multibar"]);

interface Cell {
  key: string;
  span: number;
  height?: number;
  render: () => React.ReactNode;
}

function chartCell(spec: ReportChartSpec, span: number, height: number): Cell {
  return {
    key: `${spec.kind}-${spec.title}`,
    span,
    height,
    render: () => <ReportChartCard spec={spec} height={height} compact={span <= 4} fullWidth={false} />,
  };
}

function columnsForSpan(span: number): number {
  if (span >= 8) return 3;
  if (span >= 6) return 2;
  return 1;
}

function rankedCell(spec: ReportChartSpec, span: number, theme: ReportGroupTheme): Cell {
  return {
    key: `ranked-${spec.kind}-${spec.title}`,
    span,
    render: () => <RankedListCard spec={spec} theme={theme} columns={columnsForSpan(span)} />,
  };
}

function CellRow({ cells }: { cells: Cell[] }) {
  const rowHeight = cells.reduce((max, c) => Math.max(max, c.height ?? 0), 0);
  return (
    <div className="grid grid-cols-12 gap-4">
      {cells.map((c) => (
        <div key={c.key} className={SPAN_CLASS[c.span]} style={rowHeight ? { minHeight: rowHeight } : undefined}>
          {c.render()}
        </div>
      ))}
    </div>
  );
}

export function AnalyticsBento({
  stats,
  charts,
  theme,
}: {
  stats: ReportStat[];
  charts: ReportChartSpec[];
  theme: ReportGroupTheme;
}) {
  // 0. Pull the report's own radial spec (if any) into a hero ring row —
  //    the strongest opening motif from the reference dashboards — instead
  //    of treating it as just another compact card.
  const heroRing = charts.find((c): c is RadialSpec => c.kind === "radial");
  const remaining = heroRing ? charts.filter((c) => c !== heroRing) : charts;

  // 1. Classify + dedupe: at most one chart per visual family renders as a
  //    real chart; every repeat becomes a ranked list built from its own
  //    `details`.
  const dedupeKey = (kind: string) => (kind === "area" ? "line" : kind);
  const seenKinds = new Set<string>();
  const trend: ReportChartSpec[] = [];
  const wide: ReportChartSpec[] = [];
  const compact: ReportChartSpec[] = [];
  const rankedSpecs: ReportChartSpec[] = [];

  for (const c of remaining) {
    const key = dedupeKey(c.kind);
    if (seenKinds.has(key)) {
      rankedSpecs.push(c);
      continue;
    }
    seenKinds.add(key);
    if (TREND_KINDS.has(c.kind)) trend.push(c);
    else if (WIDE_KINDS.has(c.kind)) wide.push(c);
    else compact.push(c);
  }
  const hero = trend.shift();
  wide.unshift(...trend);

  const rows: Cell[][] = [];

  // 2. Insight strip: every KPI as a bold, sentence-style summary card.
  for (const group of chunk(stats, 4)) {
    const spans = evenSpans(group.length);
    rows.push(
      group.map((stat, i) => ({
        key: `insight-${stat.label}`,
        span: spans[i],
        render: () => <InsightCard stat={stat} theme={theme} />,
      })),
    );
  }

  // 3. Hero row: the headline trend, paired with the first compact chart.
  if (hero) {
    const partner = compact.shift();
    rows.push(
      partner
        ? [chartCell(hero, 8, 300), chartCell(partner, 4, 300)]
        : [chartCell(hero, 12, 300)],
    );
  }

  // 4. Wide rows: each categorical chart paired with whatever compact
  //    material is left.
  for (const w of wide) {
    const compactPartner = compact.shift();
    const rankedPartner = compactPartner ? undefined : rankedSpecs.shift();
    const partnerCell = compactPartner
      ? chartCell(compactPartner, 4, 280)
      : rankedPartner
        ? rankedCell(rankedPartner, 4, theme)
        : undefined;
    rows.push(partnerCell ? [chartCell(w, 8, 280), partnerCell] : [chartCell(w, 12, 280)]);
  }

  // 5. Everything left over, packed 3-up.
  const leftovers: { spec: ReportChartSpec; ranked: boolean }[] = [
    ...compact.map((spec) => ({ spec, ranked: false })),
    ...rankedSpecs.map((spec) => ({ spec, ranked: true })),
  ];
  for (const group of chunk(leftovers, 3)) {
    const spans = evenSpans(group.length);
    rows.push(
      group.map((item, i) => {
        const span = spans[i];
        return item.ranked
          ? rankedCell(item.spec, span, theme)
          : chartCell(item.spec, span, 240);
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {heroRing && <HeroRings spec={heroRing} />}
      {rows.map((cells, i) => (
        <CellRow key={i} cells={cells} />
      ))}
    </div>
  );
}
