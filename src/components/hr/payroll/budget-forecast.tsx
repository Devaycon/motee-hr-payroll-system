"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Camera, ChevronDown, ChevronRight, Info, PencilLine, Plus, Trash2, TrendingUp, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { PAYROLL_HREF, PAYROLL_MODULE, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { CATEGORY_META, approvedVersionFor, budgetAlerts, buildForecast, monthLong, type DepartmentForecast, type ExpenditureCategory } from "@/src/lib/payroll/budget";
import { SCENARIO_STATUS_LABELS } from "@/src/lib/payroll/simulation";
import { activeRequisitionsFrom, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { ChartCard, ColumnChart, Figure, compactNaira } from "./components/charts";
import { PayrollCycle } from "./components/payroll-cycle";
import { NotSupported, fmtDate, money, pctArrow } from "./components/shared";

const NONE = "__none__";
const signedC = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${compactNaira(Math.abs(n))}`;
const STATUS: Record<DepartmentForecast["status"], { label: string; cls: string }> = {
  over: { label: "Over budget", cls: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  under: { label: "Under budget", cls: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300" },
  on_track: { label: "On track", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" },
  no_budget: { label: "No budget", cls: "border-border text-muted-foreground" },
};

/**
 * `/time-payroll/payroll/budget?year=&horizon=&scenario=&department=` —
 * Payroll Budget & Forecasting: approved budget against actual payroll and
 * a rolling forecast built from the payroll engine, by department, with the
 * reasons behind every projected overspend.
 */
export function PayrollBudgetPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const router = useRouter();
  const search = useSearchParams();
  const canUse = useCan(PAYROLL_MODULE, "view");
  const canEdit = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const reqList = useAppSelector((s) => s.requisitions.byCountry[s.locale.country]);
  const requests = useAppSelector((s) => s.approvals.requests);
  // Re-derive only when Recruitment or approvals change.
  const requisitions = useMemo(() => activeRequisitionsFrom(reqList, requests), [reqList, requests]);
  const horizon = Number(search.get("horizon") ?? 12);
  const scenarioId = search.get("scenario");
  const [year, setYear] = useState<number | null>(search.get("year") ? Number(search.get("year")) : null);
  const [open, setOpen] = useState<Set<string>>(() => new Set(search.get("department") ? [search.get("department")!] : []));
  const [snapId, setSnapId] = useState<string | null>(null);
  const [hire, setHire] = useState({ title: "", department: "", count: 1, monthlyGross: 500_000, startMonth: "" });
  const [alertText, setAlertText] = useState<string | null>(null);

  const forecast = useMemo(
    () => (data && bundle ? buildForecast({ data, bundle, requisitions, scenarioId, fiscalYear: year ?? undefined, horizon, alertPct: data.settings.budgetAlertPct }) : null),
    [data, bundle, requisitions, scenarioId, year, horizon],
  );

  // Alert department heads and Finance once per breach.
  const alerted = useRef(false);
  useEffect(() => {
    if (!forecast || !data || !canEdit || alerted.current) return;
    alerted.current = true;
    const version = approvedVersionFor(data.budgets, `${forecast.fiscalYear}-01`);
    const due = budgetAlerts(forecast, version?.id ?? null).filter((a) => !data.budgetAlertsSent?.[a.key]);
    if (due.length) actions.sendBudgetAlerts(due);
  }, [forecast, data, canEdit, actions]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!canUse) return <p className="py-20 text-center text-sm text-muted-foreground">Budget & Forecasting is available to payroll and finance users.</p>;
  if (!forecast) return <p className="py-20 text-center text-sm text-muted-foreground">Calculate a regular run first — the forecast starts from a real month.</p>;

  const f = forecast;
  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(search.toString());
    if (v === null) p.delete(k);
    else p.set(k, v);
    router.replace(`?${p.toString()}`);
  };
  const baseYear = data.runs.find((r) => r.id === f.baseRunId)?.period.year ?? f.fiscalYear;
  const years = [...new Set([f.fiscalYear, baseYear, baseYear + 1, ...(data.budgets ?? []).map((b) => b.fiscalYear)])].sort();
  const versionNow = approvedVersionFor(data.budgets, `${f.fiscalYear}-01`);
  const covered = f.coveredMonths;
  const coveredLabel = covered.length ? `${monthLong(covered[0]).split(" ")[0]}–${monthLong(covered[covered.length - 1])}` : "";
  const over = f.departments.filter((d) => d.status === "over");
  const snap = (data.forecastSnapshots ?? []).find((s) => s.id === snapId) ?? null;
  const alertPct = data.settings.budgetAlertPct ?? 5;
  const departments = bundle.departments.map((d) => d.name).sort();
  const n12 = f.next12;
  const answer =
    n12.budget === null
      ? `Based on the current workforce, planned recruitment and salary commitments, payroll will cost ${money(n12.spend, 0)} over the next 12 months. There is no approved budget for this period yet.`
      : `Based on the current workforce, planned recruitment and salary commitments, payroll will cost ${money(n12.spend, 0)} over the next 12 months — ${money(Math.abs(n12.over ?? 0), 0)} ${(n12.over ?? 0) > 0 ? "over" : "within"} the approved budget${n12.budgetMonths < 12 ? ` for the ${n12.budgetMonths} months budgeted so far` : ""}.`;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
          <h1 className="mt-1 text-2xl font-semibold">Payroll Budget & Forecasting</h1>
          <p className="max-w-2xl text-xs text-muted-foreground">Approved budget against actual payroll and a rolling forecast from the payroll engine — leavers, salary changes and planned recruitment included. Forecasts never change live payroll or the approved budget.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Fiscal year">
            <Select value={String(f.fiscalYear)} onValueChange={(v) => { setYear(Number(v)); setParam("year", v); }}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)} className="text-xs">FY{y}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Scenario">
            <Select value={scenarioId ?? NONE} onValueChange={(v) => setParam("scenario", v === NONE ? null : v)}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE} className="text-xs">Committed changes only</SelectItem>
                {(data.scenarios ?? []).map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">+ {s.name} ({SCENARIO_STATUS_LABELS[s.status]})</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          {canEdit && <Button size="sm" variant="outline" className="gap-1.5" asChild><Link href={`${PAYROLL_HREF}/budget/edit${versionNow ? `?version=${versionNow.id}` : ""}`}><PencilLine className="h-3.5 w-3.5" /> Budgets</Link></Button>}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { if (actions.takeForecastSnapshot("manual")) toast.success("Forecast snapshot saved"); }}><Camera className="h-3.5 w-3.5" /> Save snapshot</Button>
        </div>
      </div>

      <PayrollCycle current="predict" />

      {/* The Finance Director's question */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">How much will we spend on employees over the next 12 months, and will we exceed the approved budget?</p>
        <p className="mt-1.5 text-sm leading-relaxed">{answer}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure label="Next 12 months" value={compactNaira(n12.spend)} sub={`${f.window[0]?.label ?? ""} onward`} />
          <Figure label="Approved budget" value={n12.budget === null ? "None" : compactNaira(n12.budget)} sub={n12.budget === null ? "Set one in Budgets" : `${n12.budgetMonths} of 12 months budgeted`} />
          <Figure label="Projected over / under" value={n12.over === null ? "—" : signedC(n12.over)} sub={n12.over === null ? undefined : n12.over > 0 ? "Over budget" : "Within budget"} tone={n12.over === null ? undefined : n12.over > 0 ? "bad" : "good"} />
          <Figure label="Departments at risk" value={String(over.length)} sub={`Over budget by more than ${alertPct}% in FY${f.fiscalYear}`} tone={over.length ? "warn" : "good"} />
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Cost = gross pay + employer contributions. Forecast from {f.baseLabel} on the payroll engine{scenarioId ? `, with ${(data.scenarios ?? []).find((s) => s.id === scenarioId)?.name ?? "the selected scenario"} on top` : ""}.
          {versionNow ? ` Budget: ${versionNow.name}, approved by ${versionNow.approvedBy} on ${fmtDate(versionNow.approvedAt)}.` : ""}
        </p>
      </div>

      {/* Feedback B8: committed vs approved planned vs hypothetical. */}
      <ChartCard
        title={`What the forecast is made of · FY${f.fiscalYear}`}
        description="The remaining months of the year in three layers. Committed is what payroll already owes; approved planned is signed off but not yet in payroll; hypothetical has no approval yet."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(["committed", "approved", "hypothetical"] as ExpenditureCategory[]).map((k) => (
            <div key={k} className="rounded-lg border p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={cn("h-2.5 w-2.5 rounded-sm", k === "committed" ? "bg-primary" : k === "approved" ? "bg-sky-500" : "bg-amber-500")} />
                {CATEGORY_META[k].label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{compactNaira(f.categories.totals[k])}</p>
              <p className="text-[11px] leading-snug text-muted-foreground">{CATEGORY_META[k].definition}</p>
            </div>
          ))}
        </div>
        {f.categories.months.length > 0 && (
          <div className="mt-4">
            <ColumnChart
              series={[{ key: "committed", label: "Committed" }, { key: "approved", label: "Approved planned" }, { key: "hypothetical", label: "Hypothetical" }]}
              columns={f.categories.months.map((m) => ({ label: m.short, note: `committed ${compactNaira(m.committed)} · approved ${compactNaira(m.approved)} · hypothetical ${compactNaira(m.hypothetical)}`, parts: [{ key: "committed", value: m.committed }, { key: "approved", value: Math.max(0, m.approved) }, { key: "hypothetical", value: Math.max(0, m.hypothetical) }] }))}
            />
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground">
          Actual paid so far in FY{f.fiscalYear}: {compactNaira(f.categories.actualYtd)}.
          {f.categories.trend.monthlyChangePct !== null && ` Historical trend over ${f.categories.trend.months} finalized months: ${f.categories.trend.monthlyChangePct >= 0 ? "+" : ""}${f.categories.trend.monthlyChangePct}% a month on average.`}
          {" "}Committed + approved planned + hypothetical = the projected figure above.
        </p>
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-3"
          title={`Budget vs actual vs forecast · FY${f.fiscalYear}`}
          description="Solid: paid. Lighter: in progress or forecast. The dashed line is the approved monthly budget."
        >
          <ColumnChart
            series={[{ key: "cost", label: "Actual / forecast cost" }]}
            marker="Budget"
            columns={f.year.map((r) => ({ label: r.short, muted: r.kind !== "actual", note: r.kind === "none" ? "before MOTEE payroll" : r.kind === "in_progress" ? "in progress" : r.kind, marker: r.budget, parts: [{ key: "cost", value: r.value ?? 0 }] }))}
          />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Figure label="Actual to date" value={compactNaira(f.totals.actualYtd)} />
            <Figure label="Projected" value={compactNaira(f.totals.projected)} sub={coveredLabel} />
            <Figure label="Budget, same months" value={f.totals.budget === null ? "—" : compactNaira(f.totals.budget)} />
            <Figure label="Variance" value={f.totals.variance === null ? "—" : signedC(f.totals.variance)} sub={pctArrow(f.totals.variancePct)} tone={f.totals.variance === null ? undefined : f.totals.variance > 0 ? "bad" : "good"} />
          </div>
          {f.year.some((r) => r.kind === "none") && <p className="mt-2 text-[10px] text-muted-foreground">Months before payroll ran on MOTEE have opening balances only, so they are left out of the comparison.</p>}
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          title="Rolling forecast"
          description="Recalculated from the latest payroll every time a month closes."
          right={
            <div className="flex rounded-md bg-muted p-0.5 text-[11px]">
              {[3, 6, 12].map((h) => (
                <button key={h} type="button" onClick={() => setParam("horizon", String(h))} className={cn("rounded px-2 py-0.5", horizon === h && "bg-card font-medium shadow-sm")}>{h} months</button>
              ))}
            </div>
          }
        >
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="pb-1 font-medium">Month</th><th className="pb-1 text-right font-medium">Forecast</th><th className="pb-1 text-right font-medium">Budget</th><th className="pb-1 text-right font-medium">Variance</th></tr></thead>
            <tbody>
              {f.window.map((w) => (
                <tr key={w.month} className="border-t">
                  <td className="py-1">{w.label}{w.kind === "in_progress" && <span className="ml-1 text-[10px] text-muted-foreground">in progress</span>}</td>
                  <td className="py-1 text-right tabular-nums">{compactNaira(w.value)}</td>
                  <td className="py-1 text-right tabular-nums text-muted-foreground">{w.budget === null ? "—" : compactNaira(w.budget)}</td>
                  <td className={cn("py-1 text-right tabular-nums", w.budget !== null && w.value > w.budget && "text-rose-600")}>{w.budget === null ? "—" : signedC(w.value - w.budget)}</td>
                </tr>
              ))}
              <tr className="border-t font-semibold">
                <td className="py-1">Total</td>
                <td className="py-1 text-right tabular-nums">{compactNaira(f.window.reduce((s, w) => s + w.value, 0))}</td>
                <td className="py-1 text-right tabular-nums">{f.window.some((w) => w.budget !== null) ? compactNaira(f.window.reduce((s, w) => s + (w.budget ?? 0), 0)) : "—"}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </ChartCard>
      </div>

      {/* Forecast intelligence */}
      <div className="rounded-xl border bg-card p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Forecast intelligence</p>
        <ul className="mt-3 space-y-2.5 text-xs">
          {over.map((d) => {
            const months = covered.length || 1;
            const runRate = d.employees.reduce((s, e) => s + e.current, 0);
            const budgetRate = d.budget !== null ? d.budget / months : null;
            const causes = d.drivers.length
              ? d.drivers.map((x) => `${x.label} ${signedC(x.amount)}`).join(", ")
              : budgetRate !== null && runRate > budgetRate
                ? `current monthly cost ${compactNaira(runRate)} is above the monthly budget of ${compactNaira(budgetRate)}`
                : "actual months already paid above budget";
            return (
              <li key={d.department} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span>
                  <span className="font-medium">{d.department}</span> is projected {money(d.variance ?? 0, 0)} ({pctArrow(d.variancePct)}) over budget for {coveredLabel}. Principal causes: {causes}.
                  {d.plannedPositions > 0 && ` ${d.plannedPositions} planned position${d.plannedPositions === 1 ? "" : "s"}.`}
                  <button type="button" className="ml-1 text-primary hover:underline" onClick={() => setOpen((s) => new Set(s).add(d.department))}>See detail</button>
                </span>
              </li>
            );
          })}
          {!over.length && <li className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> No department is projected more than {alertPct}% over budget.</li>}
          {f.drivers.map((d) => (
            <li key={d.label} className="flex gap-2 text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {d.label} changes the FY{f.fiscalYear} forecast by {signedC(d.total)}.</li>
          ))}
          {f.hires.filter((h) => h.late).map((h) => (
            <li key={h.id} className="flex gap-2 text-amber-800 dark:text-amber-300"><UserPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {h.count} × {h.title} ({h.department}) — start date has passed and the position is still unfilled; forecast from {monthLong(h.startMonth)}.</li>
          ))}
        </ul>
        {canEdit && (
          <form
            className="mt-3 flex items-center gap-2 border-t pt-3 text-[11px]"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(alertText);
              if (!alertText || !(n > 0)) return;
              actions.updateSettings({ budgetAlertPct: n });
              setAlertText(null);
              toast.success(`Managers are alerted when a department is forecast more than ${n}% over budget`);
            }}
          >
            <span className="text-muted-foreground">Alert department heads and Finance when a department is forecast more than</span>
            <Input className="h-7 w-16 text-[11px]" placeholder={String(alertPct)} value={alertText ?? ""} onChange={(e) => setAlertText(e.target.value)} />
            <span className="text-muted-foreground">% over budget</span>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" type="submit">Save</Button>
          </form>
        )}
      </div>

      {/* Departments */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Departments · FY{f.fiscalYear}</p>
          <p className="text-[11px] text-muted-foreground">{coveredLabel}: actual for paid months, then forecast. Expand a department for its drivers and employees.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-3 py-2 font-medium">Department</th>
                <th className="px-3 py-2 text-right font-medium">Actual to date</th>
                <th className="px-3 py-2 text-right font-medium">Projected</th>
                <th className="px-3 py-2 text-right font-medium">Budget</th>
                <th className="px-3 py-2 text-right font-medium">Variance</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {f.departments.map((d) => {
                const isOpen = open.has(d.department);
                const toggle = () => setOpen((s) => { const n = new Set(s); if (n.has(d.department)) n.delete(d.department); else n.add(d.department); return n; });
                return (
                  <Fragment key={d.department}>
                    <tr className={cn("border-t", isOpen && "bg-muted/30")}>
                      <td className="px-2 py-2"><button type="button" onClick={toggle} aria-expanded={isOpen} aria-label="Details" className="rounded p-0.5 text-muted-foreground hover:bg-muted">{isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button></td>
                      <td className="px-3 py-2"><span className="font-medium">{d.department}</span><span className="block text-[10px] text-muted-foreground">{d.costCentre}{d.plannedPositions ? ` · ${d.plannedPositions} planned` : ""}</span></td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{money(d.actualYtd, 0)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{money(d.projected, 0)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.budget === null ? "—" : money(d.budget, 0)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", (d.variance ?? 0) > 0 && "text-rose-600")}>{d.variance === null ? "—" : signedC(d.variance)}<span className="block text-[10px] text-muted-foreground">{pctArrow(d.variancePct)}</span></td>
                      <td className="px-3 py-2"><Badge variant="outline" className={cn("text-[10px]", STATUS[d.status].cls)}>{STATUS[d.status].label}</Badge></td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan={6} className="px-3 pb-4">
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                            <div className="rounded-lg border bg-card p-3">
                              <p className="text-[11px] font-semibold">What moves the forecast</p>
                              <ul className="mt-2 space-y-1 text-[11px]">
                                {d.drivers.map((x) => <li key={x.label} className="flex justify-between gap-2"><span>{x.label}</span><span className="tabular-nums">{signedC(x.amount)}</span></li>)}
                                {!d.drivers.length && <li className="text-muted-foreground">No planned changes — the forecast is the current run-rate.</li>}
                              </ul>
                            </div>
                            <div className="overflow-hidden rounded-lg border bg-card">
                              <p className="border-b px-3 py-2 text-[11px] font-semibold">Employees · monthly cost</p>
                              <div className="max-h-64 overflow-auto">
                                <table className="w-full text-[11px]">
                                  <tbody>
                                    {d.employees.map((e) => (
                                      <tr key={e.employeeId} className="border-t first:border-t-0">
                                        <td className="px-3 py-1">{e.name}{e.changes.length > 0 && <span className="block text-[10px] text-muted-foreground">{e.changes.join(" · ")}</span>}</td>
                                        <td className="px-3 py-1 text-right tabular-nums text-muted-foreground">{money(e.current, 0)}</td>
                                        <td className="px-3 py-1 text-right tabular-nums">{money(e.projected, 0)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Planned recruitment */}
        <ChartCard title="Planned recruitment" description="Approved, open requisitions from Recruitment plus hires Finance plans here. Each is costed on the payroll engine from its start month.">
          <ul className="divide-y text-xs">
            {f.hires.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0">
                  <span className="font-medium">{h.count} × {h.title}</span>
                  <span className="block text-[10px] text-muted-foreground">{h.department} · {money(h.monthlyGross, 0)}/month each · from {monthLong(h.startMonth)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">{h.source === "requisition" ? "Requisition" : "Planned"}</Badge>
                  {h.late && <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-800 dark:text-amber-300">Unfilled</Badge>}
                  {h.source === "planned" && canEdit && <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Remove" onClick={() => actions.removePlannedHire(h.id)}><Trash2 className="h-3 w-3" /></Button>}
                </span>
              </li>
            ))}
            {!f.hires.length && <li className="py-2 text-muted-foreground">No planned recruitment. Approved requisitions in Recruitment appear here automatically.</li>}
          </ul>
          {canEdit && (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 sm:grid-cols-5">
              <Field label="Role"><Input className="h-8 text-xs" value={hire.title} onChange={(e) => setHire({ ...hire, title: e.target.value })} placeholder="e.g. Data analyst" /></Field>
              <Field label="Department">
                <Select value={hire.department || NONE} onValueChange={(v) => setHire({ ...hire, department: v === NONE ? "" : v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE} className="text-xs">Choose…</SelectItem>{departments.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="How many"><Input type="number" min={1} className="h-8 text-xs" value={hire.count} onChange={(e) => setHire({ ...hire, count: Math.max(1, Math.round(Number(e.target.value) || 1)) })} /></Field>
              <Field label="Gross ₦/month each"><Input type="number" className="h-8 text-xs" value={hire.monthlyGross} onChange={(e) => setHire({ ...hire, monthlyGross: Number(e.target.value) || 0 })} /></Field>
              <Field label="Start">
                <Select value={hire.startMonth || f.window[1]?.month || f.window[0]?.month} onValueChange={(v) => setHire({ ...hire, startMonth: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{f.window.filter((w) => w.kind === "forecast").map((w) => <SelectItem key={w.month} value={w.month} className="text-xs">{w.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Button
                size="sm"
                className="col-span-2 gap-1 sm:col-span-5 sm:justify-self-end"
                disabled={!hire.title.trim() || !hire.department || hire.monthlyGross <= 0}
                onClick={() => {
                  actions.addPlannedHire({ ...hire, title: hire.title.trim(), startMonth: hire.startMonth || f.window[1]?.month || f.window[0].month });
                  setHire({ title: "", department: "", count: 1, monthlyGross: 500_000, startMonth: "" });
                  toast.success("Planned hire added to the forecast");
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add planned hire
              </Button>
            </div>
          )}
        </ChartCard>

        {/* Snapshots */}
        <ChartCard title="Forecast history" description="A snapshot is kept every time a month closes, and whenever you save one. Compare how the forecast has moved.">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Compare with">
              <Select value={snapId ?? NONE} onValueChange={(v) => setSnapId(v === NONE ? null : v)}>
                <SelectTrigger className="h-8 w-64 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE} className="text-xs">Choose a snapshot…</SelectItem>
                  {(data.forecastSnapshots ?? []).map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.label} · FY{s.fiscalYear}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {snap ? (
            <table className="mt-3 w-full text-xs">
              <thead className="text-left text-muted-foreground"><tr><th className="pb-1 font-medium">Month</th><th className="pb-1 text-right font-medium">Then</th><th className="pb-1 text-right font-medium">Now</th><th className="pb-1 text-right font-medium">Moved</th></tr></thead>
              <tbody>
                {snap.months.map((m) => {
                  const now = f.year.find((r) => r.month === m.month)?.value ?? null;
                  return (
                    <tr key={m.month} className="border-t">
                      <td className="py-1">{monthLong(m.month)}<span className="ml-1 text-[10px] text-muted-foreground">{m.kind === "forecast" ? "forecast then" : m.kind === "in_progress" ? "in progress then" : "actual"}</span></td>
                      <td className="py-1 text-right tabular-nums text-muted-foreground">{compactNaira(m.value)}</td>
                      <td className="py-1 text-right tabular-nums">{now === null ? "—" : compactNaira(now)}</td>
                      <td className="py-1 text-right tabular-nums">{now === null ? "—" : signedC(now - m.value)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t font-semibold">
                  <td className="py-1">Total</td>
                  <td className="py-1 text-right tabular-nums">{compactNaira(snap.total)}</td>
                  <td className="py-1 text-right tabular-nums">{snap.fiscalYear === f.fiscalYear ? compactNaira(f.totals.projected) : "—"}</td>
                  <td className="py-1 text-right tabular-nums">{snap.fiscalYear === f.fiscalYear ? signedC(f.totals.projected - snap.total) : "—"}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <ul className="mt-3 space-y-1 text-xs">
              {(data.forecastSnapshots ?? []).slice(0, 6).map((s) => (
                <li key={s.id} className="flex justify-between gap-2"><span>{s.label} <span className="text-[10px] text-muted-foreground">by {s.takenBy}</span></span><span className="tabular-nums">{compactNaira(s.total)}</span></li>
              ))}
              {!(data.forecastSnapshots ?? []).length && <li className="text-muted-foreground">No snapshots yet.</li>}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
