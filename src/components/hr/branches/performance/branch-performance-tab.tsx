"use client";

import { useMemo, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { CheckCircle2, FileSpreadsheet, FileText, ListTodo, TrendingUp, XCircle } from "lucide-react";
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
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { cn } from "@/src/lib/utils";
import {
  ACTION_KIND_LABELS,
  KPI_BY_ID,
  KPI_DEFS,
  computeKpis,
  formatKpi,
  kpiTrend,
  meetsTarget,
  outstandingActions,
  performanceScore,
  periodRange,
  previousRange,
  trendBuckets,
  type KpiId,
  type PeriodPreset,
} from "@/src/lib/branches/performance";
import { buildReportModel, exportReportXlsx, printReport } from "@/src/lib/branches/performance-report";
import { usePerformanceInput } from "./use-performance";
import { BandBadge, DataFootnote, DeltaBadge, PeriodSelect } from "./shared";

/** "Performance & Reports" on a single branch: KPIs, trends, actions, targets. */
export function BranchPerformanceTab({ branchId }: { branchId: string }) {
  const { input, loading, visibleBranchIds, settings } = usePerformanceInput();
  const company = useAppSelector((s) => s.locale.data?.tenant.name) ?? "Company";
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [trendKpi, setTrendKpi] = useState<KpiId | "score">("score");
  const [grain, setGrain] = useState<"week" | "month">("week");

  const view = useMemo(() => {
    if (!input) return null;
    const range = periodRange(period, input.asOf);
    const values = computeKpis(input, branchId, range);
    const previous = computeKpis(input, branchId, previousRange(range));
    const avg = computeKpis(input, null, range, visibleBranchIds);
    return {
      range,
      values,
      previous,
      avg,
      score: performanceScore(values, settings.scoreKpis),
      prevScore: performanceScore(previous, settings.scoreKpis),
      avgScore: performanceScore(avg, settings.scoreKpis),
      actions: outstandingActions(input, branchId),
    };
  }, [input, period, branchId, visibleBranchIds, settings.scoreKpis]);

  const trend = useMemo(() => {
    if (!input) return [];
    const buckets = trendBuckets(input.asOf, grain);
    return [
      { id: "This branch", color: "#5192FA", data: kpiTrend(input, branchId, trendKpi, buckets, settings.scoreKpis) },
      { id: "Company average", color: "#94a3b8", data: kpiTrend(input, null, trendKpi, buckets, settings.scoreKpis, visibleBranchIds) },
    ];
  }, [input, branchId, trendKpi, grain, settings.scoreKpis, visibleBranchIds]);

  if (loading || !input || !view) return <Skeleton className="h-96 w-full" />;

  if (!visibleBranchIds.includes(branchId)) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Your role does not include this branch&apos;s performance data.
      </div>
    );
  }

  const branch = input.branches.find((b) => b.id === branchId);

  function exportAs(kind: "pdf" | "excel") {
    if (!input || !branch) return;
    const model = buildReportModel(input, {
      companyName: company,
      period,
      branchIds: [branchId],
      kpis: KPI_DEFS.map((k) => k.id),
      scoreKpis: settings.scoreKpis,
      targets: settings.targets,
    });
    // Compare the branch against the whole company, not just itself.
    model.company = view!.avg;
    model.companyScore = view!.avgScore;
    model.title = `${branch.name} Performance Report`;
    if (kind === "pdf") {
      if (!printReport(model)) toast.error("Allow pop-ups to download the PDF");
    } else {
      exportReportXlsx(model, `${branch.code.toLowerCase()}-performance-${input.asOf}`);
    }
  }

  const trendIsPct = trendKpi === "score" || KPI_BY_ID[trendKpi].unit === "pct";
  const met = KPI_DEFS.filter((k) => meetsTarget(k.id, view.values[k.id], settings.targets[k.id]) === true).length;
  const measured = KPI_DEFS.filter((k) => view.values[k.id] != null).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <PeriodSelect value={period} onChange={setPeriod} />
        <span className="text-xs text-muted-foreground">{view.range.label}</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => exportAs("pdf")}>
            <FileText className="h-3.5 w-3.5" /> PDF report
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => exportAs("excel")}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Overall performance score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">{formatKpi("score", view.score)}</span>
            <DeltaBadge kpi="score" current={view.score} previous={view.prevScore} />
          </div>
          <div className="mt-2"><BandBadge score={view.score} /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">vs company average</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {view.score != null && view.avgScore != null
              ? `${view.score >= view.avgScore ? "+" : ""}${(view.score - view.avgScore).toFixed(1)}`
              : "—"}
            <span className="ml-1 text-sm font-normal text-muted-foreground">pts</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Company average {formatKpi("score", view.avgScore)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Organisational targets met</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {met}<span className="text-base font-normal text-muted-foreground"> / {measured}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500" style={{ width: `${measured ? (met / measured) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Key performance indicators</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Indicator</th>
                <th className="px-4 py-2 text-right font-medium">This branch</th>
                <th className="px-4 py-2 text-right font-medium">Change</th>
                <th className="px-4 py-2 text-right font-medium">Company avg</th>
                <th className="px-4 py-2 text-right font-medium">Target</th>
                <th className="px-4 py-2 text-left font-medium">Against target</th>
              </tr>
            </thead>
            <tbody>
              {KPI_DEFS.map((k) => {
                const v = view.values[k.id];
                const ok = meetsTarget(k.id, v, settings.targets[k.id]);
                return (
                  <tr key={k.id} className="border-t border-border/60">
                    <td className="px-4 py-2.5">
                      {k.label}
                      <div className="text-[10px] text-muted-foreground">{k.source}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatKpi(k.id, v)}</td>
                    <td className="px-4 py-2.5 text-right"><DeltaBadge kpi={k.id} current={v} previous={view.previous[k.id]} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatKpi(k.id, view.avg[k.id])}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatKpi(k.id, settings.targets[k.id])}</td>
                    <td className="px-4 py-2.5">
                      {ok == null ? (
                        <span className="text-xs text-muted-foreground">No data</span>
                      ) : ok ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Met</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400"><XCircle className="h-3.5 w-3.5" /> Below target</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <ChartCard
          title="Trends over time"
          description="This branch against the company average"
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
              margin={{ top: 16, right: 16, bottom: 40, left: 40 }}
              yScale={{ type: "linear", min: trendIsPct ? 0 : "auto", max: trendIsPct ? 100 : "auto" }}
              colors={(s) => (s as { color: string }).color}
              axisLeft={{ tickSize: 0, format: (v) => (trendIsPct ? `${v}%` : `${v}`) }}
              axisBottom={{ tickSize: 0, tickPadding: 6, tickRotation: grain === "week" ? -30 : 0 }}
              pointSize={5}
              enableSlices="x"
              useMesh={false}
              theme={NIVO_THEME}
              animate={false}
              legends={[{ anchor: "top-left", direction: "row", itemWidth: 120, itemHeight: 12, translateY: -14, symbolSize: 8 }]}
            />
          </div>
        </ChartCard>

        <div className="flex flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ListTodo className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Outstanding actions</h3>
            <span className="ml-auto rounded-full bg-muted px-2 text-xs tabular-nums">{view.actions.length}</span>
          </div>
          <div className="max-h-80 flex-1 overflow-y-auto">
            {view.actions.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing outstanding at this branch.</p>
            ) : (
              view.actions.map((a, i) => (
                <div key={i} className="border-b border-border/60 px-4 py-2 text-xs last:border-0">
                  <div className="flex justify-between gap-2">
                    <span className={cn("font-medium", a.kind === "overdue_task" && "text-rose-600 dark:text-rose-400")}>
                      {ACTION_KIND_LABELS[a.kind]}
                    </span>
                    {a.date && <span className="text-muted-foreground">{a.date.slice(0, 10)}</span>}
                  </div>
                  <p>{a.title}</p>
                  <p className="text-muted-foreground">{a.owner}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <DataFootnote asOf={input.asOf} />
    </div>
  );
}
