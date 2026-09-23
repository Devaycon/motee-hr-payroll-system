"use client";

import { VenusAndMars } from "lucide-react";
import { ResponsivePie } from "@nivo/pie";
import type { ReportAnalytics, ReportChartSpec, ReportStat } from "@/src/lib/reports/types";
import { HeroRingCard, type RingSegmentData } from "@/src/components/shared/charts";
import { genderSummaryProps } from "@/src/components/shared/charts/gender-summary";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { ReportChartCard, useNivoTheme } from "./report-chart-card";

type PieSpec = Extract<ReportChartSpec, { kind: "pie" }>;
type MultibarSpec = Extract<ReportChartSpec, { kind: "multibar" }>;
type TrendSpec = Extract<ReportChartSpec, { kind: "line" | "area" }>;
type BarSpec = Extract<ReportChartSpec, { kind: "bar" }>;

/**
 * Same icon treatment as the dashboard's "Workforce Status" ring card: the
 * boy/girl illustrations, recoloured to the segment's own colour via a CSS
 * mask, for the two binary genders; a neutral icon for anything else (e.g. a
 * folded-together "Other" bucket, or a raw value like "Non-binary").
 */
function genderRingIcon(label: string, color: string) {
  const l = label.toLowerCase();
  if (l === "male" || l === "female") {
    const src = l === "male" ? "/boy-icon.png" : "/girl-icon.png";
    return (
      <span
        className="block h-full w-full"
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: `url(${src})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
      />
    );
  }
  return <VenusAndMars className="h-full w-full" style={{ color }} />;
}

/**
 * `HeroRingCard` folds anything past its top two segments into a bare
 * "Other" bucket with no icon (by design — it's a generic, domain-agnostic
 * component shared by every ring card in the app, e.g. the dashboard's own
 * Workforce Status widget and the Sickness Absence tile). Rather than change
 * that shared fold for every consumer, this page folds its own overflow
 * genders (anything past male/female) into one "Other" segment *before*
 * handing it to `HeroRingCard`, giving that bucket the same icon treatment
 * every other segment gets here — scoped to this page only.
 */
function foldOtherGenders(segments: RingSegmentData[]): RingSegmentData[] {
  const MAX_DIALS = 3; // matches HeroRingCard's own cap, so its fold is a no-op here
  if (segments.length <= MAX_DIALS) return segments;
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, MAX_DIALS - 1);
  const restValue = sorted.slice(MAX_DIALS - 1).reduce((s, x) => s + x.value, 0);
  return [
    ...top,
    {
      key: "__other",
      label: "Other",
      value: restValue,
      color: "#64748b",
      icon: genderRingIcon("Other", "#64748b"),
    },
  ];
}

function parseLeadingNumber(v: string | number): number {
  const m = String(v).match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

// ── A single read-at-a-glance gap bar ───────────────────────────────────────

function GapBar({ stat, max, tone }: { stat: ReportStat; max: number; tone: string }) {
  const value = parseLeadingNumber(stat.value);
  const pct = Math.min(100, Math.round((Math.abs(value) / max) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{stat.label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{stat.value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
      </div>
      {stat.sub && <p className="text-[11px] text-muted-foreground">{stat.sub}</p>}
    </div>
  );
}

// ── Two labeled bars comparing male vs female for one raw metric ───────────

function CompareBars({ spec }: { spec: BarSpec }) {
  const max = Math.max(...spec.data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-foreground">{spec.title}</h4>
      <div className="flex flex-col gap-1.5">
        {spec.data.map((d) => {
          const pct = Math.max(12, (d.value / max) * 100);
          return (
            <div key={d.category} className="flex items-center gap-2">
              <span
                className="w-24 shrink-0 truncate text-[11px] text-muted-foreground"
                title={d.category}
              >
                {d.category}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
                <div
                  className="flex h-full items-center justify-end rounded-md px-2 text-[10px] font-semibold text-white"
                  style={{ width: `${pct}%`, background: d.fill }}
                >
                  {spec.money ? formatMoneyLocale(d.value) : d.value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── A single share, shown as one dominant bar + one small remainder bar ────

function SplitBarPanel({
  title,
  description,
  majorLabel,
  majorPct,
  minorLabel,
  minorPct,
  tone,
}: {
  title: string;
  description?: string;
  majorLabel: string;
  majorPct: number;
  minorLabel: string;
  minorPct: number;
  tone: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4">
        <div>
          <div className="h-9 w-full overflow-hidden rounded-lg bg-muted">
            <div
              className="flex h-full items-center justify-end rounded-lg px-3 text-sm font-semibold text-white"
              style={{ width: `${Math.max(16, majorPct)}%`, background: tone }}
            >
              {majorPct}%
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{majorLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
            <div
              className="flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-white"
              style={{ width: `${Math.max(20, minorPct)}%`, background: tone, opacity: 0.5 }}
            >
              {minorPct}%
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">{minorLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ── A donut with its slice labels called out on leader lines ───────────────

function LabeledDonut({
  title,
  description,
  data,
  centerLabel,
}: {
  title: string;
  description?: string;
  data: { id: string; label: string; value: number; color: string }[];
  centerLabel: string;
}) {
  const theme = useNivoTheme();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="relative flex-1" style={{ minHeight: 260 }}>
        <ResponsivePie
          data={data}
          margin={{ top: 36, right: 88, bottom: 36, left: 88 }}
          innerRadius={0.62}
          padAngle={1.4}
          cornerRadius={3}
          colors={{ datum: "data.color" }}
          theme={theme}
          enableArcLabels={false}
          enableArcLinkLabels
          arcLinkLabel={(d) => `${d.label} ${Math.round((d.value / total) * 100)}%`}
          arcLinkLabelsSkipAngle={6}
          arcLinkLabelsTextColor={theme.text?.fill as string}
          arcLinkLabelsColor={{ from: "color" }}
          arcLinkLabelsThickness={2}
          arcLinkLabelsDiagonalLength={14}
          arcLinkLabelsStraightLength={14}
          isInteractive
          animate={false}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-foreground">{total.toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ── A category list with one inline bar per gender, side by side ───────────

function TwoToneBars({ spec }: { spec: MultibarSpec }) {
  const max = Math.max(
    ...spec.data.flatMap((d) => spec.series.map((s) => Number(d[s.key]) || 0)),
    1,
  );
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{spec.title}</h3>
        {spec.description && <p className="text-xs text-muted-foreground">{spec.description}</p>}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3">
        {spec.data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
              {String(d[spec.xAxisKey])}
            </span>
            <div className="flex flex-1 items-center gap-3">
              {spec.series.map((s) => {
                const v = Number(d[s.key]) || 0;
                const pct = (v / max) * 100;
                return (
                  <div key={s.key} className="flex flex-1 items-center gap-1.5">
                    <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-border/60 pt-3">
        {spec.series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Plain age distribution — one bar per band, no gender split ─────────────

function AgeDistributionBars({ spec }: { spec: MultibarSpec }) {
  const rows = spec.data.map((d) => ({
    label: String(d[spec.xAxisKey] ?? ""),
    total: spec.series.reduce((s, ser) => s + (Number(d[ser.key]) || 0), 0),
  }));
  const grandTotal = rows.reduce((s, r) => s + r.total, 0) || 1;
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const max = Math.max(...sorted.map((r) => r.total), 1);

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Employee Age Group</h3>
        <p className="text-xs text-muted-foreground">Share of the workforce by age band.</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {sorted.map((r) => {
          const pct = Math.round((r.total / grandTotal) * 100);
          const widthPct = Math.max(8, (r.total / max) * 100);
          return (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">{r.label}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                <div
                  className="flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-white"
                  style={{ width: `${widthPct}%`, background: "#5192FA" }}
                >
                  {pct}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GenderSplitLayout({ analytics }: { analytics: ReportAnalytics }) {
  const { stats, charts } = analytics;

  const pies = charts.filter((c): c is PieSpec => c.kind === "pie");
  const distributionSpec = pies.find((c) => c.title.includes("Distribution"));
  const leaversSpec = pies.find((c) => c.title.includes("Leavers"));
  const regionSpec = pies.find((c) => c.title.includes("Region"));

  const gradeSpec = charts.find(
    (c): c is MultibarSpec => c.kind === "multibar" && c.title.includes("Grade"),
  );
  const ageSpec = charts.find(
    (c): c is MultibarSpec => c.kind === "multibar" && c.title.includes("Age"),
  );
  const hiresSpec = charts.find(
    (c): c is TrendSpec => (c.kind === "line" || c.kind === "area") && c.title.includes("Hires"),
  );
  const avgTenureSpec = charts.find(
    (c): c is BarSpec => c.kind === "bar" && c.title.includes("Avg Tenure"),
  );
  const avgSalarySpec = charts.find(
    (c): c is BarSpec => c.kind === "bar" && c.title.includes("Avg Salary"),
  );

  const candidates: (ReportChartSpec | undefined)[] = [
    distributionSpec,
    leaversSpec,
    regionSpec,
    gradeSpec,
    ageSpec,
    hiresSpec,
    avgTenureSpec,
    avgSalarySpec,
  ];
  const featured = new Set<ReportChartSpec>(
    candidates.filter((x): x is ReportChartSpec => Boolean(x)),
  );
  const rest = charts.filter((c) => !featured.has(c));

  const tenureGapStat = stats.find((s) => s.label.includes("Tenure Gap"));
  const payGapStat = stats.find((s) => s.label.includes("Pay Gap"));
  const maleRepStat = stats.find((s) => s.label === "Male Representation");
  const femaleRepStat = stats.find((s) => s.label === "Female Representation");

  const hiresDonutData = hiresSpec
    ? hiresSpec.series.map((s) => ({
        id: s.key,
        label: s.label,
        value: hiresSpec.data.reduce((sum, d) => sum + (Number(d[s.key]) || 0), 0),
        color: s.color,
      }))
    : [];

  if (!distributionSpec) return null;
  const malePct = maleRepStat ? parseLeadingNumber(maleRepStat.value) : 0;
  const femalePct = femaleRepStat ? parseLeadingNumber(femaleRepStat.value) : 0;

  // The same ring/summary/ranked-breakdown card the dashboard's own
  // "Workforce Status" widget uses, fed this report's own (possibly finer-
  // grained) gender breakdown — folded to an iconed "Other" bucket by
  // `foldOtherGenders` above before `HeroRingCard` ever sees it.
  const genderSegments: RingSegmentData[] = foldOtherGenders(
    distributionSpec.data.map((d) => ({
      key: d.key,
      label: d.label,
      value: d.value,
      color: d.fill,
      icon: genderRingIcon(d.label, d.fill),
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      <HeroRingCard
        title="Workforce Status"
        description="Headcount by gender, across the active roster."
        segments={genderSegments}
        totalNoun="employees"
        {...genderSummaryProps(genderSegments)}
      />

      {/* Left column (tenure/pay gap meters, each paired with the raw
          male-vs-female comparison underneath it) beside two stacked rows
          on the right (representation bars, then donuts) */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 xl:w-[26rem] xl:shrink-0">
          <div className="flex flex-col gap-3">
            {tenureGapStat && <GapBar stat={tenureGapStat} max={5} tone="#5192FA" />}
            {avgTenureSpec && <CompareBars spec={avgTenureSpec} />}
          </div>
          {/* Absorbs whatever extra height xl:items-stretch hands this card
              (the right column is taller once its two rows stack up), so the
              two metric groups stay pinned to the top/bottom and the leftover
              space reads as a deliberate divider, not a dead gap. */}
          <div className="flex flex-1 items-center">
            <div className="h-px w-full bg-border" />
          </div>
          <div className="flex flex-col gap-3">
            {payGapStat && <GapBar stat={payGapStat} max={100} tone="#5192FA" />}
            {avgSalarySpec && <CompareBars spec={avgSalarySpec} />}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {maleRepStat && (
              <SplitBarPanel
                title="Male Representation"
                description="Share of the active workforce."
                majorLabel="Male"
                majorPct={malePct}
                minorLabel="Everyone else"
                minorPct={100 - malePct}
                tone="#5192FA"
              />
            )}
            {femaleRepStat && (
              <SplitBarPanel
                title="Female Representation"
                description="Share of the active workforce."
                majorLabel="Female"
                majorPct={femalePct}
                minorLabel="Everyone else"
                minorPct={100 - femalePct}
                tone="#a855f7"
              />
            )}
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {leaversSpec && (
              <LabeledDonut
                title="Leavers by Gender"
                description={leaversSpec.description}
                data={leaversSpec.data.map((d) => ({ id: d.key, label: d.label, value: d.value, color: d.fill }))}
                centerLabel="Leavers"
              />
            )}
            {hiresDonutData.length > 0 && (
              <LabeledDonut
                title="Hired by Gender"
                description="Joiners over the last 12 months."
                data={hiresDonutData}
                centerLabel="Hired"
              />
            )}
          </div>
        </div>
      </div>

      {/* Age group, region, and job-level split — three panels, one row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {ageSpec && <AgeDistributionBars spec={ageSpec} />}
        {regionSpec && (
          <LabeledDonut
            title="New Hires by Region"
            description={regionSpec.description}
            data={regionSpec.data.map((d) => ({ id: d.key, label: d.label, value: d.value, color: d.fill }))}
            centerLabel="New Hires"
          />
        )}
        {gradeSpec && <TwoToneBars spec={gradeSpec} />}
      </div>

      {/* Everything else the breakdown computed, in the standard chart grid.
          Column count tracks how many cards actually land here, so a
          lighter data set never leaves an empty grid slot beside them. */}
      {rest.length > 0 && (
        <div
          className={`grid grid-cols-1 gap-4 ${
            rest.length >= 3 ? "lg:grid-cols-3" : rest.length === 2 ? "lg:grid-cols-2" : ""
          }`}
        >
          {rest.map((spec) => (
            <ReportChartCard key={spec.title} spec={spec} height={240} compact />
          ))}
        </div>
      )}
    </div>
  );
}
