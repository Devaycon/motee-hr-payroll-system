"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, ChevronDown, Circle, FlaskConical, Gift, Landmark, Plus, Printer, RotateCcw, Save, Send, Settings2, Trash2, Users, Wallet, X, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { PAYROLL_HREF, PAYROLL_MODULE, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import {
  DEDUCTION_LABELS,
  EMPLOYER_KEYS,
  EMPLOYER_KEY_LABELS,
  EMPTY_SCENARIO,
  EVERYONE,
  SALARY_COMPONENT_LABELS,
  SCENARIO_STATUS_LABELS,
  VARIABLE_LABELS,
  isEmptyScenario,
  normalizeScenario,
  simulate,
  type CustomDeduction,
  type SalaryComponent,
  type SavedScenario,
  type Scenario,
  type Scope,
  type SimFigures,
  type SimResult,
  type VariableKind,
} from "@/src/lib/payroll/simulation";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { scenarioBudgetImpact } from "@/src/lib/payroll/budget";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { BarList, ChartCard, ColumnChart, Figure, compactNaira } from "./components/charts";
import { PayrollCycle } from "./components/payroll-cycle";
import { NotSupported, fmtDate, money, pctArrow } from "./components/shared";
import { DownloadMenu } from "./components/row-actions";

const ALL = "__all__";
const CURRENT = "__current__";
const uid = () => Math.random().toString(36).slice(2, 9);
const signed0 = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n), 0)}`;
const signedC = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${compactNaira(Math.abs(n))}`;

/**
 * `/time-payroll/payroll/simulate?scenario=…` — model, compare and forecast
 * payroll changes against a real month. Scenarios can be saved and sent for
 * management review; nothing here is ever applied to live payroll.
 */
export function PayrollSimulationPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const router = useRouter();
  const search = useSearchParams();
  const canUse = useCan(PAYROLL_MODULE, "create");
  const canReview = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const [sc, setSc] = useState<Scenario>(EMPTY_SCENARIO);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const regular = useMemo(() => (data?.runs ?? []).filter((r) => r.type === "regular" && r.employees.some((e) => e.computation)).sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month)), [data]);
  const [baseId, setBaseId] = useState<string | null>(null);
  const base = regular.find((r) => r.id === baseId) ?? regular[0];
  const result = useMemo(() => (data && bundle && base ? simulate(data, bundle, base, sc) : null), [data, bundle, base, sc]);
  const departments = useMemo(() => [...new Set((bundle?.employees ?? []).map((e) => e.departmentName))].sort(), [bundle]);
  const grades = useMemo(() => [...new Set((bundle?.employees ?? []).map((e) => e.grade).filter((g): g is string => !!g))].sort(), [bundle]);
  const names = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e.fullName])), [bundle]);
  const saved = useMemo(() => data?.scenarios ?? [], [data]);
  const current = saved.find((s) => s.id === loadedId) ?? null;

  // Open a saved scenario from the URL (?scenario=…) once data is in.
  const wanted = search.get("scenario");
  const toLoad = wanted && wanted !== loadedId ? saved.find((x) => x.id === wanted) : undefined;
  if (toLoad) {
    // Adjusting state while rendering (React's recommended alternative to an effect).
    setLoadedId(toLoad.id);
    setSc(normalizeScenario(toLoad.scenario));
    setName(toLoad.name);
    setDescription(toLoad.description);
    if (regular.some((r) => r.id === toLoad.baseRunId)) setBaseId(toLoad.baseRunId);
  }

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!canUse) return <p className="py-20 text-center text-sm text-muted-foreground">Payroll simulation is available to payroll users.</p>;
  if (!base || !result) return <p className="py-20 text-center text-sm text-muted-foreground">Calculate a regular run first — the simulation starts from a real month.</p>;

  const set = (c: Partial<Scenario>) => setSc((x) => ({ ...x, ...c }));
  const months = result.months;
  const changed = !isEmptyScenario(sc);
  const budgetMonthly = data.settings.budget ? data.settings.budget.months[months[0].key] ?? data.settings.budget.monthly : null;

  const open = (id: string | null) => {
    const p = new URLSearchParams(search.toString());
    if (id) p.set("scenario", id);
    else p.delete("scenario");
    router.replace(`?${p.toString()}`);
    if (!id) {
      setLoadedId(null);
      setSc(EMPTY_SCENARIO);
      setName("");
      setDescription("");
    }
  };
  const snapshot = () => ({ monthlyCost: result.sim.employerCost, monthlyChange: result.measures.monthlyRecurringChange, total12Change: result.measures.total12Change, headcount: result.simHeadcount });
  const save = (asNew: boolean) => {
    const id = actions.saveScenario({ id: asNew ? undefined : loadedId ?? undefined, name: name || `Scenario ${saved.length + 1}`, description, scenario: sc, baseRunId: base.id, snapshot: snapshot() });
    if (!id) return;
    setLoadedId(id);
    if (!name) setName(`Scenario ${saved.length + 1}`);
    const p = new URLSearchParams(search.toString());
    p.set("scenario", id);
    router.replace(`?${p.toString()}`);
    toast.success(asNew || !loadedId ? "Scenario saved" : "Scenario updated");
  };

  const exportTable = (format: ExportFormat) => {
    const rows = FIGURE_SECTIONS.flatMap((s) => s.rows.filter((r) => r.always || result.base[r.key] || result.sim[r.key]).map((r) => [s.title, r.label, result.base[r.key], result.sim[r.key], result.delta[r.key]]));
    writeTable(
      `payroll-simulation-${(name || "scenario").replace(/\W+/g, "-").toLowerCase()}`,
      "Simulation",
      {
        headers: ["Section", "Item", "Today", "Scenario", "Change"],
        data: rows,
        preamble: [
          [`Payroll simulation — ${name || "unsaved scenario"}`],
          [`Base month: ${base.period.label}`, "Simulation only — not committed to payroll"],
          ["Monthly recurring change", result.measures.monthlyRecurringChange],
          ["One-off impact", result.measures.oneOffImpact],
          ["Annualised recurring change", result.measures.annualisedRecurring],
          ["12-month projected expenditure", result.measures.total12Scenario],
          [],
          ["Month", "Today", "Scenario", "Change", "Headcount"],
          ...result.forecast.map((m) => [m.label, m.base, m.scenario, m.delta, m.headcount]),
          [],
          ["Employee", "Department", "Changes", "Current gross", "Proposed gross", "Current cost", "Proposed cost"],
          ...result.rows.map((r) => [r.name, r.department, r.changes.join("; "), r.base.gross, r.sim.gross, r.base.employerCost, r.sim.employerCost]),
          [],
        ],
      },
      format,
    );
    actions.logExport("", `Payroll simulation — ${name || "unsaved scenario"} (${format.toUpperCase()})`);
    toast.success("Simulation downloaded");
  };

  const counts = {
    salary: (sc.increasePct ? 1 : 0) + (sc.adjustments?.length ?? 0),
    variable: (sc.bonusPct ? 1 : 0) + (sc.variable?.length ?? 0),
    workforce: sc.starters.length + sc.leavers.length + (sc.promotions?.length ?? 0) + (sc.transfers?.length ?? 0),
    attendance: sc.unpaidDays ? 1 : 0,
    statutory: [sc.payeBandDeltaPp || null, sc.employerPensionPct, sc.employeePensionPct, sc.nhfPct, sc.nhfBasis, sc.nsitfPct, sc.itf, sc.groupLife, sc.minimumWage].filter((x) => x !== null && x !== undefined && x !== 0).length,
    deductions: sc.deductions?.length ?? 0,
  };
  const scopeProps = { departments, grades };

  return (
    <div className="flex flex-col gap-5 pb-10 print:gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground print:hidden"><ArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold"><FlaskConical className="h-7 w-7 text-primary" /> Payroll simulation</h1>
          <p className="max-w-2xl text-xs text-muted-foreground">Model, compare and forecast payroll changes before committing anything to live payroll. Every employee is calculated by the payroll engine on a full month.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-800 dark:text-emerald-300">Simulation only</Badge>
            <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-[10px] text-sky-800 dark:text-sky-300">Not committed to payroll</Badge>
            {current && <Badge variant="outline" className="text-[10px]">{SCENARIO_STATUS_LABELS[current.status]}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Label className="text-xs">Base payroll</Label>
          <Select value={base.id} onValueChange={setBaseId}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{regular.map((r) => <SelectItem key={r.id} value={r.id} className="text-xs">{r.title}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!changed && !loadedId} onClick={() => open(null)}><RotateCcw className="h-3.5 w-3.5" /> New</Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild><Link href={`${PAYROLL_HREF}/calculator`}><Calculator className="h-3.5 w-3.5" /> One employee</Link></Button>
        </div>
      </div>

      <div className="print:hidden"><PayrollCycle current="simulate" /></div>

      {/* Scenario bar */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3 print:hidden">
        <Field label="Saved scenarios">
          <Select value={loadedId ?? ALL} onValueChange={(v) => open(v === ALL ? null : v)}>
            <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">Unsaved scenario</SelectItem>
              {saved.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name} · {SCENARIO_STATUS_LABELS[s.status]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Name"><Input className="h-8 w-56 text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 10% salary review 2027" /></Field>
        <Field label="Notes"><Input className="h-8 w-64 text-xs" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose, assumptions" /></Field>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5" disabled={!changed} onClick={() => save(false)}><Save className="h-3.5 w-3.5" /> {loadedId ? "Save changes" : "Save scenario"}</Button>
          {loadedId && <Button size="sm" variant="outline" disabled={!changed} onClick={() => save(true)}>Save as new</Button>}
          {current && (current.status === "draft" || current.status === "rejected") && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { actions.submitScenario(current.id); toast.success("Sent for management review"); }}><Send className="h-3.5 w-3.5" /> Submit for review</Button>
          )}
          <DownloadMenu label="Export" onDownload={exportTable} />
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print page</Button>
        </div>
      </div>

      {current?.status === "submitted" && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-sky-500/40 bg-sky-500/5 p-3 print:hidden">
          <p className="text-xs">
            <span className="font-medium">Awaiting management review.</span> Submitted by {current.submittedBy} on {fmtDate(current.submittedAt)}. Approval marks it approved for planning; live payroll is never changed.
          </p>
          {canReview && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Input className="h-8 w-64 text-xs" placeholder="Review note (required to reject)" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
              <Button size="sm" onClick={() => { const r = actions.decideScenario(current.id, true, reviewNote); if (!r.ok) toast.error(r.reason); else { toast.success("Approved for planning"); setReviewNote(""); } }}>Approve for planning</Button>
              <Button size="sm" variant="outline" onClick={() => { const r = actions.decideScenario(current.id, false, reviewNote); if (!r.ok) toast.error(r.reason); else { toast.success("Scenario rejected"); setReviewNote(""); } }}>Reject</Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* Inputs */}
        <div className="flex flex-col gap-3 print:hidden">
          <Section icon={Wallet} title="Salary adjustments" sub="Basic salary, housing, transport and other allowances." count={counts.salary} defaultOpen>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Increase (%)"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.increasePct || ""} onChange={(e) => set({ increasePct: num(e.target.value) })} placeholder="0" /></Field>
              <Field label="Who"><DeptSelect value={sc.increaseDepartment} departments={departments} onChange={(v) => set({ increaseDepartment: v })} /></Field>
              <MonthSelect months={months} value={sc.increaseFrom} onChange={(v) => set({ increaseFrom: v })} />
            </div>
            <p className="text-[10px] text-muted-foreground">Applies to all fixed recurring pay. Add component-level changes below.</p>
            {(sc.adjustments ?? []).map((a) => (
              <ItemCard key={a.id} onRemove={() => set({ adjustments: sc.adjustments!.filter((x) => x.id !== a.id) })}>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Component">
                    <Select value={a.component} onValueChange={(v) => set({ adjustments: sc.adjustments!.map((x) => (x.id === a.id ? { ...x, component: v as SalaryComponent } : x)) })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(SALARY_COMPONENT_LABELS) as SalaryComponent[]).map((k) => <SelectItem key={k} value={k} className="text-xs">{SALARY_COMPONENT_LABELS[k]}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Change">
                    <Select value={a.mode} onValueChange={(v) => set({ adjustments: sc.adjustments!.map((x) => (x.id === a.id ? { ...x, mode: v as "percent" | "fixed" } : x)) })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percent" className="text-xs">By %</SelectItem><SelectItem value="fixed" className="text-xs">By ₦ / month</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label={a.mode === "percent" ? "%" : "₦ / month"}><Input type="number" className="h-8 text-xs" value={a.value || ""} onChange={(e) => set({ adjustments: sc.adjustments!.map((x) => (x.id === a.id ? { ...x, value: num(e.target.value) } : x)) })} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ScopeFields scope={a.scope} {...scopeProps} onChange={(scope) => set({ adjustments: sc.adjustments!.map((x) => (x.id === a.id ? { ...x, scope } : x)) })} />
                  <MonthSelect months={months} value={a.fromMonth} onChange={(v) => set({ adjustments: sc.adjustments!.map((x) => (x.id === a.id ? { ...x, fromMonth: v } : x)) })} />
                </div>
              </ItemCard>
            ))}
            <AddButton onClick={() => set({ adjustments: [...(sc.adjustments ?? []), { id: uid(), component: "housing", mode: "percent", value: 0, scope: EVERYONE, fromMonth: months[0].key }] })}>Component adjustment</AddButton>
          </Section>

          <Section icon={Gift} title="Variable payments" sub="Bonus, commission, overtime, arrears and one-off payments." count={counts.variable}>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Bonus (% basic)"><Input type="number" step={5} className="h-8 text-xs" value={sc.bonusPct || ""} onChange={(e) => set({ bonusPct: num(e.target.value) })} placeholder="0" /></Field>
              <Field label="Who"><DeptSelect value={sc.bonusDepartment} departments={departments} onChange={(v) => set({ bonusDepartment: v })} /></Field>
              <MonthSelect months={months} label="Paid in" value={sc.bonusMonth} onChange={(v) => set({ bonusMonth: v })} />
            </div>
            {(sc.variable ?? []).map((v) => {
              const upd = (c: Partial<typeof v>) => set({ variable: sc.variable!.map((x) => (x.id === v.id ? { ...x, ...c } : x)) });
              return (
                <ItemCard key={v.id} onRemove={() => set({ variable: sc.variable!.filter((x) => x.id !== v.id) })}>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Type">
                      <Select value={v.kind} onValueChange={(k) => upd({ kind: k as VariableKind, basis: k === "overtime" ? "hours" : v.basis === "hours" ? "fixed" : v.basis, recurring: k === "commission" || k === "overtime" })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(VARIABLE_LABELS) as VariableKind[]).map((k) => <SelectItem key={k} value={k} className="text-xs">{VARIABLE_LABELS[k]}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Basis">
                      <Select value={v.basis} onValueChange={(b) => upd({ basis: b as typeof v.basis })} disabled={v.kind === "overtime"}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {v.kind === "overtime" ? <SelectItem value="hours" className="text-xs">Hours / person</SelectItem> : (
                            <>
                              <SelectItem value="fixed" className="text-xs">₦ / person</SelectItem>
                              <SelectItem value="percent_basic" className="text-xs">% of basic</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Value"><Input type="number" className="h-8 text-xs" value={v.value || ""} onChange={(e) => upd({ value: num(e.target.value) })} /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <ScopeFields scope={v.scope} {...scopeProps} onChange={(scope) => upd({ scope })} />
                    <MonthSelect months={months} label={v.recurring ? "From" : "Paid in"} value={v.month} onChange={(m) => upd({ month: m })} />
                  </div>
                  <label className="flex items-center gap-2 text-[11px]"><Checkbox checked={v.recurring} onCheckedChange={(c) => upd({ recurring: c === true })} /> Every month (otherwise paid once)</label>
                </ItemCard>
              );
            })}
            <AddButton onClick={() => set({ variable: [...(sc.variable ?? []), { id: uid(), kind: "commission", basis: "fixed", value: 0, scope: EVERYONE, month: months[0].key, recurring: true }] })}>Variable payment</AddButton>
          </Section>

          <Section icon={Users} title="Workforce changes" sub="New starters, terminations, promotions and transfers." count={counts.workforce}>
            <SubTitle>New starters</SubTitle>
            {sc.starters.map((st) => {
              const upd = (c: Partial<typeof st>) => set({ starters: sc.starters.map((x) => (x.id === st.id ? { ...x, ...c } : x)) });
              return (
                <ItemCard key={st.id} onRemove={() => set({ starters: sc.starters.filter((x) => x.id !== st.id) })}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Department"><DeptSelect value={st.department} departments={departments} allowAll={false} onChange={(v) => upd({ department: v })} /></Field>
                    <Field label="How many"><Input type="number" min={1} className="h-8 text-xs" value={st.count} onChange={(e) => upd({ count: Math.max(0, Math.round(num(e.target.value))) })} /></Field>
                    <Field label="Gross ₦ / month each"><Input type="number" step={10000} className="h-8 text-xs" value={st.monthlyGross} onChange={(e) => upd({ monthlyGross: num(e.target.value) })} /></Field>
                    <MonthSelect months={months} label="Start" value={st.startMonth} onChange={(v) => upd({ startMonth: v })} />
                  </div>
                </ItemCard>
              );
            })}
            <AddButton onClick={() => set({ starters: [...sc.starters, { id: uid(), department: departments[0] ?? "", count: 1, monthlyGross: 500_000, startMonth: months[0].key }] })}>New starters</AddButton>

            <SubTitle>Terminations</SubTitle>
            <EmployeePicker value="" clearable={false} placeholder="Add a leaver…" excludeIds={sc.leavers} onChange={(e) => e && set({ leavers: [...sc.leavers, e.id], exitMonths: { ...sc.exitMonths, [e.id]: months[0].key } })} />
            {sc.leavers.map((id) => (
              <div key={id} className="grid grid-cols-[1fr_140px_28px] items-end gap-2">
                <p className="truncate pb-2 text-xs">{names.get(id) ?? id}</p>
                <MonthSelect months={months} label="Not paid from" value={sc.exitMonths?.[id]} onChange={(v) => set({ exitMonths: { ...sc.exitMonths, [id]: v } })} />
                <Button size="icon" variant="ghost" className="h-8 w-7" aria-label="Remove" onClick={() => set({ leavers: sc.leavers.filter((x) => x !== id) })}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ))}

            <SubTitle>Promotions</SubTitle>
            {(sc.promotions ?? []).map((p) => {
              const upd = (c: Partial<typeof p>) => set({ promotions: sc.promotions!.map((x) => (x.id === p.id ? { ...x, ...c } : x)) });
              return (
                <ItemCard key={p.id} onRemove={() => set({ promotions: sc.promotions!.filter((x) => x.id !== p.id) })}>
                  <EmployeePicker value={p.employeeId} clearable={false} placeholder="Employee…" onChange={(e) => e && upd({ employeeId: e.id })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Pay increase (%)"><Input type="number" className="h-8 text-xs" value={p.pct || ""} onChange={(e) => upd({ pct: num(e.target.value) })} /></Field>
                    <MonthSelect months={months} value={p.fromMonth} onChange={(v) => upd({ fromMonth: v })} />
                  </div>
                </ItemCard>
              );
            })}
            <AddButton onClick={() => set({ promotions: [...(sc.promotions ?? []), { id: uid(), employeeId: "", pct: 15, fromMonth: months[0].key }] })}>Promotion</AddButton>

            <SubTitle>Transfers</SubTitle>
            {(sc.transfers ?? []).map((t) => {
              const upd = (c: Partial<typeof t>) => set({ transfers: sc.transfers!.map((x) => (x.id === t.id ? { ...x, ...c } : x)) });
              return (
                <ItemCard key={t.id} onRemove={() => set({ transfers: sc.transfers!.filter((x) => x.id !== t.id) })}>
                  <EmployeePicker value={t.employeeId} clearable={false} placeholder="Employee…" onChange={(e) => e && upd({ employeeId: e.id })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="To department"><DeptSelect value={t.department} departments={departments} allowAll={false} onChange={(v) => upd({ department: v })} /></Field>
                    <MonthSelect months={months} value={t.fromMonth} onChange={(v) => upd({ fromMonth: v })} />
                  </div>
                </ItemCard>
              );
            })}
            <AddButton onClick={() => set({ transfers: [...(sc.transfers ?? []), { id: uid(), employeeId: "", department: departments[0] ?? "", fromMonth: months[0].key }] })}>Transfer</AddButton>
            <p className="text-[10px] text-muted-foreground">A transfer moves cost between departments; total payroll is unchanged.</p>
          </Section>

          <Section icon={CalendarClock} title="Attendance and leave" sub="Unpaid leave, lateness and absence. Overtime is under Variable payments." count={counts.attendance}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Unpaid days / person / month"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.unpaidDays || ""} onChange={(e) => set({ unpaidDays: num(e.target.value) })} placeholder="0" /></Field>
              <Field label="Who"><DeptSelect value={sc.unpaidScope?.department ?? ""} departments={departments} onChange={(v) => set({ unpaidScope: { ...(sc.unpaidScope ?? EVERYONE), department: v } })} /></Field>
            </div>
          </Section>

          <Section icon={Landmark} title="Statutory changes" sub="PAYE, pension, NHF and other statutory contributions." count={counts.statutory}>
            <StatutoryInputs sc={sc} set={set} data={data} baseDate={base.period.end} />
          </Section>

          <Section icon={Settings2} title="Custom deductions" sub="Loan deductions, voluntary contributions and other payroll deductions." count={counts.deductions}>
            {(sc.deductions ?? []).map((d) => {
              const upd = (c: Partial<CustomDeduction>) => set({ deductions: sc.deductions!.map((x) => (x.id === d.id ? { ...x, ...c } : x)) });
              return (
                <ItemCard key={d.id} onRemove={() => set({ deductions: sc.deductions!.filter((x) => x.id !== d.id) })}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Type">
                      <Select value={d.kind} onValueChange={(k) => upd({ kind: k as CustomDeduction["kind"] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{(Object.keys(DEDUCTION_LABELS) as CustomDeduction["kind"][]).map((k) => <SelectItem key={k} value={k} className="text-xs">{DEDUCTION_LABELS[k]}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="₦ / person / month"><Input type="number" className="h-8 text-xs" value={d.amount || ""} onChange={(e) => upd({ amount: num(e.target.value) })} /></Field>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <ScopeFields scope={d.scope} {...scopeProps} onChange={(scope) => upd({ scope })} />
                    <MonthSelect months={months} value={d.fromMonth} onChange={(v) => upd({ fromMonth: v })} />
                  </div>
                </ItemCard>
              );
            })}
            <AddButton onClick={() => set({ deductions: [...(sc.deductions ?? []), { id: uid(), kind: "loan", amount: 0, scope: EVERYONE, fromMonth: months[0].key }] })}>Deduction</AddButton>
            <p className="text-[10px] text-muted-foreground">Deductions reduce net pay only. They are not a cost to the employer.</p>
          </Section>
        </div>

        {/* Results */}
        <div className="flex min-w-0 flex-col gap-4">
          <MonthlyEffect result={result} label={base.period.label} />

          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
            <Figure label="Monthly recurring change" value={signedC(result.measures.monthlyRecurringChange)} sub="Once every change is in force" tone={result.measures.monthlyRecurringChange > 0 ? "warn" : result.measures.monthlyRecurringChange < 0 ? "good" : undefined} />
            <Figure label="One-off impact" value={signedC(result.measures.oneOffImpact)} sub="Counted once, never annualised" />
            <Figure label="Annualised recurring" value={signedC(result.measures.annualisedRecurring)} sub="Recurring change × 12" />
            <Figure label="12-month projected spend" value={compactNaira(result.measures.total12Scenario)} sub={`${signedC(result.measures.total12Change)} vs today's payroll`} tone={result.measures.total12Change > 0 ? "warn" : undefined} />
          </div>

          <ChartCard title="12-month forecast" description={`Monthly cost to employer, ${months[0].label} to ${months[11].label}, with each change from its effective month. The dashed line is today's monthly cost.`}>
            <ColumnChart
              series={[{ key: "cost", label: "Scenario cost" }]}
              marker="Today's monthly cost"
              columns={result.forecast.map((m) => ({ label: m.short, marker: m.base, note: `${signedC(m.delta)} vs today · ${m.headcount} people${m.oneOff ? ` · ${compactNaira(m.oneOff)} one-off` : ""}`, parts: [{ key: "cost", value: m.scenario }] }))}
            />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Cost change by department" description="Cost to employer, full effect.">
              <BarList rows={result.byDepartment.filter((d) => Math.abs(d.delta) >= 1).slice(0, 10).map((d) => ({ label: d.department, value: d.delta }))} emptyText="No change yet — adjust the scenario." />
            </ChartCard>
            <NextActions result={result} sc={sc} saved={current} budgetMonthly={budgetMonthly} />
          </div>

          <BudgetImpact impact={scenarioBudgetImpact(result, data, bundle)} />

          <EmployeePreview result={result} departments={departments} />

          <ScenarioComparison saved={saved} data={data} bundle={bundle} base={base} current={result} currentName={name || "This scenario"} budgetMonthly={budgetMonthly} onOpen={(id) => open(id)} />

          {current && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">Scenario audit history</p>
              <ol className="mt-2 space-y-1.5 text-xs">
                {[...current.history].reverse().map((h, i) => (
                  <li key={i}><span className="font-medium">{h.actor}</span> — {h.action}{h.note ? `: ${h.note}` : ""} <span className="text-[10px] text-muted-foreground">· {new Date(h.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>
                ))}
              </ol>
              {current.status !== "approved" && (
                <Button size="sm" variant="ghost" className="mt-2 h-7 gap-1 text-[11px] text-rose-600" onClick={() => { actions.deleteScenario(current.id); open(null); toast.success("Scenario deleted"); }}><Trash2 className="h-3 w-3" /> Delete scenario</Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Monthly effect ──────────────────────────────────────────────────────────

type Row = { key: keyof SimFigures; label: string; always?: boolean; strong?: boolean };
const FIGURE_SECTIONS: { title: string; note?: string; rows: Row[] }[] = [
  {
    title: "Earnings",
    rows: [
      { key: "basic", label: "Basic salary", always: true },
      { key: "housing", label: "Housing allowance", always: true },
      { key: "transport", label: "Transport allowance", always: true },
      { key: "otherAllowances", label: "Other allowances" },
      { key: "overtime", label: "Overtime & shift pay" },
      { key: "bonuses", label: "Bonuses & one-off payments" },
      { key: "attendance", label: "Unpaid leave & lateness" },
      { key: "otherEarnings", label: "Other earnings" },
      { key: "gross", label: "Gross pay", always: true, strong: true },
    ],
  },
  {
    title: "Employee deductions",
    note: "Reduce net pay — not an employer cost",
    rows: [
      { key: "paye", label: "PAYE", always: true },
      { key: "pensionEmployee", label: "Employee pension (incl. AVC)", always: true },
      { key: "nhf", label: "NHF (employee)", always: true },
      { key: "otherDeductions", label: "Other deductions" },
      { key: "net", label: "Net pay", always: true, strong: true },
    ],
  },
  {
    title: "Employer contributions",
    note: "Paid on top of gross pay",
    rows: [...EMPLOYER_KEYS.map((k) => ({ key: k as keyof SimFigures, label: EMPLOYER_KEY_LABELS[k] })), { key: "employerContributions", label: "Total employer contributions", always: true, strong: true }],
  },
];

function MonthlyEffect({ result, label }: { result: SimResult; label: string }) {
  const cell = (n: number) => money(n, 0);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-semibold">Monthly effect · {label} base</p>
      <p className="text-[11px] text-muted-foreground">Full effect: every change in force, one-offs included.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-xs">
          <thead className="text-left text-muted-foreground">
            <tr><th className="pb-1.5 font-medium" /><th className="pb-1.5 text-right font-medium">Today</th><th className="pb-1.5 text-right font-medium">Scenario</th><th className="pb-1.5 text-right font-medium">Change</th></tr>
          </thead>
          <tbody>
            <tr className="border-t"><td className="py-1.5">Headcount</td><td className="py-1.5 text-right tabular-nums">{result.baseHeadcount}</td><td className="py-1.5 text-right tabular-nums">{result.simHeadcount}</td><td className="py-1.5 text-right tabular-nums">{result.simHeadcount - result.baseHeadcount > 0 ? "+" : ""}{result.simHeadcount - result.baseHeadcount}</td></tr>
            {FIGURE_SECTIONS.map((s) => (
              <SectionRows key={s.title} s={s} result={result} cell={cell} />
            ))}
            <tr className="border-t-2 border-foreground/20 font-semibold">
              <td className="py-2">Total cost to employer<span className="block text-[10px] font-normal text-muted-foreground">Gross pay + employer contributions</span></td>
              <td className="py-2 text-right tabular-nums">{cell(result.base.employerCost)}</td>
              <td className="py-2 text-right tabular-nums">{cell(result.sim.employerCost)}</td>
              <td className={cn("py-2 text-right tabular-nums", result.delta.employerCost < 0 && "text-rose-600")}>{signed0(result.delta.employerCost)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">Annualised PAYE on a full month for everyone, so the figures show the change itself rather than year-to-date catch-up. Base figures can differ slightly from the run for part-month employees.</p>
    </div>
  );
}

function SectionRows({ s, result, cell }: { s: (typeof FIGURE_SECTIONS)[number]; result: SimResult; cell: (n: number) => string }) {
  const rows = s.rows.filter((r) => r.always || Math.abs(result.base[r.key]) >= 0.5 || Math.abs(result.sim[r.key]) >= 0.5);
  return (
    <>
      <tr className="border-t"><td colSpan={4} className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.title}{s.note && <span className="ml-1.5 font-normal normal-case tracking-normal">· {s.note}</span>}</td></tr>
      {rows.map((r) => (
        <tr key={r.key} className={cn(r.strong ? "border-t font-semibold" : "")}>
          <td className={cn("py-1", !r.strong && "pl-3")}>{r.label}</td>
          <td className="py-1 text-right tabular-nums">{cell(result.base[r.key])}</td>
          <td className="py-1 text-right tabular-nums">{cell(result.sim[r.key])}</td>
          <td className={cn("py-1 text-right tabular-nums", result.delta[r.key] < 0 && "text-rose-600")}>{Math.abs(result.delta[r.key]) < 0.5 ? "—" : signed0(result.delta[r.key])}</td>
        </tr>
      ))}
    </>
  );
}

// ── Statutory ───────────────────────────────────────────────────────────────

function StatutoryInputs({ sc, set, data, baseDate }: { sc: Scenario; set: (c: Partial<Scenario>) => void; data: NonNullable<ReturnType<typeof useTenantPayroll>["data"]>; baseDate: string }) {
  const rs = [...data.rateSets].filter((r) => r.effectiveFrom <= baseDate).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? data.rateSets[0];
  const pct = (n: number) => `${+(n * 100).toFixed(2)}`;
  const nullable = (v: string) => (v.trim() === "" ? null : num(v));
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Field label="PAYE bands (± pp)"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.payeBandDeltaPp || ""} onChange={(e) => set({ payeBandDeltaPp: num(e.target.value) })} placeholder="0" /></Field>
        <Field label="Employee pension %"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.employeePensionPct ?? ""} onChange={(e) => set({ employeePensionPct: nullable(e.target.value) })} placeholder={pct(rs.employeePensionRate)} /></Field>
        <Field label="Employer pension %"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.employerPensionPct ?? ""} onChange={(e) => set({ employerPensionPct: nullable(e.target.value) })} placeholder={pct(rs.employerPensionRate)} /></Field>
        <Field label="NHF %"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.nhfPct ?? ""} onChange={(e) => set({ nhfPct: nullable(e.target.value) })} placeholder={pct(rs.nhfRate)} /></Field>
        <Field label="NHF basis">
          <Select value={sc.nhfBasis ?? CURRENT} onValueChange={(v) => set({ nhfBasis: v === CURRENT ? null : (v as "gross" | "basic") })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={CURRENT} className="text-xs">Current ({data.settings.nhfBasis ?? "gross"})</SelectItem>
              <SelectItem value="gross" className="text-xs">Gross pay</SelectItem>
              <SelectItem value="basic" className="text-xs">Basic salary</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="NSITF %"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.nsitfPct ?? ""} onChange={(e) => set({ nsitfPct: nullable(e.target.value) })} placeholder={pct(rs.nsitfRate)} /></Field>
        <Field label="ITF">
          <TriSelect value={sc.itf} current={data.settings.itfApplicable} onChange={(v) => set({ itf: v })} />
        </Field>
        <Field label="Group life">
          <TriSelect value={sc.groupLife} current={data.settings.groupLife?.enabled ?? true} onChange={(v) => set({ groupLife: v })} />
        </Field>
        <Field label="Min. wage ₦"><Input type="number" step={1000} className="h-8 text-xs" value={sc.minimumWage ?? ""} onChange={(e) => set({ minimumWage: nullable(e.target.value) })} placeholder={String(rs.minimumWageMonthly)} /></Field>
      </div>
      <p className="text-[10px] text-muted-foreground">Blank uses the rate set in force ({rs.label}). Live rates are changed, with effective dates and a second approver, in Payroll Settings.</p>
    </>
  );
}

function TriSelect({ value, current, onChange }: { value: boolean | null | undefined; current: boolean; onChange: (v: boolean | null) => void }) {
  return (
    <Select value={value == null ? CURRENT : value ? "on" : "off"} onValueChange={(v) => onChange(v === CURRENT ? null : v === "on")}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={CURRENT} className="text-xs">Current ({current ? "on" : "off"})</SelectItem>
        <SelectItem value="on" className="text-xs">On</SelectItem>
        <SelectItem value="off" className="text-xs">Off</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Next actions ────────────────────────────────────────────────────────────

function NextActions({ result, sc, saved, budgetMonthly }: { result: SimResult; sc: Scenario; saved: SavedScenario | null; budgetMonthly: number | null }) {
  const affected = result.rows.filter((r) => Math.abs(r.sim.employerCost - r.base.employerCost) >= 1).length;
  const statutory = [sc.payeBandDeltaPp, sc.employerPensionPct, sc.employeePensionPct, sc.nhfPct, sc.nhfBasis, sc.nsitfPct, sc.itf, sc.groupLife, sc.minimumWage].some((x) => x !== null && x !== undefined && x !== 0);
  const overBudget = budgetMonthly !== null ? result.sim.employerCost - budgetMonthly : null;
  const items: { done: boolean; text: string; sub: string }[] = [
    { done: affected === 0, text: "Review employee-level impact", sub: affected ? `${affected} employee${affected === 1 ? "" : "s"} affected — see the preview below.` : "No employee affected yet." },
    { done: !statutory, text: "Check statutory calculations", sub: statutory ? "This scenario changes statutory rates — confirm them against current legislation." : "Uses the statutory rates in force." },
    {
      done: overBudget !== null && overBudget <= 0,
      text: "Compare against approved budget",
      sub: overBudget === null ? "No payroll budget set — set one in Budget & Forecasting." : overBudget > 0 ? `${compactNaira(overBudget)} a month over the monthly budget.` : `${compactNaira(-overBudget)} a month within the monthly budget.`,
    },
    { done: !!saved && saved.status !== "draft", text: "Save scenario for management review", sub: saved ? SCENARIO_STATUS_LABELS[saved.status] : "Not saved yet." },
  ];
  return (
    <ChartCard title="Recommended next actions">
      <ul className="space-y-2 text-xs">
        {items.map((i) => (
          <li key={i.text} className="flex gap-2">
            {i.done ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <span><span className="font-medium">{i.text}</span><span className="block text-muted-foreground">{i.sub}</span></span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

// ── Employee preview ────────────────────────────────────────────────────────

function EmployeePreview({ result, departments }: { result: SimResult; departments: string[] }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(ALL);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<"change" | "name">("change");
  const rows = result.rows
    .map((r) => ({ ...r, d: r.sim.employerCost - r.base.employerCost }))
    .filter((r) => (showAll || Math.abs(r.d) >= 1 || r.status !== "existing") && (dept === ALL || r.department === dept || r.baseDepartment === dept) && (!q.trim() || `${r.name} ${r.employeeId}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : Math.abs(b.d) - Math.abs(a.d)));
  const affected = result.rows.filter((r) => Math.abs(r.sim.employerCost - r.base.employerCost) >= 1).length;
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Employee-level preview</p>
          <p className="text-[11px] text-muted-foreground">{affected} of {result.rows.length} rows affected · current gross {compactNaira(result.base.gross)} → proposed {compactNaira(result.sim.gross)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px]"><Checkbox checked={showAll} onCheckedChange={(c) => setShowAll(c === true)} /> Show unaffected</label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger size="sm" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL} className="text-xs">All departments</SelectItem>{departments.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as "change" | "name")}>
            <SelectTrigger size="sm" className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="change" className="text-xs">Largest change</SelectItem><SelectItem value="name" className="text-xs">Name A–Z</SelectItem></SelectContent>
          </Select>
          <Input className="h-8 w-44 text-xs" placeholder="Search employee" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full min-w-[860px] text-xs">
          <thead className="sticky top-0 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">What changes</th>
              <th className="px-3 py-2 text-right font-medium">Current gross</th>
              <th className="px-3 py-2 text-right font-medium">Proposed gross</th>
              <th className="px-3 py-2 text-right font-medium">Proposed net</th>
              <th className="px-3 py-2 text-right font-medium">Cost change</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No employee is affected yet — adjust the scenario.</td></tr>}
            {rows.map((r) => {
              const pct = r.base.gross ? ((r.sim.gross - r.base.gross) / r.base.gross) * 100 : null;
              return (
                <tr key={r.employeeId} className="border-t align-top">
                  <td className="px-4 py-2">
                    <span className="font-medium">{r.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{r.department !== r.baseDepartment ? `${r.baseDepartment} → ${r.department}` : r.department}{r.status !== "existing" ? ` · ${r.status}` : ""}</span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{r.changes.join(" · ") || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{money(r.base.gross, 0)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(r.sim.gross, 0)}<span className="block text-[10px] text-muted-foreground">{r.status === "existing" ? pctArrow(pct) : ""}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(r.sim.net, 0)}</td>
                  <td className={cn("px-3 py-2 text-right font-medium tabular-nums", r.d < 0 && "text-rose-600")}>{signed0(r.d)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Scenario comparison ─────────────────────────────────────────────────────

function ScenarioComparison({
  saved,
  data,
  bundle,
  base,
  current,
  currentName,
  budgetMonthly,
  onOpen,
}: {
  saved: SavedScenario[];
  data: NonNullable<ReturnType<typeof useTenantPayroll>["data"]>;
  bundle: NonNullable<ReturnType<typeof useTenantPayroll>["bundle"]>;
  base: NonNullable<ReturnType<typeof useTenantPayroll>["data"]>["runs"][number];
  current: SimResult;
  currentName: string;
  budgetMonthly: number | null;
  onOpen: (id: string) => void;
}) {
  const rows = useMemo(
    () =>
      saved.map((s) => {
        const r = simulate(data, bundle, base, s.scenario);
        return { s, monthly: r.sim.employerCost, change: r.measures.monthlyRecurringChange, total12: r.measures.total12Change, heads: r.simHeadcount };
      }),
    [saved, data, bundle, base],
  );
  if (!saved.length) return null;
  const vsBudget = (n: number) => (budgetMonthly === null ? "—" : signedC(n - budgetMonthly));
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Compare scenarios</p>
        <p className="text-[11px] text-muted-foreground">Every saved scenario recalculated on {base.period.label} — none of them affects live payroll.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Scenario</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Monthly employer cost</th>
              <th className="px-3 py-2 text-right font-medium">Recurring change</th>
              <th className="px-3 py-2 text-right font-medium">12-month change</th>
              <th className="px-3 py-2 text-right font-medium">Headcount</th>
              <th className="px-3 py-2 text-right font-medium">Vs monthly budget</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t font-medium">
              <td className="px-4 py-2">Current payroll</td>
              <td className="px-3 py-2 text-muted-foreground">Live</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(current.base.employerCost, 0)}</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right tabular-nums">{current.baseHeadcount}</td>
              <td className="px-3 py-2 text-right tabular-nums">{vsBudget(current.base.employerCost)}</td>
            </tr>
            <tr className="border-t bg-primary/5">
              <td className="px-4 py-2">{currentName} <span className="text-[10px] text-muted-foreground">(on screen)</span></td>
              <td className="px-3 py-2 text-muted-foreground">Working</td>
              <td className="px-3 py-2 text-right tabular-nums">{money(current.sim.employerCost, 0)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{signedC(current.measures.monthlyRecurringChange)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{signedC(current.measures.total12Change)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{current.simHeadcount}</td>
              <td className="px-3 py-2 text-right tabular-nums">{vsBudget(current.sim.employerCost)}</td>
            </tr>
            {rows.map(({ s, monthly, change, total12, heads }) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2"><button type="button" className="font-medium text-primary hover:underline" onClick={() => onOpen(s.id)}>{s.name}</button>{s.description && <span className="block text-[10px] text-muted-foreground">{s.description}</span>}</td>
                <td className="px-3 py-2">{SCENARIO_STATUS_LABELS[s.status]}</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(monthly, 0)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{signedC(change)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{signedC(total12)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{heads}</td>
                <td className="px-3 py-2 text-right tabular-nums">{vsBudget(monthly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Small pieces ────────────────────────────────────────────────────────────

const num = (v: string) => (v.trim() === "" ? 0 : Number(v) || 0);

function Section({ icon: Icon, title, sub, count, defaultOpen = false, children }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; count: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-xs font-semibold">{title}{count > 0 && <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">{count}</span>}</span>
          <span className="block text-[11px] text-muted-foreground">{sub}</span>
        </span>
        <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-2 border-t px-4 py-3">{children}</div>}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-[11px] font-semibold text-muted-foreground">{children}</p>;
}

function ItemCard({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="relative space-y-2 rounded-lg border bg-muted/30 p-2.5 pr-9">
      {children}
      <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-7 w-7" aria-label="Remove" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={onClick}><Plus className="h-3 w-3" /> {children}</Button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      {label && <Label className="text-[11px] text-muted-foreground">{label}</Label>}
      {children}
    </div>
  );
}

function ScopeFields({ scope, departments, grades, onChange }: { scope: Scope; departments: string[]; grades: string[]; onChange: (s: Scope) => void }) {
  return (
    <>
      <Field label="Department"><DeptSelect value={scope.department} departments={departments} onChange={(v) => onChange({ ...scope, department: v })} /></Field>
      <Field label="Grade">
        <Select value={scope.grade || ALL} onValueChange={(v) => onChange({ ...scope, grade: v === ALL ? "" : v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL} className="text-xs">All grades</SelectItem>{grades.map((g) => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
    </>
  );
}

function DeptSelect({ value, departments, onChange, allowAll = true }: { value: string; departments: string[]; onChange: (v: string) => void; allowAll?: boolean }) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL} className="text-xs">Everyone</SelectItem>}
        {departments.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function MonthSelect({ months, value, onChange, label = "From" }: { months: { key: string; label: string }[]; value?: string; onChange: (v: string) => void; label?: string }) {
  return (
    <Field label={label}>
      <Select value={value || months[0].key} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{months.map((m) => <SelectItem key={m.key} value={m.key} className="text-xs">{m.label}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}

/** Feedback B7: the scenario against the budget — headroom, overspend or savings, per department. */
function BudgetImpact({ impact }: { impact: ReturnType<typeof scenarioBudgetImpact> }) {
  const t = impact.totals;
  const tone = (n: number | null) => (n === null ? undefined : n < 0 ? "bad" : "good");
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-semibold">Budget impact · next 12 months</p>
      <p className="text-[11px] text-muted-foreground">Cost to employer at today&apos;s payroll against the scenario and the approved budget. Nothing here touches live payroll.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure label="Employer cost / month — before" value={compactNaira(impact.employerCostBefore)} sub="Gross + employer contributions" />
        <Figure label="Employer cost / month — after" value={compactNaira(impact.employerCostAfter)} sub={signedC(impact.employerCostAfter - impact.employerCostBefore)} tone={impact.employerCostAfter > impact.employerCostBefore ? "warn" : undefined} />
        <Figure label="Extra employer statutory contributions" value={signedC(impact.employerStatutoryMonthly)} sub={`${signedC(impact.employerStatutoryAnnual)} a year · pension, NSITF, ITF, NHIA, group life`} />
        <Figure label={t.headroom === null ? "Budget" : t.headroom < 0 ? "Overspend vs budget" : "Budget headroom"} value={t.headroom === null ? "No budget" : compactNaira(Math.abs(t.headroom))} sub={t.budget === null ? "Set one in Budget & Forecasting" : `Budget ${compactNaira(t.budget)} · scenario ${compactNaira(t.projected)}`} tone={tone(t.headroom)} />
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] text-xs tabular-nums">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Department</th>
              <th className="px-3 py-1.5 text-right font-medium">Today (12 mo)</th>
              <th className="px-3 py-1.5 text-right font-medium">Scenario (12 mo)</th>
              <th className="px-3 py-1.5 text-right font-medium">Change</th>
              <th className="px-3 py-1.5 text-right font-medium">Budget</th>
              <th className="px-3 py-1.5 text-right font-medium">Headroom / overspend</th>
            </tr>
          </thead>
          <tbody>
            {impact.rows.map((r) => (
              <tr key={r.department} className="border-t">
                <td className="px-3 py-1.5">{r.department}</td>
                <td className="px-3 py-1.5 text-right">{compactNaira(r.current)}</td>
                <td className="px-3 py-1.5 text-right">{compactNaira(r.projected)}</td>
                <td className={cn("px-3 py-1.5 text-right", r.change > 0 ? "text-amber-700 dark:text-amber-400" : r.change < 0 && "text-emerald-700 dark:text-emerald-400")}>{signedC(r.change)}</td>
                <td className="px-3 py-1.5 text-right">{r.budget === null ? "—" : compactNaira(r.budget)}</td>
                <td className={cn("px-3 py-1.5 text-right font-medium", r.headroom !== null && (r.headroom < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"))}>{r.headroom === null ? "—" : `${r.headroom < 0 ? "Over " : ""}${compactNaira(Math.abs(r.headroom))}`}</td>
              </tr>
            ))}
            <tr className="border-t-2 font-semibold">
              <td className="px-3 py-1.5">Total</td>
              <td className="px-3 py-1.5 text-right">{compactNaira(t.current)}</td>
              <td className="px-3 py-1.5 text-right">{compactNaira(t.projected)}</td>
              <td className="px-3 py-1.5 text-right">{signedC(t.change)}</td>
              <td className="px-3 py-1.5 text-right">{t.budget === null ? "—" : compactNaira(t.budget)}</td>
              <td className={cn("px-3 py-1.5 text-right", t.headroom !== null && (t.headroom < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400"))}>{t.headroom === null ? "—" : `${t.headroom < 0 ? "Over " : ""}${compactNaira(Math.abs(t.headroom))}`}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
