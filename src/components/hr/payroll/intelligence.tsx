"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import {
  COST_DIMENSIONS,
  EMPLOYER_LINES,
  correctionRate,
  costBy,
  employerTrends,
  errorRates,
  explainVariance,
  forecastVsBudget,
  grossToNet,
  headcountMovement,
  monthsOf,
  overtimeByDepartment,
  overtimeCost,
  payEquity,
  processingTimes,
  salaryDistribution,
  yearToDate,
  type CostDimension,
} from "@/src/lib/payroll/intelligence";
import { INVESTIGATIONS_HREF, comparisonCtxOf, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { VarianceSummary } from "./variance-summary";
import { budgetFor } from "@/src/lib/payroll/budget";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { cn } from "@/src/lib/utils";
import { BarList, ChartCard, ColumnChart, Figure, compactNaira } from "./components/charts";
import { money } from "./components/shared";

/**
 * Payroll Intelligence — cost, people, quality and forecast analytics, with
 * every month's change explained by employee and pay element.
 */
export function PayrollIntelligence() {
  const { data, bundle } = useTenantPayroll();
  const actions = usePayrollActions();
  const canSettings = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const months = useMemo(() => monthsOf(data?.runs ?? []), [data]);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [dim, setDim] = useState<CostDimension>("department");
  const [budgetText, setBudgetText] = useState<string | null>(null);

  const finalMonths = months.filter((m) => m.final);
  const selected = months.find((m) => m.month === monthKey) ?? finalMonths[finalMonths.length - 1] ?? months[months.length - 1];
  const people = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e])), [bundle]);
  const states = useMemo(() => new Map((data?.profiles ?? []).map((p) => [p.employeeId, p.stateOfResidence])), [data]);

  if (!data || !bundle) return null;
  if (!months.length) return <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Run payroll to see analytics.</p>;

  const year = Number((selected?.month ?? String(new Date().getFullYear())).slice(0, 4));
  const g2n = grossToNet(months).slice(-12);
  const regularOf = (m: typeof selected) => m?.runs.find((r) => r.type === "regular");
  const selRun = regularOf(selected);
  const prevBucket = months[months.indexOf(selected!) - 1];
  const prevRun = regularOf(prevBucket);
  const story = selRun && prevRun ? explainVariance(selRun, prevRun, comparisonCtxOf(data, bundle)) : null;
  const cost = costBy(selected, dim, bundle, states);
  const heads = headcountMovement(months).slice(-12);
  const ot = overtimeCost(months, data.elements).slice(-12);
  const otDept = overtimeByDepartment(selected, data.elements, people);
  const er = employerTrends(months).slice(-12);
  const dist = salaryDistribution(selRun, data.structures);
  const equity = payEquity(selRun, people, data.structures);
  const quality = errorRates(months, data.audit).slice(-12);
  const corr = correctionRate(data.runs);
  const proc = processingTimes(data.runs);
  const ytd = yearToDate(year, data.payslips, data.openingYtd);
  const fc = forecastVsBudget(months, data.structures, data.settings, year, (m) => budgetFor(data.budgets, data.settings, m));
  const selG2n = g2n.find((m) => m.month === selected?.month);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Every figure traces back to a run and its payslip lines. Months still being prepared are shown lighter.</p>
        <Select value={selected?.month} onValueChange={setMonthKey}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[...months].reverse().map((m) => (
              <SelectItem key={m.month} value={m.month} className="text-xs">{m.label}{m.final ? "" : " (in progress)"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Variance explanation */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Why {selected?.label} changed</p>
          {selRun && prevRun && (
            <span className="flex items-center gap-3">
              <Link href={`${INVESTIGATIONS_HREF}?run=${selRun.id}`} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Investigations</Link>
              <Link href={`${PAYROLL_HREF}/compare?current=${selRun.id}&previous=${prevRun.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Waterfall & full comparison <ArrowRight className="h-3 w-3" /></Link>
            </span>
          )}
        </div>
        {story ? (
          <>
            <div className="mt-3"><VarianceSummary cmp={story.comparison} investigations={data.investigations} /></div>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">By reason</p>
                <BarList rows={story.drivers.map((d) => ({ label: d.label, value: d.amount, sub: `${d.employees} people` }))} emptyText="No movement." />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">Employees who moved it most</p>
                <ul className="space-y-1.5 text-xs">
                  {story.topEmployees.map((e) => (
                    <li key={e.employeeId} className="flex justify-between gap-2">
                      <span className="min-w-0"><span className="font-medium">{e.name}</span><span className="block text-[10px] text-muted-foreground">{e.why}</span></span>
                      <span className={cn("shrink-0 tabular-nums", e.change < 0 && "text-rose-600")}>{e.change > 0 ? "+" : ""}{compactNaira(e.change)}</span>
                    </li>
                  ))}
                  {!story.topEmployees.length && <li className="text-muted-foreground">Nobody&apos;s pay changed.</li>}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">Pay elements that moved</p>
                <BarList rows={story.topElements.map((e) => ({ label: e.label, value: e.change }))} emptyText="No element changed." />
              </div>
            </div>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">There is no earlier month to compare with.</p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* 1 · Gross to net */}
        <ChartCard title="Gross to net by month" description="Where each month's gross pay went.">
          <ColumnChart
            series={[{ key: "net", label: "Net pay" }, { key: "paye", label: "PAYE" }, { key: "pension", label: "Pension" }, { key: "nhf", label: "NHF" }, { key: "other", label: "Other deductions" }]}
            columns={g2n.map((m) => ({ label: m.short, muted: !m.final, note: m.final ? undefined : "in progress", parts: [{ key: "net", value: m.net }, { key: "paye", value: m.paye }, { key: "pension", value: m.pension }, { key: "nhf", value: m.nhf }, { key: "other", value: m.other }] }))}
          />
          {selG2n && (
            <table className="mt-3 w-full text-[11px]">
              <tbody>
                {[["Gross", selG2n.gross], ["PAYE", selG2n.paye], ["Pension (employee + AVC)", selG2n.pension], ["NHF", selG2n.nhf], ["Other deductions", selG2n.other], ["Net pay", selG2n.net]].map(([k, v]) => (
                  <tr key={k as string} className="border-t"><td className="py-1 text-muted-foreground">{k} · {selected?.label}</td><td className="py-1 text-right tabular-nums">{money(v as number)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>

        {/* 2 · Cost by dimension */}
        <ChartCard
          title={`Payroll cost by ${COST_DIMENSIONS.find((d) => d.key === dim)!.label.toLowerCase()}`}
          description={`Gross pay plus employer contributions · ${selected?.label}`}
          right={
            <Select value={dim} onValueChange={(v) => setDim(v as CostDimension)}>
              <SelectTrigger className="h-7 w-40 text-[11px]"><SelectValue /></SelectTrigger>
              <SelectContent>{COST_DIMENSIONS.map((d) => <SelectItem key={d.key} value={d.key} className="text-xs">{d.label}</SelectItem>)}</SelectContent>
            </Select>
          }
        >
          <BarList rows={cost.slice(0, 10).map((c) => ({ label: c.key, value: c.total, sub: `${c.employees} · ${c.share}%` }))} />
          {cost.length > 10 && <p className="mt-2 text-[10px] text-muted-foreground">+ {cost.length - 10} more ({compactNaira(cost.slice(10).reduce((s, c) => s + c.total, 0))})</p>}
        </ChartCard>

        {/* 3 · Headcount */}
        <ChartCard title="Headcount movement" description="Employees paid in each regular run, with joiners and leavers.">
          <ColumnChart format={(n) => String(n)} series={[{ key: "headcount", label: "Paid" }]} columns={heads.map((h) => ({ label: h.short, parts: [{ key: "headcount", value: h.headcount }], note: `+${h.joiners} joiners · −${h.leavers} leavers` }))} height={100} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
            <Figure label="Paid now" value={String(heads[heads.length - 1]?.headcount ?? 0)} />
            <Figure label="Joiners (12 mo)" value={String(heads.reduce((s, h) => s + h.joiners, 0))} />
            <Figure label="Leavers (12 mo)" value={String(heads.reduce((s, h) => s + h.leavers, 0))} />
          </div>
        </ChartCard>

        {/* 4 · Overtime */}
        <ChartCard title="Overtime cost" description="Overtime and shift pay by month, and where it went this month.">
          <ColumnChart series={[{ key: "ot", label: "Overtime" }]} columns={ot.map((o) => ({ label: o.short, parts: [{ key: "ot", value: o.cost }], note: `${o.hours} hrs · ${o.employees} people · ${o.pctOfGross}% of gross` }))} height={100} />
          <div className="mt-3"><BarList rows={otDept.slice(0, 5).map((d) => ({ label: d.department, value: d.cost }))} emptyText={`No overtime in ${selected?.label}.`} /></div>
        </ChartCard>

        {/* 5 · Employer contributions */}
        <ChartCard title="Employer statutory contributions" description="What the company pays on top of gross pay.">
          <ColumnChart series={EMPLOYER_LINES.map((l) => ({ key: l.key, label: l.label }))} columns={er.map((r) => ({ label: r.short, parts: EMPLOYER_LINES.map((l) => ({ key: l.key, value: r[l.key] ?? 0 })) }))} />
        </ChartCard>

        {/* 6 · Salary distribution & equity */}
        <ChartCard
          title="Salary distribution & pay equity"
          description={`Monthly contractual pay · ${selected?.label}`}
          right={<Link href={`${PAYROLL_HREF}/pay-equity`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Pay Equity &amp; Salary Intelligence <ArrowRight className="h-3 w-3" /></Link>}
        >
          <ColumnChart format={(n) => `${n} people`} series={[{ key: "n", label: "Employees" }]} columns={dist.bands.map((b) => ({ label: b.label, parts: [{ key: "n", value: b.count }] }))} height={90} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Figure label="Median" value={compactNaira(dist.median)} />
            <Figure label="90th ÷ 10th" value={`${dist.ratio}×`} sub="Pay spread" />
            <Figure label="Gender pay gap" value={equity.genderGapPct === null ? "—" : `${equity.genderGapPct}%`} sub="Difference in medians" tone={equity.genderGapPct !== null && Math.abs(equity.genderGapPct) > 10 ? "warn" : undefined} />
          </div>
          <table className="mt-3 w-full text-[11px]">
            <thead className="text-left text-muted-foreground"><tr><th className="font-medium">Grade</th><th className="text-right font-medium">People</th><th className="text-right font-medium">Median</th><th className="text-right font-medium">Average</th></tr></thead>
            <tbody>
              {equity.grade.slice(0, 6).map((g) => (
                <tr key={g.group} className="border-t"><td className="py-1">{g.group}</td><td className="py-1 text-right tabular-nums">{g.count}</td><td className="py-1 text-right tabular-nums">{compactNaira(g.median)}</td><td className="py-1 text-right tabular-nums">{compactNaira(g.average)}</td></tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        {/* 7 · Errors & corrections */}
        <ChartCard title="Payroll errors & corrections" description="Exceptions raised per 100 employees paid, and runs that needed correcting.">
          <ColumnChart format={(n) => n.toFixed(1)} series={[{ key: "rate", label: "Exceptions per 100 employees" }]} columns={quality.map((q) => ({ label: q.short, parts: [{ key: "rate", value: q.rate }], note: `${q.errors} errors · ${q.warnings} warnings · ${q.corrections} corrections · ${q.recalculations} recalculations` }))} height={90} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Figure label="Correction rate" value={`${corr.pct}%`} sub={`${corr.corrected} of ${corr.finalized} finalized runs`} tone={corr.pct > 10 ? "warn" : "good"} />
            <Figure label="Errors this month" value={String(quality.find((q) => q.month === selected?.month)?.errors ?? 0)} />
            <Figure label="Acknowledged" value={String(quality.find((q) => q.month === selected?.month)?.acknowledged ?? 0)} sub="With a recorded reason" />
          </div>
        </ChartCard>

        {/* 8 · Processing */}
        <ChartCard title="Processing time & approval performance" description="Days from creating each regular run to paying it.">
          <ColumnChart
            format={(n) => `${n.toFixed(1)} days`}
            series={[{ key: "prepare", label: "Prepare" }, { key: "approve", label: "Approve" }, { key: "finalize", label: "Finalize" }, { key: "pay", label: "Pay" }]}
            columns={proc.rows.slice(-8).map((r) => ({ label: r.short, parts: (["prepare", "approve", "finalize", "pay"] as const).map((k) => ({ key: k, value: r[k] ?? 0 })), note: r.onTime === null ? "not paid yet" : r.onTime ? "paid on time" : "paid late" }))}
            height={100}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Figure label="Average approval time" value={proc.avgApprovalDays === null ? "—" : `${proc.avgApprovalDays} days`} />
            <Figure label="Paid on or before pay day" value={proc.onTimePct === null ? "—" : `${proc.onTimePct}%`} tone={proc.onTimePct !== null && proc.onTimePct < 100 ? "warn" : "good"} />
          </div>
        </ChartCard>

        {/* 9 · YTD */}
        <ChartCard title={`Year to date · ${year}`} description="Every final payslip this tax year, plus balances brought forward from the previous payroll.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Figure label="Gross earnings" value={compactNaira(ytd.gross)} sub={ytd.openingGross ? `${compactNaira(ytd.openingGross)} brought forward` : undefined} />
            <Figure label="PAYE" value={compactNaira(ytd.paye)} />
            <Figure label="Employee pension" value={compactNaira(ytd.pensionEmployee)} />
            <Figure label="Employer pension" value={compactNaira(ytd.pensionEmployer)} />
            <Figure label="NHF" value={compactNaira(ytd.nhf)} />
            <Figure label="Net paid" value={compactNaira(ytd.net)} sub={`${ytd.employees} employees`} />
          </div>
        </ChartCard>

        {/* 10 · Forecast vs budget */}
        <ChartCard
          title={`Forecast against budget · ${year}`}
          description="Actual cost for paid months; the rest forecast from the latest run plus approved and pending salary changes."
          right={
            <div className="flex items-center gap-2">
            <Link href={`${PAYROLL_HREF}/budget`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Budget & Forecasting <ArrowRight className="h-3 w-3" /></Link>
            {canSettings && !data.budgets?.some((b) => b.status === "approved") && (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number((budgetText ?? "").replace(/[^0-9.]/g, ""));
                  if (!n) return;
                  actions.updateSettings({ budget: { monthly: n, months: data.settings.budget?.months ?? {} } });
                  setBudgetText(null);
                  toast.success("Monthly payroll budget saved");
                }}
              >
                <Input className="h-7 w-32 text-[11px]" placeholder={data.settings.budget ? `Budget ${compactNaira(data.settings.budget.monthly)}/mo` : "Monthly budget ₦"} value={budgetText ?? ""} onChange={(e) => setBudgetText(e.target.value)} />
                <Button size="sm" variant="outline" className="h-7 text-[11px]" type="submit">Set</Button>
              </form>
            )}
            </div>
          }
        >
          <ColumnChart
            series={[{ key: "cost", label: "Actual / forecast cost" }]}
            marker={fc.budgetYear !== null ? "Budget" : undefined}
            columns={fc.rows.map((r) => ({ label: r.short, muted: r.actual === null, note: r.actual === null ? "forecast" : "actual", marker: r.budget, parts: [{ key: "cost", value: r.actual ?? r.forecast ?? 0 }] }))}
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Figure label="Actual to date" value={compactNaira(fc.actualYtd)} />
            <Figure label="Full-year forecast" value={compactNaira(fc.forecastYear)} />
            <Figure
              label="Against budget"
              value={fc.budgetYear === null ? "No budget set" : `${fc.forecastYear - fc.budgetYear > 0 ? "+" : ""}${compactNaira(fc.forecastYear - fc.budgetYear)}`}
              sub={fc.budgetYear === null ? undefined : `Budget ${compactNaira(fc.budgetYear)}`}
              tone={fc.budgetYear === null ? undefined : fc.forecastYear > fc.budgetYear ? "bad" : "good"}
            />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
