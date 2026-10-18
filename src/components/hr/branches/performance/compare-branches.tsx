"use client";

import { useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { FileSpreadsheet, FileText, GitCompare, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ChartCard, NIVO_THEME, chartColor } from "@/src/components/shared/charts";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { cn } from "@/src/lib/utils";
import {
  KPI_BY_ID,
  KPI_DEFS,
  computeKpis,
  formatKpi,
  isBetter,
  kpiTrend,
  meetsTarget,
  performanceScore,
  periodRange,
  previousRange,
  trendBuckets,
  type KpiId,
  type PeriodPreset,
} from "@/src/lib/branches/performance";
import { buildReportModel, exportReportXlsx, printReport } from "@/src/lib/branches/performance-report";
import { usePerformanceInput } from "./use-performance";
import { DataFootnote, DeltaBadge, KPI_OPTIONS, MultiSelect, PeriodSelect } from "./shared";

/**
 * Select two or more branches and compare them indicator by indicator, with
 * the company average and organisational target alongside — the client's
 * top-priority request.
 */
export function CompareBranches() {
  const { input, loading, visibleBranchIds, settings } = usePerformanceInput();
  const company = useAppSelector((s) => s.locale.data?.tenant.name) ?? "Company";
  const [selected, setSelected] = useState<string[] | null>(null);
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [kpis, setKpis] = useState<KpiId[]>([]);
  const [trendKpi, setTrendKpi] = useState<KpiId | "score">("score");
  const [grain, setGrain] = useState<"week" | "month">("week");

  const branches = useMemo(
    () => (input?.branches ?? []).filter((b) => visibleBranchIds.includes(b.id)),
    [input, visibleBranchIds],
  );
  // Default to the first two branches so the page opens on a comparison.
  const picked = selected ?? branches.slice(0, 2).map((b) => b.id);
  const shown = kpis.length ? kpis : KPI_DEFS.map((k) => k.id);

  const data = useMemo(() => {
    if (!input) return null;
    const range = periodRange(period, input.asOf);
    const cols = branches
      .filter((b) => picked.includes(b.id))
      .map((b) => {
        const values = computeKpis(input, b.id, range);
        const previous = computeKpis(input, b.id, previousRange(range));
        return {
          branch: b,
          values,
          score: performanceScore(values, settings.scoreKpis),
          prevScore: performanceScore(previous, settings.scoreKpis),
        };
      });
    const avg = computeKpis(input, null, range, visibleBranchIds);
    return { range, cols, avg, avgScore: performanceScore(avg, settings.scoreKpis) };
  }, [input, period, branches, picked, settings.scoreKpis, visibleBranchIds]);

  const trend = useMemo(() => {
    if (!input || !data) return [];
    const buckets = trendBuckets(input.asOf, grain);
    const series = data.cols.map((c, i) => ({
      id: c.branch.name,
      color: chartColor(i),
      data: kpiTrend(input, c.branch.id, trendKpi, buckets, settings.scoreKpis),
    }));
    series.push({
      id: "Company average",
      color: "#94a3b8",
      data: kpiTrend(input, null, trendKpi, buckets, settings.scoreKpis, visibleBranchIds),
    });
    return series;
  }, [input, data, grain, trendKpi, settings.scoreKpis, visibleBranchIds]);

  if (loading || !input || !data) {
    return <Skeleton className="h-96 w-full" />;
  }

  function toggle(id: string) {
    setSelected(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  }

  function exportAs(kind: "pdf" | "excel") {
    if (!input) return;
    if (picked.length < 2) {
      toast.error("Select at least two branches to compare");
      return;
    }
    const model = buildReportModel(input, {
      companyName: company,
      period,
      branchIds: picked,
      kpis: shown,
      scoreKpis: settings.scoreKpis,
      targets: settings.targets,
    });
    model.title = "Branch Comparison Report";
    if (kind === "pdf") {
      if (!printReport(model)) toast.error("Allow pop-ups to download the PDF");
    } else {
      exportReportXlsx(model, `branch-comparison-${input.asOf}`);
    }
  }

  const pctKpis = shown.filter((k) => KPI_BY_ID[k].unit === "pct");
  const barData = pctKpis.map((k) => ({
    indicator: KPI_BY_ID[k].label,
    ...Object.fromEntries(data.cols.map((c) => [c.branch.name, c.values[k] ?? 0])),
  }));
  const trendIsPct = trendKpi === "score" || KPI_BY_ID[trendKpi].unit === "pct";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Select branches to compare</h3>
            <p className="text-xs text-muted-foreground">Pick two or more. {picked.length} selected.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelect value={period} onChange={setPeriod} />
            <MultiSelect label="Indicators" allLabel="All indicators" options={KPI_OPTIONS} value={kpis} onChange={(v) => setKpis(v as KpiId[])} min={1} />
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => exportAs("pdf")}>
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => exportAs("excel")}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => {
            const on = picked.includes(b.id);
            const idx = data.cols.findIndex((c) => c.branch.id === b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggle(b.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                  on ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))] font-medium text-foreground" : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {on && <span className="h-2 w-2 rounded-full" style={{ background: chartColor(idx) }} />}
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {data.cols.length < 2 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          <GitCompare className="mx-auto mb-2 h-6 w-6" />
          Select at least two branches to see them side by side.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Performance indicator</th>
                    {data.cols.map((c, i) => (
                      <th key={c.branch.id} className="px-4 py-2.5 text-right font-semibold text-foreground">
                        <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: chartColor(i) }} />
                        {c.branch.name}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-medium">Company avg</th>
                    <th className="px-4 py-2.5 text-right font-medium">Target</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/60 bg-muted font-semibold">
                    <td className="px-4 py-2.5">Overall score</td>
                    {data.cols.map((c) => (
                      <td key={c.branch.id} className="px-4 py-2.5 text-right tabular-nums">{formatKpi("score", c.score)}</td>
                    ))}
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatKpi("score", data.avgScore)}</td>
                    <td />
                  </tr>
                  {shown.map((k) => {
                    const vals = data.cols.map((c) => c.values[k]).filter((v): v is number => v != null);
                    const best = vals.length ? vals.reduce((a, b) => (isBetter(k, b, a) ? b : a)) : null;
                    const worst = vals.length ? vals.reduce((a, b) => (isBetter(k, a, b) ? b : a)) : null;
                    return (
                      <tr key={k} className="border-t border-border/60">
                        <td className="px-4 py-2.5" title={KPI_BY_ID[k].source}>
                          {KPI_BY_ID[k].label}
                          <div className="text-[10px] text-muted-foreground">{KPI_BY_ID[k].source}</div>
                        </td>
                        {data.cols.map((c) => {
                          const v = c.values[k];
                          const tie = best === worst;
                          return (
                            <td
                              key={c.branch.id}
                              className={cn(
                                "px-4 py-2.5 text-right tabular-nums",
                                !tie && v === best && "font-semibold text-emerald-600 dark:text-emerald-400",
                                !tie && v === worst && "text-rose-600 dark:text-rose-400",
                              )}
                            >
                              {formatKpi(k, v)}
                              {meetsTarget(k, v, settings.targets[k]) === false && (
                                <span className="ml-1 text-[10px] text-muted-foreground">below target</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatKpi(k, data.avg[k])}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatKpi(k, settings.targets[k])}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span><span className="font-semibold text-emerald-600">Green</span> = best of the selection</span>
              <span><span className="text-rose-600">Red</span> = needs most support</span>
              <span>{data.range.label}</span>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Side-by-side indicators" description="Percentage indicators for the selected branches" icon={GitCompare}>
              <div className="h-72">
                <ResponsiveBar
                  data={barData}
                  keys={data.cols.map((c) => c.branch.name)}
                  indexBy="indicator"
                  groupMode="grouped"
                  margin={{ top: 10, right: 10, bottom: 56, left: 40 }}
                  padding={0.25}
                  innerPadding={2}
                  valueScale={{ type: "linear", min: 0, max: 100 }}
                  colors={data.cols.map((_, i) => chartColor(i))}
                  borderRadius={3}
                  axisLeft={{ tickSize: 0, format: (v) => `${v}%` }}
                  axisBottom={{ tickSize: 0, tickPadding: 6, tickRotation: -15 }}
                  enableLabel={false}
                  theme={NIVO_THEME}
                  animate={false}
                  valueFormat={(v) => `${v}%`}
                />
              </div>
            </ChartCard>

            <ChartCard
              title="Performance trend"
              description="Improving or declining over time, against the company average"
              icon={TrendingUp}
              action={
                <div className="flex gap-1.5">
                  <Select value={trendKpi} onValueChange={(v) => setTrendKpi(v as KpiId | "score")}>
                    <SelectTrigger size="sm" className="h-7 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score" className="text-xs">Overall score</SelectItem>
                      {KPI_DEFS.map((k) => (
                        <SelectItem key={k.id} value={k.id} className="text-xs">{k.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={grain} onValueChange={(v) => setGrain(v as "week" | "month")}>
                    <SelectTrigger size="sm" className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week" className="text-xs">Weekly</SelectItem>
                      <SelectItem value="month" className="text-xs">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveLine
                  data={trend}
                  margin={{ top: 10, right: 16, bottom: 40, left: 40 }}
                  yScale={{ type: "linear", min: trendIsPct ? 0 : "auto", max: trendIsPct ? 100 : "auto" }}
                  colors={(s) => (s as { color: string }).color}
                  axisLeft={{ tickSize: 0, format: (v) => (trendIsPct ? `${v}%` : `${v}`) }}
                  axisBottom={{ tickSize: 0, tickPadding: 6, tickRotation: grain === "week" ? -30 : 0 }}
                  pointSize={5}
                  enableSlices="x"
                  useMesh={false}
                  theme={NIVO_THEME}
                  animate={false}
                  legends={[{ anchor: "top-left", direction: "row", itemWidth: 110, itemHeight: 12, translateY: -10, symbolSize: 8 }]}
                />
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.cols.map((c) => {
              return (
                <div key={c.branch.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-xs text-muted-foreground">{c.branch.name}</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tabular-nums">{formatKpi("score", c.score)}</span>
                    <DeltaBadge kpi="score" current={c.score} previous={c.prevScore} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {c.score != null && data.avgScore != null
                      ? `${Math.abs(c.score - data.avgScore).toFixed(1)} pts ${c.score >= data.avgScore ? "above" : "below"} company average`
                      : "Not enough data"}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <DataFootnote asOf={input.asOf} />
    </div>
  );
}
