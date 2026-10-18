"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ResponsiveBar } from "@nivo/bar";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { HrStatCardsGrid, type HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { cn } from "@/src/lib/utils";
import {
  KPI_BY_ID,
  KPI_DEFS,
  attentionItems,
  buildRows,
  computeKpis,
  formatKpi,
  meetsTarget,
  performanceScore,
  periodRange,
  previousRange,
  regionOf,
  type KpiId,
  type PeriodPreset,
} from "@/src/lib/branches/performance";
import { usePerformanceInput } from "./use-performance";
import {
  BandBadge,
  DataFootnote,
  DeltaBadge,
  KPI_OPTIONS,
  MultiSelect,
  PeriodSelect,
} from "./shared";

const DEFAULT_SHOWN: KpiId[] = ["taskCompletion", "compliance", "overdueTasks", "training", "issues", "attendance"];

/** Organisation-wide KPI dashboard, performance chart and branch rankings. */
export function PerformanceDashboard() {
  const { input, loading, visibleBranchIds, restricted, settings } = usePerformanceInput();
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [regions, setRegions] = useState<string[]>([]);
  const [branchSel, setBranchSel] = useState<string[]>([]);
  const [kpis, setKpis] = useState<KpiId[]>(DEFAULT_SHOWN);
  const [rankBy, setRankBy] = useState<KpiId | "score">("score");

  const regionOptions = useMemo(() => {
    if (!input) return [];
    const set = new Set(input.branches.filter((b) => visibleBranchIds.includes(b.id)).map(regionOf));
    return [...set].sort().map((r) => ({ value: r, label: r }));
  }, [input, visibleBranchIds]);

  const branchOptions = useMemo(
    () =>
      (input?.branches ?? [])
        .filter((b) => visibleBranchIds.includes(b.id))
        .filter((b) => regions.length === 0 || regions.includes(regionOf(b)))
        .map((b) => ({ value: b.id, label: b.name })),
    [input, visibleBranchIds, regions],
  );

  const scopeIds = useMemo(
    () => branchOptions.map((o) => o.value).filter((id) => branchSel.length === 0 || branchSel.includes(id)),
    [branchOptions, branchSel],
  );
  const shown = kpis.length ? kpis : DEFAULT_SHOWN;

  const view = useMemo(() => {
    if (!input) return null;
    const range = periodRange(period, input.asOf);
    const rows = buildRows(input, scopeIds, range, settings.scoreKpis, rankBy);
    const company = computeKpis(input, null, range, scopeIds);
    const prevCompany = computeKpis(input, null, previousRange(range), scopeIds);
    const ids = new Set(input.employees.filter((e) => e.branchId && scopeIds.includes(e.branchId)).map((e) => e.id));
    const tasksCompleted = input.tasks.filter(
      (t) => ids.has(t.assigneeId) && t.status === "done" && t.dueDate >= range.start && t.dueDate <= range.end,
    ).length;
    return {
      range,
      rows,
      company,
      companyScore: performanceScore(company, settings.scoreKpis),
      prevScore: performanceScore(prevCompany, settings.scoreKpis),
      prevCompany,
      tasksCompleted,
      attention: attentionItems(rows, settings.targets, shown),
    };
  }, [input, period, scopeIds, settings.scoreKpis, settings.targets, rankBy, shown]);

  if (loading || !input || !view) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const chartKpi = rankBy;
  const chartTarget = chartKpi === "score" ? null : settings.targets[chartKpi];
  const chartData = view.rows.map((r) => ({
    branch: r.branch.name,
    value: (chartKpi === "score" ? r.score : r.values[chartKpi]) ?? 0,
  }));
  const isPctChart = chartKpi === "score" || KPI_BY_ID[chartKpi].unit === "pct";

  const stats: HrStatCardItem[] = [
    { icon: Building2, label: "Total branches", value: view.rows.length, sub: restricted ? "branches you can access" : "active branches in view" },
    {
      icon: Gauge,
      label: "Overall performance",
      value: formatKpi("score", view.companyScore),
      sub: "mean of score indicators",
      ...trendProps(view.companyScore, view.prevScore, true),
    },
    {
      icon: ShieldCheck,
      label: "Overall compliance",
      value: formatKpi("compliance", view.company.compliance),
      sub: `target ${formatKpi("compliance", settings.targets.compliance)}`,
      ...trendProps(view.company.compliance, view.prevCompany.compliance, true),
    },
    { icon: CheckCircle2, label: "Tasks completed", value: view.tasksCompleted, sub: "due and done in period", zeroSub: "no tasks completed in period" },
    {
      icon: Clock,
      label: "Overdue actions",
      value: view.company.overdueTasks ?? 0,
      sub: "tasks past due, not done",
      tone: (view.company.overdueTasks ?? 0) > 0 ? "amber" : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <PeriodSelect value={period} onChange={setPeriod} />
        <MultiSelect label="Regions" allLabel="All regions" options={regionOptions} value={regions} onChange={(v) => { setRegions(v); setBranchSel([]); }} />
        <MultiSelect label="Branches" allLabel="All branches" options={branchOptions} value={branchSel} onChange={setBranchSel} />
        <MultiSelect label="Indicators" allLabel="All indicators" options={KPI_OPTIONS} value={kpis} onChange={(v) => setKpis(v as KpiId[])} min={1} />
        <Select value={rankBy} onValueChange={(v) => setRankBy(v as KpiId | "score")}>
          <SelectTrigger size="sm" className="h-8 w-[220px] text-xs">
            <span className="text-muted-foreground">Rank by:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score" className="text-xs">Overall score</SelectItem>
            {KPI_DEFS.map((k) => (
              <SelectItem key={k.id} value={k.id} className="text-xs">{k.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{view.range.label}</span>
      </div>

      <HrStatCardsGrid stats={stats} columns={5} />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <ChartCard
          title="Branch performance comparison"
          description={chartKpi === "score" ? "Overall performance score by branch" : `${KPI_BY_ID[chartKpi].label} by branch`}
          icon={Gauge}
        >
          <div className="h-72">
            {chartData.length === 0 ? (
              <p className="py-20 text-center text-sm text-muted-foreground">No branches match these filters.</p>
            ) : (
              <ResponsiveBar
                data={chartData}
                keys={["value"]}
                indexBy="branch"
                margin={{ top: 16, right: 16, bottom: 40, left: 44 }}
                padding={0.3}
                valueScale={{ type: "linear", min: 0, max: isPctChart ? 100 : "auto" }}
                colors={({ data }) => {
                  if (chartKpi === "score") {
                    const v = Number(data.value);
                    return v >= 85 ? "#10b981" : v >= 70 ? "#5192FA" : "#f59e0b";
                  }
                  return meetsTarget(chartKpi, Number(data.value), settings.targets[chartKpi]) ? "#5192FA" : "#f59e0b";
                }}
                borderRadius={4}
                axisLeft={{ tickSize: 0, tickPadding: 6, format: (v) => (isPctChart ? `${v}%` : `${v}`) }}
                axisBottom={{ tickSize: 0, tickPadding: 8 }}
                enableGridY
                labelSkipHeight={14}
                label={(d) => (isPctChart ? `${Math.round(Number(d.value))}%` : `${d.value}`)}
                markers={
                  chartTarget != null
                    ? [{ axis: "y", value: chartTarget, lineStyle: { stroke: "#ef4444", strokeWidth: 1.5, strokeDasharray: "4 4" }, legend: `Target ${formatKpi(chartKpi as KpiId, chartTarget)}`, legendPosition: "top-right", textStyle: { fontSize: 10, fill: "#ef4444" } }]
                    : [{ axis: "y", value: 85, lineStyle: { stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }, legend: "High performing", legendPosition: "top-right", textStyle: { fontSize: 10, fill: "#10b981" } }]
                }
                theme={NIVO_THEME}
                animate={false}
              />
            )}
          </div>
        </ChartCard>

        <div className="flex flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Management attention required</h3>
            <span className="ml-auto rounded-full bg-muted px-2 text-xs tabular-nums">{view.attention.length}</span>
          </div>
          <div className="max-h-80 flex-1 overflow-y-auto">
            {view.attention.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Every branch is meeting its targets on the selected indicators.
              </p>
            ) : (
              view.attention.map((a, i) => (
                <Link
                  key={`${a.branchId}-${a.kpi}-${i}`}
                  href={`/organization/branches/${a.branchId}?tab=performance`}
                  className="flex gap-2 border-b border-border/60 px-4 py-2.5 text-xs last:border-0 hover:bg-muted"
                >
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", a.severity === "high" ? "bg-rose-500" : "bg-amber-500")} />
                  {a.message}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Branch rankings</h3>
          <span className="text-xs text-muted-foreground">
            Change vs {previousRange(view.range).label}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Branch</th>
                <th className="px-3 py-2 text-right font-medium">Score</th>
                <th className="px-3 py-2 text-right font-medium">Change</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                {shown.map((k) => (
                  <th key={k} className="px-3 py-2 text-right font-medium" title={KPI_BY_ID[k].source}>
                    {KPI_BY_ID[k].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.rows.map((r) => (
                <tr key={r.branch.id} className="border-t border-border/60 hover:bg-muted">
                  <td className="px-3 py-2 font-semibold tabular-nums">{r.rank}</td>
                  <td className="px-3 py-2">
                    <Link href={`/organization/branches/${r.branch.id}?tab=performance`} className="font-medium hover:underline">
                      {r.branch.name}
                    </Link>
                    <div className="text-[10px] text-muted-foreground">{r.region} · {r.headcount} people</div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatKpi("score", r.score)}</td>
                  <td className="px-3 py-2 text-right"><DeltaBadge kpi="score" current={r.score} previous={r.previousScore} /></td>
                  <td className="px-3 py-2"><BandBadge score={r.score} /></td>
                  {shown.map((k) => {
                    const ok = meetsTarget(k, r.values[k], settings.targets[k]);
                    return (
                      <td key={k} className={cn("px-3 py-2 text-right tabular-nums", ok === false && "text-rose-600 dark:text-rose-400")}>
                        {formatKpi(k, r.values[k])}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-muted font-medium">
                <td />
                <td className="px-3 py-2">Company average</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatKpi("score", view.companyScore)}</td>
                <td className="px-3 py-2 text-right"><DeltaBadge kpi="score" current={view.companyScore} previous={view.prevScore} /></td>
                <td />
                {shown.map((k) => (
                  <td key={k} className="px-3 py-2 text-right tabular-nums">{formatKpi(k, view.company[k])}</td>
                ))}
              </tr>
              <tr className="bg-muted text-muted-foreground">
                <td />
                <td className="px-3 py-2">Target</td>
                <td colSpan={3} />
                {shown.map((k) => (
                  <td key={k} className="px-3 py-2 text-right tabular-nums">{formatKpi(k, settings.targets[k])}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <DataFootnote asOf={input.asOf} />
    </div>
  );
}

function trendProps(current: number | null, previous: number | null, higherBetter: boolean) {
  if (current == null || previous == null) return {};
  const diff = Math.round((current - previous) * 10) / 10;
  return {
    trend: `${diff >= 0 ? "+" : ""}${diff} pts`,
    up: diff >= 0 === higherBetter,
    trendPeriod: "vs previous period",
  };
}
