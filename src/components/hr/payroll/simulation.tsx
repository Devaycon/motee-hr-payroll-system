"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, FlaskConical, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { FIGURE_LABELS } from "@/src/lib/payroll/salary-impact";
import { EMPTY_SCENARIO, simulate, type Scenario } from "@/src/lib/payroll/simulation";
import { useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { BarList, Figure, compactNaira } from "./components/charts";
import { NotSupported, money } from "./components/shared";

const ALL = "__all__";

/**
 * `/time-payroll/payroll/simulate` — model salary increases, bonuses, new
 * starters, leavers and statutory changes against a real month. Nothing is
 * saved or sent anywhere: it's a sandbox on top of the live engine.
 */
export function PayrollSimulationPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const canUse = useCan(PAYROLL_MODULE, "create");
  const [sc, setSc] = useState<Scenario>(EMPTY_SCENARIO);
  const regular = useMemo(() => (data?.runs ?? []).filter((r) => r.type === "regular" && r.employees.some((e) => e.computation)).sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month)), [data]);
  const [baseId, setBaseId] = useState<string | null>(null);
  const base = regular.find((r) => r.id === baseId) ?? regular[0];
  const result = useMemo(() => (data && bundle && base ? simulate(data, bundle, base, sc) : null), [data, bundle, base, sc]);
  const departments = useMemo(() => [...new Set((bundle?.employees ?? []).map((e) => e.departmentName))].sort(), [bundle]);
  const set = (c: Partial<Scenario>) => setSc((x) => ({ ...x, ...c }));
  const names = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e.fullName])), [bundle]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!canUse) return <p className="py-20 text-center text-sm text-muted-foreground">Payroll simulation is available to payroll users.</p>;
  if (!base || !result) return <p className="py-20 text-center text-sm text-muted-foreground">Calculate a regular run first — the simulation starts from a real month.</p>;

  const num = (v: string) => (v.trim() === "" ? 0 : Number(v) || 0);
  const changed = JSON.stringify(sc) !== JSON.stringify(EMPTY_SCENARIO);
  const movers = [...result.rows].map((r) => ({ ...r, d: r.sim.employerCost - r.base.employerCost })).filter((r) => Math.abs(r.d) >= 1).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 12);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold"><FlaskConical className="h-7 w-7 text-primary" /> Payroll simulation</h1>
          <p className="max-w-2xl text-xs text-muted-foreground">Model a change before committing anything to live payroll. Every employee is calculated by the payroll engine on a full month; nothing here is saved, approved or paid.</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Base month</Label>
          <Select value={base.id} onValueChange={setBaseId}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{regular.map((r) => <SelectItem key={r.id} value={r.id} className="text-xs">{r.title}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!changed} onClick={() => setSc(EMPTY_SCENARIO)}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        {/* Scenario */}
        <div className="flex flex-col gap-4">
          <Section title="Salary increase">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Increase (%)"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.increasePct || ""} onChange={(e) => set({ increasePct: num(e.target.value) })} placeholder="0" /></Field>
              <Field label="Who"><DeptSelect value={sc.increaseDepartment} departments={departments} onChange={(v) => set({ increaseDepartment: v })} /></Field>
            </div>
            <p className="text-[10px] text-muted-foreground">Applies to fixed recurring pay (basic and allowances).</p>
          </Section>
          <Section title="Bonus (one-off)">
            <div className="grid grid-cols-2 gap-2">
              <Field label="% of monthly basic"><Input type="number" step={5} className="h-8 text-xs" value={sc.bonusPct || ""} onChange={(e) => set({ bonusPct: num(e.target.value) })} placeholder="0" /></Field>
              <Field label="Who"><DeptSelect value={sc.bonusDepartment} departments={departments} onChange={(v) => set({ bonusDepartment: v })} /></Field>
            </div>
          </Section>
          <Section
            title="New starters"
            right={<Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => set({ starters: [...sc.starters, { id: String(Date.now()), department: departments[0] ?? "", count: 1, monthlyGross: 500_000 }] })}><Plus className="h-3 w-3" /> Add</Button>}
          >
            {sc.starters.map((st, i) => (
              <div key={st.id} className="grid grid-cols-[1fr_56px_100px_28px] items-end gap-1.5">
                <Field label={i === 0 ? "Department" : ""}><DeptSelect value={st.department} departments={departments} allowAll={false} onChange={(v) => set({ starters: sc.starters.map((x) => (x.id === st.id ? { ...x, department: v } : x)) })} /></Field>
                <Field label={i === 0 ? "How many" : ""}><Input type="number" min={1} className="h-8 text-xs" value={st.count} onChange={(e) => set({ starters: sc.starters.map((x) => (x.id === st.id ? { ...x, count: Math.max(0, Math.round(num(e.target.value))) } : x)) })} /></Field>
                <Field label={i === 0 ? "Gross ₦/month" : ""}><Input type="number" step={10000} className="h-8 text-xs" value={st.monthlyGross} onChange={(e) => set({ starters: sc.starters.map((x) => (x.id === st.id ? { ...x, monthlyGross: num(e.target.value) } : x)) })} /></Field>
                <Button size="icon" variant="ghost" className="h-8 w-7" aria-label="Remove" onClick={() => set({ starters: sc.starters.filter((x) => x.id !== st.id) })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            {!sc.starters.length && <p className="text-[11px] text-muted-foreground">None.</p>}
          </Section>
          <Section title="Terminations">
            <EmployeePicker value="" clearable={false} placeholder="Add a leaver…" excludeIds={sc.leavers} onChange={(e) => e && set({ leavers: [...sc.leavers, e.id] })} />
            <div className="flex flex-wrap gap-1">
              {sc.leavers.map((id) => (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
                  {names.get(id) ?? id}
                  <button type="button" aria-label="Remove" onClick={() => set({ leavers: sc.leavers.filter((x) => x !== id) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </Section>
          <Section title="Statutory changes">
            <div className="grid grid-cols-3 gap-2">
              <Field label="PAYE bands (± pp)"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.payeBandDeltaPp || ""} onChange={(e) => set({ payeBandDeltaPp: num(e.target.value) })} placeholder="0" /></Field>
              <Field label="Employer pension %"><Input type="number" step={0.5} className="h-8 text-xs" value={sc.employerPensionPct ?? ""} onChange={(e) => set({ employerPensionPct: e.target.value === "" ? null : num(e.target.value) })} placeholder="10" /></Field>
              <Field label="Min. wage ₦"><Input type="number" step={1000} className="h-8 text-xs" value={sc.minimumWage ?? ""} onChange={(e) => set({ minimumWage: e.target.value === "" ? null : num(e.target.value) })} placeholder="70000" /></Field>
            </div>
          </Section>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Monthly effect · {base.period.label}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead className="text-left text-muted-foreground"><tr><th className="pb-1.5 font-medium" /><th className="pb-1.5 text-right font-medium">Today</th><th className="pb-1.5 text-right font-medium">Scenario</th><th className="pb-1.5 text-right font-medium">Change</th></tr></thead>
                <tbody>
                  <tr className="border-t"><td className="py-1.5">Headcount</td><td className="py-1.5 text-right tabular-nums">{result.baseHeadcount}</td><td className="py-1.5 text-right tabular-nums">{result.simHeadcount}</td><td className="py-1.5 text-right tabular-nums">{result.simHeadcount - result.baseHeadcount > 0 ? "+" : ""}{result.simHeadcount - result.baseHeadcount}</td></tr>
                  {FIGURE_LABELS.map(({ key, label }) => (
                    <tr key={key} className={cn("border-t", key === "employerCost" && "font-semibold")}>
                      <td className="py-1.5">{label === "Pension (employee)" ? "Employee pension" : label}</td>
                      <td className="py-1.5 text-right tabular-nums">{money(result.base[key], 0)}</td>
                      <td className="py-1.5 text-right tabular-nums">{money(result.sim[key], 0)}</td>
                      <td className={cn("py-1.5 text-right tabular-nums", result.delta[key] < 0 && "text-rose-600")}>{result.delta[key] > 0 ? "+" : ""}{money(result.delta[key], 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Figure label="Monthly cost change" value={`${result.delta.employerCost > 0 ? "+" : ""}${compactNaira(result.delta.employerCost)}`} tone={result.delta.employerCost > 0 ? "warn" : result.delta.employerCost < 0 ? "good" : undefined} />
              <Figure label="12-month cost change" value={`${result.annualCostDelta > 0 ? "+" : ""}${compactNaira(result.annualCostDelta)}`} sub="Bonus counted once" />
              <Figure label="PAYE change (monthly)" value={`${result.delta.paye > 0 ? "+" : ""}${compactNaira(result.delta.paye)}`} />
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">Annualised PAYE on a full month for everyone, so the figures show the change itself rather than year-to-date catch-up. Base figures can differ slightly from the run for part-month employees.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">Cost change by department</p>
              <BarList rows={result.byDepartment.filter((d) => Math.abs(d.delta) >= 1).slice(0, 10).map((d) => ({ label: d.department, value: d.delta }))} emptyText="No change yet — adjust the scenario." />
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">Biggest movers (cost to employer)</p>
              <ul className="space-y-1.5 text-xs">
                {movers.map((r) => (
                  <li key={r.employeeId} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{r.name} <span className="text-[10px] text-muted-foreground">· {r.status === "existing" ? r.department : r.status}</span></span>
                    <span className={cn("tabular-nums", r.d < 0 && "text-rose-600")}>{r.d > 0 ? "+" : ""}{money(r.d, 0)}</span>
                  </li>
                ))}
                {!movers.length && <li className="text-muted-foreground">No change yet.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold">{title}</p>{right}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {label && <Label className="text-[11px] text-muted-foreground">{label}</Label>}
      {children}
    </div>
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
