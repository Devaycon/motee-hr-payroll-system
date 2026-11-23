"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { BREAKDOWN_VIEWS, breakdownTable, buildBreakdown, isBreakdownView, type BreakdownRow, type BreakdownView } from "@/src/lib/payroll/breakdowns";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import { usePayrollActions, useRun } from "@/src/lib/payroll/use-payroll";
import { cn } from "@/src/lib/utils";
import { NotSupported, RunStatusBadge, money } from "./components/shared";

/**
 * `/time-payroll/payroll/[runId]/breakdown?view=…` — the drill-down behind the
 * Gross, Deductions, Net, PAYE and pension cards: every employee's share, with
 * bank / PFA / tax details, grouped by payee and downloadable.
 */
export function RunBreakdownPage({ runId }: { runId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const view: BreakdownView = isBreakdownView(search.get("view")) ? (search.get("view") as BreakdownView) : "net";
  const meta = BREAKDOWN_VIEWS.find((v) => v.key === view)!;
  const { run, data, bundle, loading, supported } = useRun(runId);
  const actions = usePayrollActions();
  const [q, setQ] = useState(search.get("q") ?? "");
  const [grouped, setGrouped] = useState(search.get("group") !== "0");

  const people = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e])), [bundle]);
  const profiles = useMemo(() => new Map((data?.profiles ?? []).map((p) => [p.employeeId, p])), [data]);
  const breakdown = useMemo(() => (run ? buildBreakdown(view, run, { people, profiles }) : null), [view, run, people, profiles]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!run || !breakdown) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        This run doesn&apos;t exist. <Link href={PAYROLL_HREF} className="text-primary hover:underline">Back to payroll</Link>
      </p>
    );
  }

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? breakdown.rows.filter((r) => `${r.name} ${r.employeeNumber} ${r.department} ${r.group} ${Object.values(r.cells).join(" ")}`.toLowerCase().includes(needle))
    : breakdown.rows;
  const canGroup = !!meta.groupBy;
  const isGrouped = canGroup && grouped;
  const groups = new Map<string, BreakdownRow[]>();
  for (const r of shown) groups.set(isGrouped ? r.group : "", [...(groups.get(isGrouped ? r.group : "") ?? []), r]);
  const orderedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const sumOf = (rows: BreakdownRow[], key: string) => rows.reduce((s, r) => s + (Number(r.cells[key]) || 0), 0);
  const numericCols = breakdown.columns.filter((c) => c.numeric);

  const setView = (v: BreakdownView) => {
    const p = new URLSearchParams(search.toString());
    p.set("view", v);
    router.replace(`?${p.toString()}`);
  };
  const download = (format: ExportFormat) => {
    const filtered = { ...breakdown, rows: shown, totals: Object.fromEntries(numericCols.map((c) => [c.key, sumOf(shown, c.key)])) };
    writeTable(`${run.period.year}-${String(run.period.month).padStart(2, "0")}-${view}-breakdown`, `${meta.label} breakdown`, breakdownTable(filtered, meta.groupBy), format);
    actions.logExport(run.id, `${meta.label} breakdown (${format.toUpperCase()})`);
    toast.success(`${meta.label} breakdown downloaded`);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`${PAYROLL_HREF}/${run.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {run.title}
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            {meta.label} breakdown <RunStatusBadge status={run.status} />
          </h1>
          <p className="text-xs text-muted-foreground">
            {meta.blurb} {run.status === "draft" || run.status === "in_review" ? "Figures can still change until the run is approved." : "Figures as approved."}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={!shown.length}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-xs" onClick={() => download("xlsx")}>Excel (XLSX)</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => download("csv")}>CSV</DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={() => download("pdf")}>PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* View switcher doubles as a summary of every total in the run. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {BREAKDOWN_VIEWS.map((v) => {
          const total = v.key === view ? breakdown.totals[breakdown.totalKey] : null;
          const figure =
            v.key === "gross" ? run.totals.gross
            : v.key === "deductions" ? run.totals.deductions
            : v.key === "net" ? run.totals.net
            : v.key === "paye" ? run.totals.paye
            : v.key === "employer" ? run.totals.employerCost
            : total;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={cn(
                "rounded-xl bg-card px-3 py-2.5 text-left ring-1 ring-foreground/10 transition hover:ring-primary/50",
                v.key === view && "ring-2 ring-primary",
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{v.label}</p>
              <p className="text-sm font-semibold tabular-nums">{figure === null ? "View" : money(figure)}</p>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {shown.length} {view === "third-party" ? "deduction" : "employee"}
            {shown.length === 1 ? "" : "s"} · total <span className="font-semibold text-foreground tabular-nums">{money(sumOf(shown, breakdown.totalKey))}</span>
          </p>
          <div className="flex items-center gap-3">
            {canGroup && (
              <div className="flex items-center gap-2">
                <Switch id="bd-group" checked={grouped} onCheckedChange={setGrouped} />
                <Label htmlFor="bd-group" className="flex items-center gap-1 text-xs"><Layers className="h-3.5 w-3.5" /> Group by {meta.groupBy?.toLowerCase()}</Label>
              </div>
            )}
            <Input className="h-8 w-60 text-xs" placeholder="Search name, ID, bank, PFA…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Employee ID</th>
                {breakdown.columns.map((c) => (
                  <th key={c.key} className={cn("whitespace-nowrap px-4 py-2 font-medium", c.numeric && "text-right")}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={breakdown.columns.length + 2} className="px-4 py-10 text-center text-muted-foreground">
                    {breakdown.rows.length ? "Nothing matches the search." : "Nothing to show for this run."}
                  </td>
                </tr>
              )}
              {orderedGroups.map(([group, rows]) => (
                <Fragment key={group || "_"}>
                  {isGrouped && (
                    <tr className="border-t bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))]">
                      <td colSpan={2} className="px-4 py-2 font-semibold">
                        {group} <span className="font-normal text-muted-foreground">· {rows.length}</span>
                      </td>
                      {breakdown.columns.map((c) => (
                        <td key={c.key} className="px-4 py-2 text-right font-semibold tabular-nums">{c.numeric ? money(sumOf(rows, c.key)) : ""}</td>
                      ))}
                    </tr>
                  )}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2">
                        <Link href={`${PAYROLL_HREF}/${run.id}/employees/${r.employeeId}`} className="font-medium hover:text-primary hover:underline">{r.name}</Link>
                        <p className="text-[10px] text-muted-foreground">{r.department}</p>
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px]">{r.employeeNumber}</td>
                      {breakdown.columns.map((c) => {
                        const v = r.cells[c.key];
                        const missing = v === "MISSING";
                        return (
                          <td key={c.key} className={cn("whitespace-nowrap px-4 py-2", c.numeric && "text-right tabular-nums", c.mono && "font-mono text-[11px]", missing && "font-medium text-rose-600")}>
                            {c.numeric ? money(Number(v) || 0) : missing ? "Missing" : v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            {shown.length > 0 && (
              <tfoot className="border-t-2 font-semibold">
                <tr>
                  <td colSpan={2} className="px-4 py-2.5">Total</td>
                  {breakdown.columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5 text-right tabular-nums">{c.numeric ? money(sumOf(shown, c.key)) : ""}</td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
