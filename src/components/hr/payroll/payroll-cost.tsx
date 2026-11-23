"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, GitCompareArrows, Landmark } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { payrollCostYtd, type CostMonth } from "@/src/lib/payroll/drilldowns";
import { writeTable } from "@/src/lib/payroll/exports";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { BarList, ChartCard, ColumnChart, Figure, compactNaira } from "./components/charts";
import { DownloadMenu, RowActions } from "./components/row-actions";
import { NotSupported, money } from "./components/shared";

const COLS: { key: keyof CostMonth; label: string }[] = [
  { key: "gross", label: "Gross pay" },
  { key: "PENSION_ER", label: "Employer pension" },
  { key: "NSITF", label: "NSITF" },
  { key: "ITF", label: "ITF" },
  { key: "health", label: "Health / HMO" },
  { key: "GROUP_LIFE", label: "Group life" },
  { key: "other", label: "Other employer" },
  { key: "employer", label: "Employer contributions" },
  { key: "total", label: "Total cost" },
];

/**
 * `/time-payroll/payroll/cost?year=` — the Payroll Cost YTD card, drilled:
 * gross pay plus every employer contribution, month by month and by
 * department, from final payslips and balances brought forward.
 */
export function PayrollCostPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const router = useRouter();
  const search = useSearchParams();
  const years = useMemo(() => [...new Set((data?.payslips ?? []).filter((p) => p.status === "final").map((p) => p.period.year))].sort((a, b) => b - a), [data]);
  const year = Number(search.get("year")) || years[0] || new Date().getFullYear();
  const people = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e])), [bundle]);
  const cost = useMemo(() => (data ? payrollCostYtd(year, data.payslips, data.openingYtd, people) : null), [data, year, people]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !cost) return <Skeleton className="h-150 w-full rounded-xl" />;

  const regularRun = (m: CostMonth) => data.runs.find((r) => m.runIds.includes(r.id) && r.type === "regular") ?? data.runs.find((r) => m.runIds.includes(r.id));
  const download = (f: "xlsx" | "csv" | "pdf") => {
    const data2 = cost.months.map((m) => [m.label, m.employees, ...COLS.map((c) => m[c.key] as number)]);
    writeTable(
      `payroll-cost-${year}`,
      `Payroll cost ${year}`,
      {
        preamble: [[`Payroll cost — ${year}`], ["Gross pay plus employer contributions, from final payslips"], ...(cost.opening ? [["Brought forward (gross + employer pension)", cost.opening.total]] : []), []],
        headers: ["Month", "Employees", ...COLS.map((c) => c.label)],
        data: data2,
        trailer: [["TOTAL (this payroll)", "", ...COLS.map((c) => cost.totals[c.key as keyof typeof cost.totals])], ["YEAR TO DATE incl. brought forward", "", "", "", "", "", "", "", "", "", cost.total]],
      },
      f,
    );
    actions.logExport("", `Payroll cost ${year} (${f.toUpperCase()})`);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><Landmark className="h-6 w-6 text-primary" /> Payroll cost {year}</h1>
          <p className="text-xs text-muted-foreground">What payroll has cost the company this year: gross pay plus employer pension, NSITF, ITF, health insurance and group life — from final payslips.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Year</Label>
            <Select value={String(year)} onValueChange={(v) => router.replace(`?year=${v}`)}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{(years.length ? years : [year]).map((y) => <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DownloadMenu onDownload={download} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
        <Figure label="Payroll cost YTD" value={compactNaira(cost.total)} sub={cost.opening ? `incl. ${compactNaira(cost.opening.total)} brought forward` : undefined} />
        <Figure label="Gross pay" value={compactNaira(cost.totals.gross + (cost.opening?.gross ?? 0))} />
        <Figure label="Employer contributions" value={compactNaira(cost.totals.employer + (cost.opening?.pensionEmployer ?? 0))} sub="On top of gross pay" />
        <Figure label="Months on this payroll" value={String(cost.months.length)} sub={cost.months.length ? `${cost.months[0].label} – ${cost.months[cost.months.length - 1].label}` : undefined} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Cost by month" description="Gross pay and employer contributions for each finalized month.">
          <ColumnChart
            series={[{ key: "gross", label: "Gross pay" }, { key: "employer", label: "Employer contributions" }]}
            columns={cost.months.map((m) => ({ label: m.label.split(" ")[0].slice(0, 3), parts: [{ key: "gross", value: m.gross }, { key: "employer", value: m.employer }], note: `${m.employees} employees` }))}
          />
        </ChartCard>
        <ChartCard title="By department" description="This payroll's months only.">
          <BarList rows={cost.byDepartment.map((d) => ({ label: d.department, value: d.total, sub: `${d.employees}` }))} />
        </ChartCard>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <p className="border-b px-4 py-3 text-sm font-semibold">Month by month</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Month</th>
                {COLS.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2 text-right font-medium">{c.label}</th>)}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {cost.opening && (
                <tr className="border-t bg-muted/30 text-muted-foreground">
                  <td className="px-4 py-2">Brought forward<span className="block text-[10px]">{cost.opening.employees} employees · previous payroll</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(cost.opening.gross)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(cost.opening.pensionEmployer)}</td>
                  <td colSpan={5} className="px-3 py-2 text-center text-[10px]">Not available from the previous payroll</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(cost.opening.pensionEmployer)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(cost.opening.total)}</td>
                  <td />
                </tr>
              )}
              {cost.months.map((m) => {
                const run = regularRun(m);
                return (
                  <tr key={m.month} className="border-t">
                    <td className="px-4 py-2"><span className="font-medium">{m.label}</span><span className="block text-[10px] text-muted-foreground">{m.employees} employees · {m.runIds.length} run{m.runIds.length === 1 ? "" : "s"}</span></td>
                    {COLS.map((c) => <td key={c.key} className={`px-3 py-2 text-right tabular-nums ${c.key === "total" ? "font-semibold" : ""}`}>{money(m[c.key] as number)}</td>)}
                    <td className="px-2 py-2">
                      {run && (
                        <RowActions
                          label={`${m.label} actions`}
                          actions={[
                            { label: "Employer cost breakdown", icon: Eye, href: `${PAYROLL_HREF}/${run.id}/breakdown?view=employer` },
                            { label: "Gross pay breakdown", icon: Eye, href: `${PAYROLL_HREF}/${run.id}/breakdown?view=gross` },
                            { label: "Open the run", icon: Landmark, href: `${PAYROLL_HREF}/${run.id}` },
                            { label: "Compare with previous month", icon: GitCompareArrows, href: `${PAYROLL_HREF}/compare?current=${run.id}`, separated: true },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {!cost.months.length && <tr><td colSpan={COLS.length + 2} className="px-4 py-10 text-center text-muted-foreground">No finalized payroll in {year} yet.</td></tr>}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr>
                <td className="px-4 py-2.5">Total</td>
                {COLS.map((c) => <td key={c.key} className="px-3 py-2.5 text-right tabular-nums">{money(cost.totals[c.key as keyof typeof cost.totals])}</td>)}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
