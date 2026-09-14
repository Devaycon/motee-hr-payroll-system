"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight, SearchX } from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { Skeleton } from "@/src/components/ui/skeleton";
import { HubHero } from "@/src/components/shared/hub-hero";
import { cn } from "@/src/lib/utils";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { ALL_REPORTS, REPORT_GROUPS } from "@/src/lib/reports/registry";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { AnyReportDef, ReportAnalytics, ReportStat } from "@/src/lib/reports/types";
import { ReportMiniChart, findTrendChart } from "./components/report-mini-chart";

/**
 * The four dashboards an HR admin actually opens every day. Everything else
 * in the catalog is real and just as deep — these are pinned above the rest
 * purely for how often they're checked, not how much they contain.
 */
const FEATURED_IDS = ["employees", "attendance", "leave", "recruitment"];

function statText(stat: ReportStat): string {
  return stat.money ? formatMoneyLocale(Number(stat.value)) : String(stat.value);
}

interface ReportInsight {
  report: AnyReportDef;
  recordCount: number;
  analytics: ReportAnalytics;
}

function FeaturedCard({ insight }: { insight: ReportInsight }) {
  const { report, analytics } = insight;
  const Icon = report.icon;
  const stat = analytics.stats[0] as ReportStat | undefined;
  const trendChart = findTrendChart(analytics.charts);

  return (
    <Link
      href={`/operations/analytics/${report.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground">
          {analytics.charts.length} charts
        </span>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-foreground">{report.label}</h3>
        {report.description && (
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
            {report.description}
          </p>
        )}
      </div>

      {trendChart ? <ReportMiniChart chart={trendChart} /> : <div className="h-11" />}

      <div className="mt-auto flex items-end justify-between gap-2">
        {stat ? (
          <div className="min-w-0">
            <p className="truncate text-xl font-bold leading-none tabular-nums text-foreground">
              {statText(stat)}
            </p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {stat.sub ?? stat.label}
            </p>
          </div>
        ) : (
          <span />
        )}
        {stat?.trend && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
              stat.up
                ? "bg-[#50D34C]/10 text-[#1F8A3B]"
                : "bg-red-500/10 text-red-600",
            )}
          >
            {stat.up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {stat.trend}
          </span>
        )}
      </div>
    </Link>
  );
}

function ReportRow({ insight }: { insight: ReportInsight }) {
  const { report, analytics } = insight;
  const Icon = report.icon;
  const stat = analytics.stats[0] as ReportStat | undefined;

  return (
    <Link
      href={`/operations/analytics/${report.id}`}
      className="flex items-center gap-3.5 border-t border-border px-4 py-3 transition-colors first:border-t-0 hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60"
    >
      <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-foreground">{report.label}</p>
        {report.description && (
          <p className="truncate text-xs text-muted-foreground">{report.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {stat && (
          <span className="hidden text-xs font-semibold tabular-nums text-foreground sm:inline">
            {statText(stat)}{" "}
            <span className="font-normal text-muted-foreground">{stat.label}</span>
          </span>
        )}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
          {analytics.charts.length} charts
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </Link>
  );
}

export function AnalyticsPage() {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const { data: bundle, loading } = useLocaleSection<LocaleBundle>((b) => b);
  const [search, setSearch] = useState("");

  const visibleReports = useMemo(() => {
    const level = accessLevelId
      ? levels.find((l) => l.id === accessLevelId)
      : undefined;
    const canView = (mod: string) => {
      if (!accessLevelId || !level) return true;
      return !!level.permissions.find((p) => p.module === mod)?.access;
    };
    return ALL_REPORTS.filter((r) => canView(r.permission));
  }, [accessLevelId, levels]);

  const insights = useMemo(() => {
    if (!bundle) return null;
    const map = new Map<string, ReportInsight>();
    let totalCharts = 0;
    let totalRecords = 0;
    for (const r of visibleReports) {
      const rows = r.select(bundle);
      const analytics = r.analytics(rows, bundle);
      map.set(r.id, { report: r, recordCount: rows.length, analytics });
      totalCharts += analytics.charts.length;
      totalRecords += rows.length;
    }
    return { map, totalCharts, totalRecords };
  }, [bundle, visibleReports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleReports;
    return visibleReports.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q),
    );
  }, [visibleReports, search]);

  const featured = useMemo(() => {
    if (!insights) return [];
    return FEATURED_IDS.map((id) => filteredReports.find((r) => r.id === id))
      .filter((r): r is AnyReportDef => !!r)
      .map((r) => insights.map.get(r.id))
      .filter((i): i is ReportInsight => !!i);
  }, [filteredReports, insights]);

  const groups = useMemo(() => {
    if (!insights) return [];
    return REPORT_GROUPS.map((group) => {
      const reports = filteredReports.filter(
        (r) => r.group === group && !FEATURED_IDS.includes(r.id),
      );
      const rows = reports
        .map((r) => insights.map.get(r.id))
        .filter((i): i is ReportInsight => !!i);
      return { group, rows };
    }).filter((g) => g.rows.length > 0);
  }, [filteredReports, insights]);

  const visibleCount = featured.length + groups.reduce((s, g) => s + g.rows.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <HubHero
        eyebrow="Live analytics"
        title="Analytics"
        description="Every dataset, distilled into the KPIs and trends that matter — updated the moment your data changes."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search datasets — employees, attendance, recruitment…"
        graphicSrc="/chart-logo.png"
        stats={[
          { label: "Datasets tracked", value: visibleReports.length },
          {
            label: "Charts & KPIs",
            value: loading ? "…" : insights?.totalCharts ?? 0,
          },
          {
            label: "Records analyzed",
            value: loading ? "…" : (insights?.totalRecords ?? 0).toLocaleString(),
          },
        ]}
      />

      {loading || !bundle || !insights ? (
        <div className="grid grid-cols-12 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="col-span-12 h-44 sm:col-span-6 lg:col-span-4" />
          ))}
        </div>
      ) : (
        <>
          {search.trim() && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{visibleCount}</span> of{" "}
              {visibleReports.length} datasets for &ldquo;{search}&rdquo;
            </p>
          )}

          {visibleCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
              <SearchX className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No datasets match &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Try a different term, or clear the search to see everything.
              </p>
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Your daily dashboards
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {featured.map((insight) => (
                      <FeaturedCard key={insight.report.id} insight={insight} />
                    ))}
                  </div>
                </section>
              )}

              <div className="flex flex-col gap-5">
                {groups.map(({ group, rows }) => (
                  <section key={group} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group}
                      </h2>
                      <div className="h-px flex-1 bg-border" />
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {rows.length}
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                      {rows.map((insight) => (
                        <ReportRow key={insight.report.id} insight={insight} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
