"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { HubHero } from "@/src/components/shared/hub-hero";
import { cn } from "@/src/lib/utils";
import { ALL_REPORTS, REPORT_GROUPS } from "@/src/lib/reports/registry";
import { reportGroupTheme, type ReportGroupTheme } from "@/src/lib/reports/group-theme";
import { gridFillSpans } from "@/src/lib/reports/grid-fill";
import { exportCsv } from "@/src/lib/reports/export";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { AnyReportDef } from "@/src/lib/reports/types";
import { CustomReportModal } from "./components/custom-report-modal";

const EXPORT_FORMAT_COUNT = 5; // CSV, Excel, JSON, Image, PDF
const WIDE_COLUMN_PREVIEW = 4;

function ReportCard({
  report,
  theme,
  rowCount,
  wide,
  className,
  onQuickExport,
}: {
  report: AnyReportDef;
  theme: ReportGroupTheme;
  rowCount: number;
  wide: boolean;
  className: string;
  onQuickExport: (e: React.MouseEvent, r: AnyReportDef) => void;
}) {
  const Icon = report.icon;
  const previewCols = report.columns.slice(0, WIDE_COLUMN_PREVIEW);
  const extraCols = report.columns.length - previewCols.length;

  return (
    <Link href={`/operations/reports/${report.id}`} className={cn(className, "group focus-visible:outline-none")}>
      <Card
        className={cn(
          "relative flex h-full flex-col gap-3 overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-primary/40",
          wide && "lg:flex-row lg:items-center lg:gap-6",
        )}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.bar}`} />
        <div className="flex items-center justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.bg} ${theme.text} transition-transform group-hover:scale-105`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1">
            {!wide && (
              <Button
                variant="ghost"
                size="icon"
                title="Quick export as CSV"
                onClick={(e) => onQuickExport(e, report)}
                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            <ArrowRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground",
                wide && "lg:hidden",
              )}
            />
          </div>
        </div>
        <div className={cn("flex flex-col gap-1", wide && "lg:flex-1")}>
          <h3 className="text-base font-semibold text-foreground">{report.label}</h3>
          {report.description && (
            <p className={cn("text-sm leading-relaxed text-muted-foreground", !wide && "line-clamp-2")}>
              {report.description}
            </p>
          )}
          {wide && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {previewCols.map((c) => (
                <span
                  key={c.key}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {c.header}
                </span>
              ))}
              {extraCols > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  +{extraCols} more
                </span>
              )}
            </div>
          )}
        </div>
        <p className={cn("mt-auto pt-1 text-xs text-muted-foreground", wide && "lg:mt-0 lg:shrink-0 lg:pt-0")}>
          <span className="font-semibold text-foreground">{rowCount.toLocaleString()}</span> records ·{" "}
          <span className="font-semibold text-foreground">{report.columns.length}</span> columns
        </p>
        {wide && (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={(e) => onQuickExport(e, report)}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground lg:block" />
          </div>
        )}
      </Card>
    </Link>
  );
}

export function ReportsPage() {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const { data: bundle, loading } = useLocaleSection<LocaleBundle>((b) => b);
  const [customOpen, setCustomOpen] = useState(false);
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

  const rowsByReport = useMemo(() => {
    if (!bundle) return null;
    const map = new Map<string, Record<string, unknown>[]>();
    let totalRecords = 0;
    let totalColumns = 0;
    for (const r of visibleReports) {
      const rows = r.select(bundle);
      map.set(r.id, rows);
      totalRecords += rows.length;
      totalColumns += r.columns.length;
    }
    return { map, totalRecords, totalColumns };
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

  function quickExport(e: React.MouseEvent, r: AnyReportDef) {
    e.preventDefault();
    e.stopPropagation();
    const rows = rowsByReport?.map.get(r.id) ?? [];
    if (rows.length === 0) {
      toast.error("Nothing to export — this dataset has no records yet.");
      return;
    }
    exportCsv(r.id, r.columns, rows);
    toast.success(`Exported ${rows.length} rows from ${r.label} as CSV`);
  }

  return (
    <div className="flex flex-col gap-6">
      <HubHero
        eyebrow="Export-ready"
        title="Reports"
        description="Filter, shape and export any dataset — or build your own report from scratch in a couple of clicks."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search datasets — employees, attendance, recruitment…"
        stats={[
          { label: "Datasets", value: visibleReports.length },
          { label: "Export formats", value: EXPORT_FORMAT_COUNT },
          {
            label: "Columns available",
            value: loading ? "…" : rowsByReport?.totalColumns ?? 0,
          },
          {
            label: "Records available",
            value: loading ? "…" : (rowsByReport?.totalRecords ?? 0).toLocaleString(),
          },
        ]}
        action={
          <Button className="mt-1 gap-1.5" onClick={() => setCustomOpen(true)}>
            <Wand2 className="h-4 w-4" />
            Build Custom Report
          </Button>
        }
      />

      {loading || !bundle ? (
        <div className="grid grid-cols-12 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="col-span-12 h-40 sm:col-span-6 lg:col-span-4" />
          ))}
        </div>
      ) : (
        <>
          {REPORT_GROUPS.map((group) => {
            const reports = filteredReports.filter((r) => r.group === group);
            if (reports.length === 0) return null;
            const theme = reportGroupTheme(group);
            const spans = gridFillSpans(reports.length);
            return (
              <section key={group} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {reports.length}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  {reports.map((r, i) => (
                    <ReportCard
                      key={r.id}
                      report={r}
                      theme={theme}
                      rowCount={rowsByReport?.map.get(r.id)?.length ?? 0}
                      wide={spans[i].wide}
                      className={spans[i].className}
                      onQuickExport={quickExport}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {filteredReports.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-sm font-medium text-foreground">
                No datasets match &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Try a different term, or clear the search to see everything.
              </p>
            </div>
          )}
        </>
      )}

      <CustomReportModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        allowedReportIds={visibleReports.map((r) => r.id)}
      />
    </div>
  );
}
